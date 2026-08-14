import {
  checkAdminPassword,
  createSessionToken,
  createSessionCookieHeader,
} from '../_helpers';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { username, password } = body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Le mot de passe est obligatoire.' });
    }

    const isValid = checkAdminPassword(password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiant ou mot de passe administrateur incorrect.',
      });
    }

    const token = createSessionToken(username || 'admin');
    const cookieHeader = createSessionCookieHeader(token);

    res.setHeader('Set-Cookie', cookieHeader);
    return res.status(200).json({
      success: true,
      username: username || 'admin',
      message: 'Connexion administrateur réussie.',
    });
  } catch (error: any) {
    console.error('Login Handler Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur interne du serveur lors de l\'authentification.' });
  }
}
