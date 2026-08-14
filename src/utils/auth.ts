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

export const getStoredCredentials = (): AdminCredentials => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse admin credentials:', e);
    }
  }
  return DEFAULT_ADMIN;
};

export const saveAdminCredentials = (credentials: AdminCredentials): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(credentials));
};

/**
 * Server-side Admin Login API
 */
export const verifyAdminLoginServer = async (
  userInput: string,
  passwordInput: string
): Promise<{ success: boolean; message?: string; username?: string }> => {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userInput,
        password: passwordInput,
      }),
    });

    const data = await response.json();
    return {
      success: !!data.success,
      message: data.message,
      username: data.username || 'admin',
    };
  } catch (error) {
    console.error('Server login request failed:', error);
    return {
      success: false,
      message: 'Impossible de contacter le serveur d\'authentification.',
    };
  }
};

/**
 * Server-side Admin Session Verification
 */
export const verifyAdminSessionServer = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return !!data.authenticated;
  } catch (error) {
    console.error('Session verification failed:', error);
    return false;
  }
};

/**
 * Server-side Admin Logout
 */
export const logoutAdminServer = async (): Promise<void> => {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

/**
 * Server-side Password Reset API
 */
export const resetPasswordServer = async (
  code: string,
  newPassword: string,
  newPin?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        newPassword,
        newPin,
      }),
    });

    const data = await response.json();
    return {
      success: !!data.success,
      message: data.message || (data.success ? 'Mot de passe mis à jour avec succès.' : 'Erreur de réinitialisation.'),
    };
  } catch (error) {
    console.error('Reset password request failed:', error);
    return {
      success: false,
      message: 'Erreur lors de la communication avec le serveur.',
    };
  }
};

export const maskEmail = (email: string): string => {
  return "adresse e-mail d'administration";
};
