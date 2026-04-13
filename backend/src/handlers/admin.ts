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
              message: 'Sube una imagen valida: JPG, PNG, WebP, AVIF, GIF, HEIC o HEIF.',
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
