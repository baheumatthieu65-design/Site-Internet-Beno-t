import React, { useState, useEffect } from 'react';
import {
  BrandConfig,
  JacketModel,
  ButtonStyleId,
  ButtonRadiusId,
  CardStyleId,
  HeroLayoutId,
  ShowcaseLayoutId,
  SectionId,
  ThemeConfig
} from '../types';
import {
  Sliders,
  Save,
  RotateCcw,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  Palette,
  Layers,
  Type,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Mail,
  GitBranch,
  Terminal,
  Copy,
  ExternalLink,
  HelpCircle,
  Globe,
  ShoppingBag
} from 'lucide-react';
import {
  buttonModelPresets,
  cardModelPresets,
  radiusPresets,
  sectionMeta,
  defaultThemeConfig,
  getButtonClasses,
  getCardClasses
} from '../utils/themeStyles';
import { getStoredCredentials, saveAdminCredentials, AdminCredentials } from '../utils/auth';

interface BrandCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandData: BrandConfig;
  onSave: (newData: BrandConfig) => void;
  onReset: () => void;
  initialTab?: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security' | 'github';
}

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  isOpen,
  onClose,
  brandData,
  onSave,
  onReset,
  initialTab = 'theme',
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<BrandConfig>(() => {
    const copy = JSON.parse(JSON.stringify(brandData));
    if (!copy.theme) {
      copy.theme = { ...defaultThemeConfig };
    }
    if (!copy.ordersEmail) {
      copy.ordersEmail = 'baheu.matthieu65@gmail.com';
    }
    return copy;
  });

  const [activeTab, setActiveTab] = useState<'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security' | 'github'>(
    initialTab || 'theme'
  );

  // Security Credentials state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const creds = getStoredCredentials();
    setAdminUsername(creds.username);
    setAdminEmail(creds.email || 'baheu.matthieu65@gmail.com');
  }, [isOpen]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const currentTheme = formData.theme || defaultThemeConfig;

  const updateTheme = (fields: Partial<ThemeConfig>) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...(prev.theme || defaultThemeConfig),
        ...fields,
      },
    }));
  };

  const handleChangeBrand = (field: keyof BrandConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangeJacket = (jacketIdx: 0 | 1, field: keyof JacketModel, value: any) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets] as [JacketModel, JacketModel];
      jackets[jacketIdx] = { ...jackets[jacketIdx], [field]: value };
      return { ...prev, jackets };
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Section Reorder Handlers
  const handleMoveSection = (sectionId: SectionId, direction: 'up' | 'down') => {
    const currentOrder = [...(currentTheme.sectionOrder || defaultThemeConfig.sectionOrder)];
    const index = currentOrder.indexOf(sectionId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = currentOrder[index - 1];
      currentOrder[index - 1] = currentOrder[index];
      currentOrder[index] = temp;
      updateTheme({ sectionOrder: currentOrder });
    } else if (direction === 'down' && index < currentOrder.length - 1) {
      const temp = currentOrder[index + 1];
      currentOrder[index + 1] = currentOrder[index];
      currentOrder[index] = temp;
      updateTheme({ sectionOrder: currentOrder });
    }
  };

  const handleToggleSectionVisibility = (sectionId: SectionId) => {
    const hidden = [...(currentTheme.hiddenSections || [])];
    const index = hidden.indexOf(sectionId);
    if (index > -1) {
      hidden.splice(index, 1);
    } else {
      // Don't allow hiding hero or collection to avoid empty site
      if (sectionId === 'hero' || sectionId === 'collection') {
        alert('Cette section maîtresse ne peut pas être entièrement masquée.');
        return;
      }
      hidden.push(sectionId);
    }
    updateTheme({ hiddenSections: hidden });
  };

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    const stored = getStoredCredentials();
    if (currentPassword !== stored.passwordHash) {
      setSecurityMessage({
        type: 'error',
        text: 'Le mot de passe actuel saisi est incorrect.',
      });
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setSecurityMessage({
        type: 'error',
        text: 'Le nouveau mot de passe doit contenir au moins 4 caractères.',
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSecurityMessage({
        type: 'error',
        text: 'La confirmation ne correspond pas au nouveau mot de passe.',
      });
      return;
    }

    saveAdminCredentials({
      username: adminUsername.trim() || 'admin',
      email: adminEmail.trim() || 'baheu.matthieu65@gmail.com',
      passwordHash: newPassword || stored.passwordHash,
      lastUpdated: new Date().toISOString(),
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityMessage({
      type: 'success',
      text: 'Identifiants & email administrateur mis à jour avec succès !',
    });
  };

  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pyrenees-site-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.brandName && parsed.jackets) {
            setFormData(parsed);
            alert('Configuration importée avec succès ! Pensez à enregistrer pour valider.');
          } else {
            alert('Le format du fichier JSON importé est invalide.');
          }
        } catch (err) {
          alert('Erreur lors de la lecture du fichier JSON.');
        }
      };
    }
  };

  const j1 = formData.jackets[0];
  const j2 = formData.jackets[1];

  const previewBtnClasses = getButtonClasses(currentTheme, 'primary');
  const previewSecBtnClasses = getButtonClasses(currentTheme, 'secondary');
  const previewCard = getCardClasses(currentTheme);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-6xl bg-[#141a15] border border-[#3b473e] rounded-3xl shadow-2xl overflow-hidden text-[#e2d5c3] flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#18201a] border-b border-[#2b372d] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f3ece0] flex items-center space-x-2">
                <span>Panneau de Personnalisation Intégrale</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 font-sans">
                  Admin
                </span>
              </h3>
              <p className="text-xs text-[#a3b1a5]">
                Modifiez en direct les boutons, présentations, formats, emplacements, vestes, textes & prix.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#9c7844] to-[#d4af37] text-[#121613] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer & Appliquer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#202922] hover:bg-[#2e3b30] flex items-center justify-center text-[#a3b1a5] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-[#2a362c] bg-[#111612] px-4 py-2 space-x-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'theme'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Palette className="w-4 h-4 text-[#d4af37]" />
            <span>1. Modèles de Boutons & Cartes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layouts')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'layouts'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#b89f74]" />
            <span>2. Formats & Ordre des Blocs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('labels')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'labels'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Type className="w-4 h-4 text-[#b89f74]" />
            <span>3. Textes & Libellés Boutons</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'brand'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#b89f74]" />
            <span>4. Identité & Terroir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('j1')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'j1'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <span>🧥 5. Veste N°1 ({j1.name})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('j2')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'j2'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <span>🧥 6. Veste N°2 ({j2.name})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <Key className="w-4 h-4 text-[#a3b1a5]" />
            <span>7. Sécurité & Compte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'github'
                ? 'bg-[#29362c] text-[#d4af37] border border-[#d4af37]/60 shadow'
                : 'text-[#9eb0a0] hover:text-[#f3ece0] hover:bg-[#1a211c]'
            }`}
          >
            <GitBranch className="w-4 h-4 text-[#d4af37]" />
            <span>8. GitHub & Déploiement</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: THEME & BUTTONS PRESETS (Requested by user)        */}
          {/* ========================================================= */}
          {activeTab === 'theme' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Interactive Live Swatch Box */}
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3c4c3f] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#d4af37] text-xs uppercase font-serif tracking-widest font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Aperçu en Direct de vos Choix Graphiques</span>
                  </div>
                  <span className="text-[11px] text-[#a3b1a5]">
                    Modèle sélectionné : <strong>{currentTheme.buttonStyle}</strong> • Arrondi : <strong>{currentTheme.buttonRadius}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                  <div className="space-y-3">
                    <span className="text-xs text-[#a3b1a5] block uppercase tracking-wider">Boutons en Action :</span>
                    <div className="flex flex-wrap gap-3">
                      <button className={`px-6 py-3 text-xs uppercase tracking-widest ${previewBtnClasses}`}>
                        {currentTheme.orderButtonText || 'Commander'}
                      </button>
                      <button className={`px-5 py-3 text-xs uppercase tracking-widest ${previewSecBtnClasses}`}>
                        {currentTheme.discoverButtonText || 'Découvrir'}
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl ${previewCard.card} space-y-2`}>
                    <span className="text-[10px] uppercase tracking-widest text-[#d4af37]">Modèle de Carte Actif</span>
                    <h4 className="font-serif text-base text-[#f3ece0]">Carte Présentation Produit</h4>
                    <p className="text-xs text-[#a3b1a5]">Rendu visuel des encadrements, reliefs et liserés.</p>
                  </div>
                </div>
              </div>

              {/* 1. BUTTON STYLE SELECTION (6 Models) */}
              <div className="space-y-4">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold flex items-center space-x-2">
                  <span>Modèles & Matières des Boutons</span>
                  <span className="text-xs text-[#d4af37] font-normal font-sans">({buttonModelPresets.length} variantes d'exception)</span>
                </h4>
                <p className="text-xs text-[#a3b1a5]">
                  Sélectionnez l'ambiance matérielle appliquée instantanément à tous les boutons d'action du site :
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buttonModelPresets.map((preset) => {
                    const isSelected = currentTheme.buttonStyle === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => updateTheme({ buttonStyle: preset.id })}
                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all space-y-3 relative ${
                          isSelected
                            ? 'bg-[#212c23] border-[#d4af37] shadow-xl shadow-[#d4af37]/10'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#526a57]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-black/40 text-[#d4af37] border border-[#d4af37]/40">
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <span className="flex items-center space-x-1 text-xs text-[#d4af37] font-bold">
                              <Check className="w-4 h-4" />
                              <span>Actif</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h5 className="font-serif text-base text-[#f3ece0] font-semibold">{preset.name}</h5>
                          <p className="text-xs text-[#a3b1a5] mt-1 leading-relaxed">{preset.description}</p>
                        </div>

                        {/* Interactive mini button sample */}
                        <div className="pt-2">
                          <button
                            type="button"
                            className={`w-full py-2 text-xs uppercase tracking-wider ${currentTheme.buttonRadius || 'rounded-full'} ${preset.primaryClass}`}
                          >
                            Exemple : {currentTheme.orderButtonText || 'Commander'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. BUTTON RADIUS (5 Shapes) */}
              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold">
                  Forme & Rayon d'Arrondi des Boutons
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {radiusPresets.map((r) => {
                    const isSelected = (currentTheme.buttonRadius || 'rounded-full') === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateTheme({ buttonRadius: r.id })}
                        className={`p-3 border-2 transition-all text-center flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#29362c] border-[#d4af37] text-[#f3ece0]'
                            : 'bg-[#18201a] border-[#313f33] text-[#a3b1a5] hover:border-[#4d6050]'
                        } rounded-xl`}
                      >
                        <div className={`w-12 h-6 bg-[#d4af37] ${r.cssClass} flex items-center justify-center shadow-sm`}>
                          <span className="text-[8px] text-black font-bold">CTA</span>
                        </div>
                        <span className="text-xs font-semibold">{r.name}</span>
                        <span className="text-[10px] text-[#7a8a7c]">{r.radiusLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CARD PRESENTATION STYLES (4 Styles) */}
              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold">
                  Modèles de Cartes & Présentations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cardModelPresets.map((c) => {
                    const isSelected = (currentTheme.cardStyle || 'atelier-relief') === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => updateTheme({ cardStyle: c.id })}
                        className={`p-5 rounded-2xl cursor-pointer border-2 transition-all space-y-2 relative ${
                          isSelected
                            ? 'bg-[#212c23] border-[#d4af37] shadow-xl'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#526a57]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase font-bold text-[#d4af37] tracking-wider">{c.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-[#a3b1a5]">{c.badge}</span>
                        </div>
                        <p className="text-xs text-[#a3b1a5]">{c.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: FORMATS & SECTION ORDER                            */}
          {/* ========================================================= */}
          {activeTab === 'layouts' && (
            <div className="space-y-8 animate-fadeIn">
              {/* 1. HERO LAYOUT VARIANT */}
              <div className="space-y-4">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold">
                  Format de la Section d'Accueil (Hero)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'split-cards' as HeroLayoutId,
                      name: 'Duo Cartes Présentation',
                      badge: 'Par défaut',
                      desc: 'Titre prestigieux centré avec les 2 cartes de vestes interactives sous le texte.',
                    },
                    {
                      id: 'centered-minimal' as HeroLayoutId,
                      name: 'Centré Majestueux & Boutons',
                      badge: 'Épuré',
                      desc: 'Focus immersif sur le slogan, grand bouton d’action et pastilles de sélection.',
                    },
                    {
                      id: 'side-by-side' as HeroLayoutId,
                      name: 'Panorama 2 Colonnes Asymétrique',
                      badge: 'Bannière',
                      desc: 'Texte à gauche et les 2 modèles empilés à droite façon magazine de mode.',
                    },
                  ].map((h) => {
                    const isSelected = (currentTheme.heroLayout || 'split-cards') === h.id;
                    return (
                      <div
                        key={h.id}
                        onClick={() => updateTheme({ heroLayout: h.id })}
                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all space-y-2 ${
                          isSelected
                            ? 'bg-[#212c23] border-[#d4af37] shadow-xl'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#526a57]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[#f3ece0]">{h.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-[#d4af37]">{h.badge}</span>
                        </div>
                        <p className="text-xs text-[#a3b1a5] leading-relaxed">{h.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. SHOWCASE PRESENTATION VARIANT */}
              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold">
                  Format de la Section Showcase (Les 2 Vestes)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'split-interactive' as ShowcaseLayoutId,
                      name: 'Atelier Interactif Split',
                      badge: 'Interactif',
                      desc: 'Grand zoom photo avec points d’intérêt cliquables à gauche et panneau personnalisation à droite.',
                    },
                    {
                      id: 'magazine-editorial' as ShowcaseLayoutId,
                      name: 'Éditorial Grand Angle',
                      badge: 'Magazine',
                      desc: 'Photo immersive géante avec caractéristiques détaillées présentées en 3 blocs équilibrés.',
                    },
                    {
                      id: 'lookbook-focus' as ShowcaseLayoutId,
                      name: 'Focus Galerie Multi-Angles',
                      badge: 'Multi-Photos',
                      desc: 'Mosaïque de 4 angles de prise de vue et loupe macro matière.',
                    },
                  ].map((s) => {
                    const isSelected = (currentTheme.showcaseLayout || 'split-interactive') === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => updateTheme({ showcaseLayout: s.id })}
                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all space-y-2 ${
                          isSelected
                            ? 'bg-[#212c23] border-[#d4af37] shadow-xl'
                            : 'bg-[#181f19] border-[#2f3d32] hover:border-[#526a57]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-[#f3ece0]">{s.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-[#d4af37]">{s.badge}</span>
                        </div>
                        <p className="text-xs text-[#a3b1a5] leading-relaxed">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. SECTION REORDERING & VISIBILITY */}
              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold flex items-center justify-between">
                  <span>Ordre & Emplacements des Sections</span>
                  <span className="text-xs text-[#a3b1a5] font-normal font-sans">
                    Utilisez les flèches ↑ et ↓ pour déplacer les blocs sur la page
                  </span>
                </h4>

                <div className="space-y-2.5">
                  {(currentTheme.sectionOrder || defaultThemeConfig.sectionOrder).map((secId, idx, arr) => {
                    const meta = sectionMeta[secId] || { name: secId, icon: '📄', desc: '' };
                    const isHidden = (currentTheme.hiddenSections || []).includes(secId);

                    return (
                      <div
                        key={secId}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          isHidden
                            ? 'bg-[#151916] border-[#28322a] opacity-60'
                            : 'bg-[#1c241e] border-[#364539] shadow-md'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-serif font-bold text-[#f3ece0]">
                                {idx + 1}. {meta.name}
                              </span>
                              {isHidden && (
                                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                                  Masqué
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#a3b1a5]">{meta.desc}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(secId, 'up')}
                            className="p-2 rounded-xl bg-[#253127] hover:bg-[#324235] text-[#d4af37] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Monter ce bloc"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleMoveSection(secId, 'down')}
                            className="p-2 rounded-xl bg-[#253127] hover:bg-[#324235] text-[#d4af37] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Descendre ce bloc"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          {/* Toggle Visibility */}
                          <button
                            type="button"
                            onClick={() => handleToggleSectionVisibility(secId)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isHidden
                                ? 'bg-red-950/40 text-red-300 border-red-800/40'
                                : 'bg-[#253127] hover:bg-[#324235] text-[#a3b1a5] border-[#364539]'
                            }`}
                            title={isHidden ? 'Afficher la section' : 'Masquer la section'}
                          >
                            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CUSTOM LABELS & BUTTON TEXTS                       */}
          {/* ========================================================= */}
          {activeTab === 'labels' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#1b231d] border border-[#354337]">
                <h4 className="font-serif text-sm uppercase tracking-widest text-[#d4af37] font-semibold mb-2">
                  Personnalisation de Tous les Textes des Boutons
                </h4>
                <p className="text-xs text-[#a3b1a5]">
                  Vous pouvez adapter chaque texte d'action pour correspondre exactement à votre style de communication.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Texte Bouton Commande Principal (Navbar & Showcase) :
                  </label>
                  <input
                    type="text"
                    value={currentTheme.orderButtonText || 'Commander'}
                    onChange={(e) => updateTheme({ orderButtonText: e.target.value })}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    placeholder="Ex: Commander, Réserver ma Veste..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Texte Bouton Découvrir (Hero / Cartes) :
                  </label>
                  <input
                    type="text"
                    value={currentTheme.discoverButtonText || 'Découvrir'}
                    onChange={(e) => updateTheme({ discoverButtonText: e.target.value })}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    placeholder="Ex: Découvrir, Explorer la Création..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Texte Bouton Sur Mesure :
                  </label>
                  <input
                    type="text"
                    value={currentTheme.inquiryButtonText || 'Commander sur Mesure'}
                    onChange={(e) => updateTheme({ inquiryButtonText: e.target.value })}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    placeholder="Ex: Commander sur Mesure, Demande d'Atelier..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Texte Bouton Atelier (Pied de Page) :
                  </label>
                  <input
                    type="text"
                    value={currentTheme.workshopButtonText || "Prendre Rendez-vous à l'Atelier"}
                    onChange={(e) => updateTheme({ workshopButtonText: e.target.value })}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    placeholder="Ex: Prendre Rendez-vous à l'Atelier..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Badge de Sous-Titre Accueil (Haut de page) :
                  </label>
                  <input
                    type="text"
                    value={currentTheme.heroBadgeText || 'Édition Limitée des Pyrénées'}
                    onChange={(e) => updateTheme({ heroBadgeText: e.target.value })}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    placeholder="Ex: Édition Limitée des Pyrénées..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Surtitre d'Accueil (Italique au-dessus du nom) :
                  </label>
                  <input
                    type="text"
                    value={currentTheme.heroTitlePrefix || 'Thème Champêtre & Élégance'}
                    onChange={(e) => updateTheme({ heroTitlePrefix: e.target.value })}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    placeholder="Ex: Thème Champêtre & Élégance..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BRAND IDENTITY & STORY                             */}
          {/* ========================================================= */}
          {activeTab === 'brand' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Nom de la Maison :
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => handleChangeBrand('brandName', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Slogan Principal :
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleChangeBrand('tagline', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Sous-titre / Description de Présentation :
                  </label>
                  <textarea
                    rows={2}
                    value={formData.subtitle}
                    onChange={(e) => handleChangeBrand('subtitle', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Lieu de l'Atelier / Conception :
                  </label>
                  <input
                    type="text"
                    value={formData.designerLocation}
                    onChange={(e) => handleChangeBrand('designerLocation', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Email de Contact Général :
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChangeBrand('contactEmail', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-[#141b16] border border-[#344437] space-y-2">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <ShoppingBag className="w-4 h-4" />
                    <label className="text-xs uppercase tracking-widest font-bold">
                      Email Destinataire des Commandes & Réservations :
                    </label>
                  </div>
                  <p className="text-[11px] text-[#a3b1a5]">
                    Toutes les réservations, demandes sur mesure et commandes passées par les clients sur le site seront dirigées vers cette adresse :
                  </p>
                  <input
                    type="email"
                    required
                    value={formData.ordersEmail || ''}
                    onChange={(e) => handleChangeBrand('ordersEmail', e.target.value)}
                    placeholder="ex: baheu.matthieu65@gmail.com"
                    className="w-full bg-[#1b231d] border border-[#435747] text-sm text-[#f3ece0] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#2a362c]">
                <h4 className="font-serif text-sm uppercase tracking-widest text-[#d4af37] font-semibold">
                  Récit de Création & Terroir
                </h4>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                    Titre du Récit :
                  </label>
                  <input
                    type="text"
                    value={formData.storyTitle}
                    onChange={(e) => handleChangeBrand('storyTitle', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Paragraphe 1 :
                    </label>
                    <textarea
                      rows={4}
                      value={formData.storyText1}
                      onChange={(e) => handleChangeBrand('storyText1', e.target.value)}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-2 font-medium">
                      Paragraphe 2 :
                    </label>
                    <textarea
                      rows={4}
                      value={formData.storyText2}
                      onChange={(e) => handleChangeBrand('storyText2', e.target.value)}
                      className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: JACKET 1 (La Veste des Cimes)                       */}
          {/* ========================================================= */}
          {activeTab === 'j1' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#1b231d] border border-[#354337] flex items-center justify-between">
                <span className="font-serif text-sm font-semibold text-[#d4af37]">Modèle N°1 : {j1.name}</span>
                <span className="text-xs text-[#f3ece0] font-mono font-bold">{j1.price} {j1.currency}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Nom :</label>
                  <input
                    type="text"
                    value={j1.name}
                    onChange={(e) => handleChangeJacket(0, 'name', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Prix (€) :</label>
                  <input
                    type="number"
                    value={j1.price}
                    onChange={(e) => handleChangeJacket(0, 'price', Number(e.target.value))}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Catégorie :</label>
                  <input
                    type="text"
                    value={j1.category}
                    onChange={(e) => handleChangeJacket(0, 'category', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Sous-titre :</label>
                <input
                  type="text"
                  value={j1.subTitle}
                  onChange={(e) => handleChangeJacket(0, 'subTitle', e.target.value)}
                  className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Description Courte :</label>
                  <textarea
                    rows={3}
                    value={j1.description}
                    onChange={(e) => handleChangeJacket(0, 'description', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Récit Détaillé :</label>
                  <textarea
                    rows={3}
                    value={j1.longDescription}
                    onChange={(e) => handleChangeJacket(0, 'longDescription', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: JACKET 2 (Le Manteau Pastorale)                     */}
          {/* ========================================================= */}
          {activeTab === 'j2' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#1b231d] border border-[#354337] flex items-center justify-between">
                <span className="font-serif text-sm font-semibold text-[#d4af37]">Modèle N°2 : {j2.name}</span>
                <span className="text-xs text-[#f3ece0] font-mono font-bold">{j2.price} {j2.currency}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Nom :</label>
                  <input
                    type="text"
                    value={j2.name}
                    onChange={(e) => handleChangeJacket(1, 'name', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Prix (€) :</label>
                  <input
                    type="number"
                    value={j2.price}
                    onChange={(e) => handleChangeJacket(1, 'price', Number(e.target.value))}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Catégorie :</label>
                  <input
                    type="text"
                    value={j2.category}
                    onChange={(e) => handleChangeJacket(1, 'category', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Sous-titre :</label>
                <input
                  type="text"
                  value={j2.subTitle}
                  onChange={(e) => handleChangeJacket(1, 'subTitle', e.target.value)}
                  className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Description Courte :</label>
                  <textarea
                    rows={3}
                    value={j2.description}
                    onChange={(e) => handleChangeJacket(1, 'description', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">Récit Détaillé :</label>
                  <textarea
                    rows={3}
                    value={j2.longDescription}
                    onChange={(e) => handleChangeJacket(1, 'longDescription', e.target.value)}
                    className="w-full bg-[#18201a] border border-[#313f33] text-sm text-white px-3 py-2 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: SECURITY & BACKUPS                                 */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-4">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold flex items-center space-x-2">
                  <Key className="w-5 h-5 text-[#d4af37]" />
                  <span>Compte Administrateur & Email de Récupération</span>
                </h4>

                <p className="text-xs text-[#a3b1a5]">
                  Associez votre adresse email pour pouvoir récupérer ou réinitialiser votre mot de passe en cas d'oubli lors de la connexion.
                </p>

                {securityMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                      securityMessage.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
                        : 'bg-red-950/60 border border-red-700 text-red-200'
                    }`}
                  >
                    <span>{securityMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Identifiant Admin :
                      </label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full bg-[#121613] border border-[#364438] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Email Associé (Récupération) :
                      </label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="baheu.matthieu65@gmail.com"
                        className="w-full bg-[#121613] border border-[#364438] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                      Mot de passe actuel (Requis pour valider les changements) :
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#121613] border border-[#364438] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#2a362c]">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Nouveau mot de passe (optionnel) :
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Laisser vide si inchangé"
                        className="w-full bg-[#121613] border border-[#364438] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] mb-1 font-medium">
                        Confirmer nouveau mot de passe :
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmation"
                        className="w-full bg-[#121613] border border-[#364438] text-sm text-white px-3.5 py-2 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#28362b] border border-[#d4af37] text-[#d4af37] hover:bg-[#344638] text-xs uppercase font-bold tracking-wider cursor-pointer transition-all"
                  >
                    Enregistrer les paramètres de sécurité
                  </button>
                </form>
              </div>

              {/* Export / Import */}
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-4">
                <h4 className="font-serif text-lg text-[#f3ece0] font-semibold flex items-center space-x-2">
                  <Download className="w-5 h-5 text-[#d4af37]" />
                  <span>Sauvegarde & Exportation JSON du Site</span>
                </h4>
                <p className="text-xs text-[#a3b1a5]">
                  Exportez l'intégralité de vos textes, photos, modèles et personnalisations dans un fichier JSON pour sauvegarder ou restaurer sur un autre environnement.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleExportConfig}
                    className="px-4 py-2.5 rounded-xl bg-[#232e26] border border-[#435747] hover:border-[#d4af37] text-xs text-[#f3ece0] font-medium flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-[#d4af37]" />
                    <span>Télécharger la Sauvegarde (.JSON)</span>
                  </button>

                  <label className="px-4 py-2.5 rounded-xl bg-[#232e26] border border-[#435747] hover:border-[#d4af37] text-xs text-[#f3ece0] font-medium flex items-center space-x-2 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#d4af37]" />
                    <span>Restaurer / Importer un Fichier JSON</span>
                    <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Voulez-vous réinitialiser toutes les modifications au design initial ?')) {
                        onReset();
                        onClose();
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-300 hover:bg-red-900/50 flex items-center space-x-1.5 cursor-pointer ml-auto transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser par Défaut</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: GITHUB & DEPLOYMENT GUIDE                          */}
          {/* ========================================================= */}
          {activeTab === 'github' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Intro Banner */}
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#d4af37]/40 space-y-3">
                <div className="flex items-center space-x-3 text-[#d4af37]">
                  <GitBranch className="w-6 h-6" />
                  <h4 className="font-serif text-lg font-bold text-[#f3ece0]">
                    Exporter et Héberger Gratuitement votre Site sur GitHub
                  </h4>
                </div>
                <p className="text-xs text-[#dcd2c4] leading-relaxed">
                  Votre projet est 100% autonome et propriétaire. Vous pouvez l'exporter sous forme de dépôt Git sur votre compte <strong>GitHub</strong>, puis le connecter à <strong>Vercel</strong>, <strong>Netlify</strong> ou <strong>GitHub Pages</strong> pour un hébergement gratuit à vie avec nom de domaine personnalisé et certificat SSL (HTTPS) automatique.
                </p>
              </div>

              {/* Step by Step Terminal Commands */}
              <div className="p-6 rounded-2xl bg-[#141a15] border border-[#364538] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Terminal className="w-5 h-5" />
                    <span className="font-serif text-sm uppercase tracking-widest font-semibold text-[#f3ece0]">
                      Commandes Git pour importer sur votre GitHub :
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: "1. Initialiser le dépôt Git local",
                      cmd: "git init",
                    },
                    {
                      label: "2. Ajouter tous les fichiers du projet",
                      cmd: "git add .",
                    },
                    {
                      label: "3. Créer le commit initial",
                      cmd: 'git commit -m "Maison des Pyrénées - Site Vitrine & Panneau Admin"',
                    },
                    {
                      label: "4. Définir la branche principale en 'main'",
                      cmd: "git branch -M main",
                    },
                    {
                      label: "5. Lier votre dépôt GitHub distant (remplacez par l'URL de votre dépôt)",
                      cmd: "git remote add origin https://github.com/VOTRE-NOM-UTILISATEUR/votre-depot-pyrenees.git",
                    },
                    {
                      label: "6. Envoyer le code sur GitHub",
                      cmd: "git push -u origin main",
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#1b221d] border border-[#2c392e] space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#a3b1a5]">
                        <span className="font-medium text-[#d4af37]">{step.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(step.cmd);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="flex items-center space-x-1 text-[11px] text-[#a3b1a5] hover:text-[#d4af37] px-2 py-0.5 rounded bg-[#253027] transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-[#e2d5c3] bg-[#111612] px-3 py-2 rounded-lg overflow-x-auto select-all">
                        {step.cmd}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hosting Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-3">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Globe className="w-5 h-5" />
                    <h5 className="font-serif font-bold text-sm text-[#f3ece0]">Option A: Vercel (Recommandé)</h5>
                  </div>
                  <ul className="text-xs text-[#a3b1a5] space-y-1.5 list-disc list-inside">
                    <li>Gratuit à vie</li>
                    <li>Connexion directe à votre GitHub en 1 clic</li>
                    <li>Détection automatique du projet Vite / React</li>
                    <li>Déploiement continu à chaque push Git</li>
                  </ul>
                  <span className="inline-block text-[11px] font-mono text-[#d4af37] bg-black/40 px-2 py-1 rounded">
                    vercel.com/new
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-3">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Globe className="w-5 h-5" />
                    <h5 className="font-serif font-bold text-sm text-[#f3ece0]">Option B: Netlify</h5>
                  </div>
                  <ul className="text-xs text-[#a3b1a5] space-y-1.5 list-disc list-inside">
                    <li>Gratuit & très rapide</li>
                    <li>Build command : <code className="text-[#f3ece0]">npm run build</code></li>
                    <li>Publish directory : <code className="text-[#f3ece0]">dist</code></li>
                    <li>Gestion des formulaires & SSL inclus</li>
                  </ul>
                  <span className="inline-block text-[11px] font-mono text-[#d4af37] bg-black/40 px-2 py-1 rounded">
                    app.netlify.com
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] space-y-3">
                  <div className="flex items-center space-x-2 text-[#d4af37]">
                    <Globe className="w-5 h-5" />
                    <h5 className="font-serif font-bold text-sm text-[#f3ece0]">Option C: GitHub Pages</h5>
                  </div>
                  <ul className="text-xs text-[#a3b1a5] space-y-1.5 list-disc list-inside">
                    <li>100% intégré à votre dépôt GitHub</li>
                    <li>Activé via les "Pages" dans les paramètres GitHub</li>
                    <li>Utilise GitHub Actions pour compiler et publier</li>
                  </ul>
                  <span className="inline-block text-[11px] font-mono text-[#d4af37] bg-black/40 px-2 py-1 rounded">
                    Paramètres Dépôt &gt; Pages
                  </span>
                </div>
              </div>

              {/* Quick Export ZIP / Download */}
              <div className="p-6 rounded-2xl bg-[#1a221c] border border-[#3b4b3e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="font-serif font-bold text-sm text-[#f3ece0]">
                    Téléchargement des Fichiers de Configuration
                  </h5>
                  <p className="text-xs text-[#a3b1a5]">
                    Pensez à télécharger votre configuration personnalisée pour la conserver avec votre dépôt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportConfig}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9c7844] to-[#d4af37] text-[#121613] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 hover:brightness-110 shadow-lg cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter la Config JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 bg-[#18201a] border-t border-[#2b372d] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-wider text-[#a3b1a5] hover:text-white rounded-xl bg-[#202922] cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#9c7844] via-[#c6a877] to-[#e4cb9c] text-[#121613] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer toutes les modifications</span>
          </button>
        </div>
      </div>
    </div>
  );
};
