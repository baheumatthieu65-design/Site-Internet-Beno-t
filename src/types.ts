export type ButtonStyleId =
  | 'gold-laiton'
  | 'cuir-naturel'
  | 'sapin-cimes'
  | 'minimal-couture'
  | 'pill-terroir'
  | 'brut-montagne';

export type ButtonRadiusId =
  | 'rounded-full'
  | 'rounded-2xl'
  | 'rounded-xl'
  | 'rounded-md'
  | 'rounded-none';

export type CardStyleId =
  | 'atelier-relief'
  | 'epure-noir'
  | 'cadre-champetre'
  | 'verre-altitude';

export type HeroLayoutId =
  | 'split-cards'
  | 'centered-minimal'
  | 'side-by-side';

export type ShowcaseLayoutId =
  | 'split-interactive'
  | 'magazine-editorial'
  | 'lookbook-focus';

export type SectionId =
  | 'hero'
  | 'collection'
  | 'comparatif'
  | 'origines'
  | 'lookbook'
  | 'contact';

export interface Hotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  description: string;
  category: 'fabric' | 'hardware' | 'cut' | 'utility';
}

export interface JacketModel {
  id: string;
  name: string;
  subTitle: string;
  category: string;
  price: number;
  currency: string;
  heroImage: string;
  gallery: string[];
  description: string;
  longDescription: string;
  tagline: string;
  fabrics: string[];
  colors: { name: string; hex: string; image?: string }[];
  sizes: string[];
  features: { iconName: string; title: string; desc: string }[];
  specs: {
    weight: string;
    waterResistance: string;
    warmthRating: string;
    fitType: string;
    origin: string;
    care: string;
  };
  hotspots: Hotspot[];
}

export interface ThemeConfig {
  buttonStyle: ButtonStyleId;
  buttonRadius: ButtonRadiusId;
  cardStyle: CardStyleId;
  heroLayout: HeroLayoutId;
  showcaseLayout: ShowcaseLayoutId;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  accentColorHex?: string;
  // Custom button labels
  orderButtonText: string;
  discoverButtonText: string;
  inquiryButtonText: string;
  workshopButtonText: string;
  heroBadgeText: string;
  heroTitlePrefix: string;
}

export interface BrandConfig {
  brandName: string;
  tagline: string;
  subtitle: string;
  logoUrl: string;
  accentColor: string;
  foundingYear: string;
  designerLocation: string;
  heroBgImage: string;
  storyTitle: string;
  storyText1: string;
  storyText2: string;
  manifesto: string[];
  contactEmail: string;
  instagram: string;
  jackets: [JacketModel, JacketModel];
  theme?: ThemeConfig;
}
