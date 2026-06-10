import type {
  APIGatewayProxyEventV2 as Event,
  APIGatewayProxyResultV2 as Result,
} from "aws-lambda";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  EvaluationResponse,
  ApiResponse,
  SessionStartResponse,
  CardItem,
  StoryDefinition,
  StoryAdvanceRequest,
  StoryAdvancePayload,
  StoryMission,
  StoryRequirement,
  StoryAdvanceRequirementState,
  EvalResult,
  StoryAssistanceRequest,
  StoryAssistanceResponse,
  TranslationRequest,
  TranslationResponse,
  PromoCodeValidationRequest,
  PromoCodeValidationResponse,
  AppVersionCheckRequest,
  AppVersionCheckResponse,
  AppVersionCheckStatus,
  CharacterDefinition,
  CreateFriendRequest,
  FriendCharacter,
  FriendChatRequest,
  FriendChatPayload,
  FriendConversationSnapshot,
  FriendsListResponse,
} from "../types";
import { CHARACTERS } from "../data/characters";
import {
  type CharacterPost,
  incrementCharacterPostConversationMessages,
  incrementCharacterPostLike,
  incrementCharacterPostMetric,
  listPublicCharacterPosts,
  listPublicCharacterVideoPosts,
} from "../character-posts";
import { listPublicFeedPosts } from "../feed-posts";
import {
  answerLessonHelp,
  getPublicLesson,
  listPublicLessons,
} from "../admin/lessons";
import { listPublicShadowingCatalog } from "../shadowing";
import { validatePromoCode } from "../promo-codes";

const s3 = new S3Client({});
const ssm = new SSMClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
let OPENAI_API_KEY_CACHE: string | undefined;
let GOOGLE_TRANSLATE_API_KEY_CACHE: string | undefined;
const DEFAULT_OPENAI_CHAT_MODEL = "gpt-5.4-nano";
const STORIES_PATH_CANDIDATES: (string | undefined)[] = [
  // Only allow override via explicit env var; default source is CHARACTERS.
  process.env.STORIES_PATH,
];
let STORIES_CACHE: StoryDefinition[] | null = null;

function sanitizeStoriesList(input: any[], fallbackPrefix: string): StoryDefinition[] {
  const sanitized: StoryDefinition[] = [];
  input.forEach((story, index) => {
    const fallbackId = `${fallbackPrefix}_${index}`;
    const normalized = sanitizeStoryDefinition(story, fallbackId);
    if (normalized) sanitized.push(normalized);
  });
  return sanitized;
}

function readStoriesFromDisk(): StoryDefinition[] | undefined {
  for (const candidate of STORIES_PATH_CANDIDATES) {
    if (!candidate) continue;
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn(
          JSON.stringify({ scope: 'stories.load.invalidFormat', path: candidate })
        );
        continue;
      }
      const sanitized = sanitizeStoriesList(parsed, 'file');
      if (sanitized.length) {
        console.log(
          JSON.stringify({ scope: 'stories.load.success', path: candidate, items: sanitized.length })
        );
        return sanitized;
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          scope: 'stories.load.error',
          message: (err as Error)?.message || 'unknown',
          path: candidate,
        })
      );
    }
  }
  return undefined;
}

function loadStories(): StoryDefinition[] {
  if (STORIES_CACHE) return STORIES_CACHE;
  const fromDisk = readStoriesFromDisk();
  STORIES_CACHE = fromDisk && fromDisk.length ? fromDisk : [];
  return STORIES_CACHE;
}

function getStory(storyId: string): StoryDefinition | undefined {
  return loadStories().find((s) => s.storyId === storyId);
}

type StoryMessage = { role: 'user' | 'assistant'; content: string };
const STORY_HISTORY_LIMIT = 20;
const FRIEND_HISTORY_LIMIT = 24;

type StorySessionState = {
  storyId?: string;
  missionIndex: number;
  history: StoryMessage[];
  requirements: StoryAdvanceRequirementState[];
  story?: StoryDefinition;
  lastUpdated: number;
};

type CognitoClaims = Record<string, string | undefined>;

type UserIdentity = {
  userId: string;
  email?: string;
  sub?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
};

type FriendConversationFeedback = {
  summary: string;
  improvements: string[];
};

type FriendChatFinishRequest = {
  postId?: unknown;
  englishDifficulty?: 'easy' | 'medium' | 'hard';
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

type FriendChatRetryRequest = {
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

type FriendChatPostContext = {
  postId?: string;
  context?: string;
  caption?: string;
  imageUrl?: string;
  videoUrl?: string;
};

type FriendRecord = FriendCharacter & {
  userId: string;
  lastUserMessage?: string;
  messageCount?: number;
  conversationCount?: number;
};

const STORY_SESSIONS = new Map<string, StorySessionState>();
function pruneStorySessions(maxEntries: number = 200, ttlMs: number = 1000 * 60 * 30) {
  const now = Date.now();
  for (const [id, session] of STORY_SESSIONS) {
    if (session.lastUpdated + ttlMs < now) {
      STORY_SESSIONS.delete(id);
    }
  }
  if (STORY_SESSIONS.size > maxEntries) {
    const entries = Array.from(STORY_SESSIONS.entries()).sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
    for (let i = 0; i < entries.length && STORY_SESSIONS.size > maxEntries; i++) {
      STORY_SESSIONS.delete(entries[i][0]);
    }
  }
}

function mergeHistory(base: StoryMessage[] = [], additions: StoryMessage[] = []): StoryMessage[] {
  const merged: StoryMessage[] = [...base];
  for (const message of additions) {
    if (!message) continue;
    const trimmed = (message.content || '').trim();
    if (!trimmed) continue;
    const normalized: StoryMessage = { role: message.role, content: trimmed };
    if (normalized.role !== 'user' && normalized.role !== 'assistant') {
      continue;
    }
    const last = merged[merged.length - 1];
    if (!last || last.role !== normalized.role || last.content !== normalized.content) {
      merged.push(normalized);
      if (merged.length > STORY_HISTORY_LIMIT) {
        merged.splice(0, merged.length - STORY_HISTORY_LIMIT);
      }
    }
  }
  return merged;
}

function appendHistoryEntry(history: StoryMessage[] = [], message: StoryMessage): StoryMessage[] {
  return mergeHistory(history, [message]);
}

function sanitizeSessionContext(input: any): { storyId?: string; sceneIndex?: number; story?: StoryDefinition } {
  if (!input || typeof input !== 'object') return {};
  const rawStoryId = typeof input.storyId === 'string' ? input.storyId : undefined;
  const rawSceneIndex =
    input.sceneIndex ?? input.missionIndex ?? input.scene_index ?? input.scene ?? input.stepIndex;
  const sceneIndex = Number.isFinite(Number(rawSceneIndex))
    ? Math.max(0, Math.floor(Number(rawSceneIndex)))
    : undefined;
  const storyFromBody = input.storyDefinition
    ? sanitizeStoryDefinition(input.storyDefinition, rawStoryId)
    : undefined;
  return {
    storyId: storyFromBody?.storyId ?? rawStoryId,
    sceneIndex,
    story: storyFromBody,
  };
}
function sanitizeHistory(history?: StoryAdvanceRequest['history']): StoryMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((msg): msg is StoryMessage => !!msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
    .map((msg) => ({ role: msg.role, content: msg.content.trim() }));
}

function sanitizeStoryRequirement(input: any): StoryRequirement | undefined {
  if (!input) return undefined;
  const requirementId =
    typeof input.requirementId === 'string'
      ? input.requirementId
      : typeof input.requirement_id === 'string'
      ? input.requirement_id
      : undefined;
  const text =
    typeof input.text === 'string'
      ? input.text
      : typeof input.description === 'string'
      ? input.description
      : undefined;
  if (!requirementId || !text) return undefined;
  return { requirementId, text };
}

function sanitizeStoryMission(input: any): StoryMission | undefined {
  if (!input) return undefined;
  const missionIdRaw = input.missionId ?? input.id;
  const missionId =
    typeof missionIdRaw === 'string'
      ? missionIdRaw
      : typeof missionIdRaw === 'number'
      ? String(missionIdRaw)
      : undefined;
  const title = typeof input.title === 'string' ? input.title : undefined;
  const aiRole =
    typeof input.aiRole === 'string'
      ? input.aiRole
      : typeof input.ai_role === 'string'
      ? input.ai_role
      : undefined;
  if (!missionId || !title || !aiRole) return undefined;
  const aiRoleFriends =
    typeof input.aiRoleFriends === 'string'
      ? input.aiRoleFriends
      : typeof input.ai_role_friends === 'string'
      ? input.ai_role_friends
      : undefined;
  const sceneSummary =
    typeof input.sceneSummary === 'string'
      ? input.sceneSummary
      : typeof input.scene_summary === 'string'
      ? input.scene_summary
      : undefined;
  const caracterName =
    typeof input.caracterName === 'string'
      ? input.caracterName
      : typeof input.characterName === 'string'
      ? input.characterName
      : undefined;
  const caracterPrompt =
    typeof input.caracterPrompt === 'string'
      ? input.caracterPrompt
      : typeof input.characterPrompt === 'string'
      ? input.characterPrompt
      : undefined;
  const avatarImageUrl =
    typeof input.avatarImageUrl === 'string'
      ? input.avatarImageUrl
      : typeof input.avatar_image_url === 'string'
      ? input.avatar_image_url
      : undefined;
  const avatarImageXsUrl =
    typeof input.avatarImageXsUrl === 'string'
      ? input.avatarImageXsUrl
      : typeof input.avatar_image_xs_url === 'string'
      ? input.avatar_image_xs_url
      : undefined;
  const avatarImageMdUrl =
    typeof input.avatarImageMdUrl === 'string'
      ? input.avatarImageMdUrl
      : typeof input.avatar_image_md_url === 'string'
      ? input.avatar_image_md_url
      : undefined;
  const videoIntro =
    typeof input.videoIntro === 'string'
      ? input.videoIntro
      : typeof input.video_intro === 'string'
      ? input.video_intro
      : undefined;
  const videoPreviewUrl =
    typeof input.videoPreviewUrl === 'string'
      ? input.videoPreviewUrl
      : typeof input.video_preview_url === 'string'
      ? input.video_preview_url
      : undefined;
  const videoThumbnailUrl =
    typeof input.videoThumbnailUrl === 'string'
      ? input.videoThumbnailUrl
      : typeof input.video_thumbnail_url === 'string'
      ? input.video_thumbnail_url
      : undefined;
  const requirementsRaw = Array.isArray(input.requirements) ? input.requirements : [];
  const requirements = requirementsRaw
    .map((req: any) => sanitizeStoryRequirement(req))
    .filter((req: StoryRequirement | undefined): req is StoryRequirement => !!req);
  return {
    missionId,
    title,
    sceneSummary,
    aiRole,
    ...(aiRoleFriends ? { aiRoleFriends } : {}),
    caracterName,
    caracterPrompt,
    avatarImageUrl,
    avatarImageXsUrl,
    avatarImageMdUrl,
    videoIntro,
    videoPreviewUrl,
    videoThumbnailUrl,
    requirements,
  };
}

function sanitizeStoryDefinition(input: any, fallbackId?: string): StoryDefinition | undefined {
  if (!input) return undefined;
  const storyId = typeof input.storyId === 'string' ? input.storyId : fallbackId;
  const title = typeof input.title === 'string' ? input.title : undefined;
  const summary = typeof input.summary === 'string' ? input.summary : undefined;
  if (!storyId || !title || !summary) return undefined;
  const missionsRaw = Array.isArray(input.missions) ? input.missions : [];
  const missions = missionsRaw
    .map((mission: any) => sanitizeStoryMission(mission))
    .filter((mission: StoryMission | undefined): mission is StoryMission => !!mission);
  if (!missions.length) return undefined;
  return {
    storyId,
    isInitial: input.isInitial === true,
    title,
    summary,
    level: typeof input.level === 'string' ? input.level : undefined,
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    unlockCost: typeof input.unlockCost === 'number' ? input.unlockCost : 0,
    missions,
  };
}
function json(statusCode: number, data: unknown): ApiResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  };
}

function notFound(): ApiResponse {
  return json(404, { message: "Not Found" });
}
function badRequest(message: string): ApiResponse {
  return json(400, { message });
}
function unauthorized(message: string = "Unauthorized"): ApiResponse {
  return json(401, { code: "UNAUTHORIZED", message });
}

const ROUTE_PREFIX = "/v1";
const APP_VERSION_POLICY = {
  latestVersion: "1.2.0",
  recommendedMinimumVersion: "1.1.3",
  minimumSupportedVersion: "1.1.3",
  iosStoreUrl: "https://apps.apple.com/us/app/luva-ingles/id6758112881",
  androidStoreUrl: "https://play.google.com/store/apps/details?id=com.cardi7.luva",
  fallbackStoreUrl: "https://play.google.com/store/apps/details?id=com.cardi7.luva",
} as const;

type SupportedPlatform = "ios" | "android" | "web" | "unknown";

function parseVersionParts(version: string): number[] {
  const trimmed = version.trim();
  if (!trimmed) return [0];
  return trimmed.split(".").map((segment) => {
    const match = segment.match(/\d+/);
    if (!match) return 0;
    const value = Number(match[0]);
    return Number.isFinite(value) ? value : 0;
  });
}

function compareVersions(left: string, right: string): number {
  const a = parseVersionParts(left);
  const b = parseVersionParts(right);
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function normalizePlatform(platform: unknown): SupportedPlatform {
  if (typeof platform !== "string") return "unknown";
  const normalized = platform.trim().toLowerCase();
  if (normalized === "ios") return "ios";
  if (normalized === "android") return "android";
  if (normalized === "web") return "web";
  return "unknown";
}

function buildVersionCheckResponse(
  currentVersion: string,
  platform: SupportedPlatform
): AppVersionCheckResponse {
  let status: AppVersionCheckStatus = "ok";
  if (compareVersions(currentVersion, APP_VERSION_POLICY.minimumSupportedVersion) < 0) {
    status = "required_update";
  } else if (compareVersions(currentVersion, APP_VERSION_POLICY.recommendedMinimumVersion) < 0) {
    status = "optional_update";
  }
  const force = status === "required_update";
  const title =
    status === "required_update" ? "Actualiza Luva" : "Hay una nueva versión";
  const message =
    status === "required_update"
      ? `Tu versión ${currentVersion} ya no es compatible. Debes actualizar para continuar.`
      : status === "optional_update"
      ? `Hay una versión más reciente (${APP_VERSION_POLICY.latestVersion}). Te recomendamos actualizar.`
      : "Tu app está actualizada.";
  const storeUrl =
    platform === "ios"
      ? APP_VERSION_POLICY.iosStoreUrl
      : platform === "android"
      ? APP_VERSION_POLICY.androidStoreUrl
      : APP_VERSION_POLICY.fallbackStoreUrl;

  return {
    status,
    force,
    title,
    message,
    currentVersion,
    latestVersion: APP_VERSION_POLICY.latestVersion,
    recommendedMinimumVersion: APP_VERSION_POLICY.recommendedMinimumVersion,
    minimumSupportedVersion: APP_VERSION_POLICY.minimumSupportedVersion,
    storeUrl,
    urls: {
      ios: APP_VERSION_POLICY.iosStoreUrl,
      android: APP_VERSION_POLICY.androidStoreUrl,
      fallback: APP_VERSION_POLICY.fallbackStoreUrl,
    },
  };
}

function getClaims(event: any): CognitoClaims {
  const rawClaims =
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims ||
    {};
  const claims: CognitoClaims = {};
  for (const [key, value] of Object.entries(rawClaims)) {
    if (value == null) continue;
    claims[key] = typeof value === "string" ? value : String(value);
  }
  return claims;
}

function normalizeIdentityValue(value?: string): string | undefined {
  const normalized = (value || "").trim().toLowerCase();
  return normalized || undefined;
}

function normalizeLearnerName(value?: string): string | undefined {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  if (!normalized || normalized.includes("@")) return undefined;
  return normalized.slice(0, 80);
}

function getUserIdentity(event: any): UserIdentity | undefined {
  const claims = getClaims(event);
  const email = normalizeIdentityValue(claims.email || claims["cognito:username"]);
  const sub = normalizeIdentityValue(claims.sub);
  const userId = email || sub;
  if (!userId) return undefined;
  return {
    userId,
    email,
    sub,
    displayName: normalizeLearnerName(claims.name),
    givenName: normalizeLearnerName(claims.given_name),
    familyName: normalizeLearnerName(claims.family_name),
  };
}

function getUsersTableNameOptional(): string | undefined {
  return process.env.USERS_TABLE_NAME || undefined;
}

type LearnerDifficulty = 'easy' | 'medium' | 'hard';

type LearnerProfile = {
  name?: string;
  difficulty?: LearnerDifficulty;
};

function normalizeLearnerDifficulty(value: unknown): LearnerDifficulty | undefined {
  const normalized = (typeof value === 'string' ? value : '').trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
    return normalized;
  }
  return undefined;
}

async function resolveLearnerProfile(identity: UserIdentity): Promise<LearnerProfile> {
  const fallbackName =
    normalizeLearnerName(identity.displayName) ||
    normalizeLearnerName([identity.givenName, identity.familyName].filter(Boolean).join(" "));

  const tableName = getUsersTableNameOptional();
  if (!tableName || !identity.email) {
    return { name: fallbackName };
  }

  try {
    const out = await dynamo.send(
      new GetCommand({
        TableName: tableName,
        Key: { email: identity.email },
        ProjectionExpression: "displayName, givenName, familyName, englishDifficulty",
      })
    );
    const item = out.Item as
      | {
          displayName?: string;
          givenName?: string;
          familyName?: string;
          englishDifficulty?: string;
        }
      | undefined;
    return {
      name:
        normalizeLearnerName(item?.displayName) ||
        normalizeLearnerName([item?.givenName, item?.familyName].filter(Boolean).join(" ")) ||
        fallbackName,
      difficulty: normalizeLearnerDifficulty(item?.englishDifficulty),
    };
  } catch (err) {
    console.warn(
      JSON.stringify({
        scope: "friends.chat.learner_profile_error",
        message: (err as Error)?.message || "unknown",
      })
    );
    return { name: fallbackName };
  }
}

export const handler = async (event: any, context?: any): Promise<Result> => {
  const method: string =
    event.httpMethod || event.requestContext?.http?.method || "GET";
  const rawPath: string =
    event.resource && event.path
      ? event.path
      : event.requestContext?.http?.path || "/";
  const path = rawPath.startsWith(ROUTE_PREFIX)
    ? rawPath
    : `${ROUTE_PREFIX}${rawPath}`;
  const reqId: string | undefined =
    event.requestContext?.requestId ||
    event.requestContext?.http?.requestId ||
    context?.awsRequestId;
  const stage = process.env.STAGE || "dev";

  const log = (scope: string, extra?: Record<string, unknown>) => {
    try {
      console.log(
        JSON.stringify({ scope, method, path, reqId, stage, ...extra })
      );
    } catch {
      // fallback minimal log
      console.log(`[${scope}] ${method} ${path} ${reqId || ""}`);
    }
  };

  log("request.received");

  try {
    if (method === "GET" && path === `${ROUTE_PREFIX}/cards`) {
      log("cards.list");
      return json(200, { items: mockCards(), nextCursor: null });
    }

    if (method === "POST" && path === `${ROUTE_PREFIX}/sessions/start`) {
      log("sessions.start.begin");
      const startBody = parseBody(event.body);
      const { uploadUrl, sessionId } = await startSession(startBody);
      log("sessions.start.success", { sessionId });
      return json(200, { sessionId, uploadUrl } satisfies SessionStartResponse);
    }

    const sessionTranscribe = path.match(
      /^\/v1\/sessions\/([^/]+)\/transcribe$/
    );
    if (method === "POST" && sessionTranscribe) {
      const sessionId = sessionTranscribe[1];
      log("sessions.transcribe.begin", { sessionId });
      const t0 = Date.now();
      const transcript = await transcribeWhisper(sessionId);
      log("sessions.transcribe.success", {
        sessionId,
        ms: Date.now() - t0,
        length: transcript?.length || 0,
      });
      return json(200, { transcript });
    }

    const sessionEvaluate = path.match(/^\/v1\/sessions\/([^/]+)\/evaluate$/);
    if (method === "POST" && sessionEvaluate) {
      const sessionId = sessionEvaluate[1];
      const body = parseBody(event.body);
      const transcript = body?.transcript ?? "";
      const label = body?.label as string | undefined;
      const example = body?.example as string | undefined;
      log("sessions.evaluate.begin", {
        sessionId,
        hasLabel: !!label,
        exampleProvided: !!example,
        tLen: transcript?.length || 0,
      });
      const t0 = Date.now();
      const evalResponse = await evaluateAI(transcript, { label, example });
      log("sessions.evaluate.success", {
        sessionId,
        ms: Date.now() - t0,
        score: (evalResponse as any)?.score,
      });
      return json(200, evalResponse as any);
    }

    const cardComplete = path.match(/^\/v1\/cards\/([^/]+)\/complete$/);
    if (method === "POST" && cardComplete) {
      // Normally update streak/points in DynamoDB
      return json(200, {
        newPoints: 5,
        unlocked: { stories: ["london_trip"] },
      });
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/characters`) {
      return json(200, { items: listCatalogFriends() });
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/feed/posts`) {
      return json(200, await listPublicFeedPosts());
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/feed/character-videos`) {
      return json(200, { posts: await listPublicCharacterVideoPosts() });
    }

    const characterVideoMetric = path.match(
      /^\/v1\/feed\/character-videos\/([^/]+)\/([^/]+)\/metric$/,
    );
    if (method === "POST" && characterVideoMetric) {
      try {
        const body = parseBody(event.body) || {};
        return json(
          200,
          await incrementCharacterPostMetric(
            decodeURIComponent(characterVideoMetric[1]),
            decodeURIComponent(characterVideoMetric[2]),
            (body as { event?: unknown }).event,
          ),
        );
      } catch (err: any) {
        if (
          err?.message === 'INVALID_CHARACTER_ID' ||
          err?.message === 'INVALID_CHARACTER_POST_ID' ||
          err?.message === 'INVALID_CHARACTER_POST_METRIC'
        ) {
          return badRequest(err.message);
        }
        if (err?.name === 'ConditionalCheckFailedException') {
          return notFound();
        }
        throw err;
      }
    }

    const characterVideoLike = path.match(
      /^\/v1\/feed\/character-videos\/([^/]+)\/([^/]+)\/like$/,
    );
    if (method === "POST" && characterVideoLike) {
      try {
        return json(
          200,
          await incrementCharacterPostLike(
            decodeURIComponent(characterVideoLike[1]),
            decodeURIComponent(characterVideoLike[2]),
          ),
        );
      } catch (err: any) {
        if (
          err?.message === 'INVALID_CHARACTER_ID' ||
          err?.message === 'INVALID_CHARACTER_POST_ID'
        ) {
          return badRequest(err.message);
        }
        if (err?.name === 'ConditionalCheckFailedException') {
          return notFound();
        }
        throw err;
      }
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/lessons`) {
      return json(200, await listPublicLessons());
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/shadowing`) {
      return json(200, await listPublicShadowingCatalog());
    }

    const lessonDetail = path.match(/^\/v1\/lessons\/([^/]+)$/);
    if (method === "GET" && lessonDetail) {
      try {
        return json(200, await getPublicLesson({ lessonId: decodeURIComponent(lessonDetail[1]) }));
      } catch (err: any) {
        if (err?.message === 'LESSON_NOT_FOUND') {
          return notFound();
        }
        if (err?.message === 'INVALID_LESSON_ID') {
          return badRequest('Missing lessonId');
        }
        throw err;
      }
    }

    const lessonHelp = path.match(/^\/v1\/lessons\/([^/]+)\/help$/);
    if (method === "POST" && lessonHelp) {
      try {
        return json(200, await answerLessonHelp({
          lessonId: decodeURIComponent(lessonHelp[1]),
          ...(parseBody(event.body) || {}),
        }));
      } catch (err: any) {
        if (err?.message === 'LESSON_NOT_FOUND') {
          return notFound();
        }
        if (
          err?.message === 'INVALID_LESSON_ID' ||
          err?.message === 'INVALID_LESSON_HELP_QUESTION'
        ) {
          return badRequest(err?.message === 'INVALID_LESSON_HELP_QUESTION' ? 'Missing question' : 'Missing lessonId');
        }
        console.error(
          JSON.stringify({
            scope: 'lessons.help.error',
            message: err?.message || 'unknown',
          })
        );
        return json(500, { message: 'No pudimos generar la ayuda', code: 'LESSON_HELP_FAILED' });
      }
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/friends`) {
      const identity = getUserIdentity(event);
      if (!identity) {
        return unauthorized("Missing user identity");
      }
      return json(200, { items: await listFriends(identity.userId) } satisfies FriendsListResponse);
    }

    if (method === "POST" && path === `${ROUTE_PREFIX}/friends`) {
      const identity = getUserIdentity(event);
      if (!identity) {
        return unauthorized("Missing user identity");
      }
      const body = parseBody(event.body) as CreateFriendRequest | undefined;
      try {
        const friend = await createFriendFromMission(identity.userId, body || {});
        return json(200, { friend });
      } catch (err: any) {
        if (err?.message === "FRIEND_STORY_NOT_FOUND" || err?.message === "FRIEND_MISSION_NOT_FOUND") {
          return badRequest("Mission not found");
        }
        throw err;
      }
    }

    const friendProfile = path.match(/^\/v1\/(?:friends\/([^/]+)\/profile|friend-profiles\/([^/]+))$/);
    if (method === "GET" && friendProfile) {
      const identity = getUserIdentity(event);
      const encodedFriendId = friendProfile[1] || friendProfile[2];
      const friendId = decodeURIComponent(encodedFriendId);
      const profile = await getPublicFriendProfile(friendId, identity);
      if (!profile.friend) {
        return notFound();
      }

      return json(200, profile);
    }

    const publicFriendFinish = path.match(/^\/v1\/public\/friends\/([^/]+)\/finish$/);
    if (method === "POST" && publicFriendFinish) {
      const friendId = decodeURIComponent(publicFriendFinish[1]);
      const body = parseBody(event.body) as FriendChatFinishRequest | undefined;
      try {
        const feedback = await finishFriendChat(undefined, friendId, body || {});
        return json(200, { friendId, conversationEnded: true, conversationFeedback: feedback });
      } catch (err: any) {
        if (err?.message === "FRIEND_NOT_FOUND") {
          return notFound();
        }
        throw err;
      }
    }

    const publicFriendChat = path.match(/^\/v1\/public\/friends\/([^/]+)\/chat$/);
    if (method === "POST" && publicFriendChat) {
      const friendId = decodeURIComponent(publicFriendChat[1]);
      const body = parseBody(event.body) as FriendChatRequest | undefined;
      const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
      if (!transcript) {
        return badRequest("Missing transcript");
      }
      try {
        const payload = await advanceFriendChat(
          undefined,
          friendId,
          {
            ...(body || {}),
            transcript,
          }
        );
        return json(200, payload);
      } catch (err: any) {
        if (err?.message === "FRIEND_NOT_FOUND") {
          return notFound();
        }
        throw err;
      }
    }

    const publicFriendAssist = path.match(/^\/v1\/public\/friends\/([^/]+)\/assist$/);
    if (method === "POST" && publicFriendAssist) {
      const friendId = decodeURIComponent(publicFriendAssist[1]);
      const body = parseBody(event.body) as any;
      const question = typeof body?.question === "string" ? body.question.trim() : "";
      if (!question) {
        return badRequest("Missing question");
      }
      try {
        const answer = await answerFriendAssistance(undefined, friendId, {
          ...(body || {}),
          question,
        });
        return json(200, { answer });
      } catch (err: any) {
        if (err?.message === "FRIEND_NOT_FOUND") {
          return notFound();
        }
        console.error(
          JSON.stringify({
            scope: "friends.public_assist.error",
            message: err?.message || "unknown",
          })
        );
        return json(500, { message: "No pudimos generar la asistencia", code: "FRIEND_ASSISTANCE_FAILED" });
      }
    }

    const friendFinish = path.match(/^\/v1\/friends\/([^/]+)\/finish$/);
    if (method === "POST" && friendFinish) {
      const identity = getUserIdentity(event);
      if (!identity) {
        return unauthorized("Missing user identity");
      }
      const friendId = decodeURIComponent(friendFinish[1]);
      const body = parseBody(event.body) as FriendChatFinishRequest | undefined;
      try {
        const learnerProfile = await resolveLearnerProfile(identity);
        const feedback = await finishFriendChat(
          identity.userId,
          friendId,
          body || {},
          learnerProfile.difficulty
        );
        return json(200, { friendId, conversationEnded: true, conversationFeedback: feedback });
      } catch (err: any) {
        if (err?.message === "FRIEND_NOT_FOUND") {
          return notFound();
        }
        throw err;
      }
    }

    const friendRetry = path.match(/^\/v1\/friends\/([^/]+)\/retry$/);
    if (method === "POST" && friendRetry) {
      const identity = getUserIdentity(event);
      if (!identity) {
        return unauthorized("Missing user identity");
      }
      const friendId = decodeURIComponent(friendRetry[1]);
      const body = parseBody(event.body) as FriendChatRetryRequest | undefined;
      try {
        const conversationSnapshot = await retryFriendChat(identity.userId, friendId, body || {});
        return json(200, { friendId, conversationSnapshot: conversationSnapshot ?? null });
      } catch (err: any) {
        if (err?.message === "FRIEND_NOT_FOUND") {
          return notFound();
        }
        throw err;
      }
    }

    const friendChat = path.match(/^\/v1\/friends\/([^/]+)\/chat$/);
    if (method === "POST" && friendChat) {
      const identity = getUserIdentity(event);
      if (!identity) {
        return unauthorized("Missing user identity");
      }
      const friendId = decodeURIComponent(friendChat[1]);
      const body = parseBody(event.body) as FriendChatRequest | undefined;
      const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
      if (!transcript) {
        return badRequest("Missing transcript");
      }
      try {
        const learnerProfile = await resolveLearnerProfile(identity);
        const payload = await advanceFriendChat(
          identity.userId,
          friendId,
          {
            ...(body || {}),
            transcript,
          },
          learnerProfile.name,
          learnerProfile.difficulty
        );
        return json(200, payload);
      } catch (err: any) {
        if (err?.message === "FRIEND_NOT_FOUND") {
          return notFound();
        }
        throw err;
      }
    }

    const friendAssist = path.match(/^\/v1\/friends\/([^/]+)\/assist$/);
    if (method === "POST" && friendAssist) {
      const identity = getUserIdentity(event);
      if (!identity) {
        return unauthorized("Missing user identity");
      }
      const friendId = decodeURIComponent(friendAssist[1]);
      const body = parseBody(event.body) as any;
      const question = typeof body?.question === "string" ? body.question.trim() : "";
      if (!question) {
        return badRequest("Missing question");
      }
      try {
        const answer = await answerFriendAssistance(identity.userId, friendId, {
          ...(body || {}),
          question,
        });
        return json(200, { answer });
      } catch (err: any) {
        if (err?.message === "FRIEND_NOT_FOUND") {
          return notFound();
        }
        console.error(
          JSON.stringify({
            scope: "friends.assist.error",
            message: err?.message || "unknown",
          })
        );
        return json(500, { message: "No pudimos generar la asistencia", code: "FRIEND_ASSISTANCE_FAILED" });
      }
    }

    if (method === "POST" && path === `${ROUTE_PREFIX}/practice/assist`) {
      const body = parseBody(event.body) as StoryAssistanceRequest;
      const question = typeof body?.question === "string" ? body.question.trim() : "";
      if (!question) {
        return badRequest("Missing question");
      }
      const story = sanitizeStoryDefinition(body?.storyDefinition, "practice-session");
      const mission =
        sanitizeStoryMission(body?.missionDefinition) ||
        story?.missions?.[0];
      if (!story || !mission) {
        return badRequest("Missing practice context");
      }
      try {
        const answer = await generateAssistanceAnswer({
          story,
          mission,
          history: sanitizeHistory(body?.history).slice(-STORY_HISTORY_LIMIT),
          requirements: Array.isArray(body?.requirements)
            ? alignRequirementStates(mission, body.requirements)
            : [],
          question,
          conversationFeedback: body?.conversationFeedback || null,
        });
        return json(200, { answer } as StoryAssistanceResponse);
      } catch (err: any) {
        console.error(
          JSON.stringify({
            scope: "practice.assist.error",
            message: err?.message || "unknown",
          })
        );
        return json(500, { message: "No pudimos generar la asistencia", code: "PRACTICE_ASSISTANCE_FAILED" });
      }
    }

    if (method === "POST" && path === `${ROUTE_PREFIX}/translate`) {
      const body = parseBody(event.body) as TranslationRequest | undefined;
      const text = typeof body?.text === "string" ? body.text.trim() : "";
      if (!text) {
        return badRequest("Missing text");
      }
      if (text.length > 5000) {
        return badRequest("Text is too long");
      }
      const target = normalizeLanguageCode(body?.target, "es");
      const source = normalizeLanguageCode(body?.source, "en");
      log("translate.begin", {
        tLen: text.length,
        source,
        target,
      });
      try {
        const translated = await translateTextWithGoogle(text, {
          source,
          target,
        });
        log("translate.success", {
          translatedLen: translated.translatedText.length,
          detectedSourceLanguage: translated.sourceLanguage,
        });
        return json(200, translated satisfies TranslationResponse);
      } catch (err: any) {
        console.error(
          JSON.stringify({
            scope: "translate.google.error",
            message: err?.message || "unknown",
          })
        );
        return json(500, {
          message: "No pudimos traducir el mensaje",
          code: "TRANSLATION_FAILED",
        });
      }
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/me/progress`) {
      return json(200, {
        points: 120,
        streaks: { max: 7, current: 2 },
        recent: [],
      });
    }

    if (method === "POST" && path === `${ROUTE_PREFIX}/promo-codes/validate`) {
      const body = parseBody(event.body) as PromoCodeValidationRequest | undefined;
      const submittedCode = typeof body?.code === "string" ? body.code.trim() : "";
      if (!submittedCode) {
        return badRequest("Missing code");
      }
      const payload: PromoCodeValidationResponse = validatePromoCode(submittedCode);
      return json(200, payload);
    }

    if (method === "POST" && path === `${ROUTE_PREFIX}/app/version-check`) {
      const body = parseBody(event.body) as AppVersionCheckRequest | undefined;
      const submittedVersion = typeof body?.version === "string" ? body.version.trim() : "";
      if (!submittedVersion) {
        return badRequest("Missing version");
      }
      const platform = normalizePlatform(body?.platform);
      const payload = buildVersionCheckResponse(submittedVersion, platform);
      return json(200, payload);
    }

    return notFound();
  } catch (err: any) {
    log("request.unhandledError", { error: err?.message || "unknown" });
    return json(500, { message: "Internal error", code: "INTERNAL_ERROR" });
  }
};

function parseBody(body: any): any {
  if (!body) return undefined;
  try {
    return typeof body === "string" ? JSON.parse(body) : body;
  } catch {
    return undefined;
  }
}

function getFriendshipsTableName(): string {
  const tableName = process.env.FRIENDSHIPS_TABLE_NAME?.trim();
  if (!tableName) {
    throw new Error("FRIENDSHIPS_TABLE_NAME not set");
  }
  return tableName;
}

function sanitizeFriendConversationFeedback(input: any): FriendConversationFeedback | undefined {
  if (!input || typeof input !== "object") return undefined;
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  const improvements = Array.isArray(input.improvements)
    ? input.improvements
        .map((item: unknown) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  if (!summary && !improvements.length) return undefined;
  return { summary, improvements };
}

function sanitizeFriendConversationSnapshot(input: any): FriendConversationSnapshot | undefined {
  if (!input || typeof input !== "object") return undefined;
  const messages = sanitizeHistory(input.messages).slice(-FRIEND_HISTORY_LIMIT);
  if (!messages.length) return undefined;
  const updatedAt = sanitizeSyncTimestamp(input.updatedAt) || new Date().toISOString();
  return {
    messages,
    conversationEnded: Boolean(input.conversationEnded),
    conversationFeedback: sanitizeFriendConversationFeedback(input.conversationFeedback) || null,
    updatedAt,
  };
}

function latestConversationSnapshot(
  left?: FriendConversationSnapshot,
  right?: FriendConversationSnapshot
): FriendConversationSnapshot | undefined {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(right.updatedAt) > Date.parse(left.updatedAt) ? right : left;
}

function publicFriend(record: FriendRecord): FriendCharacter {
  return {
    friendId: record.friendId,
    characterName: record.characterName,
    aiRole: record.aiRole,
    ...(record.characterPrompt ? { characterPrompt: record.characterPrompt } : {}),
    ...(record.characterBio ? { characterBio: record.characterBio } : {}),
    ...(record.avatarImageUrl ? { avatarImageUrl: record.avatarImageUrl } : {}),
    ...(record.avatarImageXsUrl ? { avatarImageXsUrl: record.avatarImageXsUrl } : {}),
    ...(record.avatarImageMdUrl ? { avatarImageMdUrl: record.avatarImageMdUrl } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(record.lastMessageAt ? { lastMessageAt: record.lastMessageAt } : {}),
    ...(typeof record.messageCount === "number" ? { messageCount: record.messageCount } : {}),
    ...(typeof record.conversationCount === "number" ? { conversationCount: record.conversationCount } : {}),
    ...(record.conversationSnapshot ? { conversationSnapshot: record.conversationSnapshot } : {}),
  };
}

function friendFromCharacter(character: CharacterDefinition): FriendCharacter {
  return {
    friendId: character.characterId,
    characterName: character.caracterName || "Personaje",
    aiRole: character.aiRole,
    ...(character.caracterPrompt ? { characterPrompt: character.caracterPrompt } : {}),
    ...(character.characterBio ? { characterBio: character.characterBio } : {}),
    ...(character.avatarImageUrl ? { avatarImageUrl: character.avatarImageUrl } : {}),
    ...(character.avatarImageXsUrl ? { avatarImageXsUrl: character.avatarImageXsUrl } : {}),
    ...(character.avatarImageMdUrl ? { avatarImageMdUrl: character.avatarImageMdUrl } : {}),
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

function findCharacter(characterId: string): CharacterDefinition | undefined {
  const trimmed = typeof characterId === "string" ? characterId.trim() : "";
  if (!trimmed) return undefined;
  return CHARACTERS.find((character) => character.characterId === trimmed);
}

function publicCatalogFriend(friendIdInput: string): FriendCharacter | undefined {
  const character = findCharacter(friendIdInput);
  return character ? friendFromCharacter(character) : undefined;
}

function listCatalogFriends(): FriendCharacter[] {
  const initials = CHARACTERS.filter((character) => character.storyIsInitial);
  const rest = CHARACTERS.filter((character) => !character.storyIsInitial);
  return [...initials, ...rest].map(friendFromCharacter);
}

function publicFriendFromCharacterPosts(
  friendIdInput: string,
  posts: CharacterPost[]
): FriendCharacter | undefined {
  const friendId = typeof friendIdInput === "string" ? friendIdInput.trim() : "";
  const firstPost = posts.find((post) => post.characterId === friendId) || posts[0];
  if (!friendId || !firstPost) {
    return undefined;
  }

  return {
    friendId,
    characterName: firstPost.characterName,
    aiRole: `You are ${firstPost.characterName}, a friendly English conversation partner.`,
    ...(firstPost.avatarImageUrl ? { avatarImageUrl: firstPost.avatarImageUrl } : {}),
    createdAt: firstPost.createdAt,
    updatedAt: firstPost.updatedAt,
  };
}

async function getPublicFriendProfile(
  friendId: string,
  identity?: UserIdentity
): Promise<{ friend?: FriendCharacter; posts: CharacterPost[] }> {
  const storedFriend = identity ? await getFriendRecord(identity.userId, friendId) : undefined;
  const catalogFriend = publicCatalogFriend(friendId);
  let friend = storedFriend ? publicFriend(storedFriend) : catalogFriend;
  if (friend && !friend.characterBio && catalogFriend?.characterBio) {
    friend = { ...friend, characterBio: catalogFriend.characterBio };
  }
  const posts = await listPublicCharacterPosts(friend?.friendId || friendId);

  return {
    friend: friend || publicFriendFromCharacterPosts(friendId, posts),
    posts,
  };
}

function sanitizeFriendRecord(input: any): FriendRecord | undefined {
  if (!input || typeof input !== "object") return undefined;
  const userId = typeof input.userId === "string" ? input.userId : undefined;
  const friendId = typeof input.friendId === "string" ? input.friendId : undefined;
  const characterName = typeof input.characterName === "string" ? input.characterName : undefined;
  const aiRole = typeof input.aiRole === "string" ? input.aiRole : undefined;
  const createdAt = typeof input.createdAt === "string" ? input.createdAt : undefined;
  const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : undefined;
  const conversationCount =
    typeof input.conversationCount === "number"
      ? input.conversationCount
      : typeof input.completedAt === "string"
      ? 1
      : undefined;
  if (!userId || !friendId || !characterName || !aiRole || !createdAt || !updatedAt) {
    return undefined;
  }
  const conversationSnapshot = sanitizeFriendConversationSnapshot(input.conversationSnapshot);

  return {
    userId,
    friendId,
    characterName,
    aiRole,
    ...(typeof input.characterPrompt === "string" ? { characterPrompt: input.characterPrompt } : {}),
    ...(typeof input.characterBio === "string" ? { characterBio: input.characterBio } : {}),
    ...(typeof input.avatarImageUrl === "string" ? { avatarImageUrl: input.avatarImageUrl } : {}),
    ...(typeof input.avatarImageXsUrl === "string" ? { avatarImageXsUrl: input.avatarImageXsUrl } : {}),
    ...(typeof input.avatarImageMdUrl === "string" ? { avatarImageMdUrl: input.avatarImageMdUrl } : {}),
    createdAt,
    updatedAt,
    ...(typeof input.lastMessageAt === "string" ? { lastMessageAt: input.lastMessageAt } : {}),
    ...(typeof input.lastUserMessage === "string" ? { lastUserMessage: input.lastUserMessage } : {}),
    ...(typeof input.messageCount === "number" ? { messageCount: input.messageCount } : {}),
    ...(typeof conversationCount === "number" ? { conversationCount } : {}),
    ...(conversationSnapshot ? { conversationSnapshot } : {}),
  };
}

async function getFriendRecord(userId: string, friendId: string): Promise<FriendRecord | undefined> {
  const out = await dynamo.send(
    new GetCommand({
      TableName: getFriendshipsTableName(),
      Key: { userId, friendId },
    })
  );
  return sanitizeFriendRecord(out.Item);
}

async function listFriends(userId: string): Promise<FriendCharacter[]> {
  const out = await dynamo.send(
    new QueryCommand({
      TableName: getFriendshipsTableName(),
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    })
  );
  return (out.Items || [])
    .map((item) => sanitizeFriendRecord(item))
    .filter((item): item is FriendRecord => !!item)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(publicFriend);
}

function sanitizeSyncCount(value: unknown): number | undefined {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value.trim())
      : Number.NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
}

function sanitizeSyncTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || !Number.isFinite(Date.parse(trimmed))) return undefined;
  return new Date(trimmed).toISOString();
}

function latestTimestamp(...values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => Boolean(value && Number.isFinite(Date.parse(value))))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

function resolveCharacterFromBody(body: CreateFriendRequest): CharacterDefinition | undefined {
  const characterId =
    typeof body.characterId === "string" && body.characterId.trim()
      ? body.characterId.trim()
      : typeof body.storyId === "string" && typeof body.missionId === "string"
      ? `${body.storyId.trim()}:${body.missionId.trim()}`
      : undefined;
  return characterId ? findCharacter(characterId) : undefined;
}

async function createFriendFromMission(
  userId: string,
  body: CreateFriendRequest
): Promise<FriendCharacter> {
  const character = resolveCharacterFromBody(body);
  if (!character) {
    throw new Error("FRIEND_CHARACTER_NOT_FOUND");
  }

  const friendId = character.characterId;
  const existing = await getFriendRecord(userId, friendId);
  const now = new Date().toISOString();
  const syncedLastMessageAt = sanitizeSyncTimestamp(body.lastMessageAt);
  const syncedLastUserMessage =
    typeof body.lastUserMessage === "string" && body.lastUserMessage.trim()
      ? body.lastUserMessage.trim().slice(0, 500)
      : undefined;
  const syncedMessageCount = sanitizeSyncCount(body.messageCount);
  const syncedConversationCount = sanitizeSyncCount(body.conversationCount);
  const messageCount = Math.max(existing?.messageCount ?? 0, syncedMessageCount ?? 0);
  const conversationCount = Math.max(existing?.conversationCount ?? 0, syncedConversationCount ?? 0);
  const lastMessageAt = latestTimestamp(existing?.lastMessageAt, syncedLastMessageAt);
  const conversationSnapshot = latestConversationSnapshot(
    existing?.conversationSnapshot,
    sanitizeFriendConversationSnapshot(body.conversationSnapshot)
  );
  const item: FriendRecord = {
    userId,
    friendId,
    characterName: character.caracterName || "Personaje",
    aiRole: character.aiRole,
    ...(character.caracterPrompt ? { characterPrompt: character.caracterPrompt } : {}),
    ...(character.characterBio ? { characterBio: character.characterBio } : {}),
    ...(character.avatarImageUrl ? { avatarImageUrl: character.avatarImageUrl } : {}),
    ...(character.avatarImageXsUrl ? { avatarImageXsUrl: character.avatarImageXsUrl } : {}),
    ...(character.avatarImageMdUrl ? { avatarImageMdUrl: character.avatarImageMdUrl } : {}),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...(lastMessageAt ? { lastMessageAt } : {}),
    ...(syncedLastUserMessage || existing?.lastUserMessage
      ? { lastUserMessage: syncedLastUserMessage || existing?.lastUserMessage }
      : {}),
    ...(messageCount > 0 ? { messageCount } : {}),
    ...(conversationCount > 0 ? { conversationCount } : {}),
    ...(conversationSnapshot ? { conversationSnapshot } : {}),
  };

  await dynamo.send(
    new PutCommand({
      TableName: getFriendshipsTableName(),
      Item: item,
    })
  );

  return publicFriend(item);
}

async function resolveFriendRecord(userId: string, friendId: string): Promise<FriendRecord | undefined> {
  let friend = await getFriendRecord(userId, friendId);
  if (friend) {
    return friend;
  }

  const catalogFriend = publicCatalogFriend(friendId);
  if (!catalogFriend) {
    return undefined;
  }

  await createFriendFromMission(userId, { characterId: catalogFriend.friendId });
  return getFriendRecord(userId, friendId);
}

function publicFriendRecord(friend: FriendCharacter, userId = "anonymous"): FriendRecord {
  return {
    userId,
    friendId: friend.friendId,
    characterName: friend.characterName,
    aiRole: friend.aiRole,
    ...(friend.characterPrompt ? { characterPrompt: friend.characterPrompt } : {}),
    ...(friend.avatarImageUrl ? { avatarImageUrl: friend.avatarImageUrl } : {}),
    ...(friend.avatarImageXsUrl ? { avatarImageXsUrl: friend.avatarImageXsUrl } : {}),
    ...(friend.avatarImageMdUrl ? { avatarImageMdUrl: friend.avatarImageMdUrl } : {}),
    createdAt: friend.createdAt,
    updatedAt: friend.updatedAt,
    ...(friend.lastMessageAt ? { lastMessageAt: friend.lastMessageAt } : {}),
    ...(typeof friend.messageCount === "number" ? { messageCount: friend.messageCount } : {}),
    ...(typeof friend.conversationCount === "number" ? { conversationCount: friend.conversationCount } : {}),
    ...(friend.conversationSnapshot ? { conversationSnapshot: friend.conversationSnapshot } : {}),
  };
}

async function resolvePublicFriendRecord(friendId: string): Promise<FriendRecord | undefined> {
  const catalogFriend = publicCatalogFriend(friendId);
  if (catalogFriend) {
    return publicFriendRecord(catalogFriend);
  }

  const posts = await listPublicCharacterPosts(friendId);
  const postFriend = publicFriendFromCharacterPosts(friendId, posts);
  return postFriend ? publicFriendRecord(postFriend) : undefined;
}

async function resolveFriendRecordForChat(
  userId: string | undefined,
  friendId: string
): Promise<FriendRecord | undefined> {
  return userId ? resolveFriendRecord(userId, friendId) : resolvePublicFriendRecord(friendId);
}

async function answerFriendAssistance(
  userId: string | undefined,
  friendId: string,
  body: { question: string; history?: StoryMessage[]; postContext?: string }
): Promise<string> {
  const friend = await resolveFriendRecordForChat(userId, friendId);
  if (!friend) {
    throw new Error("FRIEND_NOT_FOUND");
  }

  const sceneSummary =
    typeof body.postContext === "string" && body.postContext.trim()
      ? `The learner is replying to a profile post from ${friend.characterName}: ${body.postContext.trim()}`
      : undefined;
  const mission: StoryMission = {
    missionId: friend.friendId,
    title: friend.characterName,
    sceneSummary,
    aiRole: friend.aiRole,
    caracterName: friend.characterName,
    caracterPrompt: friend.characterPrompt,
    avatarImageUrl: friend.avatarImageUrl,
    avatarImageXsUrl: friend.avatarImageXsUrl,
    avatarImageMdUrl: friend.avatarImageMdUrl,
    requirements: [],
  };
  const story: StoryDefinition = {
    storyId: friend.friendId,
    title: friend.characterName,
    summary: sceneSummary || friend.characterName,
    missions: [mission],
  };

  return generateAssistanceAnswer({
    story,
    mission,
    history: sanitizeHistory(body.history).slice(-STORY_HISTORY_LIMIT),
    requirements: [],
    question: body.question,
    conversationFeedback: null,
  });
}

async function touchFriendChat(
  userId: string,
  friendId: string,
  transcript: string,
  conversationEnded: boolean,
  conversationSnapshot?: FriendConversationSnapshot
): Promise<void> {
  try {
    const setExpressions = [
      "lastMessageAt = :now",
      "lastUserMessage = :message",
      "updatedAt = :now",
    ];
    const expressionAttributeValues: Record<string, any> = {
      ":now": new Date().toISOString(),
      ":message": transcript.slice(0, 500),
      ":one": 1,
    };
    if (conversationSnapshot) {
      setExpressions.push("conversationSnapshot = :conversationSnapshot");
      expressionAttributeValues[":conversationSnapshot"] = {
        ...conversationSnapshot,
        updatedAt: conversationSnapshot.updatedAt || expressionAttributeValues[":now"],
      };
    }
    const addExpressions = ["messageCount :one"];
    if (conversationEnded) {
      addExpressions.push("conversationCount :one");
    }
    await dynamo.send(
      new UpdateCommand({
        TableName: getFriendshipsTableName(),
        Key: { userId, friendId },
        UpdateExpression: `SET ${setExpressions.join(", ")} ADD ${addExpressions.join(", ")}`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  } catch (err) {
    console.warn(
      JSON.stringify({
        scope: "friends.chat.touch_error",
        message: (err as Error)?.message || "unknown",
      })
    );
  }
}

async function retryFriendChat(
  userId: string,
  friendId: string,
  body: FriendChatRetryRequest
): Promise<FriendConversationSnapshot | undefined> {
  const friend = await resolveFriendRecord(userId, friendId);
  if (!friend) {
    throw new Error("FRIEND_NOT_FOUND");
  }

  const history = sanitizeHistory(body.history).slice(-FRIEND_HISTORY_LIMIT);
  const now = new Date().toISOString();
  const lastUserMessage = [...history].reverse().find((entry) => entry.role === "user")?.content;
  const conversationSnapshot: FriendConversationSnapshot | undefined = history.length
    ? {
        messages: history,
        conversationEnded: false,
        conversationFeedback: null,
        updatedAt: now,
      }
    : undefined;
  const messageCount = Math.max(0, Math.floor(friend.messageCount ?? 0) - 1);
  const setExpressions = ["updatedAt = :now", "messageCount = :messageCount"];
  const removeExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {
    ":now": now,
    ":messageCount": messageCount,
  };

  if (conversationSnapshot) {
    setExpressions.push("conversationSnapshot = :conversationSnapshot");
    expressionAttributeValues[":conversationSnapshot"] = conversationSnapshot;
  } else {
    removeExpressions.push("conversationSnapshot");
  }

  if (lastUserMessage) {
    setExpressions.push("lastMessageAt = :now", "lastUserMessage = :message");
    expressionAttributeValues[":message"] = lastUserMessage.slice(0, 500);
  } else {
    removeExpressions.push("lastMessageAt", "lastUserMessage");
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: getFriendshipsTableName(),
      Key: { userId, friendId },
      UpdateExpression: [
        `SET ${setExpressions.join(", ")}`,
        removeExpressions.length ? `REMOVE ${removeExpressions.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" "),
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  return conversationSnapshot;
}

function buildFriendConversationFeedbackFallback(args: {
  correctness: number;
  result: EvalResult;
  errors: string[];
  reformulations: string[];
}): FriendConversationFeedback {
  const summary =
    args.result === "correct"
      ? `Cerraste la conversación de forma natural y clara. Tu último mensaje quedó fuerte: ${args.correctness}/100.`
      : args.result === "partial"
      ? `Cerraste la conversación bien, con algunos detalles de inglés por pulir. Tu último mensaje obtuvo ${args.correctness}/100.`
      : `La despedida se entendió, pero conviene ajustar gramática o naturalidad. Tu último mensaje obtuvo ${args.correctness}/100.`;
  const improvements = args.reformulations.length
    ? args.reformulations
    : args.errors.length
    ? args.errors.map((item) => `Revisa este punto: ${item}`)
    : ["Sigue usando despedidas breves y naturales como \"See you later\" o \"Talk to you soon\"."];

  return {
    summary,
    improvements: improvements.slice(0, 3),
  };
}

function sanitizeFriendChatText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().replace(/\s+\n/g, "\n");
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, maxLength);
}

function sanitizeFriendChatPostId(value: unknown): string | undefined {
  return sanitizeFriendChatText(value, 120);
}

function buildFriendChatPostContextFromPost(post: CharacterPost): FriendChatPostContext {
  return {
    postId: post.postId,
    context: post.context || post.caption,
    caption: post.caption,
    imageUrl: post.imageUrl,
    ...(post.videoUrl ? { videoUrl: post.videoUrl } : {}),
  };
}

async function resolveFriendChatPostContext(
  friend: FriendRecord,
  body: FriendChatRequest
): Promise<FriendChatPostContext | undefined> {
  const postId = sanitizeFriendChatPostId(body.postId);
  if (postId) {
    try {
      const posts = await listPublicCharacterPosts(friend.friendId);
      const post = posts.find((item) => item.postId === postId);
      if (post) {
        return buildFriendChatPostContextFromPost(post);
      }
    } catch (err) {
      console.warn(
        JSON.stringify({
          scope: "friends.chat.post_context_error",
          friendId: friend.friendId,
          postId,
          message: (err as Error)?.message || "unknown",
        })
      );
    }
  }

  const context = sanitizeFriendChatText(body.postContext, 3000);
  const caption = sanitizeFriendChatText(body.postCaption, 2200);
  const imageUrl = sanitizeFriendChatText(body.postImageUrl, 2048);
  const videoUrl = sanitizeFriendChatText(body.postVideoUrl, 2048);
  const fallbackContext = context || caption;
  if (!postId && !fallbackContext && !imageUrl && !videoUrl) {
    return undefined;
  }

  return {
    ...(postId ? { postId } : {}),
    ...(fallbackContext ? { context: fallbackContext } : {}),
    ...(caption ? { caption } : {}),
    ...(imageUrl && /^https?:\/\//i.test(imageUrl) ? { imageUrl } : {}),
    ...(videoUrl && /^https?:\/\//i.test(videoUrl) ? { videoUrl } : {}),
  };
}

async function advanceFriendChat(
  userId: string | undefined,
  friendId: string,
  body: FriendChatRequest,
  learnerName?: string,
  learnerDifficulty?: LearnerDifficulty
): Promise<FriendChatPayload> {
  const friend = await resolveFriendRecordForChat(userId, friendId);
  if (!friend) {
    throw new Error("FRIEND_NOT_FOUND");
  }

  const transcript = body.transcript.trim();
  const effectiveDifficulty =
    normalizeLearnerDifficulty(body.englishDifficulty) || learnerDifficulty;
  const postContext = await resolveFriendChatPostContext(friend, body);
  let conversationHistory = sanitizeHistory(body.history).slice(-FRIEND_HISTORY_LIMIT);
  conversationHistory = appendHistoryEntry(conversationHistory, {
    role: "user",
    content: transcript,
  }).slice(-FRIEND_HISTORY_LIMIT);

  const isEasyMode = effectiveDifficulty === 'easy';
  let correctness = isEasyMode ? 100 : 0;
  let result: EvalResult = isEasyMode ? "correct" : "incorrect";
  let errors: string[] = [];
  let reformulations: string[] = [];
  const englishEvalResult = await Promise.allSettled([
    isEasyMode
      ? evaluateEasyEnglish(conversationHistory, transcript)
      : evaluateStoryEnglish(conversationHistory, transcript),
  ]);

  const englishEval = englishEvalResult[0];
  if (englishEval.status === "fulfilled") {
    const value = englishEval.value;
    if (isEasyMode) {
      correctness = 100;
      result = "correct";
      errors = value.errors.slice(0, 2).map((item) => String(item));
      const alternatives = value.alternatives ?? value.improvements ?? value.suggestions ?? [];
      reformulations = alternatives.slice(0, 2).map((item) => String(item));
    } else {
      correctness = Math.max(0, Math.min(100, Math.round(Number(value.score ?? value.correctness ?? 0))));
      const rawResult = (value.result || value.status || "").toString().toLowerCase();
      result =
        rawResult === "correct" || rawResult === "partial" || rawResult === "incorrect"
          ? (rawResult as EvalResult)
          : correctness >= 85
          ? "correct"
          : correctness >= 60
          ? "partial"
          : "incorrect";
      errors = value.errors.slice(0, 3).map((item) => String(item));
      const alternatives = value.alternatives ?? value.improvements ?? value.suggestions ?? [];
      reformulations = alternatives.slice(0, 2).map((item) => String(item));
    }
  } else {
    console.error(
      JSON.stringify({
        scope: "friends.chat.english_error",
        message: (englishEval.reason as Error)?.message || "unknown",
      })
    );
  }

  let aiReply = "Tell me more about that.";
  try {
    aiReply = await generateFriendReply(
      friend,
      conversationHistory,
      {
        result,
        correctness,
      },
      learnerName,
      postContext,
      effectiveDifficulty
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: "friends.chat.reply_error",
        message: (err as Error)?.message || "unknown",
      })
    );
  }

  const conversationWithReply = appendHistoryEntry(conversationHistory, {
    role: "assistant",
    content: aiReply,
  }).slice(-FRIEND_HISTORY_LIMIT);

  if (userId) {
    await touchFriendChat(userId, friendId, transcript, false, {
      messages: conversationWithReply,
      conversationEnded: false,
      conversationFeedback: null,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    friendId,
    aiReply,
    correctness,
    result,
    errors,
    reformulations,
    conversationEnded: false,
    conversationFeedback: null,
  };
}

async function finishFriendChat(
  userId: string | undefined,
  friendId: string,
  body: FriendChatFinishRequest,
  learnerDifficulty?: LearnerDifficulty
): Promise<FriendConversationFeedback> {
  const friend = await resolveFriendRecordForChat(userId, friendId);
  if (!friend) {
    throw new Error("FRIEND_NOT_FOUND");
  }
  const history = sanitizeHistory(body.history).slice(-FRIEND_HISTORY_LIMIT);
  const postId = sanitizeFriendChatPostId(body.postId);
  const effectiveDifficulty =
    normalizeLearnerDifficulty(body.englishDifficulty) || learnerDifficulty;
  const userMessageCount = history.filter((entry) => entry.role === "user").length;
  let feedback: FriendConversationFeedback;
  try {
    feedback = await generateFriendConversationFeedback(friend, history, effectiveDifficulty);
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: "friends.chat.finish_feedback_error",
        message: (err as Error)?.message || "unknown",
      })
    );
    feedback = buildFriendConversationFeedbackFallback({
      correctness: 0,
      result: "partial",
      errors: [],
      reformulations: [],
    });
  }
  if (userId) {
    await touchFriendChat(userId, friendId, "", true, {
      messages: history,
      conversationEnded: true,
      conversationFeedback: feedback,
      updatedAt: new Date().toISOString(),
    });
  }
  if (postId && userMessageCount > 0) {
    await recordFinishedPostConversation(friendId, postId, userMessageCount);
  }
  return feedback;
}

async function recordFinishedPostConversation(
  characterId: string,
  postId: string,
  messageCount: number,
): Promise<void> {
  try {
    await incrementCharacterPostConversationMessages(characterId, postId, messageCount);
  } catch (err: any) {
    console.warn(
      JSON.stringify({
        scope: "friends.chat.post_message_count_error",
        characterId,
        postId,
        messageCount,
        message: err?.message || "unknown",
      })
    );
  }
}

async function startSession(body?: any): Promise<{
  sessionId: string;
  uploadUrl: string;
}> {
  const sessionId = randomUUID();
  const audioBucket = process.env.AUDIO_BUCKET;
  if (!audioBucket) throw new Error("AUDIO_BUCKET not set");
  const key = `sessions/${sessionId}/audio.m4a`;
  const cmd = new PutObjectCommand({
    Bucket: audioBucket,
    Key: key,
    ContentType: "audio/mp4",
  });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });
  try {
    const context = sanitizeSessionContext(body);
    if (context.storyId || context.story) {
      const storedStory =
        context.story ||
        (context.storyId ? getStory(context.storyId) : undefined) ||
        (body?.storyDefinition ? sanitizeStoryDefinition(body.storyDefinition, context.storyId) : undefined) ||
        undefined;
      STORY_SESSIONS.set(sessionId, {
        storyId: storedStory?.storyId || context.storyId,
        missionIndex: context.sceneIndex ?? 0,
        history: [],
        requirements: [],
        story: storedStory,
        lastUpdated: Date.now(),
      });
      pruneStorySessions();
    }
  } catch (err) {
    console.warn(
      JSON.stringify({
        scope: 'sessions.start.context_error',
        message: (err as Error)?.message || 'unknown',
      })
    );
  }
  console.log(
    JSON.stringify({
      scope: "sessions.start.presigned",
      sessionId,
      bucket: audioBucket,
      key,
    })
  );
  return { sessionId, uploadUrl };
}

async function transcribeWhisper(sessionId: string): Promise<string> {
  const audioBucket = process.env.AUDIO_BUCKET;
  if (!audioBucket) throw new Error("AUDIO_BUCKET not set");
  const key = `sessions/${sessionId}/audio.m4a`;
  console.log(
    JSON.stringify({
      scope: "transcribe.fetchS3.begin",
      sessionId,
      bucket: audioBucket,
      key,
    })
  );
  const body = await getObjectBuffer(audioBucket, key);
  const apiKey = await getOpenAIKey();

  // Use Node 18+ fetch + FormData/Blob
  const form = new FormData();
  const file = new Blob([body], { type: "audio/m4a" });
  form.append("file", file as any, "audio.m4a");
  form.append("model", "whisper-1");

  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form as any,
  } as any);
  if (!res.ok) {
    const txt = await res.text();
    console.error(
      JSON.stringify({
        scope: "transcribe.whisper.error",
        status: res.status,
        body: txt?.slice(0, 200),
      })
    );
    throw new Error("TRANSCRIBE_FAILED");
  }
  const data: any = await res.json();
  console.log(
    JSON.stringify({
      scope: "transcribe.whisper.success",
      ms: Date.now() - t0,
      textLen: (data?.text || "").length,
    })
  );
  return data.text || "";
}

async function getObjectBuffer(bucket: string, key: string): Promise<Buffer> {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const stream = out.Body as any; // Readable
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk as Uint8Array);
  return Buffer.concat(chunks);
}

async function getOpenAIKey(): Promise<string> {
  if (OPENAI_API_KEY_CACHE) return OPENAI_API_KEY_CACHE;
  const direct = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (direct?.trim()) {
    OPENAI_API_KEY_CACHE = direct.trim();
    return OPENAI_API_KEY_CACHE;
  }
  const name = process.env.OPENAI_KEY_PARAM;
  console.log("Fetching OpenAI key from SSM param", name);
  if (!name) throw new Error("OPENAI_KEY_PARAM not set");
  const out = await ssm.send(
    new GetParameterCommand({ Name: name, WithDecryption: true })
  );
  const value = out.Parameter?.Value;
  if (!value || value === "SET_IN_SSM")
    throw new Error("OpenAI key not configured");
  OPENAI_API_KEY_CACHE = value;
  return value;
}

async function getGoogleTranslateApiKey(): Promise<string> {
  if (GOOGLE_TRANSLATE_API_KEY_CACHE) return GOOGLE_TRANSLATE_API_KEY_CACHE;
  const directKey =
    process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
  if (directKey && directKey !== "SET_IN_SSM") {
    GOOGLE_TRANSLATE_API_KEY_CACHE = directKey;
    return directKey;
  }
  console.log("Fetching Google Translate API key from SSM param", process.env.GOOGLE_TRANSLATE_API_KEY_PARAM);
  const name = process.env.GOOGLE_TRANSLATE_API_KEY_PARAM;
  if (!name) throw new Error("GOOGLE_TRANSLATE_API_KEY_PARAM not set");
  const out = await ssm.send(
    new GetParameterCommand({ Name: name, WithDecryption: true })
  );
  const value = out.Parameter?.Value;
  if (!value || value === "SET_IN_SSM") {
    throw new Error("Google Translate API key not configured");
  }
  GOOGLE_TRANSLATE_API_KEY_CACHE = value;
  return value;
}

function normalizeLanguageCode(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  return /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(normalized)
    ? normalized
    : fallback;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCodePoint(value) : _match;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const value = Number.parseInt(code, 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : _match;
    });
}

async function translateTextWithGoogle(
  text: string,
  options: { source?: string; target: string }
): Promise<TranslationResponse> {
  const apiKey = await getGoogleTranslateApiKey();
  const timeoutMs = Number(process.env.TRANSLATE_TIMEOUT_MS || 8000);
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const body: Record<string, string> = {
      q: text,
      target: options.target,
      format: "text",
    };
    if (options.source) {
      body.source = options.source;
    }

    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      }
    );
    const payload: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = payload?.error?.message || res.statusText;
      console.error(
        JSON.stringify({
          scope: "translate.google.httpError",
          status: res.status,
          body: String(reason).slice(0, 200),
        })
      );
      throw new Error(`GOOGLE_TRANSLATE_HTTP_${res.status}`);
    }

    const first = payload?.data?.translations?.[0];
    const translatedText =
      typeof first?.translatedText === "string"
        ? decodeHtmlEntities(first.translatedText)
        : "";
    if (!translatedText) {
      throw new Error("GOOGLE_TRANSLATE_EMPTY_RESPONSE");
    }

    return {
      translatedText,
      ...(typeof first?.detectedSourceLanguage === "string"
        ? { sourceLanguage: first.detectedSourceLanguage }
        : options.source
        ? { sourceLanguage: options.source }
        : {}),
      targetLanguage: options.target,
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("GOOGLE_TRANSLATE_TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(to);
  }
}

async function evaluateAI(
  transcript: string,
  context: { label?: string; example?: string }
): Promise<
  EvaluationResponse & { errors?: string[]; improvements?: string[] }
> {
  const apiKey = await getOpenAIKey();
  const model = process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.EVAL_TIMEOUT_MS || 8000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === "1";
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || "low" }
    : undefined;
  const sys = `Eres un profesor de inglÃ©s que habla espaÃ±ol. 
  El alumno va a dar un ejemplo del uso de ${context.label}; debes evaluar su respuesta.

Devuelve SOLO JSON (sin texto extra) con estas claves:
  - correctness: nÃºmero 0-100 que indique quÃ© tan correcta es la respuesta.
  - errors: arreglo con hasta 3 mensajes cortos en español, escritos de forma muy sencilla y amable, como si le explicaras a un niño de 10 años (solo si hay errores reales, no inventes errores). Sin términos técnicos de gramática: di qué salió un poquito mal con palabras simples y agrega un pequeño consejo positivo para mejorar.
  - improvements: arreglo con 1 reformulaciÃ³n mÃ¡s natural para un nativo en inglÃ©s (frase concisa), sin explicaciones. Opcional si ya estÃ¡ perfecto.

Responde Ãºnicamente el JSON, da tu respuesta de una forma amable.`;

  const user = `${transcript}`;
  // Use Responses API for GPT-5 family, else fallback to Chat Completions
  console.log(
    JSON.stringify({
      scope: "evaluate.openai.begin",
      model,
      mode: useResponses ? "responses" : "chat",
      tLen: transcript?.length || 0,
      hasLabel: !!context.label,
      hasExample: !!context.example,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let contentText = "";
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: sys,
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: user }],
          },
        ],
        max_output_tokens: Number(process.env.EVAL_MAX_OUTPUT_TOKENS || 512),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const full: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = full?.error?.message || res.statusText;
        console.error(
          JSON.stringify({
            scope: "evaluate.openai.httpError",
            status: res.status,
            body: String(reason).slice(0, 200),
          })
        );
        throw new Error(`EVALUATE_HTTP_${res.status}`);
      }
      // Extract output_text from Responses API
      if (Array.isArray(full?.output)) {
        for (const item of full.output) {
          if (item?.type === "message" && Array.isArray(item.content)) {
            const texts = item.content
              .filter(
                (c: any) =>
                  c?.type === "output_text" && typeof c.text === "string"
              )
              .map((c: any) => c.text);
            if (texts.length) {
              contentText = texts.join("\n");
              break;
            }
          }
        }
      }
      if (!contentText && full?.choices && full.choices[0]?.message?.content) {
        contentText = full.choices[0].message.content;
      }
      // Log basic usage
      const usage = full?.usage || {};
      console.log(
        JSON.stringify({
          scope: "evaluate.openai.success",
          mode: "responses",
          input_tokens: usage?.input_tokens,
          output_tokens: usage?.output_tokens,
        })
      );
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error(
          JSON.stringify({
            scope: "evaluate.openai.httpError",
            status: res.status,
            body: txt?.slice(0, 200),
          })
        );
        throw new Error(`EVALUATE_HTTP_${res.status}`);
      }
      const data: any = await res.json();
      contentText = data.choices?.[0]?.message?.content || "";
      console.log(
        JSON.stringify({ scope: "evaluate.openai.success", mode: "chat" })
      );
    }
  } catch (e: any) {
    clearTimeout(to);
    if (e?.name === "AbortError") {
      console.error(
        JSON.stringify({ scope: "evaluate.openai.timeout", timeoutMs })
      );
      throw new Error("EVALUATE_TIMEOUT");
    }
    console.error(
      JSON.stringify({
        scope: "evaluate.openai.fetchError",
        message: e?.message || "unknown",
      })
    );
    throw e;
  } finally {
    clearTimeout(to);
  }

  if (!contentText) {
    throw new Error("EVALUATE_EMPTY_CONTENT");
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(contentText);
  } catch (e) {
    console.error(
      JSON.stringify({
        scope: "evaluate.openai.parseError",
        sample: String(contentText).slice(0, 120),
      })
    );
    throw new Error("EVALUATE_BAD_JSON");
  }
  const correctness = Math.max(
    0,
    Math.min(100, Number(parsed.correctness ?? 0))
  );
  const errors: string[] = Array.isArray(parsed.errors)
    ? parsed.errors.slice(0, 5)
    : [];
  const improvements: string[] = Array.isArray(parsed.improvements)
    ? parsed.improvements.slice(0, 2)
    : [];
  const result =
    correctness >= 85 ? "correct" : correctness >= 60 ? "partial" : "incorrect";
  console.log(
    JSON.stringify({
      scope: "evaluate.openai.parsed",
      score: correctness,
      errors: errors.length,
      improvements: improvements.length,
    })
  );
  return {
    score: correctness,
    result,
    feedback: {
      grammar: errors,
      wording: [],
      naturalness: [],
      register: [],
    },
    suggestions: improvements,
    nextHint: undefined,
    errors,
    improvements,
  } as any;
}

async function generateAssistanceAnswer(args: {
  story: StoryDefinition;
  mission: StoryMission;
  history: StoryMessage[];
  requirements: StoryAdvanceRequirementState[];
  question: string;
  conversationFeedback?: { summary?: string; improvements?: string[] } | null;
}): Promise<string> {
  const { story, mission, history, requirements, question, conversationFeedback } = args;
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === '1';
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
    : undefined;
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Estudiante' : 'Guía'}: ${msg.content}`)
    .join('\n')
    .trim();
  const requirementText = requirements
    .map(
      (req, idx) =>
        `${idx + 1}. ${req.text} — ${req.met ? 'cumplido' : 'pendiente'}${req.feedback ? ` (${req.feedback})` : ''}`
    )
    .join('\n');
  const feedbackLines: string[] = [];
  if (conversationFeedback?.summary) {
    feedbackLines.push(`Feedback previo: ${conversationFeedback.summary}`);
  }
  if (conversationFeedback?.improvements?.length) {
    feedbackLines.push(`Mejoras sugeridas: ${conversationFeedback.improvements.join(' | ')}`);
  }
  const systemPrompt = `Eres un tutor de inglés que responde en español de forma breve y accionable. Usa un lenguaje amigable y tiene un actitud un poco sarcastica.
  Puede meter alguna pequeña broma cuando la situacion se presta.
Con el contexto de la misión, la conversación y los objetivos, ofrece orientación clara para que el alumno avance.
Devuelve 2-4 viñetas en español (máx 3 líneas en total) y, si es útil, agrega un solo ejemplo en inglés de hasta 15 palabras con el prefijo "Ejemplo:".
No incluyas formato extra, JSON ni emojis.`;
  const userPrompt = `Historia: ${story.title}
Misión: ${mission.title}
Resumen: ${mission.sceneSummary || 'N/D'}
Objetivos:
${requirementText || 'Sin objetivos definidos.'}
${feedbackLines.length ? `Notas previas:\n${feedbackLines.join('\n')}` : ''}
Conversación reciente:
${conversationText || 'Sin conversación previa.'}

Pregunta del alumno: ${question}

Resuelve su pregunta con ayuda concreta para cumplir la misión. Si consideras necesario, puedes dar alguna explicación sobre el ingles o sugerir un vocabulario.`;

  console.log(
    JSON.stringify({
      scope: 'stories.assist.openai.begin',
      storyId: story.storyId,
      missionId: mission.missionId,
      questionLength: question.length,
      historyCount: conversation.length,
      requirements: requirements.length,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        max_output_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_ASSIST_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && typeof payload?.output_text === 'string') {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_ASSIST_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_ASSIST_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('STORY_ASSIST_EMPTY_RESPONSE');
  }
  return trimmed;
}


async function evaluateStoryEnglish(
  history: StoryMessage[],
  transcript: string
): Promise<{
  score: number;
  result?: string;
  errors: string[];
  alternatives: string[];
  correctness?: number;
  status?: string;
  suggestions?: string[];
  improvements?: string[];
}> {
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === '1';
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
    : undefined;
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Guide'}: ${msg.content}`)
    .join('\n')
    .trim();
  const systemPrompt = `You are an English coach evaluating only the English quality of the student's latest message.
Return ONLY JSON with this exact shape:{
  "score": number,
  "result": "correct" | "partial" | "incorrect",
  "errors": string[],
  "alternatives": string[]
}

Rules:
- Evaluate ONLY grammar, word order, word choice, and naturalness of the latest student message.
- NEVER penalize because the message is short, simple, or does not match the conversation topic.
- NEVER penalize because the message does not advance the mission or role-play scenario.
- NEVER penalize because the message seems off-topic or irrelevant to what the guide said.
- A single valid English word or phrase (e.g. "Hello", "Hi", "Yes", "I see") is grammatically correct and must score 90–100.
- Brevity is not an English error. A short message with no grammar mistakes is always "correct".
- Mission objectives and task completion are evaluated separately by another system; do not consider them here.
- Use Spanish for errors and feedback texts.
- Use the full conversation only to understand meaning and pronoun references, not to judge relevance.
- Do not mark obvious typos, capitalization, or apostrophe mistakes as errors unless they change the meaning.
- Mark malformed questions as errors. Example: "the dish is spicy?" should be partial; the natural correction is "Is the dish spicy?"
- Mark indirect question word order errors. Example: "I don't know what is the star dish?" should be partial.
- Link errors only to actual grammar/usage issues in the last message (max 3).
- Always provide 1-2 alternatives in "alternatives", even when the message is correct.
- The alternatives must sound like what a real native English speaker would actually say in this context, not a literal word-by-word correction. Prefer common collocations, contractions, idiomatic phrasing, and natural rhythm over a minimal grammar fix.
- Preserve the original intent and meaning of the student's message, but feel free to restructure the sentence, change word order, swap verbs, or add small connectors so it sounds genuinely native. The goal is "this is how a native would say the same thing", not "this is the smallest edit that makes it grammatical".
- Avoid stiff, textbook, or overly formal phrasings unless the original message was clearly formal.
- If the latest message has errors, rewrite the idea the way a native speaker would naturally express it, not just patch the broken parts.
- If the latest message is already correct, offer richer native-sounding variants (idiomatic phrasing, more natural word choice) with the same meaning. Do not present them as errors.
- Do not include any extra keys or commentary.

Language evaluation rubric (for the last message only):
- correct: No grammar or usage errors; natural and fluent. Score 85–100. This includes any short but valid message like "Hello" or "I agree".
- partial: Understandable but with 1–2 noticeable grammar, word order, or word choice issues. Score 60–84.
- incorrect: Serious grammatical or lexical errors that make the message hard to understand. Score 0–59.

Scoring:
- Start from 100 and subtract 10–40 points per real grammar/usage error.
- Do NOT subtract points for brevity, topic irrelevance, or not completing a mission requirement.
`;

  const userPrompt = `Full conversation so far (Student is the learner, Guide is the coach):\n
  ${conversationText || 'No prior conversation.'}\n\nLast student message to evaluate:\n${transcript || '<empty>'}\n\nReturn json only.`;
  console.log(
    JSON.stringify({
      scope: 'stories.english.evaluate.begin',
      userPrompt,
      systemPrompt,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        text: { format: { type: 'json_object' } },
        max_output_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 600),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && payload?.output_text) {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 600),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_MODEL_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) {
    throw new Error('STORY_MODEL_EMPTY_RESPONSE');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('STORY_MODEL_BAD_JSON');
  }

  const score = Math.max(0, Math.min(100, Number(parsed?.score ?? parsed?.correctness ?? 0)));
  const result = typeof parsed?.result === 'string' ? parsed.result : undefined;
  const errors = Array.isArray(parsed?.errors)
    ? parsed.errors.slice(0, 3).map((item: any) => String(item))
    : [];
  const alternatives = Array.isArray(parsed?.alternatives)
    ? parsed.alternatives.slice(0, 2).map((item: any) => String(item))
    : [];
  return {
    score,
    result,
    errors,
    alternatives,
    correctness: score,
    status: result,
    suggestions: alternatives,
    improvements: alternatives,
  };
}

async function evaluateEasyEnglish(
  history: StoryMessage[],
  transcript: string
): Promise<{
  score: number;
  result?: string;
  errors: string[];
  alternatives: string[];
  correctness?: number;
  status?: string;
  suggestions?: string[];
  improvements?: string[];
}> {
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === '1';
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
    : undefined;
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Friend'}: ${msg.content}`)
    .join('\n')
    .trim();
  const systemPrompt = `You are a warm, encouraging English coach for a Spanish-speaking learner at A1 (easy) level.
The learner is practicing English in a casual chat. Your job is to help — never to grade or correct.

Return ONLY JSON with this exact shape:
{
  "tips": string[],
  "alternatives": string[]
}

General tone:
- Always kind, patient, motivating. Speak like a friend, not a teacher with a red pen.
- Never use words like "error", "wrong", "incorrect", "mistake" or negative judgements.
- No grammar jargon (no "subject", "verb tense", "auxiliary"). Use simple, everyday words.
- Tips are written in Spanish. Alternatives are written in English.

If the learner's last message is in Spanish (or mostly Spanish / mixed):
- Do NOT say anything negative. Treat it as normal: they are still learning.
- Tips: 1–2 short, friendly hints in Spanish that teach how to say the same idea in easy English. Example: "Para decir eso en inglés, puedes usar 'I like pizza'." Include a tiny example whenever you can.
- Alternatives: 1–2 simple, natural English versions of what they wanted to say.

If the learner's last message is in English:
- Do NOT correct directly. Instead, teach a small, friendly lesson that helps them say what they wanted.
- Tips: 1–2 short lessons/tips in Spanish, focused on how to express the idea, with a tiny English example. Example: "Para preguntar cómo está alguien, puedes decir 'How are you?'."
- Alternatives: 1–2 simple, natural ways a native would say the same idea in easy English.

If the message is already a perfectly fine simple sentence:
- Tips can be empty, or contain one short positive hint with a small example (e.g. "Otra forma fácil de decirlo: 'That sounds great!'.").
- Always still return at least 1 alternative in "alternatives".

Hard limits:
- "tips": maximum 2 items. Each tip is one short sentence in Spanish, simple words, optionally with a tiny English example inside quotes.
- "alternatives": 1–2 items. Each one is a short, simple English sentence (A1/A2 level), natural and friendly.
- Do not include any other keys or commentary.
`;

  const userPrompt = `Full conversation so far (Student is the learner, Friend is the chat partner):\n${conversationText || 'No prior conversation.'}\n\nLast student message:\n${transcript || '<empty>'}\n\nReturn json only.`;

  console.log(
    JSON.stringify({
      scope: 'friends.english.evaluate.easy.begin',
      tLen: transcript?.length || 0,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        text: { format: { type: 'json_object' } },
        max_output_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 600),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && payload?.output_text) {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 600),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_MODEL_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) {
    throw new Error('STORY_MODEL_EMPTY_RESPONSE');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('STORY_MODEL_BAD_JSON');
  }

  const tips = Array.isArray(parsed?.tips)
    ? parsed.tips.slice(0, 2).map((item: any) => String(item))
    : [];
  const alternatives = Array.isArray(parsed?.alternatives)
    ? parsed.alternatives.slice(0, 2).map((item: any) => String(item))
    : [];

  return {
    score: 100,
    result: 'correct',
    errors: tips,
    alternatives,
    correctness: 100,
    status: 'correct',
    suggestions: alternatives,
    improvements: alternatives,
  };
}

async function evaluateStoryRequirementProgress(
  story: StoryDefinition,
  mission: StoryMission,
  history: StoryMessage[]
): Promise<{
  requirements: any[];
  objectivesMet: boolean;
}> {
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === '1';
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
    : undefined;
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Guide'}: ${msg.content}`)
    .join('\n')
    .trim();
  const requirementsList = (mission.requirements || [])
    .map((req, index) => `${index + 1}. ${req.requirementId}: ${req.text}`)
    .join('\n');
  const systemPrompt = `You evaluate only mission requirement progress in a role-play.
Return ONLY JSON with this exact shape:{
  "requirements": [
    {"requirementId": "string", "met": boolean, "feedback": "string"}
  ],
  "objectives_met": boolean
}

Rules:
- Do not grade English grammar, spelling, word order, or naturalness. English quality is evaluated separately.
- Mark a requirement as met when the student's intention clearly satisfies it anywhere in the conversation, even if the English has small mistakes.
- Keep the requirements array in the original order and include every requirement exactly once.
- Use Spanish for feedback texts.
- For unmet requirements, use neutral progress feedback like "Pendiente" or "Todavia no se ha cubierto"; do not call it an English error.
- objectives_met must be true only if every requirement is met across the conversation.
- Do not include any extra keys or commentary.
`;

  const userPrompt = `Story: ${story.title}\nMission: ${mission.title}\nRole: ${mission.aiRole}\nMission summary: ${mission.sceneSummary || 'No summary provided.'}\nObjectives:\n${requirementsList || 'No explicit objectives listed.'}\n\nFull conversation so far (Student is the learner, Guide is the coach):\n${conversationText || 'No prior conversation.'}\n\nReturn json only.`;
  console.log(
    JSON.stringify({
      scope: 'stories.requirements.evaluate.begin',
      storyId: story.storyId,
      missionId: mission.missionId,
      userPrompt,
      systemPrompt,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        text: { format: { type: 'json_object' } },
        max_output_tokens: Number(process.env.STORY_REQUIREMENTS_MAX_OUTPUT_TOKENS || 500),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_REQUIREMENTS_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && payload?.output_text) {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: Number(process.env.STORY_REQUIREMENTS_MAX_OUTPUT_TOKENS || 500),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_REQUIREMENTS_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_REQUIREMENTS_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) {
    throw new Error('STORY_REQUIREMENTS_EMPTY_RESPONSE');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('STORY_REQUIREMENTS_BAD_JSON');
  }

  const requirements = Array.isArray(parsed?.requirements) ? parsed.requirements : [];
  const objectivesMet =
    typeof parsed?.objectives_met === 'boolean'
      ? parsed.objectives_met
      : requirements.length
      ? requirements.every((item: any) => !!(item?.met ?? item?.completed ?? false))
      : true;

  return { requirements, objectivesMet };
}

async function generateStoryReply(
  story: StoryDefinition,
  mission: StoryMission,
  history: StoryMessage[],
  requirements: StoryAdvanceRequirementState[],
  evaluation: { result: EvalResult; correctness: number }
): Promise<string> {
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === '1';
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
    : undefined;
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Guide'}: ${msg.content}`)
    .join('\n')
    .trim();
const systemPrompt = `
You are ${mission.aiRole}. Continue the role-play in English as the guide.

Stay coherent with the character, but do NOT force the role into every response.
Keep a natural, human-like conversation.

You may introduce small actions, observations, or events
that naturally move the situation forward.

Encourage the user to react, decide, or express opinions.

Do not exaggerate personality traits.
Keep the reply under 15 words.
Ask questions when useful but do not overdo it.
Use B2 English.
`;

  const userPrompt = `Story: ${story.title}\nMission: ${mission.title}\nMission summary: ${mission.sceneSummary || 'No summary provided.'}
  ${conversationText || 'No prior conversation.'}\n\nWrite the next Guide message in English, sounding natural and aligned with ${mission.aiRole} but do NOT force this role or its interests into every answer.`;
  console.log(
    JSON.stringify({
      scope: 'stories.reply.openai.begin',
      storyId: story.storyId,
      missionId: mission.missionId,
      userPrompt,
      systemPrompt,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        max_output_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && payload?.output_text) {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_MODEL_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) {
    throw new Error('STORY_MODEL_EMPTY_RESPONSE');
  }

  return raw.trim();
}

async function generateFriendReply(
  friend: FriendRecord,
  history: StoryMessage[],
  evaluation: { result: EvalResult; correctness: number },
  learnerName?: string,
  postContext?: FriendChatPostContext,
  learnerDifficulty?: LearnerDifficulty
): Promise<string> {
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === "1";
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || "low" }
    : undefined;
  const conversation = history.slice(-FRIEND_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === "user" ? "Student" : friend.characterName}: ${msg.content}`)
    .join("\n")
    .trim();
  const characterNotes = [
    `Character name: ${friend.characterName}`,
    `Original role: ${friend.aiRole}`,
    friend.characterPrompt ? `Character notes: ${friend.characterPrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const normalizedLearnerName = normalizeLearnerName(learnerName);
  const learnerNotes = normalizedLearnerName ? `Learner name: ${normalizedLearnerName}` : "";
  const postNotes = postContext
    ? [
        `The learner is replying to one of ${friend.characterName}'s profile posts.`,
        postContext.context ? `Post context: ${postContext.context}` : "",
        postContext.caption && postContext.caption !== postContext.context
          ? `Visible caption: ${postContext.caption}`
          : "",
        postContext.videoUrl ? "Post media: video." : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";
  const systemPrompt = `
You are continuing a free conversation in English with a Spanish-speaking learner.

Persona:
${characterNotes}
${learnerNotes ? `\nLearner:\n${learnerNotes}` : ""}
${postNotes ? `\nProfile post being discussed:\n${postNotes}` : ""}

Rules:
- Stay in character, but keep the conversation natural and casual.
- If the learner name is provided, you may use it naturally when it feels human; do not overuse it.
- If profile post context is provided, treat the learner's message as a reply to that post and use that context naturally.
- Not every reply needs a follow-up question; sometimes just react or share something.
- You are a fictional character: feel free to invent concrete, plausible details so the conversation feels alive. Stay consistent with your persona and with details you've already stated in this conversation" — commit to the character.
- ${
  learnerDifficulty === 'easy'
    ? 'Keep the reply short: maximum 12 words total. Use the simplest english for a non-native speaker.'
    : learnerDifficulty === 'hard'
    ? 'Keep the reply under 18 words. Use native, natural English'
    : 'Keep the reply under 18 words. Use clear B1-B2 English.'
}
- Treat attraction, romance, and light flirting between consenting adults as normal parts of conversation when appropriate for the character.
`;

  const userPrompt = `Recent conversation:\n${conversationText || "No prior conversation."}\n\nWrite the next in-character message in English.`;

  console.log(
    JSON.stringify({
      scope: "friends.reply.openai.begin",
      userId: friend.userId,
      friendId: friend.friendId,
      postId: postContext?.postId,
      historyCount: conversation.length,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = "";
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
        max_output_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`FRIEND_MODEL_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === "message" && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === "output_text" && typeof c.text === "string")
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join("\n");
              break;
            }
          }
        }
      }
      if (!raw && payload?.output_text) {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`FRIEND_MODEL_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || "";
    }
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      throw new Error("FRIEND_MODEL_TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("FRIEND_MODEL_EMPTY_RESPONSE");
  }
  return trimmed;
}

async function generateFriendConversationFeedback(
  friend: FriendRecord,
  history: StoryMessage[],
  learnerDifficulty?: LearnerDifficulty
): Promise<FriendConversationFeedback> {
  const isEasyMode = learnerDifficulty === 'easy';
  console.log(
    JSON.stringify({
      scope: "friends.feedback.generate.begin",
      userId: friend.userId,
      friendId: friend.friendId,
      difficulty: learnerDifficulty,
    })
  );
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === "1";
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || "low" }
    : undefined;
  const conversation = history.slice(-FRIEND_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) =>
      `${msg.role === "user" ? "Student (evaluate)" : `${friend.characterName} (context only)`}: ${msg.content}`
    )
    .join("\n")
    .trim();
  const systemPrompt = isEasyMode
    ? `
You are a warm, encouraging English coach for a Spanish-speaking learner at A1 (easy) level.

You are wrapping up a completed casual conversation between the student and an English-speaking friend.

Context you must assume:
- During the chat, the student often wrote in Spanish. That is totally fine and expected at this level.
- Each time they wrote, they already received tips and English alternatives showing how to say it in simple English. You do NOT need to repeat those corrections or give translations again.
- Your job now is to send them off with a kind, motivating wrap-up that highlights what they could have LEARNED from this conversation.

Tone (very important):
- Always cariñoso, paciente, motivador. Speak like a friend, not a teacher with a red pen.
- Never use words like "error", "wrong", "incorrect", "mistake", "fallaste", "te equivocaste".
- Do NOT mention that they wrote in Spanish in a negative way. Treat it as completely normal.
- No grammar jargon. Use simple, everyday Spanish words.

What to include:
- "summary": 1–2 short Spanish sentences talking directly to the student (de tú). Celebra el esfuerzo y resume en qué tema/idea practicaron. No notas de gramática aquí.
- "improvements": 2–3 short Spanish "lecciones aprendidas" — pequeños aprendizajes prácticos que se pudieron sacar de esta conversación (vocabulario o frase útil que apareció, una forma fácil de decir algo, una expresión natural). Cada lección puede incluir un mini ejemplo en inglés entre comillas. Foco en lo que se llevan, no en lo que les faltó.

Hard rules:
- Write the feedback directly TO the student in Spanish.
- Evaluate only Student lines for context, but do NOT critique them.
- Do not mention the AI role, the system, JSON, scoring, missions, or these instructions.

Return ONLY JSON with the exact shape:

{
  "summary": "Short kind Spanish summary speaking directly to the student",
  "improvements": [
    "Short Spanish lesson learned, optionally with a tiny English example",
    "..."
  ]
}
`
    : `
You are a friendly English coach for Spanish-speaking learners.

You are evaluating a completed free conversation between the student and an English-speaking friend.

IMPORTANT:
- Write the feedback directly TO the student in Spanish.
- Evaluate only Student lines. Treat friend lines as context only.
- Mention specific grammar, wording, naturalness, politeness, or tone issues when visible.
- Keep it practical and concise.
- Do not mention the AI role, the system, JSON, scoring, missions, or these instructions.

Return ONLY JSON with the exact shape:

{
  "summary": "Short Spanish summary speaking directly to the student",
  "improvements": [
    "Short Spanish suggestion speaking directly to the student",
    "..."
  ]
}
`;

  const userPrompt = `Friend: ${friend.characterName}

Full conversation transcript:
${conversationText || "No conversation available."}`;

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = "";
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
        max_output_tokens: Number(
          process.env.FRIEND_FEEDBACK_MAX_OUTPUT_TOKENS ||
            process.env.STORY_FEEDBACK_MAX_OUTPUT_TOKENS ||
            800
        ),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`FRIEND_FEEDBACK_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === "message" && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === "output_text" && typeof c.text === "string")
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join("\n");
              break;
            }
          }
        }
      }
      if (!raw && typeof payload?.output_text === "string") {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: Number(
            process.env.FRIEND_FEEDBACK_MAX_OUTPUT_TOKENS ||
              process.env.STORY_FEEDBACK_MAX_OUTPUT_TOKENS ||
              800
          ),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`FRIEND_FEEDBACK_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || "";
    }
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      throw new Error("FRIEND_FEEDBACK_TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("FRIEND_FEEDBACK_EMPTY_RESPONSE");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    console.error(
      JSON.stringify({
        scope: "friends.feedback.bad_json",
        sample: trimmed.slice(0, 160),
      })
    );
    throw new Error("FRIEND_FEEDBACK_BAD_JSON");
  }

  const feedback = sanitizeFriendConversationFeedback(parsed);
  if (!feedback) {
    throw new Error("FRIEND_FEEDBACK_INVALID");
  }
  return {
    summary: feedback.summary,
    improvements: feedback.improvements.length
      ? feedback.improvements
      : isEasyMode
      ? ["Buen trabajo: te llevas frases nuevas en inglés que puedes reusar en la próxima charla."]
      : ["Cierra con frases simples y naturales, y revisa que el tono suene amable."],
  };
}


async function generateStoryMissionFeedback(
  story: StoryDefinition,
  mission: StoryMission,
  history: StoryMessage[]
): Promise<{ summary: string; improvements: string[] }> {
  console.log(
    JSON.stringify({
      scope: 'stories.feedback.generate.begin',
      storyId: story.storyId,
      missionId: mission.missionId,
    })
  );
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 80000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === '1';
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
    : undefined;
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Student (evaluate)' : 'Guide (context only)'}: ${msg.content}`)
    .join('\n')
    .trim();
  const systemPrompt = `
You are a friendly but slightly sarcastic English coach.

You are evaluating a full conversation of a Spanish-speaking student
who is completing a mission in a story-based English learning app
(B1 to C1 progression).

IMPORTANT:
- Write the feedback directly TO the student (use "you").
- Do NOT talk about the student in third person.
- Be warm, encouraging, a little playful or sarcastic when appropriate,
  but never rude or discouraging.
- Point out clear grammar mistakes.
- Also comment on naturalness, tone, politeness, and emotional nuance.
- If something sounds too direct, awkward, too literal, or slightly rude,
  explain why and suggest a more natural alternative.
- Avoid generic feedback like "Good job overall."
- Be specific and practical.
- Use the entire conversation for context, but evaluate and correct only Student lines.
- Treat Guide lines as context only; never give feedback on their English.

Return ONLY JSON with the exact shape:

{
  "summary": "Short Spanish summary speaking directly to the student",
  "improvements": [
    "Short Spanish suggestion speaking directly to the student",
    "..."
  ]
}

Rules:
- Do not mention the AI role.
- Do not mention the system.
- Do not add commentary outside the JSON.
`;

  const userPrompt = `Story: ${story.title}
Mission: ${mission.title}
Mission summary: ${mission.sceneSummary || 'No summary provided.'}

Full conversation transcript:
${conversationText || 'No conversation available.'}`;
  console.log(
    JSON.stringify({
      scope: 'stories.feedback.openai.begin',
      storyId: story.storyId,
      missionId: mission.missionId,
      userPrompt,
      systemPrompt,
    })
  );
  console.log('systemPrompt:', systemPrompt);
  console.log('userPrompt:', userPrompt);
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
          },
        ],
        max_output_tokens: Number(process.env.STORY_FEEDBACK_MAX_OUTPUT_TOKENS || 800),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_FEEDBACK_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && typeof payload?.output_text === 'string') {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: Number(process.env.STORY_FEEDBACK_MAX_OUTPUT_TOKENS || 800),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_FEEDBACK_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_FEEDBACK_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('STORY_FEEDBACK_EMPTY_RESPONSE');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    console.error(
      JSON.stringify({
        scope: 'stories.feedback.bad_json',
        sample: trimmed.slice(0, 160),
      })
    );
    throw new Error('STORY_FEEDBACK_BAD_JSON');
  }
  const summary =
    typeof parsed?.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : '';
  const improvements = Array.isArray(parsed?.improvements)
    ? parsed.improvements
        .map((item: unknown) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  if (!summary && !improvements.length) {
    throw new Error('STORY_FEEDBACK_INVALID');
  }
  return {
    summary,
    improvements: improvements.length ? improvements : ['Sigue practicando para mantener tu progreso.'],
  };
}


function mergeRequirementProgress(
  previous: StoryAdvanceRequirementState[],
  current: StoryAdvanceRequirementState[]
): StoryAdvanceRequirementState[] {
  if (!previous.length) return current;
  const prevById = new Map(previous.map((item) => [item.requirementId, item]));
  return current.map((state) => {
    const prev = prevById.get(state.requirementId);
    if (!prev) return state;
    if (prev.met && !state.met) {
      return {
        ...state,
        met: true,
        feedback: prev.feedback || state.feedback,
      };
    }
    if (prev.met && state.met) {
      return {
        ...state,
        feedback: state.feedback || prev.feedback,
      };
    }
    return state;
  });
}

function alignRequirementStates(
  mission: StoryMission,
  rawStates: any[]
): StoryAdvanceRequirementState[] {
  return (mission.requirements || []).map((req, index) => {
    const match = Array.isArray(rawStates)
      ? rawStates.find((item) =>
          item?.requirementId === req.requirementId ||
          item?.requirement_id === req.requirementId ||
          item?.index === index
        )
      : undefined;
    const met = !!(match?.met ?? match?.completed ?? false);
    let feedback: string | undefined;
    if (typeof match?.feedback === 'string') feedback = match.feedback;
    else if (typeof match?.note === 'string') feedback = match.note;
    else if (typeof match?.explanation === 'string') feedback = match.explanation;
    if (!feedback && met) feedback = 'Listo, requisito cubierto.';
    if (!feedback && !met) feedback = 'Aun falta mencionar este punto.';
    return {
      requirementId: req.requirementId,
      text: req.text,
      met,
      feedback,
    };
  });
}
function mockCards(): CardItem[] {
  return [
    {
      cardId: "pv_set_up_001",
      type: "phrasal",
      prompt:
        "What does 'set up' mean in this context: 'We need to set up the new router'?",
      answers: ["install", "configure", "prepare"],
      hints: ["Separable: set it up", "Similar to 'install'"],
      examples: ["I'll set up the projector", "She set up a meeting"],
      tags: ["B2", "tech", "separable"],
      difficulty: "B2",
    },
    {
      cardId: "st_inversion_001",
      type: "structure",
      prompt: "Reformulate: 'I had never seen such a view' (B2 style)",
      answers: ["Never had I seen such a view"],
      hints: ["Use inversion after negative adverbials"],
      examples: ["Rarely have I been so moved"],
      tags: ["B2", "grammar"],
      difficulty: "B2",
    },
    {
      cardId: "vb_workplace_001",
      type: "vocab",
      prompt: "Natural alternative to 'do a meeting'?",
      answers: ["have a meeting", "hold a meeting"],
      hints: ["Collocation: have/hold a meeting"],
      examples: ["We have a meeting at 10"],
      tags: ["B1+", "workplace", "collocation"],
      difficulty: "B1+",
    },
  ];
}
