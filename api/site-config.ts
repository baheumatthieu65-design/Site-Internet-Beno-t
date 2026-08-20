import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import {
  getRedisClient,
  parseCookies,
  verifySessionToken,
} from './_helpers.js';

const KEY = 'mdp_site_config';

const LEGACY_DATA_URLS: Record<string, string> = {
  '29cbdd45ce9db2074533ba5b587be27fd2eafe2e3e441cb8bc35d8b3f6c41259': '/assets/persistent-media-1.png',
  '4e6d3b32587362a2efa8b5dccdc177b9cc553c0e60bff5d0cbc6246b513ddded': '/assets/persistent-media-2.png',
};

function sanitizePersistedMedia(value: unknown): any {
  if (typeof value === 'string') {
    if (!value.startsWith('data:image/')) return value;
    const hash = crypto.createHash('sha256').update(value).digest('hex');
    // Les anciens snapshots de l'éditeur contenaient des images base64.
    // On les convertit vers les deux fichiers publics conservés dans cette
    // version propre du projet. Toute nouvelle image doit passer par Blob.
    return LEGACY_DATA_URLS[hash] || '';
  }

  if (Array.isArray(value)) return value.map(sanitizePersistedMedia);

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        sanitizePersistedMedia(child),
      ])
    );
  }

  return value;
}


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
      // Nettoyage à la lecture pour que les anciens snapshots base64
      // ne puissent plus bloquer ou ralentir le visiteur.
      config: config ? sanitizePersistedMedia(config) : null,
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

  const config = {
    ...sanitizePersistedMedia(body.config),
    publishedAt: Number(body.config.publishedAt) || Date.now(),
  };

  await redis.set(KEY, config);

  return json(res, 200, {
    success: true,
    config,
  });
}
