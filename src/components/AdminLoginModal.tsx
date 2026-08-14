import React, { useState } from 'react';
import { Lock, User, Key, Eye, EyeOff, ShieldCheck, AlertCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { verifyAdminLogin, setAdminSession, getStoredCredentials } from '../utils/auth';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
        setError('Identifiant ou mot de passe incorrect. Veuillez vérifier vos accès.');
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
            <Lock className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-semibold">
            Maison des Pyrénées • Administration
          </span>
          <h3 className="font-serif text-2xl text-[#f3ece0] font-bold">
            Espace Gestionnaire
          </h3>
          <p className="text-xs text-[#a3b1a5] leading-relaxed">
            Connectez-vous pour éditer les modèles de vestes, prix, photos, logos et textes de la marque.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="admin-login-error-alert"
            className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2.5 animate-shake"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div
            id="admin-login-success-alert"
            className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Connexion réussie ! Ouverture du panneau administrateur...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
              Identifiant / Email Admin
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
                placeholder="ex: admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f1410] border border-[#334235] text-[#f3ece0] text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
              Mot de passe
            </label>
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
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7d8c7f] hover:text-[#e2d5c3] transition-colors"
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
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8c6d3f] to-[#b89f74] text-[#141815] font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-black/40 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-[#141815]" viewBox="0 0 24 24">
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

        {/* Demo Credentials Quick Fill Banner */}
        <div className="mt-6 pt-5 border-t border-[#2a352c] text-center space-y-2">
          <div className="p-3 rounded-2xl bg-[#1d261e]/80 border border-[#344436] flex flex-col items-center justify-center space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-[#d4af37] font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Identifiants administrateur :</span>
            </div>
            <div className="text-xs text-[#c6d3c8] font-mono bg-[#111612] px-3 py-1 rounded-lg border border-[#2b392d]">
              Login: <strong className="text-[#f3ece0]">{currentCreds.username}</strong> | MDP: <strong className="text-[#f3ece0]">{currentCreds.passwordHash}</strong>
            </div>
            <button
              id="fill-demo-credentials-btn"
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-[#b89f74] hover:text-[#ecd0a2] underline underline-offset-2 transition-colors pt-0.5"
            >
              Pré-remplir automatiquement ces identifiants
            </button>
          </div>
          <p className="text-[10px] text-[#7a887b]">
            Vous pourrez modifier ce mot de passe à tout moment dans l'onglet Sécurité du panneau administrateur.
          </p>
        </div>
      </div>
    </div>
  );
};
