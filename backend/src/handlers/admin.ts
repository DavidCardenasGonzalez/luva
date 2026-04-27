import type { APIGatewayProxyResultV2 as Result } from 'aws-lambda';
import { createAdminAssetUpload } from '../admin/assets';
import { buildAdminOverview } from '../admin/overview';
import {
  completeAdminTikTokAuth,
  createAdminTikTokAuthStart,
  getAdminTikTokAuthStatus,
} from '../admin/tiktok-auth';
import {
  grantManualCodeProAccess,
  revokeManualCodeProAccess,
} from '../admin/pro-access';
import { verifyRevenueCatPremiumUsers } from '../admin/revenuecat';
import { listAdminUsers } from '../admin/users';
import {
  completeAdminVideoReplace,
  createAdminVideoReplaceUpload,
  getAdminVideoPreview,
  listAdminVideos,
  updateAdminVideoPublication,
} from '../admin/videos';
import { getAdminIdentity, getClaims, hasAdminAccess } from '../admin/auth';
import {
  createAdminFeedPost,
  deleteAdminFeedPost,
  listFeedPosts,
  updateAdminFeedPost,
} from '../feed-posts';
import {
  listAdminLessons,
  createAdminLesson,
  deleteAdminLesson,
  generateLessonScript,
  updateLessonScript,
  generateLessonQuiz,
  listLessonVoices,
  generateLessonAudio,
  generateLessonSubtitles,
  translateLessonSubtitles,
  createLessonVideoUpload,
  completeLessonVideoUpload,
} from '../admin/lessons';
import {
  createAdminCharacterPost,
  deleteAdminCharacterPost,
  findStoryCharacter,
  listCharacterPosts,
  listStoryCharacters,
  updateAdminCharacterPost,
} from '../character-posts';
import { STORIES_SEED } from '../data/stories-seed';

const ROUTE_PREFIX = '/v1';

export const handler = async (event: any): Promise<Result> => {
  const method: string =
    event.httpMethod || event.requestContext?.http?.method || 'GET';
  const rawPath: string =
    event.resource && event.path
      ? event.path
      : event.requestContext?.http?.path || '/';
  const path = rawPath.startsWith(ROUTE_PREFIX)
    ? rawPath
    : `${ROUTE_PREFIX}${rawPath}`;

  try {
    const claims = getClaims(event);
    const admin = getAdminIdentity(claims);

    if (!admin.email) {
      return json(401, { code: 'UNAUTHORIZED', message: 'Missing email claim' });
    }

    if (!hasAdminAccess(claims)) {
      return json(403, { code: 'FORBIDDEN', message: 'Admin role required' });
    }

    if (method === 'GET' && (path === `${ROUTE_PREFIX}/admin` || path === `${ROUTE_PREFIX}/admin/overview`)) {
      return json(200, buildAdminOverview({
        ...admin,
        email: admin.email,
      }, {
        stage: process.env.STAGE || 'prod',
      }));
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/users`) {
      const search = normalizeSearch(event);
      return json(200, await listAdminUsers({ search }));
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/videos`) {
      return json(200, await listAdminVideos());
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/feed-posts`) {
      try {
        return json(200, await listFeedPosts());
      } catch (error) {
        const handled = handleFeedPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/story-characters`) {
      return json(200, listStoryCharacters(STORIES_SEED));
    }

    const characterPosts = path.match(/^\/v1\/admin\/story-characters\/([^/]+)\/posts$/);
    if (method === 'GET' && characterPosts) {
      const character = findStoryCharacter(STORIES_SEED, decodeURIComponent(characterPosts[1]));
      if (!character) {
        return json(404, {
          code: 'STORY_CHARACTER_NOT_FOUND',
          message: 'No encontramos ese personaje en las stories.',
        });
      }

      try {
        return json(200, await listCharacterPosts(character));
      } catch (error) {
        const handled = handleCharacterPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'POST' && characterPosts) {
      const character = findStoryCharacter(STORIES_SEED, decodeURIComponent(characterPosts[1]));
      if (!character) {
        return json(404, {
          code: 'STORY_CHARACTER_NOT_FOUND',
          message: 'No encontramos ese personaje en las stories.',
        });
      }

      try {
        return json(200, await createAdminCharacterPost(character, parseBody(event.body) || {}));
      } catch (error) {
        const handled = handleCharacterPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const characterPostUpdate = path.match(/^\/v1\/admin\/story-characters\/([^/]+)\/posts\/update$/);
    if (method === 'POST' && characterPostUpdate) {
      const character = findStoryCharacter(STORIES_SEED, decodeURIComponent(characterPostUpdate[1]));
      if (!character) {
        return json(404, {
          code: 'STORY_CHARACTER_NOT_FOUND',
          message: 'No encontramos ese personaje en las stories.',
        });
      }

      try {
        return json(200, await updateAdminCharacterPost(character, parseBody(event.body) || {}));
      } catch (error) {
        const handled = handleCharacterPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const characterPostDelete = path.match(/^\/v1\/admin\/story-characters\/([^/]+)\/posts\/delete$/);
    if (method === 'POST' && characterPostDelete) {
      try {
        return json(200, await deleteAdminCharacterPost(
          decodeURIComponent(characterPostDelete[1]),
          parseBody(event.body) || {},
        ));
      } catch (error) {
        const handled = handleCharacterPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/feed-posts`) {
      try {
        return json(200, await createAdminFeedPost(parseBody(event.body) || {}));
      } catch (error) {
        const handled = handleFeedPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/feed-posts/update`) {
      try {
        return json(200, await updateAdminFeedPost(parseBody(event.body) || {}));
      } catch (error) {
        const handled = handleFeedPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/feed-posts/delete`) {
      try {
        return json(200, await deleteAdminFeedPost(parseBody(event.body) || {}));
      } catch (error) {
        const handled = handleFeedPostError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/assets/upload`) {
      try {
        return json(200, await createAdminAssetUpload(parseBody(event.body) || {}));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_ASSET_FOLDER') {
            return json(400, {
              code: 'INVALID_ASSET_FOLDER',
              message: 'Selecciona una carpeta valida para guardar el asset.',
            });
          }

          if (error.message === 'INVALID_ASSET_CONTENT_TYPE') {
            return json(400, {
              code: 'INVALID_ASSET_CONTENT_TYPE',
              message:
                'Sube un asset valido para la carpeta seleccionada: imagen JPG, PNG, WebP, AVIF, GIF, HEIC o HEIF; video MP4, MOV, WebM, M4V o MPEG.',
            });
          }

          if (
            error.message === 'ASSETS_BUCKET_NAME not set' ||
            error.message === 'ASSETS_CLOUDFRONT_DOMAIN_NAME not set'
          ) {
            return json(503, {
              code: 'ASSETS_NOT_CONFIGURED',
              message: 'Configura el bucket assets y su distribucion CloudFront en la lambda admin.',
            });
          }
        }

        throw error;
      }
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/social/tiktok`) {
      try {
        return json(200, await getAdminTikTokAuthStatus());
      } catch (error) {
        if (error instanceof Error && error.message === 'TIKTOK_ACCESS_TOKEN_PARAM not set') {
          return json(503, {
            code: 'TIKTOK_NOT_CONFIGURED',
            message: 'Configura las variables TikTok en la lambda admin antes de usar esta integración.',
          });
        }
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/social/tiktok/start`) {
      try {
        return json(200, await createAdminTikTokAuthStart());
      } catch (error) {
        if (error instanceof Error && error.message === 'TIKTOK_OAUTH_NOT_CONFIGURED') {
          return json(503, {
            code: 'TIKTOK_OAUTH_NOT_CONFIGURED',
            message: 'Configura TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET y TIKTOK_REDIRECT_URI en la lambda admin.',
          });
        }
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/social/tiktok/complete`) {
      try {
        return json(200, await completeAdminTikTokAuth(parseBody(event.body) || {}));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'TIKTOK_OAUTH_NOT_CONFIGURED') {
            return json(503, {
              code: 'TIKTOK_OAUTH_NOT_CONFIGURED',
              message: 'Configura TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET y TIKTOK_REDIRECT_URI en la lambda admin.',
            });
          }

          if (error.message === 'INVALID_TIKTOK_CODE') {
            return json(400, {
              code: 'INVALID_TIKTOK_CODE',
              message: 'TikTok no devolvió un code válido para completar la autenticación.',
            });
          }

          if (error.message === 'INVALID_TIKTOK_CODE_VERIFIER') {
            return json(400, {
              code: 'INVALID_TIKTOK_CODE_VERIFIER',
              message: 'No se encontró el code verifier PKCE para completar la autenticación de TikTok.',
            });
          }

          if (error.message === 'INVALID_TIKTOK_TOKEN_RESPONSE') {
            return json(502, {
              code: 'INVALID_TIKTOK_TOKEN_RESPONSE',
              message: 'TikTok respondió sin access_token o refresh_token válidos.',
            });
          }
        }
        throw error;
      }
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/videos/preview`) {
      try {
        return json(200, await getAdminVideoPreview({
          storyId: getQueryParam(event, 'storyId'),
          videoId: getQueryParam(event, 'videoId'),
        }));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_VIDEO_KEY') {
            return json(400, {
              code: 'INVALID_VIDEO_KEY',
              message: 'Indica storyId y videoId válidos para abrir la vista previa.',
            });
          }

          if (error.message === 'VIDEO_NOT_FOUND') {
            return json(404, {
              code: 'VIDEO_NOT_FOUND',
              message: 'No encontramos ese video o no tiene bucket/key válidos para vista previa.',
            });
          }
        }

        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/videos/replace-upload`) {
      try {
        return json(200, await createAdminVideoReplaceUpload(parseBody(event.body) || {}));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_VIDEO_KEY') {
            return json(400, {
              code: 'INVALID_VIDEO_KEY',
              message: 'Indica storyId y videoId válidos para reemplazar el video.',
            });
          }

          if (error.message === 'VIDEO_NOT_FOUND') {
            return json(404, {
              code: 'VIDEO_NOT_FOUND',
              message: 'No encontramos ese video o no tiene bucket/key válidos para reemplazo.',
            });
          }
        }

        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/videos/replace-complete`) {
      try {
        return json(200, await completeAdminVideoReplace(parseBody(event.body) || {}));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_VIDEO_KEY') {
            return json(400, {
              code: 'INVALID_VIDEO_KEY',
              message: 'Indica storyId y videoId válidos para confirmar el reemplazo.',
            });
          }

          if (error.message === 'VIDEO_NOT_FOUND') {
            return json(404, {
              code: 'VIDEO_NOT_FOUND',
              message: 'No encontramos ese video para confirmar el reemplazo.',
            });
          }
        }

        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/videos/update`) {
      try {
        return json(200, await updateAdminVideoPublication(parseBody(event.body) || {}));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_VIDEO_KEY') {
            return json(400, {
              code: 'INVALID_VIDEO_KEY',
              message: 'Indica storyId y videoId válidos para actualizar el video.',
            });
          }

          if (error.message === 'INVALID_VIDEO_STATUS') {
            return json(400, {
              code: 'INVALID_VIDEO_STATUS',
              message: 'El status del video no es válido.',
            });
          }

          if (error.message === 'INVALID_PUBLISH_ON') {
            return json(400, {
              code: 'INVALID_PUBLISH_ON',
              message: 'publishOn debe venir con fecha y hora válidas en formato ISO.',
            });
          }

          if (error.message === 'PUBLISH_ON_REQUIRED_FOR_PROGRAMADO') {
            return json(400, {
              code: 'PUBLISH_ON_REQUIRED',
              message: 'Debes indicar publishOn para dejar el video como programado.',
            });
          }

          if (error.message === 'VIDEO_NOT_FOUND') {
            return json(404, {
              code: 'VIDEO_NOT_FOUND',
              message: 'No encontramos ese video en la tabla administrativa.',
            });
          }
        }

        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/users/revenuecat/verify`) {
      try {
        return json(200, await verifyRevenueCatPremiumUsers());
      } catch (error) {
        if (error instanceof Error && error.message === 'REVENUECAT_SECRET_KEY not set') {
          return json(503, {
            code: 'REVENUECAT_NOT_CONFIGURED',
            message: 'Configura REVENUECAT_SECRET_KEY en la lambda admin antes de verificar suscripciones.',
          });
        }
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/users/pro-access/code-grant`) {
      try {
        return json(200, await grantManualCodeProAccess(parseBody(event.body) || {}));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_EMAIL') {
            return json(400, {
              code: 'INVALID_EMAIL',
              message: 'Indica un correo válido para aplicar el acceso Pro.',
            });
          }

          if (error.message === 'INVALID_PREMIUM_DAYS') {
            return json(400, {
              code: 'INVALID_PREMIUM_DAYS',
              message: 'Indica una cantidad válida de días para otorgar o renovar Pro.',
            });
          }

          if (error.message === 'USER_NOT_FOUND') {
            return json(404, {
              code: 'USER_NOT_FOUND',
              message: 'No encontramos ese usuario en la tabla administrativa.',
            });
          }
        }

        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/users/pro-access/code-revoke`) {
      try {
        return json(200, await revokeManualCodeProAccess(parseBody(event.body) || {}));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_EMAIL') {
            return json(400, {
              code: 'INVALID_EMAIL',
              message: 'Indica un correo válido para revocar el acceso Pro.',
            });
          }

          if (error.message === 'USER_NOT_FOUND') {
            return json(404, {
              code: 'USER_NOT_FOUND',
              message: 'No encontramos ese usuario en la tabla administrativa.',
            });
          }

          if (error.message === 'CODE_GRANT_NOT_ACTIVE') {
            return json(409, {
              code: 'CODE_GRANT_NOT_ACTIVE',
              message: 'Ese usuario no tiene una membresía manual activa por código para revocar.',
            });
          }
        }

        throw error;
      }
    }

    // ── Lessons ───────────────────────────────────────────────────────────────
    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/lessons`) {
      try {
        return json(200, await listAdminLessons());
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/lessons`) {
      try {
        return json(200, await createAdminLesson(parseBody(event.body) || {}));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/admin/lessons/delete`) {
      try {
        return json(200, await deleteAdminLesson(parseBody(event.body) || {}));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/admin/lessons/voices`) {
      return json(200, listLessonVoices());
    }

    const lessonScriptGenerate = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/generate-script$/);
    if (method === 'POST' && lessonScriptGenerate) {
      try {
        return json(200, await generateLessonScript({ lessonId: decodeURIComponent(lessonScriptGenerate[1]) }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const lessonScriptUpdate = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/update-script$/);
    if (method === 'POST' && lessonScriptUpdate) {
      try {
        return json(200, await updateLessonScript({
          lessonId: decodeURIComponent(lessonScriptUpdate[1]),
          ...(parseBody(event.body) || {}),
        }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const lessonQuizGenerate = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/generate-quiz$/);
    if (method === 'POST' && lessonQuizGenerate) {
      try {
        return json(200, await generateLessonQuiz({ lessonId: decodeURIComponent(lessonQuizGenerate[1]) }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const lessonAudioGenerate = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/generate-audio$/);
    if (method === 'POST' && lessonAudioGenerate) {
      try {
        return json(200, await generateLessonAudio({
          lessonId: decodeURIComponent(lessonAudioGenerate[1]),
          ...(parseBody(event.body) || {}),
        }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const lessonSubtitlesGenerate = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/generate-subtitles$/);
    if (method === 'POST' && lessonSubtitlesGenerate) {
      try {
        return json(200, await generateLessonSubtitles({ lessonId: decodeURIComponent(lessonSubtitlesGenerate[1]) }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const lessonSubtitlesTranslate = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/translate-subtitles$/);
    if (method === 'POST' && lessonSubtitlesTranslate) {
      try {
        return json(200, await translateLessonSubtitles({
          lessonId: decodeURIComponent(lessonSubtitlesTranslate[1]),
          ...(parseBody(event.body) || {}),
        }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const lessonVideoUpload = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/video-upload$/);
    if (method === 'POST' && lessonVideoUpload) {
      try {
        return json(200, await createLessonVideoUpload({
          lessonId: decodeURIComponent(lessonVideoUpload[1]),
          ...(parseBody(event.body) || {}),
        }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    const lessonVideoComplete = path.match(/^\/v1\/admin\/lessons\/([^/]+)\/video-complete$/);
    if (method === 'POST' && lessonVideoComplete) {
      try {
        return json(200, await completeLessonVideoUpload({
          lessonId: decodeURIComponent(lessonVideoComplete[1]),
          ...(parseBody(event.body) || {}),
        }));
      } catch (error) {
        const handled = handleLessonError(error);
        if (handled) return handled;
        throw error;
      }
    }

    return json(404, { code: 'NOT_FOUND', message: 'Not found' });
  } catch (err: any) {
    console.error(
      JSON.stringify({
        scope: 'admin.handler.error',
        message: err?.message || 'unknown',
      })
    );
    return json(500, { code: 'INTERNAL_ERROR', message: 'Internal error' });
  }
};

function json(statusCode: number, body: unknown): Result {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body),
  };
}

function normalizeSearch(event: any): string | undefined {
  const params = event?.queryStringParameters || event?.rawQueryString;
  if (typeof params === 'string') {
    return new URLSearchParams(params).get('search')?.trim() || undefined;
  }

  if (!params || typeof params !== 'object') {
    return undefined;
  }

  const raw = typeof params.search === 'string' ? params.search : undefined;
  return raw?.trim() || undefined;
}

function handleFeedPostError(error: unknown): Result | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  if (error.message === 'FEED_POSTS_TABLE_NAME not set') {
    return json(503, {
      code: 'FEED_POSTS_NOT_CONFIGURED',
      message: 'Configura la tabla de posts del feed en la lambda admin.',
    });
  }

  if (error.message === 'FEED_POST_NOT_FOUND') {
    return json(404, {
      code: 'FEED_POST_NOT_FOUND',
      message: 'No encontramos ese post en la tabla del feed.',
    });
  }

  const validationMessages: Record<string, string> = {
    INVALID_FEED_POST_ID: 'Indica un postId valido para actualizar o borrar el post.',
    INVALID_FEED_POST_TEXT: 'Escribe el texto del post.',
    INVALID_FEED_POST_ORDER: 'Indica un orden valido. Usa 1 para mostrarlo hasta arriba.',
    INVALID_FEED_POST_TYPE: 'Selecciona un tipo de post valido.',
    INVALID_FEED_POST_TARGET: 'Indica el id requerido para el tipo de post seleccionado.',
    INVALID_FEED_POST_COIN_AMOUNT: 'Indica una cantidad valida de monedas para el post extra.',
    INVALID_FEED_POST_URL: 'Usa una URL publica valida para imagen o video.',
  };

  const message = validationMessages[error.message];
  if (message) {
    return json(400, {
      code: error.message,
      message,
    });
  }

  return undefined;
}

function handleCharacterPostError(error: unknown): Result | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  if (error.message === 'CHARACTER_POSTS_TABLE_NAME not set') {
    return json(503, {
      code: 'CHARACTER_POSTS_NOT_CONFIGURED',
      message: 'Configura la tabla de posts de personajes en la lambda admin.',
    });
  }

  if (error.message === 'INVALID_CHARACTER_ID') {
    return json(400, {
      code: 'INVALID_CHARACTER_ID',
      message: 'Indica un personaje valido para administrar posts.',
    });
  }

  if (error.message === 'INVALID_CHARACTER_POST_ID') {
    return json(400, {
      code: 'INVALID_CHARACTER_POST_ID',
      message: 'Indica un post valido del perfil.',
    });
  }

  if (error.message === 'CHARACTER_POST_NOT_FOUND') {
    return json(404, {
      code: 'CHARACTER_POST_NOT_FOUND',
      message: 'No encontramos ese post del perfil.',
    });
  }

  if (error.message === 'INVALID_CHARACTER_POST_CAPTION') {
    return json(400, {
      code: 'INVALID_CHARACTER_POST_CAPTION',
      message: 'Escribe un caption para el post.',
    });
  }

  if (error.message === 'INVALID_CHARACTER_POST_IMAGE_URL') {
    return json(400, {
      code: 'INVALID_CHARACTER_POST_IMAGE_URL',
      message: 'Sube una imagen valida o usa una URL https valida.',
    });
  }

  if (error.message === 'INVALID_CHARACTER_POST_ORDER') {
    return json(400, {
      code: 'INVALID_CHARACTER_POST_ORDER',
      message: 'Usa un orden numerico mayor a cero.',
    });
  }

  return undefined;
}

function handleLessonError(error: unknown): Result | undefined {
  if (!(error instanceof Error)) return undefined;

  const notConfigured: Record<string, string> = {
    'LESSONS_TABLE_NAME not set': 'Configura la tabla de lecciones en la lambda admin.',
    'ASSETS_BUCKET_NAME not set': 'Configura el bucket de assets en la lambda admin.',
    'ASSETS_CLOUDFRONT_DOMAIN_NAME not set': 'Configura el dominio CloudFront de assets en la lambda admin.',
    'OPENAI_KEY_PARAM not set': 'Configura la clave de OpenAI en la lambda admin.',
    'GEMINI_API_KEY_PARAM not set': 'Configura la clave de Gemini en la lambda admin.',
    'GOOGLE_TTS_API_KEY_PARAM not set': 'Configura la clave de Google TTS en la lambda admin.',
    'GOOGLE_TRANSLATE_API_KEY_PARAM not set': 'Configura la clave de Google Translate en la lambda admin.',
  };

  for (const [msg, hint] of Object.entries(notConfigured)) {
    if (error.message === msg) {
      return json(503, { code: 'NOT_CONFIGURED', message: hint });
    }
  }

  const validationMessages: Record<string, [number, string]> = {
    INVALID_LESSON_ID: [400, 'Indica un lessonId válido.'],
    INVALID_LESSON_TITLE: [400, 'Escribe un título para la lección.'],
    INVALID_LESSON_PROMPT: [400, 'Escribe el tema o prompt de la lección.'],
    INVALID_LESSON_SCRIPT: [400, 'El guion no puede estar vacío.'],
    INVALID_LESSON_VOICE: [400, 'Selecciona una voz válida para el audio.'],
    INVALID_VIDEO_CONTENT_TYPE: [400, 'Sube un video en formato MP4, MOV, WebM, M4V o MPEG.'],
    INVALID_VIDEO_KEY: [400, 'La clave del video no es válida.'],
    LESSON_NOT_FOUND: [404, 'No encontramos esa lección.'],
    LESSON_SCRIPT_REQUIRED: [400, 'Genera o escribe el guion antes de continuar con este paso.'],
    LESSON_SUBTITLES_REQUIRED: [400, 'Genera los subtítulos antes de traducirlos.'],
    QUIZ_PARSE_FAILED: [502, 'No pudimos procesar el quiz generado. Intenta de nuevo.'],
    QUIZ_TOO_SHORT: [502, 'El quiz generado tiene menos de 3 preguntas. Intenta de nuevo.'],
  };

  for (const [code, [status, message]] of Object.entries(validationMessages)) {
    if (error.message === code) {
      return json(status, { code, message });
    }
  }

  if (error.message.startsWith('OPENAI_HTTP_') || error.message === 'OPENAI_EMPTY_RESPONSE') {
    return json(502, { code: 'OPENAI_ERROR', message: 'Error al llamar a OpenAI. Intenta de nuevo.' });
  }

  if (
    error.message.startsWith('GEMINI_TTS_HTTP_') ||
    error.message === 'GEMINI_TTS_EMPTY_RESPONSE' ||
    error.message === 'GEMINI_TTS_REQUEST_FAILED' ||
    error.message.startsWith('GOOGLE_TTS_HTTP_') ||
    error.message === 'GOOGLE_TTS_EMPTY_RESPONSE'
  ) {
    return json(502, { code: 'GEMINI_TTS_ERROR', message: 'Error al generar el audio con Gemini TTS. Intenta de nuevo.' });
  }

  if (error.message.startsWith('GOOGLE_TRANSLATE_HTTP_')) {
    return json(502, { code: 'GOOGLE_TRANSLATE_ERROR', message: 'Error al traducir los subtítulos. Intenta de nuevo.' });
  }

  return undefined;
}

function getQueryParam(event: any, key: string): string | undefined {
  const params = event?.queryStringParameters || event?.rawQueryString;

  if (typeof params === 'string') {
    return new URLSearchParams(params).get(key)?.trim() || undefined;
  }

  if (!params || typeof params !== 'object') {
    return undefined;
  }

  const raw = params[key];
  return typeof raw === 'string' ? raw.trim() || undefined : undefined;
}

function parseBody(body: unknown): Record<string, unknown> | undefined {
  if (!body) {
    return undefined;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }

  return typeof body === 'object' ? (body as Record<string, unknown>) : undefined;
}
