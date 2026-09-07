import React from 'react';
import {
  ButtonStyleId,
  ButtonRadiusId,
  ButtonSizeId,
  ButtonTextSizeId,
  ButtonTargetId,
  CardStyleId,
  ThemeConfig,
  SectionId,
  SiteThemePresetId,
} from '../types.js';

export interface ButtonModelPreset {
  id: ButtonStyleId;
  name: string;
  badge: string;
  description: string;
  primaryClass: string;
  secondaryClass: string;
  outlineClass: string;
  previewBg: string;
}

export interface CardModelPreset {
  id: CardStyleId;
  name: string;
  badge: string;
  description: string;
  cardClass: string;
  innerClass: string;
  borderClass: string;
}

export interface RadiusPreset {
  id: ButtonRadiusId;
  name: string;
  cssClass: string;
  radiusLabel: string;
}

export const defaultThemeConfig: ThemeConfig = {
  buttonStyle: 'gold-laiton',
  buttonRadius: 'rounded-full',
  buttonSize: 'standard',
  buttonBackgroundImageUrl: '',
  buttonBackgroundOverlay: 28,
  buttonOverrides: {},
  cardStyle: 'atelier-relief',
  heroLayout: 'split-cards',
  showcaseLayout: 'split-interactive',
  sectionOrder: ['hero', 'collection', 'comparatif', 'origines', 'lookbook', 'contact'],
  hiddenSections: [],
  textAlign: 'center',
  buttonAlign: 'center',
  heroBadgePosition: 'top',
  cardMediaPosition: 'left',
  contentPadding: 'comfortable',
  containerWidth: 'standard',
  showcaseImageScale: 100,
  showcaseImageFrameWidth: 60,
  showcaseImageFrameHeight: 320,
  lookbookImageScale: 100,
  lookbookImageFrameWidth: 60,
  lookbookImageFrameHeight: 220,
  sectionBackgroundImages: {},
  sectionBackgroundMedia: {},
  siteThemePreset: 'pyrenees-noir',
  siteBackgroundColor: '#121613',
  navBackgroundColor: '#1a1e1b',
  navBackgroundOpacity: 0,
  sectionBackgroundOpacity: {},
  sectionWidthPercent: {},
  lookbookProductIds: [],
  catalogCategories: [],
  productBlocksOrder: ['title-price', 'description', 'colors', 'sizes', 'specs', 'cta'],
  formFieldsOrder: ['name', 'email', 'phone', 'jacket', 'color', 'size', 'requestType', 'message'],
  orderButtonText: 'Commander',
  discoverButtonText: 'Découvrir',
  inquiryButtonText: 'Commander sur Mesure',
  workshopButtonText: "Prendre Rendez-vous à l'Atelier",
  heroBadgeText: 'Édition Limitée des Pyrénées',
  heroTitlePrefix: 'Thème Champêtre & Élégance',
  landingBoutiqueKicker: 'MAISON MAILHAGUT',
  landingBoutiqueTitle: 'La Boutique',
  landingGiteKicker: 'PYRÉNÉES',
  landingGiteTitle: 'Le Gîte',
};

export interface SiteThemePreset {
  id: SiteThemePresetId;
  name: string;
  description: string;
  siteBackgroundColor: string;
  navBackgroundColor: string;
  previewBg: string;
}

export const siteThemePresets: SiteThemePreset[] = [
  { id: 'pyrenees-noir', name: 'Pyrénées Noir', description: 'Vert noir profond, or signature.', siteBackgroundColor: '#121613', navBackgroundColor: '#1a1e1b', previewBg: 'linear-gradient(135deg,#121613,#2a332d)' },
  { id: 'foret-profonde', name: 'Forêt Profonde', description: 'Vert sapin plus marqué et minéral.', siteBackgroundColor: '#0f1a14', navBackgroundColor: '#16251b', previewBg: 'linear-gradient(135deg,#0f1a14,#284632)' },
  { id: 'ardoise-luxe', name: 'Ardoise Luxe', description: 'Anthracite froid, très contemporain.', siteBackgroundColor: '#11151a', navBackgroundColor: '#1b2028', previewBg: 'linear-gradient(135deg,#11151a,#303846)' },
  { id: 'ivoire-atelier', name: 'Ivoire Atelier', description: 'Fond clair pierre et navigation chocolat.', siteBackgroundColor: '#e9e2d6', navBackgroundColor: '#2a2621', previewBg: 'linear-gradient(135deg,#e9e2d6,#2a2621)' },
];

export const buttonModelPresets: ButtonModelPreset[] = [
  {
    id: 'gold-laiton',
    name: 'Or Fumé & Laiton Brossé',
    badge: 'Signature',
    description: 'Dégradé d’or et de laiton chaleureux, texturé et éclatant façon atelier d’orfèvre.',
    primaryClass: 'bg-gradient-to-r from-[#9c7844] via-[#c6a877] to-[#e4cb9c] text-[#121613] font-bold shadow-lg shadow-[#b89f74]/20 hover:brightness-110 active:scale-[0.98] border border-[#f0dfbe]/40',
    secondaryClass: 'bg-[#222b24] text-[#e2d5c3] border border-[#c6a877]/60 hover:border-[#e4cb9c] hover:bg-[#2c372e] hover:text-[#f3ece0]',
    outlineClass: 'border border-[#c6a877] text-[#e4cb9c] hover:bg-[#c6a877]/10 hover:text-white',
    previewBg: 'linear-gradient(135deg, #9c7844, #c6a877, #e4cb9c)',
  },
  {
    id: 'cuir-naturel',
    name: 'Cuir Pyrénéen & Cognac',
    badge: 'Champêtre',
    description: 'Chaleur du cuir pleine fleur patiné, surpiqûre subtile et tonalités terreuses de montagne.',
    primaryClass: 'bg-gradient-to-r from-[#7a482b] via-[#995c37] to-[#ba7447] text-[#fbf7f0] font-bold shadow-lg shadow-[#7a482b]/30 hover:brightness-110 active:scale-[0.98] border border-[#df9b6f]/40',
    secondaryClass: 'bg-[#231b17] text-[#edd9cb] border border-[#995c37]/70 hover:border-[#df9b6f] hover:bg-[#322620]',
    outlineClass: 'border border-[#995c37] text-[#df9b6f] hover:bg-[#995c37]/15 hover:text-white',
    previewBg: 'linear-gradient(135deg, #7a482b, #995c37, #ba7447)',
  },
  {
    id: 'sapin-cimes',
    name: 'Vert Sapin & Émeraude Sombre',
    badge: 'Haute Forêt',
    description: 'Vert noble inspiré des épaisses forêts de conifères des Pyrénées avec reflets dorés.',
    primaryClass: 'bg-gradient-to-r from-[#243f2e] via-[#355c43] to-[#4c7d5c] text-[#f2f8f3] font-bold shadow-lg shadow-[#1e3325]/40 hover:brightness-110 active:scale-[0.98] border border-[#79ab8b]/40',
    secondaryClass: 'bg-[#18261e] text-[#d6e5db] border border-[#3e634b]/80 hover:border-[#79ab8b] hover:bg-[#203328]',
    outlineClass: 'border border-[#4c7d5c] text-[#9acbb0] hover:bg-[#355c43]/20 hover:text-white',
    previewBg: 'linear-gradient(135deg, #243f2e, #355c43, #4c7d5c)',
  },
  {
    id: 'minimal-couture',
    name: 'Haute Couture Minimaliste',
    badge: 'Couturier',
    description: 'Élégance stricte, fond graphite sombre satiné avec liseré or et typographie espacée.',
    primaryClass: 'bg-[#191d1a] text-[#f5eedf] font-semibold border border-[#d4af37]/80 hover:bg-[#242b26] hover:border-[#f3ece0] shadow-md active:scale-[0.98] tracking-widest',
    secondaryClass: 'bg-transparent text-[#e2d5c3] border border-[#526355] hover:border-[#d4af37] hover:text-[#f5eedf] hover:bg-[#1a211c]',
    outlineClass: 'border border-[#3d4c3f] text-[#c0cdb5] hover:border-[#d4af37] hover:text-[#d4af37]',
    previewBg: '#191d1a',
  },
  {
    id: 'pill-terroir',
    name: 'Bouton Galet des Gaves',
    badge: 'Galet Minéral',
    description: 'Forme douce et feutrée rappelant les galets polis par les torrents pyrénéens.',
    primaryClass: 'bg-gradient-to-r from-[#59665c] via-[#758479] to-[#92a196] text-[#121613] font-bold shadow-md hover:brightness-105 active:scale-[0.98] border border-[#bcc8c0]/50',
    secondaryClass: 'bg-[#212923] text-[#dce4de] border border-[#566459] hover:bg-[#2a352d] hover:border-[#8e9f93]',
    outlineClass: 'border border-[#758479] text-[#bcc8c0] hover:bg-[#758479]/15 hover:text-white',
    previewBg: 'linear-gradient(135deg, #59665c, #758479, #92a196)',
  },
  {
    id: 'brut-montagne',
    name: 'Ardoise & Métal Brut',
    badge: 'Minéral Brut',
    description: 'Nuance ardoise profonde des toitures traditionnelles avec angles ciselés et robustesse.',
    primaryClass: 'bg-gradient-to-r from-[#292e33] via-[#3c444d] to-[#515c67] text-[#f0f4f8] font-bold shadow-lg shadow-black/40 hover:brightness-110 active:scale-[0.98] border border-[#8594a4]/40',
    secondaryClass: 'bg-[#181c20] text-[#cfd9e3] border border-[#3c4754] hover:border-[#8594a4] hover:bg-[#232930]',
    outlineClass: 'border border-[#515c67] text-[#a9b9cb] hover:bg-[#3c444d]/25 hover:text-white',
    previewBg: 'linear-gradient(135deg, #292e33, #3c444d, #515c67)',
  },
];

export const cardModelPresets: CardModelPreset[] = [
  {
    id: 'atelier-relief',
    name: 'Relief Atelier & Liseré Doré',
    badge: 'Par défaut',
    description: 'Fond sombre texturé avec liseré or laiton et halo d’élévation subtil.',
    cardClass: 'bg-[#1e2520]/85 backdrop-blur-md border border-[#3d4c40] hover:border-[#d4af37] shadow-xl hover:shadow-2xl hover:shadow-[#d4af37]/10 transition-all duration-300',
    innerClass: 'bg-[#171d18]/60',
    borderClass: 'border-[#3d4c40]',
  },
  {
    id: 'epure-noir',
    name: 'Ébène Épuré Minimal',
    badge: 'Graphite',
    description: 'Surfaces épurées, contraste franc et finitions linéaires ultra-nettes.',
    cardClass: 'bg-[#141715] border border-[#2b332d] hover:border-[#4d5c50] shadow-md transition-all duration-300',
    innerClass: 'bg-[#0f1210]',
    borderClass: 'border-[#2b332d]',
  },
  {
    id: 'cadre-champetre',
    name: 'Cadre Champêtre Bois Sombre',
    badge: 'Chaleureux',
    description: 'Atmosphère de chalet de montagne avec teintes chaudes et encadrement sculpté.',
    cardClass: 'bg-[#221c18]/90 border-2 border-[#5c4231] hover:border-[#ba7447] shadow-2xl hover:shadow-[#ba7447]/15 transition-all duration-300',
    innerClass: 'bg-[#181310]',
    borderClass: 'border-[#5c4231]',
  },
  {
    id: 'verre-altitude',
    name: 'Givre & Verre d’Altitude',
    badge: 'Dépoli Givré',
    description: 'Effet verre dépoli d’altitude avec réfraction lumineuse et transparence subtile.',
    cardClass: 'bg-[#1e2722]/60 backdrop-blur-xl border border-[#526a57]/50 hover:border-[#86aa8e] shadow-2xl transition-all duration-300',
    innerClass: 'bg-black/20',
    borderClass: 'border-[#526a57]/40',
  },
];

export const radiusPresets: RadiusPreset[] = [
  { id: 'rounded-full', name: 'Galet / Pillule', cssClass: 'rounded-full', radiusLabel: 'Arrondi total' },
  { id: 'rounded-2xl', name: 'Biseauté Doux (16px)', cssClass: 'rounded-2xl', radiusLabel: '16px' },
  { id: 'rounded-xl', name: 'Contemporain (12px)', cssClass: 'rounded-xl', radiusLabel: '12px' },
  { id: 'rounded-md', name: 'Classique Tailleur (6px)', cssClass: 'rounded-md', radiusLabel: '6px' },
  { id: 'rounded-none', name: 'Angles Droits Architecturaux', cssClass: 'rounded-none', radiusLabel: '0px' },
];

export interface ButtonSizePreset {
  id: ButtonSizeId;
  name: string;
  description: string;
  cssClass: string;
  defaultTextClass: string;
}

export interface ButtonTextSizePreset {
  id: ButtonTextSizeId;
  name: string;
  cssClass: string;
}

export const buttonSizePresets: ButtonSizePreset[] = [
  { id: 'compact', name: 'Compact', description: 'Plus fin et discret', cssClass: '!px-4 !py-2', defaultTextClass: '!text-[11px]' },
  { id: 'standard', name: 'Standard', description: 'Équilibre actuel', cssClass: '!px-5 !py-2.5', defaultTextClass: '!text-xs' },
  { id: 'large', name: 'Grand', description: 'Plus présent', cssClass: '!px-6 !py-3', defaultTextClass: '!text-sm' },
  { id: 'xl', name: 'XL', description: 'Très visible / premium', cssClass: '!px-8 !py-4', defaultTextClass: '!text-sm' },
];

export const buttonTextSizePresets: ButtonTextSizePreset[] = [
  { id: 'small', name: 'Petit', cssClass: '!text-[11px]' },
  { id: 'standard', name: 'Standard', cssClass: '!text-xs' },
  { id: 'large', name: 'Grand', cssClass: '!text-sm' },
  { id: 'xl', name: 'XL', cssClass: '!text-base' },
  { id: 'xxl', name: 'XXL', cssClass: '!text-lg' },
];

export const sectionMeta: { [key in SectionId]: { name: string; icon: string; desc: string } } = {
  hero: { name: 'Accueil & Duo de Présentation', icon: '🏔️', desc: 'Bannière principale, slogan, photo de fond et cartes des 2 vestes' },
  collection: { name: 'Showcase Interactif (Les 2 Vestes)', icon: '🧥', desc: 'Sélecteur, photos haute résolution, nuancier de couleurs et points d’intérêt' },
  comparatif: { name: 'Tableau Comparatif des Modèles', icon: '⚖️', desc: 'Matrice comparative détaillée des matières, poids et usages' },
  origines: { name: 'Histoire & Terroir Pyrénéen', icon: '🌲', desc: 'Récit de création, engagement de la Maison et manifeste artisanal' },
  lookbook: { name: 'Lookbook Éditorial & Macro Matières', icon: '📷', desc: 'Galerie d’inspiration, gros plans sur le tissage et silhouettes' },
  contact: { name: 'Atelier & Contact', icon: '✉️', desc: 'Coordonnées, formulaire d’information et newsletter' },
};

// Style Resolver Functions
export function getButtonClasses(
  theme?: ThemeConfig,
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  buttonId?: ButtonTargetId,
): string {
  const currentTheme = theme || defaultThemeConfig;
  const override = buttonId ? currentTheme.buttonOverrides?.[buttonId] : undefined;
  const styleId = override?.buttonStyle || currentTheme.buttonStyle;
  const radius = override?.buttonRadius || currentTheme.buttonRadius || 'rounded-full';
  const sizeId = override?.buttonSize || currentTheme.buttonSize || 'standard';

  const stylePreset = buttonModelPresets.find((b) => b.id === styleId) || buttonModelPresets[0];
  const sizePreset =
    buttonSizePresets.find((s) => s.id === sizeId) ||
    buttonSizePresets.find((s) => s.id === 'standard')!;
  const textSizeId = override?.buttonTextSize;
  const textSizePreset = textSizeId
    ? buttonTextSizePresets.find((s) => s.id === textSizeId)
    : undefined;

  let base = `${radius} ${sizePreset.cssClass} ${textSizePreset?.cssClass || sizePreset.defaultTextClass} transition-all duration-200 cursor-pointer `;
  const imageUrl = override?.backgroundImageUrl || currentTheme.buttonBackgroundImageUrl;
  if (imageUrl) {
    base += 'bg-cover bg-center bg-no-repeat ';
  }

  if (variant === 'primary') return `${base} ${stylePreset.primaryClass}`;
  if (variant === 'secondary') return `${base} ${stylePreset.secondaryClass}`;
  return `${base} ${stylePreset.outlineClass}`;
}

export function getButtonInlineStyle(
  theme?: ThemeConfig,
  buttonId?: ButtonTargetId,
): React.CSSProperties {
  const currentTheme = theme || defaultThemeConfig;
  const override = buttonId ? currentTheme.buttonOverrides?.[buttonId] : undefined;
  const imageUrl = override?.backgroundImageUrl || currentTheme.buttonBackgroundImageUrl;
  const textStyle = override?.buttonTextColor ? { color: override.buttonTextColor } : {};
  if (!imageUrl) return textStyle;

  const overlay = Math.max(
    0,
    Math.min(100, override?.backgroundOverlay ?? currentTheme.buttonBackgroundOverlay ?? 28),
  ) / 100;

  return {
    ...(override?.buttonTextColor ? { color: override.buttonTextColor } : {}),
    backgroundImage: `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url(${JSON.stringify(imageUrl)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

export function getCardClasses(theme?: ThemeConfig): { card: string; inner: string; border: string } {
  const currentTheme = theme || defaultThemeConfig;
  const preset = cardModelPresets.find((c) => c.id === currentTheme.cardStyle) || cardModelPresets[0];
  return {
    card: preset.cardClass,
    inner: preset.innerClass,
    border: preset.borderClass,
  };
}

export function getTextAlignClass(theme?: ThemeConfig): string {
  const align = theme?.textAlign || 'center';
  switch (align) {
    case 'left':
      return 'text-left';
    case 'right':
      return 'text-right';
    default:
      return 'text-center';
  }
}

export function getButtonAlignClass(theme?: ThemeConfig): string {
  const align = theme?.buttonAlign || 'center';
  switch (align) {
    case 'left':
      return 'justify-start';
    case 'right':
      return 'justify-end';
    case 'stretch':
      return 'justify-stretch';
    default:
      return 'justify-center';
  }
}

export function getContentPaddingClass(theme?: ThemeConfig): string {
  const pad = theme?.contentPadding || 'comfortable';
  switch (pad) {
    case 'compact':
      return 'py-12 md:py-16';
    case 'spacious':
      return 'py-28 md:py-36';
    default:
      return 'py-20 md:py-24';
  }
}

export function getContainerWidthClass(theme?: ThemeConfig): string {
  const width = theme?.containerWidth || 'standard';
  switch (width) {
    case 'narrow':
      return 'max-w-5xl mx-auto';
    case 'wide':
      return 'max-w-[1400px] mx-auto';
    default:
      return 'max-w-7xl mx-auto';
  }
}
