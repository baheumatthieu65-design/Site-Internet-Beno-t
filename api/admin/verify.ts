import { parseCookies, verifySessionToken } from '../_helpers.js';

export default async function handler(req: any, res: any) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies.admin_session;

    const { valid, username } = verifySessionToken(sessionToken);

    if (valid) {
      return res.status(200).json({
        authenticated: true,
        username: username || 'admin',
      });
    }

    return res.status(200).json({
      authenticated: false,
    });
  } catch (error: any) {
    console.error('Verify Handler Error:', error);
    return res.status(200).json({ authenticated: false });
  }
}
