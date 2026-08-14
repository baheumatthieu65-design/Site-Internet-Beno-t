import React from 'react';
import { Sliders, ShieldCheck, LogOut, Key, Sparkles, Palette, Layers, Type, Tag, Move, Check } from 'lucide-react';
import { ButtonStyleId, ThemeConfig } from '../types';
import { buttonModelPresets } from '../utils/themeStyles';

interface AdminBarProps {
  username: string;
  theme?: ThemeConfig;
  isDragReorderMode?: boolean;
  onToggleDragReorderMode?: () => void;
  onQuickChangeButtonStyle?: (styleId: ButtonStyleId) => void;
  onOpenEditor: (tab?: 'brand' | 'articles' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onOpenSecurity: () => void;
  onLogout: () => void;
}

export const AdminBar: React.FC<AdminBarProps> = ({
  username,
  theme,
  isDragReorderMode = true,
  onToggleDragReorderMode,
  onQuickChangeButtonStyle,
  onOpenEditor,
  onOpenSecurity,
  onLogout,
}) => {
  const currentStyleId = theme?.buttonStyle || 'gold-laiton';
  const currentPreset = buttonModelPresets.find((b) => b.id === currentStyleId) || buttonModelPresets[0];

  return (
    <div
      id="admin-top-bar"
      className="bg-[#161c17] border-b border-[#d4af37]/50 text-[#f3ece0] text-xs py-2 px-4 shadow-2xl relative z-50 sticky top-0 transition-all backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Admin Status Badge & Quick Presets */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/50 text-[#d4af37]">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Espace Administrateur
            </span>
          </div>

          {/* Drag and Drop Mode Toggle */}
          {onToggleDragReorderMode && (
            <button
              onClick={onToggleDragReorderMode}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                isDragReorderMode
                  ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-sm ring-1 ring-[#d4af37]/60'
                  : 'bg-[#1f2720] text-[#a3b1a5] border-[#364438] hover:text-white hover:bg-[#28342a]'
              }`}
              title="Déplacer directement les sections et les blocs par simple glisser-déposer sur la page"
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isDragReorderMode ? 'Glisser-Déposer : Activé' : 'Glisser-Déposer'}</span>
            </button>
          )}

          {/* Quick Button Preset Dropdown / Pill */}
          {onQuickChangeButtonStyle && (
            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-[#313f33]">
              <span className="text-[#a3b1a5] text-[11px]">Modèle Boutons :</span>
              <div className="flex items-center space-x-1">
                {buttonModelPresets.map((preset) => {
                  const isSelected = preset.id === currentStyleId;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onQuickChangeButtonStyle(preset.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#d4af37] text-[#121613] font-bold shadow-sm'
                          : 'bg-[#212a22] text-[#b8c5ba] hover:text-white hover:bg-[#2b372d] border border-[#374639]'
                      }`}
                      title={`${preset.name} — ${preset.description}`}
                    >
                      <span>{preset.badge}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Navigation Tabs to Open Customizer */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Button & Styling Tab */}
          <button
            onClick={() => onOpenEditor('theme')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#242f26] hover:bg-[#314034] text-[#d4af37] border border-[#d4af37]/40 transition-all font-medium cursor-pointer"
            title="Modifier les modèles de boutons, arrondis et styles de cartes"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Boutons & Cartes</span>
          </button>

          {/* Formats & Layouts Tab */}
          <button
            onClick={() => onOpenEditor('layouts')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#d4af37] transition-all cursor-pointer"
            title="Modifier la disposition de l'accueil, du showcase et l'ordre des sections"
          >
            <Layers className="w-3.5 h-3.5 text-[#b89f74]" />
            <span className="hidden md:inline">Formats & Ordre</span>
          </button>

          {/* Button Labels / Texts Tab */}
          <button
            onClick={() => onOpenEditor('labels')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#b89f74] transition-all cursor-pointer"
            title="Modifier les libellés des boutons (Commander, Découvrir, etc.)"
          >
            <Type className="w-3.5 h-3.5 text-[#a3b1a5]" />
            <span className="hidden lg:inline">Textes Boutons</span>
          </button>

          {/* Articles & Jackets Tab */}
          <button
            onClick={() => onOpenEditor('articles')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#b89f74] transition-all cursor-pointer"
            title="Gérer les articles (ajouter, supprimer, modifier prix, photos, matières)"
          >
            <Tag className="w-3.5 h-3.5 text-[#b89f74]" />
            <span>Articles</span>
          </button>

          {/* Security / Password Button */}
          <button
            id="admin-bar-security-btn"
            onClick={onOpenSecurity}
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2b362e] text-[#a3b1a5] border border-[#364438] hover:text-white transition-all cursor-pointer"
            title="Modifier l'identifiant, le mot de passe et exporter vos données"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Sécurité</span>
          </button>

          {/* Logout Button */}
          <button
            id="admin-bar-logout-btn"
            onClick={onLogout}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/60 hover:border-red-600 transition-all cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
