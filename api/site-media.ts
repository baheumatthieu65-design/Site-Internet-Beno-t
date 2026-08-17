import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { parseCookies, verifySessionToken } from './_helpers.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const json = (res: VercelResponse, status: number, data: unknown) =>
  res.status(status).setHeader('Content-Type', 'application/json').json(data);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method not allowed' });

  const session = verifySessionToken(parseCookies(req.headers.cookie).admin_session);
  if (!session.valid) return json(res, 401, { success: false, error: 'Non autorisé' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json(res, 503, { success: false, error: 'BLOB_READ_WRITE_TOKEN non configuré sur Vercel.' });
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const body = Buffer.concat(chunks);

    const contentType = String(req.headers['content-type'] || '');
    const match = contentType.match(/boundary=([^;]+)/);
    if (!match) return json(res, 400, { success: false, error: 'FormData invalide.' });

    const boundary = Buffer.from(`--${match[1]}`);
    const parts = body.toString('binary').split(boundary.toString('binary'));
    const filePart = parts.find((part) => part.includes('filename='));
    if (!filePart) return json(res, 400, { success: false, error: 'Aucun fichier.' });

    const headerEnd = filePart.indexOf('\r\n\r\n');
    const header = filePart.slice(0, headerEnd);
    const filenameMatch = header.match(/filename="([^"]+)"/);
    const typeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
    const filename = filenameMatch?.[1] || `media-${Date.now()}`;
    const mime = typeMatch?.[1]?.trim() || 'application/octet-stream';
    const rawBinary = filePart.slice(headerEnd + 4).replace(/\r\n$/, '');
    const fileBuffer = Buffer.from(rawBinary, 'binary');

    const blob = await put(`site-media/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '-')}`, fileBuffer, {
      access: 'public',
      contentType: mime,
      addRandomSuffix: false,
    });

    return json(res, 200, { success: true, url: blob.url });
  } catch (error) {
    console.error('Upload media:', error);
    return json(res, 500, { success: false, error: 'Upload impossible.' });
  }
}
