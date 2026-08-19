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

function unwrapStoredValue(value: any) {
  // Nouveau format : { config, revision }
  if (
    value &&
    typeof value === 'object' &&
    value.config &&
    typeof value.config === 'object'
  ) {
    return {
      config: value.config,
      revision: Number(value.revision || 0),
    };
  }

  // Ancien format : la configuration était stockée directement.
  // On la conserve lisible pour ne rien casser.
  return {
    config: value && typeof value === 'object' ? value : null,
    revision: 0,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const redis = getRedisClient();

  if (req.method === 'GET') {
    if (!redis) {
      return json(res, 200, {
        success: true,
        config: null,
        revision: 0,
      });
    }

    try {
      const stored = await redis.get(KEY);
      const { config, revision } = unwrapStoredValue(stored);

      return json(res, 200, {
        success: true,
        config,
        revision,
      });
    } catch (error) {
      console.error('site-config GET:', error);

      return json(res, 500, {
        success: false,
        error: 'Impossible de lire la configuration publiée.',
      });
    }
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

  const revision = Number(body.revision || Date.now());

  await redis.set(KEY, {
    config: body.config,
    revision: Number.isFinite(revision) ? revision : Date.now(),
  });

  return json(res, 200, {
    success: true,
    config: body.config,
    revision,
  });
}
