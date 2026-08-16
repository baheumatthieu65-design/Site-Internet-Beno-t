import { createClearCookieHeader } from '../_helpers.js';

export default async function handler(req: any, res: any) {
  try {
    const clearCookie = createClearCookieHeader();
    res.setHeader('Set-Cookie', clearCookie);
    return res.status(200).json({
      success: true,
      message: 'Déconnexion administrateur effectuée.',
    });
  } catch (error: any) {
    console.error('Logout Handler Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la déconnexion.' });
  }
}
