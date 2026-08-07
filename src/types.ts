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
}
