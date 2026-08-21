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


export type ButtonSizeId =
  | 'compact'
  | 'standard'
  | 'large'
  | 'xl';

export type ButtonTextSizeId =
  | 'small'
  | 'standard'
  | 'large'
  | 'xl'
  | 'xxl';

export type ButtonTargetId =
  | 'navbar-order'
  | 'hero-order'
  | 'hero-discover'
  | 'showcase-order'
  | 'lookbook-order'
  | 'comparison-order'
  | 'footer-workshop';

export interface ButtonOverride {
  buttonStyle?: ButtonStyleId;
  buttonRadius?: ButtonRadiusId;
  buttonSize?: ButtonSizeId;
  buttonTextSize?: ButtonTextSizeId;
  buttonTextColor?: string;
  backgroundImageUrl?: string;
  backgroundOverlay?: number;
}

export type SiteThemePresetId =
  | 'pyrenees-noir'
  | 'foret-profonde'
  | 'ardoise-luxe'
  | 'ivoire-atelier';

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

export type NavigationId =
  | 'collection'
  | 'comparatif'
  | 'origines'
  | 'lookbook'
  | 'contact';

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

export type MediaType = 'image' | 'gif' | 'video';

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

export type JacketAvailabilityStatus = 'on-sale' | 'sold-out' | 'coming-soon';

export interface JacketModel {
  id: string;
  name: string;
  subTitle: string;
  category: string;

  /** Ligne éditoriale affichée au-dessus du nom dans le Showcase. */
  showcaseEyebrow?: string;

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

  /** Statut commercial affiché sur les visuels. Legacy isAvailable reste supporté. */
  availabilityStatus?: JacketAvailabilityStatus;
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

  buttonSize?: ButtonSizeId;
  buttonBackgroundImageUrl?: string;
  buttonBackgroundOverlay?: number;
  buttonOverrides?: Partial<Record<ButtonTargetId, ButtonOverride>>;

  cardStyle: CardStyleId;

  heroLayout: HeroLayoutId;

  showcaseLayout: ShowcaseLayoutId;

  sectionOrder: SectionId[];

  hiddenSections: SectionId[];

  /** Ordre des onglets de navigation publique. Les IDs restent stables. */
  navOrder?: NavigationId[];

  accentColorHex?: string;
  siteThemePreset?: SiteThemePresetId;
  siteBackgroundColor?: string;
  navBackgroundColor?: string;
  navBackgroundOpacity?: number;

  /* Positionnement & alignement */

  textAlign?: TextAlignId;

  buttonAlign?: ButtonAlignId;

  heroBadgePosition?: BadgePositionId;

  cardMediaPosition?: CardMediaPositionId;

  contentPadding?: ContentPaddingId;

  containerWidth?: ContainerWidthId;

  /* Échelle visuelle des médias principaux. Les valeurs sont des pourcentages. */
  /** Taille du cadre visuel du Showcase. L'image elle-même remplit ce cadre. */
  showcaseImageScale?: number;
  showcaseImageFrameWidth?: number;
  showcaseImageFrameHeight?: number;
  /** Taille du cadre visuel de la Galerie/Lookbook. */
  lookbookImageScale?: number;
  lookbookImageFrameWidth?: number;
  lookbookImageFrameHeight?: number;
  /** Images de fond choisies par module principal. */
  sectionBackgroundImages?: Partial<Record<SectionId, string>>;
  sectionBackgroundMedia?: Partial<Record<SectionId, BackgroundMedia>>;
  /** Largeur d'affichage de chaque module principal, en pourcentage. */
  sectionWidthPercent?: Partial<Record<SectionId, number>>;
  /** Opacité des images de fond de chaque module principal, en pourcentage. */
  sectionBackgroundOpacity?: Partial<Record<SectionId, number>>;
  /** Articles sélectionnés pour le Lookbook. Vide/absent = tous les articles. */
  lookbookProductIds?: string[];

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


export type GiteContentBlockType = 'text' | 'heading' | 'image' | 'video' | 'button';

export interface GiteContentBlock {
  id: string;
  moduleId: string;
  type: GiteContentBlockType;
  x: number;
  y: number;
  width: number;
  height?: number;
  text?: string;
  url?: string;
  link?: string;
  alt?: string;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  italic?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  opacity?: number;
  rotation?: number;
  objectFit?: 'cover' | 'contain';
  autoSize?: boolean;
  buttonImageUrl?: string;
  buttonImageEnabled?: boolean;
  visible: boolean;
}

export interface GiteModuleConfig {
  id: string;
  label: string;
  visible: boolean;
  background?: BackgroundMedia;
}

export interface GiteSiteConfig {
  name: string;
  location: string;
  tagline: string;
  heroImage: string;
  intro: { title: string; text: string };
  gallery: { src: string; alt: string }[];
  videoUrl?: string;
  videoPoster?: string;
  essentials: { value: string; label: string }[];
  bookingText: string;
  airbnbUrl: string;
  bookingUrl: string;
  nearby: { title: string; text: string }[];
  access: { title: string; text: string };
  modules: GiteModuleConfig[];
  navLabels?: Record<string, string>;
  /** Zones libres déplaçables de la page Gîte. */
  contentBlocks?: GiteContentBlock[];
}

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

  /** Configuration indépendante de la page Gîte. */
  gite?: GiteSiteConfig;
}
