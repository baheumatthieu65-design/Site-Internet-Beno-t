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
  Sparkles,
  CheckCircle2,
  Mail,
  ArrowLeft,
  KeyRound,
  Send,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import {
  verifyAdminLogin,
  verifyTwoFactorPin,
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
  const [viewMode, setViewMode] = useState<'login' | 'login_2fa' | 'forgot_request' | 'forgot_verify'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA Pin state (4 digits)
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Recovery form state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [generatedCodeNotification, setGeneratedCodeNotification] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Focus first PIN input when entering 2FA mode
  useEffect(() => {
    if (viewMode === 'login_2fa') {
      setTimeout(() => {
        pinInputRefs[0].current?.focus();
      }, 100);
    }
  }, [viewMode]);

  // Handle Step 1: Username & Password verification
  const handleSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const isValid = verifyAdminLogin(username, password);
      setIsLoading(false);
      if (isValid) {
        // Move to Step 2: 2FA 4-digit PIN
        setViewMode('login_2fa');
        setPinDigits(['', '', '', '']);
      } else {
        setError('Identifiant ou mot de passe incorrect.');
      }
    }, 350);
  };

  // Handle Step 2: 2FA PIN verification
  const handleSubmitStep2Pin = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pinDigits.join('');
    if (enteredPin.length < 4) {
      setError('Veuillez saisir les 4 chiffres de votre code de sécurité 2FA.');
      return;
    }

    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const isPinValid = verifyTwoFactorPin(enteredPin);
      if (isPinValid) {
        setSuccess(true);
        setAdminSession(true, rememberMe);
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(username || currentCreds.username);
          onClose();
        }, 500);
      } else {
        setIsLoading(false);
        setError('Code de sécurité 2FA incorrect. Veuillez vérifier les 4 chiffres.');
        // clear PIN digits
        setPinDigits(['', '', '', '']);
        pinInputRefs[0].current?.focus();
      }
    }, 350);
  };

  const handlePinChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...pinDigits];

    if (cleaned.length > 0) {
      newDigits[index] = cleaned[cleaned.length - 1];
      setPinDigits(newDigits);
      // Auto-advance to next input
      if (index < 3) {
        pinInputRefs[index + 1].current?.focus();
      }
    } else {
      newDigits[index] = '';
      setPinDigits(newDigits);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
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
      const res = verifyAndResetPassword(recoveryEmail, recoveryCode, newPassword, newPin);
      if (res.success) {
        setRecoveryMessage({ type: 'success', text: res.message });
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
            {viewMode === 'login' && <Lock className="w-7 h-7" />}
            {viewMode === 'login_2fa' && <Smartphone className="w-7 h-7" />}
            {viewMode === 'forgot_request' && <KeyRound className="w-7 h-7" />}
            {viewMode === 'forgot_verify' && <ShieldCheck className="w-7 h-7" />}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-semibold">
            Maison des Pyrénées • Administration
          </span>
          <h3 className="font-serif text-2xl text-[#f3ece0] font-bold">
            {viewMode === 'login' && "Espace Gestionnaire"}
            {viewMode === 'login_2fa' && "Double Authentification (2FA)"}
            {viewMode === 'forgot_request' && "Récupération du Mot de Passe"}
            {viewMode === 'forgot_verify' && "Nouveau Mot de Passe"}
          </h3>
          <p className="text-xs text-[#a3b1a5] leading-relaxed">
            {viewMode === 'login' && "Connectez-vous pour accéder aux réglages et à la personnalisation."}
            {viewMode === 'login_2fa' && "Saisissez votre code de sécurité à 4 chiffres (ex: 0709)."}
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
            <span>Authentification réussie ! Ouverture du panneau administrateur...</span>
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
        {/* VIEW 1: NORMAL LOGIN FORM (STEP 1)                            */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'login' && (
          <form onSubmit={handleSubmitStep1} className="space-y-4">
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
                  placeholder="Identifiant ou email"
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
                    setRecoveryEmail(currentCreds.email || '');
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
              disabled={isLoading}
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
                  <Lock className="w-4 h-4" />
                  <span>Continuer (Étape 1/2)</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: STEP 2 - DOUBLE AUTHENTICATION (2FA) 4 DIGITS          */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'login_2fa' && (
          <form onSubmit={handleSubmitStep2Pin} className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-[#111712] border border-[#2f3d31] text-center space-y-3">
              <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold block">
                Code de Sécurité à 4 Chiffres
              </span>

              {/* 4 Digit Boxes */}
              <div className="flex justify-center items-center space-x-3 py-2">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={pinInputRefs[idx]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    className="w-12 h-14 text-center font-mono text-2xl font-bold rounded-xl bg-[#1a231d] border-2 border-[#3d4f40] focus:border-[#d4af37] focus:bg-[#202c23] text-[#f3ece0] outline-none shadow-inner transition-all"
                  />
                ))}
              </div>

              <p className="text-[11px] text-[#8e9f90]">
                Vérification de sécurité administrateur requise.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8c6d3f] to-[#b89f74] text-[#121613] font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg cursor-pointer"
            >
              {isLoading ? (
                <span>Validation 2FA...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Valider et Se Connecter</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setError(null);
              }}
              className="w-full py-2 text-xs text-[#a3b1a5] hover:text-white flex items-center justify-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour aux identifiants</span>
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: FORGOT PASSWORD - STEP 1 (EMAIL REQUEST)               */}
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
                Un code de vérification vous sera généré pour réinitialiser vos accès.
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
        {/* VIEW 4: FORGOT PASSWORD - STEP 2 (CODE & NEW PASSWORD)         */}
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5">
                Nouveau Code 2FA (4 chiffres optionnel)
              </label>
              <input
                type="text"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="0709"
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

