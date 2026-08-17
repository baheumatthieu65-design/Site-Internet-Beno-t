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

/* =========================================================
   ÉDITEUR VISUEL
   ========================================================= */

export type MediaType = 'image' | 'gif' | 'video';

export type AdminBarPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';

export interface BackgroundMedia {
  type: MediaType;
  url: string;
  poster?: string;
  overlay?: number;
  positionX?: number;
  positionY?: number;
  objectFit?: 'cover' | 'contain';
}

export interface EditableSiteBlock {
  id: string;

  type:
    | 'text'
    | 'heading'
    | 'button'
    | 'image'
    | 'video'
    | 'spacer';

  section: SectionId;

  x: number;
  y: number;

  text?: string;
  url?: string;
  mediaUrl?: string;

  visible: boolean;
}

export interface AdminBarConfig {
  position: AdminBarPosition;
  collapsed: boolean;
}

/* =========================================================
   HOTSPOTS
   ========================================================= */

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  category: 'fabric' | 'hardware' | 'cut' | 'utility';
}

/* =========================================================
   COMPARATIF
   ========================================================= */

export interface ComparisonCriterion {
  id: string;
  label: string;
  key: string;
}

/* =========================================================
   PRODUITS
   ========================================================= */

export interface JacketColor {
  name: string;
  hex: string;
  image?: string;
}

export interface JacketFeature {
  iconName: string;
  title: string;
  desc: string;
}

export interface JacketSpecs {
  weight: string;
  waterResistance: string;
  warmthRating: string;
  fitType: string;
  origin: string;
  care: string;
}

export interface JacketModel {
  id: string;
  name: string;
  subTitle: string;
  category: string;

  /**
   * Prix officiel du produit.
   * Le serveur doit toujours utiliser cette valeur depuis Redis
   * lors de la création d'une commande.
   */
  price: number;

  currency: string;

  heroImage: string;
  gallery: string[];

  description: string;
  longDescription: string;
  tagline: string;

  fabrics: string[];

  colors: JacketColor[];

  sizes: string[];

  features: JacketFeature[];

  specs: JacketSpecs;

  customSpecs?: Record<string, string>;

  hotspots: Hotspot[];

  /**
   * true  = produit visible et commandable
   * false = produit masqué / indisponible
   * absent = considéré comme disponible pour compatibilité
   */
  isAvailable?: boolean;
}

/* =========================================================
   ALIGNEMENTS / MISE EN PAGE
   ========================================================= */

export type TextAlignId =
  | 'left'
  | 'center'
  | 'right';

export type ButtonAlignId =
  | 'left'
  | 'center'
  | 'right'
  | 'stretch';

export type BadgePositionId =
  | 'top'
  | 'below-title'
  | 'hidden';

export type CardMediaPositionId =
  | 'left'
  | 'top'
  | 'right';

export type ContentPaddingId =
  | 'compact'
  | 'comfortable'
  | 'spacious';

export type ContainerWidthId =
  | 'standard'
  | 'wide'
  | 'narrow';

/* =========================================================
   ORDRE DES BLOCS PRODUIT
   ========================================================= */

export type ProductBlockId =
  | 'title-price'
  | 'description'
  | 'colors'
  | 'sizes'
  | 'specs'
  | 'cta';

/* =========================================================
   FORMULAIRE
   ========================================================= */

export type FormFieldId =
  | 'name'
  | 'email'
  | 'phone'
  | 'jacket'
  | 'color'
  | 'size'
  | 'requestType'
  | 'message';

/* =========================================================
   THÈME
   ========================================================= */

export interface ThemeConfig {
  buttonStyle: ButtonStyleId;

  buttonRadius: ButtonRadiusId;

  cardStyle: CardStyleId;

  heroLayout: HeroLayoutId;

  showcaseLayout: ShowcaseLayoutId;

  sectionOrder: SectionId[];

  hiddenSections: SectionId[];

  accentColorHex?: string;

  /* Positionnement & alignement */

  textAlign?: TextAlignId;

  buttonAlign?: ButtonAlignId;

  heroBadgePosition?: BadgePositionId;

  cardMediaPosition?: CardMediaPositionId;

  contentPadding?: ContentPaddingId;

  containerWidth?: ContainerWidthId;

  /* Ordre des blocs */

  productBlocksOrder?: ProductBlockId[];

  formFieldsOrder?: FormFieldId[];

  /* Libellés personnalisables */

  orderButtonText: string;

  discoverButtonText: string;

  inquiryButtonText: string;

  workshopButtonText: string;

  heroBadgeText: string;

  heroTitlePrefix: string;

  /* Navigation */

  collectionTabLabel?: string;

  comparatifTabLabel?: string;

  originesTabLabel?: string;

  lookbookTabLabel?: string;

  contactTabLabel?: string;

  /* Tableau comparatif */

  comparisonCriteria?: ComparisonCriterion[];
}

/* =========================================================
   CONFIGURATION DE LA MARQUE / DU SITE
   ========================================================= */

export interface BrandConfig {
  brandName: string;

  tagline: string;

  subtitle: string;

  logoUrl: string;

  accentColor: string;

  foundingYear: string;

  designerLocation: string;

  /* Fond historique du site */

  heroBgImage: string;

  /* Nouveau fond éditable : image / GIF / vidéo */

  heroBackground?: BackgroundMedia;

  /* Position de la barre administrateur */

  adminBar?: AdminBarConfig;

  /* Blocs ajoutés par l'éditeur visuel */

  editableBlocks?: EditableSiteBlock[];

  /* =======================================================
     HISTOIRE / PRÉSENTATION
     ======================================================= */

  storyTitle: string;

  storyText1: string;

  storyText2: string;

  manifesto: string[];

  /* =======================================================
     CONTACT
     ======================================================= */

  contactEmail: string;

  ordersEmail: string;

  instagram: string;

  /* =======================================================
     CATALOGUE
     ======================================================= */

  /**
   * Catalogue actuellement chargé dans l'application.
   *
   * En production, cette liste est synchronisée avec
   * GET /api/products puis avec Upstash Redis.
   */
  jackets: JacketModel[];

  /* =======================================================
     THÈME
     ======================================================= */

  theme?: ThemeConfig;
}
