import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Mail,
  ArrowLeft,
  KeyRound,
  Send,
  Smartphone,
} from 'lucide-react';
import {
  verifyAdminLoginServer,
  resetPasswordServer,
  getStoredCredentials,
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
  const [viewMode, setViewMode] = useState<'login' | 'forgot_verify'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recovery form state
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Server-Side Login
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await verifyAdminLoginServer(username || 'admin', password);
    setIsLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess(res.username || username || 'admin');
        onClose();
        setSuccess(false);
      }, 500);
    } else {
      setError(res.message || 'Identifiant ou mot de passe incorrect.');
    }
  };

  // Handle Server-Side Password Reset
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    if (newPassword !== confirmNewPassword) {
      setRecoveryMessage({ type: 'error', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setIsLoading(true);
    const res = await resetPasswordServer(recoveryCode, newPassword, newPin);
    setIsLoading(false);

    if (res.success) {
      setRecoveryMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setViewMode('login');
        setPassword(newPassword);
        setRecoveryMessage(null);
      }, 1200);
    } else {
      setRecoveryMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div
      id="admin-login-modal-overlay"
      className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="admin-login-modal-box"
        className="relative w-full max-w-md bg-[#161c17] border border-[#3b4a3c] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#e2d5c3] flex flex-col"
      >
        {/* Close Button */}
        <button
          id="close-admin-login-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9ea99f] hover:text-white hover:bg-[#253026] transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#2a362c] to-[#1c241e] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-lg shadow-black/40">
            {viewMode === 'login' && <Lock className="w-7 h-7" />}
            {viewMode === 'forgot_verify' && <ShieldCheck className="w-7 h-7" />}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-semibold">
            Maison des Pyrénées • Administration
          </span>
          <h3 className="font-serif text-2xl text-[#f3ece0] font-bold">
            {viewMode === 'login' && "Espace Gestionnaire"}
            {viewMode === 'forgot_verify' && "Réinitialisation Sécurisée"}
          </h3>
          <p className="text-xs text-[#a3b1a5] leading-relaxed">
            {viewMode === 'login' && "Connectez-vous pour accéder au panneau d'administration."}
            {viewMode === 'forgot_verify' && "Saisissez votre mot de passe de sécurité pour modifier votre mot de passe."}
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
            <span>Authentification réussie ! Ouverture de l'espace administration...</span>
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

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: NORMAL LOGIN FORM                                     */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'login' && (
          <form onSubmit={handleSubmitLogin} className="space-y-4">
            {/* Username / Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
                Identifiant
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
                  placeholder="admin"
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
                    setViewMode('forgot_verify');
                    setRecoveryCode('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setNewPin('');
                    setError(null);
                    setRecoveryMessage(null);
                  }}
                  className="text-[11px] text-[#b89f74] hover:text-[#f3ece0] underline cursor-pointer font-medium"
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

            {/* Submit Button */}
            <button
              id="admin-submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8c6d3f] to-[#b89f74] text-[#121613] font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-black/40 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-[#121613]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connexion en cours...</span>
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Se Connecter</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: FORGOT PASSWORD - SECURITY CODE & NEW PASSWORDS      */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'forgot_verify' && (
          <form onSubmit={handleVerifyAndReset} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1">
                Mot de passe de sécurité
              </label>
              <input
                type="password"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="••••••••"
                className="w-full text-center tracking-widest font-mono text-lg py-2.5 rounded-xl bg-[#0f1410] border border-[#d4af37]/60 text-[#f3ece0] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1">
                Nouveau Mot de Passe Principal
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1">
                Confirmer le Nouveau Mot de Passe Principal
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
              <span>Valider la Réinitialisation</span>
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
      </div>
    </div>
  );
};
