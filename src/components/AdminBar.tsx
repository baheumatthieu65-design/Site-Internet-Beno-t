import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LogOut,
  Key,
  Palette,
  Layers,
  Type,
  Tag,
  Move,
  Package,
} from 'lucide-react';
import { ThemeConfig } from '../types';
import { getStoredOrders } from '../utils/orderStorage';

interface AdminBarProps {
  username: string;
  theme?: ThemeConfig;
  isDragReorderMode?: boolean;
  onToggleDragReorderMode?: () => void;
  onQuickChangeButtonStyle?: (styleId: any) => void;
  onOpenEditor: (
    tab?:
      | 'brand'
      | 'articles'
      | 'j1'
      | 'j2'
      | 'theme'
      | 'layouts'
      | 'labels'
      | 'security'
  ) => void;
  onOpenOrders: () => void;
  onOpenProducts?: () => void;
  onOpenSecurity: () => void;
  onLogout: () => void;
}

declare global {
  interface Window {
    __pyreneesOpenAdminOrders?: () => void;
  }
}

export const AdminBar: React.FC<AdminBarProps> = ({
  username,
  theme,
  isDragReorderMode = true,
  onToggleDragReorderMode,
  onOpenEditor,
  onOpenOrders,
  onOpenProducts,
  onOpenSecurity,
  onLogout,
}) => {
  const [ordersCount, setOrdersCount] = useState<number>(0);

  useEffect(() => {
    setOrdersCount(getStoredOrders().length);

    window.__pyreneesOpenAdminOrders = onOpenOrders;

    return () => {
      delete window.__pyreneesOpenAdminOrders;
    };
  }, [onOpenOrders]);

  return (
    <div
      id="admin-top-bar"
      className="bg-[#161c17] border-t border-[#d4af37]/50 text-[#f3ece0] text-xs py-2 px-4 shadow-2xl relative z-50 fixed bottom-0 left-0 right-0 transition-all backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/50 text-[#d4af37]">
            <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Espace Administrateur
            </span>
          </div>

          {onToggleDragReorderMode && (
            <button
              onClick={onToggleDragReorderMode}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                isDragReorderMode
                  ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-sm ring-1 ring-[#d4af37]/60'
                  : 'bg-[#1f2720] text-[#a3b1a5] border-[#364438] hover:text-white hover:bg-[#28342a]'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>
                {isDragReorderMode
                  ? 'Glisser-Déposer : Activé'
                  : 'Glisser-Déposer'}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <button
            onClick={() => onOpenEditor('theme')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#242f26] hover:bg-[#314034] text-[#d4af37] border border-[#d4af37]/40 transition-all font-medium cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Boutons & Cartes</span>
          </button>

          <button
            onClick={() => onOpenEditor('layouts')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#d4af37] transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#b89f74]" />
            <span className="hidden md:inline">Formats & Ordre</span>
          </button>

          <button
            onClick={() => onOpenEditor('labels')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#b89f74] transition-all cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-[#a3b1a5]" />
            <span className="hidden lg:inline">Textes Boutons</span>
          </button>

          {onOpenProducts ? (
            <button
              onClick={onOpenProducts}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#243126] hover:bg-[#304133] text-[#d4af37] border border-[#d4af37]/60 transition-all font-bold cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Catalogue</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenEditor('articles')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#b89f74] transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#b89f74]" />
              <span>Articles</span>
            </button>
          )}

          <button
            id="admin-bar-security-btn"
            onClick={onOpenSecurity}
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2b362e] text-[#a3b1a5] border border-[#364438] hover:text-white transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Sécurité</span>
          </button>

          <button
            id="admin-bar-logout-btn"
            onClick={onLogout}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/60 hover:border-red-600 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
