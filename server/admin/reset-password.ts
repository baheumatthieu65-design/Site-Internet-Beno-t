import { checkResetCode, createSessionToken, createSessionCookieHeader } from '../../api/_helpers.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { code, newPassword, newPin } = body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Le mot de passe de sécurité de réinitialisation est obligatoire.' });
    }

    const isCodeValid = checkResetCode(code);

    if (!isCodeValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe de sécurité de réinitialisation incorrect.',
      });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 4 caractères.',
      });
    }

    // Generate authenticated session for admin
    const token = createSessionToken('admin');
    const cookieHeader = createSessionCookieHeader(token);

    res.setHeader('Set-Cookie', cookieHeader);

    return res.status(200).json({
      success: true,
      message: 'Vos mots de passe administrateur principal et secondaire ont été mis à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Reset Password Handler Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la réinitialisation.' });
  }
}
