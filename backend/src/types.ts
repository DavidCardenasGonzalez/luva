export type EvalResult = "correct" | "partial" | "incorrect";

export interface EvaluationFeedback {
  grammar: string[];
  wording: string[];
  naturalness: string[];
  register: string[];
}

export interface EvaluationResponse {
  score: number; // 0-100
  result: EvalResult;
  feedback: EvaluationFeedback;
  suggestions: string[];
  nextHint?: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  headers?: Record<string, string>;
  body: string; // JSON
}

export interface SessionStartResponse {
  sessionId: string;
  uploadUrl: string;
}

export interface CardItem {
  cardId: string;
  type: "phrasal" | "structure" | "vocab";
  prompt: string;
  answers: string[];
  hints: string[];
  examples: string[];
  tags: string[];
  difficulty: "B1" | "B1+" | "B2";
}

export interface StoryRequirement {
  requirementId: string;
  text: string;
}

export interface StoryMission {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  caracterName?: string;
  caracterPrompt?: string;
  requirements: StoryRequirement[];
}

export interface StoryDefinition {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  tags?: string[];
  unlockCost?: number;
  missions: StoryMission[];
}

export interface StorySummaryItem {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  tags: string[];
  unlockCost?: number;
  locked: boolean;
  missionsCount: number;
}

export interface StoryAdvanceRequest {
  sessionId: string;
  transcript: string;
  sceneIndex: number;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  storyDefinition?: StoryDefinition;
  missionDefinition?: StoryMission;
  persistedRequirements?: StoryAdvanceRequirementState[];
  persistedMissionCompleted?: boolean;
}

export interface StoryAdvanceRequirementState {
  requirementId: string;
  text: string;
  met: boolean;
  feedback?: string;
}

export interface StoryAdvancePayload {
  sceneIndex: number;
  missionCompleted: boolean;
  storyCompleted: boolean;
  requirements: StoryAdvanceRequirementState[];
  aiReply: string;
  correctness: number;
  result: EvalResult;
  errors: string[];
  reformulations: string[];
  conversationFeedback?: {
    summary: string;
    improvements: string[];
  } | null;
}
