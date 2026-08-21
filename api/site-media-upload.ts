import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { parseCookies, verifySessionToken } from './_helpers.js';

const json = (res: VercelResponse, status: number, data: unknown) =>
  res.status(status).setHeader('Content-Type', 'application/json').json(data);

export const config = { api: { bodyParser: true } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method not allowed' });
  if (!verifySessionToken(parseCookies(req.headers.cookie).admin_session).valid) {
    return json(res, 401, { success: false, error: 'Non autorisé' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json(res, 503, { success: false, error: 'BLOB_READ_WRITE_TOKEN non configuré sur Vercel.' });
  }

  try {
    const body = req.body as HandleUploadBody;
    const response = await handleUpload({
      body,
      request: req as unknown as Request,
      onBeforeGenerateToken: async (_pathname: string, clientPayload: string | null) => {
        const payload = clientPayload ? JSON.parse(clientPayload) as { kind?: string } : {};
        if (payload.kind !== 'section-background-video') {
          throw new Error('Type de média non autorisé.');
        }
        return {
          allowedContentTypes: ['video/mp4', 'video/webm'],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind: payload.kind }),
        };
      },
      onUploadCompleted: async () => undefined,
    });

    return json(res, 200, response);
  } catch (error) {
    console.error('Client upload média:', error);
    return json(res, 500, { success: false, error: error instanceof Error ? error.message : 'Upload impossible.' });
  }
}
