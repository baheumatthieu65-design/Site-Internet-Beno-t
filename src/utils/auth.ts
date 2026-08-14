export interface AdminCredentials {
  username: string;
  email: string;
  passwordHash: string; // stored plain or simple hash for client admin
  lastUpdated: string;
}

const DEFAULT_ADMIN: AdminCredentials = {
  username: 'admin',
  email: 'baheu.matthieu65@gmail.com',
  passwordHash: 'pyrenees2025',
  lastUpdated: new Date().toISOString(),
};

const AUTH_KEY = 'pyrenees_admin_credentials';
const SESSION_KEY = 'pyrenees_admin_session';
const RESET_TOKEN_KEY = 'pyrenees_admin_reset_token';

export const getStoredCredentials = (): AdminCredentials => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure email exists if older format
      if (!parsed.email) {
        parsed.email = DEFAULT_ADMIN.email;
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse admin credentials:', e);
    }
  }
  return DEFAULT_ADMIN;
};

export const saveAdminCredentials = (credentials: AdminCredentials): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(credentials));
};

export const verifyAdminLogin = (userInput: string, passwordInput: string): boolean => {
  const creds = getStoredCredentials();
  const cleanInput = userInput.trim().toLowerCase();
  const storedUser = creds.username.trim().toLowerCase();
  const storedEmail = (creds.email || '').trim().toLowerCase();

  // Allow login by Username OR by associated Admin Email
  const isUserValid =
    cleanInput === storedUser ||
    cleanInput === storedEmail ||
    (storedUser === 'admin' && cleanInput === 'admin@maisondespyrenees.fr');

  const isPassValid = passwordInput === creds.passwordHash;

  return isUserValid && isPassValid;
};

export interface PasswordResetRequestResult {
  success: boolean;
  message: string;
  tempCode?: string;
  destinationEmail?: string;
}

export const requestPasswordReset = (emailInput: string): PasswordResetRequestResult => {
  const creds = getStoredCredentials();
  const cleanInput = emailInput.trim().toLowerCase();
  const storedEmail = (creds.email || DEFAULT_ADMIN.email).trim().toLowerCase();
  const storedUser = creds.username.trim().toLowerCase();

  // Check if input matches stored admin email or username
  if (cleanInput !== storedEmail && cleanInput !== storedUser && cleanInput !== 'admin@maisondespyrenees.fr') {
    return {
      success: false,
      message: `Aucun compte administrateur n'est associé à l'adresse "${emailInput}". Vérifiez l'adresse ou contactez le support.`,
    };
  }

  // Generate a realistic 6-digit security code
  const tempCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  const tokenData = {
    code: tempCode,
    email: creds.email,
    expiresAt,
  };

  localStorage.setItem(RESET_TOKEN_KEY, JSON.stringify(tokenData));

  return {
    success: true,
    message: `Un code sécurisé de récupération a été généré pour le compte associé à ${creds.email}.`,
    tempCode,
    destinationEmail: creds.email,
  };
};

export const verifyAndResetPassword = (
  emailInput: string,
  code: string,
  newPassword: string
): { success: boolean; message: string } => {
  const tokenRaw = localStorage.getItem(RESET_TOKEN_KEY);
  if (!tokenRaw) {
    return { success: false, message: 'Aucune demande de réinitialisation en cours ou code expiré.' };
  }

  try {
    const token = JSON.parse(tokenRaw);
    if (Date.now() > token.expiresAt) {
      localStorage.removeItem(RESET_TOKEN_KEY);
      return { success: false, message: 'Le code de sécurité a expiré (validité 15 min). Veuillez refaire une demande.' };
    }

    if (token.code.trim() !== code.trim()) {
      return { success: false, message: 'Code de sécurité incorrect. Veuillez vérifier les 6 chiffres.' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Le mot de passe doit contenir au moins 4 caractères.' };
    }

    // Success: update credentials
    const creds = getStoredCredentials();
    const updated: AdminCredentials = {
      ...creds,
      passwordHash: newPassword,
      lastUpdated: new Date().toISOString(),
    };
    saveAdminCredentials(updated);
    localStorage.removeItem(RESET_TOKEN_KEY);

    return {
      success: true,
      message: 'Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant vous connecter.',
    };
  } catch (e) {
    return { success: false, message: 'Erreur lors de la validation du code.' };
  }
};

export const getInitialAdminSession = (): boolean => {
  const local = localStorage.getItem(SESSION_KEY);
  const session = sessionStorage.getItem(SESSION_KEY);
  return local === 'true' || session === 'true';
};

export const setAdminSession = (isActive: boolean, rememberMe: boolean = true): void => {
  if (isActive) {
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, 'true');
    } else {
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
  } else {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }
};

