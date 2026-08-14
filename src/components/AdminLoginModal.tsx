import React, { useState } from 'react';
import {
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles,
  CheckCircle2,
  Mail,
  ArrowLeft,
  HelpCircle,
  KeyRound,
  Send
} from 'lucide-react';
import {
  verifyAdminLogin,
  setAdminSession,
  getStoredCredentials,
  requestPasswordReset,
  verifyAndResetPassword
} from '../utils/auth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  if (!isOpen) return null;

  const currentCreds = getStoredCredentials();
  const [viewMode, setViewMode] = useState<'login' | 'forgot_request' | 'forgot_verify'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recovery form state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [generatedCodeNotification, setGeneratedCodeNotification] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const isValid = verifyAdminLogin(username, password);
      if (isValid) {
        setSuccess(true);
        setAdminSession(true, rememberMe);
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(username || currentCreds.username);
          onClose();
        }, 600);
      } else {
        setIsLoading(false);
        setError('Identifiant ou mot de passe incorrect. Vous pouvez vous connecter avec votre identifiant ou votre email associé.');
      }
    }, 400);
  };

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = requestPasswordReset(recoveryEmail || currentCreds.email);
      if (res.success) {
        setGeneratedCodeNotification(res.tempCode || null);
        setRecoveryMessage({ type: 'success', text: res.message });
        setViewMode('forgot_verify');
      } else {
        setRecoveryMessage({ type: 'error', text: res.message });
      }
    }, 400);
  };

  const handleVerifyAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    if (newPassword !== confirmNewPassword) {
      setRecoveryMessage({ type: 'error', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = verifyAndResetPassword(recoveryEmail, recoveryCode, newPassword);
      if (res.success) {
        setRecoveryMessage({ type: 'success', text: res.message });
        // After 1.5s switch back to login with prefilled password
        setTimeout(() => {
          setViewMode('login');
          setUsername(currentCreds.username);
          setPassword(newPassword);
          setRecoveryMessage(null);
          setGeneratedCodeNotification(null);
        }, 1200);
      } else {
        setRecoveryMessage({ type: 'error', text: res.message });
      }
    }, 400);
  };

  const handleFillDemo = () => {
    setUsername(currentCreds.username);
    setPassword(currentCreds.passwordHash);
    setError(null);
  };

  return (
    <div
      id="admin-login-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="admin-login-modal-box"
        className="relative w-full max-w-md bg-[#161c17] border border-[#3b4a3c] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#e2d5c3] flex flex-col"
      >
        {/* Close Button */}
        <button
          id="close-admin-login-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9ea99f] hover:text-white hover:bg-[#253026] transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#2a362c] to-[#1c241e] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-lg shadow-black/40">
            {viewMode === 'login' ? <Lock className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-semibold">
            Maison des Pyrénées • Administration
          </span>
          <h3 className="font-serif text-2xl text-[#f3ece0] font-bold">
            {viewMode === 'login' && "Espace Gestionnaire"}
            {viewMode === 'forgot_request' && "Récupération du Mot de Passe"}
            {viewMode === 'forgot_verify' && "Nouveau Mot de Passe"}
          </h3>
          <p className="text-xs text-[#a3b1a5] leading-relaxed">
            {viewMode === 'login' && "Connectez-vous pour éditer les modèles de vestes, prix, photos, logos et textes de la marque."}
            {viewMode === 'forgot_request' && "Indiquez l'adresse email associée à votre compte admin pour recevoir le code de réinitialisation."}
            {viewMode === 'forgot_verify' && "Saisissez le code de sécurité reçu et choisissez votre nouveau mot de passe."}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div
            id="admin-login-error-alert"
            className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2.5 animate-shake"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            id="admin-login-success-alert"
            className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Connexion réussie ! Ouverture du panneau administrateur...</span>
          </div>
        )}

        {recoveryMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center space-x-2.5 ${
              recoveryMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
                : 'bg-red-950/60 border border-red-800/80 text-red-200 animate-shake'
            }`}
          >
            {recoveryMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span>{recoveryMessage.text}</span>
          </div>
        )}

        {/* Simulated Instant Code Notification */}
        {generatedCodeNotification && viewMode === 'forgot_verify' && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#1d271f] border border-[#d4af37]/60 text-xs text-[#e2d5c3] space-y-1.5 shadow-md">
            <div className="flex items-center space-x-2 text-[#d4af37] font-semibold">
              <Mail className="w-4 h-4" />
              <span>Email de sécurité envoyé à {currentCreds.email}</span>
            </div>
            <div className="text-[11px] text-[#b8c5ba] flex items-center justify-between">
              <span>Code de récupération :</span>
              <span className="font-mono text-sm font-bold text-white bg-[#0e130f] px-2.5 py-0.5 rounded border border-[#3b4b3e] tracking-widest">
                {generatedCodeNotification}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRecoveryCode(generatedCodeNotification)}
              className="text-[11px] text-[#d4af37] hover:underline cursor-pointer pt-1"
            >
              Cliquer pour pré-remplir ce code
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: NORMAL LOGIN FORM                                     */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'login' && (
          <form onSubmit={handleSubmitLogin} className="space-y-4">
            {/* Username / Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
                Identifiant ou Email Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7d8c7f]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`ex: ${currentCreds.username} ou ${currentCreds.email}`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f1410] border border-[#334235] text-[#f3ece0] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot_request');
                    setRecoveryEmail(currentCreds.email);
                    setError(null);
                  }}
                  className="text-[11px] text-[#b89f74] hover:text-[#f3ece0] underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7d8c7f]">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#0f1410] border border-[#334235] text-[#f3ece0] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7d8c7f] hover:text-[#e2d5c3] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me option */}
            <div className="flex items-center justify-between text-xs text-[#a3b1a5] pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#3b4a3c] bg-[#121713] text-[#d4af37] focus:ring-0 w-4 h-4 accent-[#d4af37]"
                />
                <span>Mémoriser ma session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="admin-submit-login-btn"
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8c6d3f] to-[#b89f74] text-[#121613] font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-black/40 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-[#121613]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Vérification...</span>
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Accéder à l'Administration</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: FORGOT PASSWORD - STEP 1 (EMAIL REQUEST)               */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'forgot_request' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
                Email Associé au Compte Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7d8c7f]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="ex: baheu.matthieu65@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f1410] border border-[#334235] text-[#f3ece0] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#7e8f81] mt-1.5">
                Un code de vérification à 6 chiffres vous sera instantanément généré.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8c6d3f] to-[#b89f74] text-[#121613] font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Générer le Code de Récupération</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError(null);
                setRecoveryMessage(null);
              }}
              className="w-full py-2 text-xs text-[#a3b1a5] hover:text-white flex items-center justify-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la connexion</span>
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: FORGOT PASSWORD - STEP 2 (CODE & NEW PASSWORD)         */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'forgot_verify' && (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
                Code de sécurité (6 chiffres)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.trim())}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-lg py-2.5 rounded-xl bg-[#0f1410] border border-[#334235] text-[#f3ece0] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
                Nouveau Mot de Passe
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f1410] border border-[#334235] text-[#f3ece0] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
                Confirmer le Nouveau Mot de Passe
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f1410] border border-[#334235] text-[#f3ece0] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8c6d3f] to-[#b89f74] text-[#121613] font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider le Nouveau Mot de Passe</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError(null);
                setRecoveryMessage(null);
              }}
              className="w-full py-2 text-xs text-[#a3b1a5] hover:text-white flex items-center justify-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Annuler et revenir à la connexion</span>
            </button>
          </form>
        )}

        {/* Demo Credentials Quick Fill Banner (Only on login view) */}
        {viewMode === 'login' && (
          <div className="mt-6 pt-5 border-t border-[#2a352c] text-center space-y-2">
            <div className="p-3 rounded-2xl bg-[#1d261e]/80 border border-[#344436] flex flex-col items-center justify-center space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs text-[#d4af37] font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Identifiants & Email Admin Associé :</span>
              </div>
              <div className="text-xs text-[#c6d3c8] font-mono bg-[#111612] px-3 py-1.5 rounded-lg border border-[#2b392d] space-y-0.5">
                <div>Login: <strong className="text-[#f3ece0]">{currentCreds.username}</strong> | MDP: <strong className="text-[#f3ece0]">{currentCreds.passwordHash}</strong></div>
                <div className="text-[11px] text-[#a3b1a5]">Email : <strong className="text-[#d4af37]">{currentCreds.email}</strong></div>
              </div>
              <button
                id="fill-demo-credentials-btn"
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-[#b89f74] hover:text-[#ecd0a2] underline underline-offset-2 transition-colors pt-0.5 cursor-pointer"
              >
                Pré-remplir automatiquement ces identifiants
              </button>
            </div>
            <p className="text-[10px] text-[#7a887b]">
              Vous pouvez vous connecter avec votre identifiant ou votre adresse email, et modifier vos accès dans l'onglet Sécurité.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

