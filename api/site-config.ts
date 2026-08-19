import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getRedisClient,
  parseCookies,
  verifySessionToken,
} from './_helpers.js';

const KEY = 'mdp_site_config';

function json(
  res: VercelResponse,
  status: number,
  data: unknown
) {
  return res
    .status(status)
    .setHeader('Content-Type', 'application/json')
    .setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    .setHeader('Pragma', 'no-cache')
    .setHeader('Expires', '0')
    .json(data);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const redis = getRedisClient();

  // La configuration publiée est la source active du site.
  // Cette réponse ne doit jamais être mise en cache.
  if (req.method === 'GET') {
    if (!redis) {
      return json(res, 200, {
        success: true,
        config: null,
      });
    }

    const config = await redis.get(KEY);

    return json(res, 200, {
      success: true,
      config: config ?? null,
    });
  }

  if (req.method !== 'PUT') {
    return json(res, 405, {
      success: false,
      error: 'Method not allowed',
    });
  }

  const session = verifySessionToken(
    parseCookies(req.headers.cookie).admin_session
  );

  if (!session.valid) {
    return json(res, 401, {
      success: false,
      error: 'Non autorisé',
    });
  }

  if (!redis) {
    return json(res, 503, {
      success: false,
      error: 'Upstash Redis non configuré',
    });
  }

  const body =
    typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

  if (!body?.config || typeof body.config !== 'object') {
    return json(res, 400, {
      success: false,
      error: 'Configuration invalide',
    });
  }

  await redis.set(KEY, body.config);

  return json(res, 200, {
    success: true,
    config: body.config,
  });
}
