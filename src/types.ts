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

export interface ComparisonCriterion {
  id: string;
  label: string;
  key: string;
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
  customSpecs?: Record<string, string>;
  hotspots: Hotspot[];
}

export type TextAlignId = 'left' | 'center' | 'right';
export type ButtonAlignId = 'left' | 'center' | 'right' | 'stretch';
export type BadgePositionId = 'top' | 'below-title' | 'hidden';
export type CardMediaPositionId = 'left' | 'top' | 'right';
export type ContentPaddingId = 'compact' | 'comfortable' | 'spacious';
export type ContainerWidthId = 'standard' | 'wide' | 'narrow';
export type ProductBlockId = 'title-price' | 'description' | 'colors' | 'sizes' | 'specs' | 'cta';
export type FormFieldId = 'name' | 'email' | 'phone' | 'jacket' | 'color' | 'size' | 'requestType' | 'message';

export interface ThemeConfig {
  buttonStyle: ButtonStyleId;
  buttonRadius: ButtonRadiusId;
  cardStyle: CardStyleId;
  heroLayout: HeroLayoutId;
  showcaseLayout: ShowcaseLayoutId;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  accentColorHex?: string;
  // Positioning & Alignment
  textAlign?: TextAlignId;
  buttonAlign?: ButtonAlignId;
  heroBadgePosition?: BadgePositionId;
  cardMediaPosition?: CardMediaPositionId;
  contentPadding?: ContentPaddingId;
  containerWidth?: ContainerWidthId;
  productBlocksOrder?: ProductBlockId[];
  formFieldsOrder?: FormFieldId[];
  // Custom button & tab labels
  orderButtonText: string;
  discoverButtonText: string;
  inquiryButtonText: string;
  workshopButtonText: string;
  heroBadgeText: string;
  heroTitlePrefix: string;
  // Custom Section & Tab Navigation Labels
  collectionTabLabel?: string;
  comparatifTabLabel?: string;
  originesTabLabel?: string;
  lookbookTabLabel?: string;
  contactTabLabel?: string;
  // Custom Comparison Table Criteria
  comparisonCriteria?: ComparisonCriterion[];
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
  ordersEmail: string; // Destination email for customer reservations and orders
  instagram: string;
  jackets: JacketModel[];
  theme?: ThemeConfig;
}
