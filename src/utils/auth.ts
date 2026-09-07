export interface AdminCredentials {
  username: string;
  email: string;
  lastUpdated: string;
}

const DEFAULT_ADMIN: AdminCredentials = {
  username: 'admin',
  email: 'contact@maisondespyrenees.fr',
  lastUpdated: new Date().toISOString(),
};

const AUTH_KEY = 'pyrenees_admin_info';

/**
 * Récupère uniquement les informations publiques de l'administrateur.
 * Aucun mot de passe n'est stocké dans le navigateur.
 */
export const getStoredCredentials = (): AdminCredentials => {
  try {
    const stored = localStorage.getItem(AUTH_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (
        parsed &&
        typeof parsed.username === 'string' &&
        typeof parsed.email === 'string' &&
        typeof parsed.lastUpdated === 'string'
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Impossible de lire les informations administrateur :', error);
  }

  return DEFAULT_ADMIN;
};

/**
 * Enregistre uniquement les informations publiques de l'administrateur.
 */
export const saveAdminCredentials = (
  credentials: AdminCredentials
): void => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error(
      'Impossible de sauvegarder les informations administrateur :',
      error
    );
  }
};

/**
 * Connexion administrateur via le serveur.
 *
 * Le mot de passe est envoyé au serveur uniquement
 * pour vérification contre la variable d'environnement Admin.
 */
export const verifyAdminLoginServer = async (
  userInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  message?: string;
  username?: string;
}> => {
  try {
    const username = userInput.trim();
    const password = passwordInput;

    if (!username || !password) {
      return {
        success: false,
        message: 'Veuillez renseigner votre identifiant et votre mot de passe.',
      };
    }

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username,
        password,
      }),
    });

    let data: any = {};

    try {
      data = await response.json();
    } catch {
      return {
        success: false,
        message: `Réponse serveur invalide (${response.status}).`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message:
          data.message ||
          'Identifiant ou mot de passe incorrect.',
      };
    }

    if (!data.success) {
      return {
        success: false,
        message:
          data.message ||
          'Identifiant ou mot de passe incorrect.',
      };
    }

    const authenticatedUsername =
      typeof data.username === 'string' && data.username.trim()
        ? data.username.trim()
        : username;

    // On conserve uniquement des informations non sensibles.
    saveAdminCredentials({
      username: authenticatedUsername,
      email: DEFAULT_ADMIN.email,
      lastUpdated: new Date().toISOString(),
    });

    return {
      success: true,
      message: data.message,
      username: authenticatedUsername,
    };
  } catch (error) {
    console.error('Erreur lors de la connexion administrateur :', error);

    return {
      success: false,
      message:
        'Impossible de contacter le serveur d\'authentification.',
    };
  }
};

/**
 * Vérifie côté serveur si le cookie de session administrateur
 * est toujours valide.
 */
export const verifyAdminSessionServer = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return data?.authenticated === true;
  } catch (error) {
    console.error(
      'Erreur lors de la vérification de session :',
      error
    );

    return false;
  }
};

/**
 * Déconnexion administrateur.
 *
 * Le serveur supprime le cookie HttpOnly.
 */
export const logoutAdminServer = async (): Promise<void> => {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (error) {
    console.error(
      'Erreur lors de la déconnexion administrateur :',
      error
    );
  }
};

/**
 * Réinitialisation du mot de passe via le serveur.
 */
export const resetPasswordServer = async (
  code: string,
  newPassword: string,
  newPin?: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const cleanCode = code.trim();

    if (!cleanCode || !newPassword) {
      return {
        success: false,
        message:
          'Le code de réinitialisation et le nouveau mot de passe sont obligatoires.',
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message:
          'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      };
    }

    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code: cleanCode,
        newPassword,
        newPin,
      }),
    });

    let data: any = {};

    try {
      data = await response.json();
    } catch {
      return {
        success: false,
        message: `Réponse serveur invalide (${response.status}).`,
      };
    }

    return {
      success: data?.success === true,
      message:
        data?.message ||
        (data?.success
          ? 'Mot de passe mis à jour avec succès.'
          : 'Erreur lors de la réinitialisation du mot de passe.'),
    };
  } catch (error) {
    console.error(
      'Erreur lors de la réinitialisation du mot de passe :',
      error
    );

    return {
      success: false,
      message:
        'Erreur lors de la communication avec le serveur.',
    };
  }
};

/**
 * Ne révèle jamais l'adresse e-mail réelle dans l'interface.
 */
export const maskEmail = (_email: string): string => {
  return "adresse e-mail d'administration";
};