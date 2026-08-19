import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, Key, Palette, Layers, Type, Tag, Move, Package, Image as ImageIcon } from 'lucide-react';
import { ThemeConfig } from '../types';
import { getStoredOrders } from '../utils/orderStorage';

interface AdminBarProps {
  username: string;
  theme?: ThemeConfig;
  isDragReorderMode?: boolean;
  onToggleDragReorderMode?: () => void;
  onQuickChangeButtonStyle?: (styleId: any) => void;
  onOpenEditor: (tab?: 'brand'|'articles'|'j1'|'j2'|'theme'|'layouts'|'labels'|'security') => void;
  onOpenOrders: () => void;
  onOpenProducts?: () => void;
  onOpenLogoEditor?: () => void;
  onOpenSecurity: () => void;
  onLogout: () => void;
  embedded?: boolean;
}

declare global { interface Window { __pyreneesOpenAdminOrders?: () => void; } }

export const AdminBar: React.FC<AdminBarProps> = ({ username, theme, isDragReorderMode=true, onToggleDragReorderMode, onOpenEditor, onOpenOrders, onOpenProducts, onOpenLogoEditor, onOpenSecurity, onLogout, embedded=false }) => {
  const [ordersCount, setOrdersCount] = useState(0);
  useEffect(() => { setOrdersCount(getStoredOrders().length); window.__pyreneesOpenAdminOrders = onOpenOrders; return () => { delete window.__pyreneesOpenAdminOrders; }; }, [onOpenOrders]);
  return <div id="admin-top-bar" className={embedded ? 'rounded-xl border border-[#d4af37]/40 bg-[#161c17] px-3 py-3 text-xs text-[#f3ece0] shadow-inner' : 'fixed bottom-0 left-0 right-0 z-50 border-t border-[#d4af37]/50 bg-[#161c17] px-4 py-2 text-xs text-[#f3ece0] shadow-2xl backdrop-blur-md'}>
    <div className={embedded ? 'flex flex-wrap items-center justify-between gap-3' : 'mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3'}>
      <div className="flex items-center space-x-3"><div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/50 text-[#d4af37]"><ShieldCheck className="w-3.5 h-3.5"/><span className="font-semibold uppercase tracking-wider text-[11px]">Espace Administrateur</span></div>{onToggleDragReorderMode && <button onClick={onToggleDragReorderMode} className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${isDragReorderMode ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-sm ring-1 ring-[#d4af37]/60' : 'bg-[#1f2720] text-[#a3b1a5] border-[#364438] hover:text-white hover:bg-[#28342a]'}`}><Move className="w-3.5 h-3.5"/><span>{isDragReorderMode ? 'Glisser-Déposer : Activé' : 'Glisser-Déposer'}</span></button>}</div>
      <div className="flex w-full flex-col items-end gap-2 lg:w-auto"><div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
        <button onClick={() => onOpenEditor('theme')} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#242f26] hover:bg-[#314034] text-[#d4af37] border border-[#d4af37]/40 transition-all font-medium cursor-pointer"><Palette className="w-3.5 h-3.5"/><span className="hidden sm:inline">Boutons & Cartes</span></button>
        {onOpenLogoEditor && <button onClick={onOpenLogoEditor} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#242f26] hover:bg-[#314034] text-[#d4af37] border border-[#d4af37]/60 transition-all font-semibold cursor-pointer"><ImageIcon className="w-3.5 h-3.5"/><span>Logo</span></button>}
        <button onClick={() => onOpenEditor('layouts')} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#d4af37] transition-all cursor-pointer"><Layers className="w-3.5 h-3.5 text-[#b89f74]"/><span className="hidden md:inline">Formats & Ordre</span></button>
        <button onClick={() => onOpenEditor('labels')} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] hover:border-[#b89f74] transition-all cursor-pointer"><Type className="w-3.5 h-3.5 text-[#a3b1a5]"/><span className="hidden lg:inline">Textes Boutons</span></button>
        {onOpenProducts ? <button onClick={onOpenProducts} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#243126] hover:bg-[#304133] text-[#d4af37] border border-[#d4af37]/60 transition-all font-bold cursor-pointer"><Package className="w-3.5 h-3.5"/><span>Catalogue</span></button> : <button onClick={() => onOpenEditor('articles')} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2c382e] text-[#c4ceb8] border border-[#3b4b3e] cursor-pointer"><Tag className="w-3.5 h-3.5"/><span>Articles</span></button>}
      </div><div className="flex items-center gap-2 border-t border-[#344139] pt-2"><button id="admin-bar-security-btn" onClick={onOpenSecurity} className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-[#202922] hover:bg-[#2b362e] text-[#a3b1a5] border border-[#364438] hover:text-white transition-all cursor-pointer"><Key className="w-3.5 h-3.5"/><span>Sécurité</span></button><button id="admin-bar-logout-btn" onClick={onLogout} className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/60 hover:border-red-600 transition-all cursor-pointer"><LogOut className="w-3.5 h-3.5"/><span>Quitter</span></button></div></div>
    </div>
  </div>;
};
