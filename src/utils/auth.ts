export interface AdminCredentials {
  username: string;
  passwordHash: string; // stored plain or simple hash for client admin demo
  lastUpdated: string;
}

const DEFAULT_ADMIN: AdminCredentials = {
  username: 'admin',
  passwordHash: 'pyrenees2025',
  lastUpdated: new Date().toISOString(),
};

const AUTH_KEY = 'pyrenees_admin_credentials';
const SESSION_KEY = 'pyrenees_admin_session';

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

export const verifyAdminLogin = (usernameInput: string, passwordInput: string): boolean => {
  const creds = getStoredCredentials();
  const cleanUser = usernameInput.trim().toLowerCase();
  const storedUser = creds.username.trim().toLowerCase();
  
  // Allow username or admin email format
  const isUserValid = cleanUser === storedUser || (storedUser === 'admin' && cleanUser === 'admin@maisondespyrenees.fr');
  const isPassValid = passwordInput === creds.passwordHash;
  
  return isUserValid && isPassValid;
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
