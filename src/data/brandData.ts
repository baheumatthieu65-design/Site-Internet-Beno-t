import { BrandConfig } from '../types.js';
import { defaultThemeConfig } from '../utils/themeStyles.js';
import { defaultGiteConfig } from './giteConfig.js';

import pyreneesHeroImg from '../assets/images/pyrenees_landscape_hero_1785338591988.jpg';
import pyreneesJacket1Img from '../assets/images/pyrenees_jacket_1_1785338603269.jpg';
import pyreneesJacket2Img from '../assets/images/pyrenees_jacket_2_1785338614694.jpg';
import pyreneesLogoImg from '../assets/images/pyrenees_brand_logo_1785338626936.jpg';

import jacket1SummitImg from '../assets/images/jacket_1_summit_1785338933118.jpg';
import jacket2PastureImg from '../assets/images/jacket_2_pasture_1785338949621.jpg';
import woolMacroImg from '../assets/images/wool_detail_macro_1785338963967.jpg';
import waxedMacroImg from '../assets/images/waxed_detail_macro_1785338977808.jpg';

export const initialBrandData: BrandConfig = {
  brandName: 'MAISON DES PYRÉNÉES',
  tagline: 'Élégance Champêtre & Artisanat des Cimes',
  subtitle: 'Conçues au cœur de la chaîne pyrénéenne, deux vestes d’exception mariant matières nobles et coupe haute couture.',
  logoUrl: pyreneesLogoImg,
  accentColor: '#4A5D4E', // Alpine Evergreen / Sage Warm Green
  foundingYear: '2025',
  designerLocation: 'Vallée de Lourdios & Pic du Midi',
  heroBgImage: pyreneesHeroImg,
  storyTitle: 'Aux origines de la Maison',
  storyText1: 'Pensée entre pâturages verdoyants et sommets acérés, notre maison fait le pari d’un luxe brut et authentique. Chaque veste est façonnée pour affronter les brumes pyrénéennes tout en offrant une silhouette d’une distinction rare.',
  storyText2: 'Nous avons sélectionné des laines de bergers pyrénéens et des toiles techniques imperméables d’exception pour façonner ces deux pièces signatures : La Veste des Cimes et Le Manteau Pastorale.',
  manifesto: [
    'Artisanat pyrénéen & matières naturelles nobles',
    'Conception durable, coupes millimétrées & résistance aux éléments',
    'Chic champêtre & raffinement intemporel'
  ],
  contactEmail: 'contact@maisondespyrenees.fr',
  ordersEmail: 'contact@maisondespyrenees.fr',
  instagram: '@maison.des.pyrenees',
  gite: JSON.parse(JSON.stringify(defaultGiteConfig)),
  jackets: [
    {
      id: 'veste-des-cimes',
      name: 'La Veste des Cimes',
      subTitle: 'Modèle N°1 — Draps de Laine des Pyrénées & Coupe Structurée',
      category: 'Haute Montagne & Élégance',
      price: 680,
      currency: '€',
      heroImage: pyreneesJacket1Img,
      gallery: [
        pyreneesJacket1Img,
        jacket1SummitImg,
        woolMacroImg,
        pyreneesHeroImg
      ],
      description: 'Une veste à la stature majestueuse, tissée en drap de laine anthracite ultra-dense, conçue pour braver le vent des vallées tout en conservant une ligne affûtée.',
      longDescription: 'La Veste des Cimes incarne l’équilibre parfait entre la rigueur de la montagne et la finesse des tailleurs. Ses poches plaquées discrètes et sa doublure thermique en sergé fluide apportent aisance et protection contre le froid d’altitude.',
      tagline: 'Raffinement minéral & confort absolu',
      fabrics: ['100% Pure Laine Vierge des Pyrénées', 'Doublure Soie & Viscose', 'Boutons en Corne Véritable'],
      colors: [
        { name: 'Gris Anthracite Cime', hex: '#2C3035', image: pyreneesJacket1Img },
        { name: 'Vert Ardoise Pyrénéenne', hex: '#3B4840' },
        { name: 'Brun Mousse', hex: '#4A3E31' }
      ],
      sizes: ['S', 'M', 'L', 'XL', 'Sur Mesure'],
      features: [
        { iconName: 'Shield', title: 'Coupe-Vent Naturel', desc: 'Drap de laine feutré à haute densité isolante.' },
        { iconName: 'Feather', title: 'Douceur & Chaleur', desc: 'Toucher velouté sans irritation avec doublure respirante.' },
        { iconName: 'Gem', title: 'Finition Tailleur', desc: 'Coutures gansées et finitions faites main en atelier.' }
      ],
      specs: {
        weight: '1 100 g',
        waterResistance: 'Déperlant Naturel (Laine feutrée)',
        warmthRating: 'Indice 4/5 (Froid de montagne & intersaison)',
        fitType: 'Ajusté élégant',
        origin: 'Atelier Pyrénées Françaises',
        care: 'Nettoyage à sec spécialisé'
      },
      hotspots: [
        {
          id: 'hs1-col',
          x: 48,
          y: 22,
          title: 'Col Officier à Revers',
          description: 'Protection thermique du cou rehaussée d’une bride en cuir pour fermer hermétiquement le col.',
          category: 'cut'
        },
        {
          id: 'hs1-boutons',
          x: 52,
          y: 45,
          title: 'Boutonnage en Corne Gravée',
          description: 'Chaque bouton est taillé dans la corne naturelle et gravé au laser avec le monogramme de la marque.',
          category: 'hardware'
        },
        {
          id: 'hs1-poche',
          x: 62,
          y: 65,
          title: 'Poches Soufflet d’Atelier',
          description: 'Grandes poches doublées en flanelle pour garder les mains au chaud lors des balades en altitude.',
          category: 'utility'
        }
      ]
    },
    {
      id: 'manteau-pastorale',
      name: 'Le Manteau Pastorale',
      subTitle: 'Modèle N°2 — Coton Waxé Champêtre & Doublure Tartan',
      category: 'Chic Champêtre & Tout Temps',
      price: 590,
      currency: '€',
      heroImage: pyreneesJacket2Img,
      gallery: [
        pyreneesJacket2Img,
        jacket2PastureImg,
        waxedMacroImg,
        pyreneesHeroImg
      ],
      description: 'L’esprit champêtre pyrénéen réinventé : une veste robuste en coton huilé olive champêtre, agrémentée de détails en cuir patiné et boutons pression en laiton vieilli.',
      longDescription: 'Inspirée des habits traditionnels des gardiens de troupeaux et des randonneurs des sommets, cette veste conjugue imperméabilité totale et silhouette d’une classe incontestable pour la ville comme pour la campagne.',
      tagline: 'L’authenticité du terroir & la patine du temps',
      fabrics: ['Coton Bio Huilé à la Cire d’Abeille', 'Col en Velours Côtelé Marron', 'Doublure Tartan Coton'],
      colors: [
        { name: 'Vert Olive Champêtre', hex: '#44513E', image: pyreneesJacket2Img },
        { name: 'Ocre Terre Brûlée', hex: '#7A4D2E' },
        { name: 'Noir Écorce', hex: '#222222' }
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      features: [
        { iconName: 'CloudRain', title: '100% Imperméable', desc: 'Cire végétale d’abeille hydrofuge appliquée artisanalement.' },
        { iconName: 'Compass', title: 'Poches Multi-Usage', desc: '3 poches intérieures zippées & poches repose-mains en microfleece.' },
        { iconName: 'Sparkles', title: 'Patine Unique', desc: 'Le tissu s’embellit au fil du temps et de vos escapades.' }
      ],
      specs: {
        weight: '1 250 g',
        waterResistance: '10 000 mm (Cire imperméabilisante)',
        warmthRating: 'Indice 3/5 (Polyvalente 4 Saisons)',
        fitType: 'Droit chic avec cordon de cintrage intérieur',
        origin: 'Atelier Pyrénées Françaises',
        care: 'Re-cirage annuel au baume naturel'
      },
      hotspots: [
        {
          id: 'hs2-col',
          x: 46,
          y: 20,
          title: 'Col Velours Doux',
          description: 'Toucher velours côtelé marron qui évite tout frottement et garde la chaleur du cou.',
          category: 'fabric'
        },
        {
          id: 'hs2-fermeture',
          x: 50,
          y: 42,
          title: 'Zip Double Curseur & Rabat Laiton',
          description: 'Double zip YKK pour ajuster l’ouverture en position assise ou à cheval.',
          category: 'hardware'
        },
        {
          id: 'hs2-cuir',
          x: 35,
          y: 58,
          title: 'Renforts Coudes en Cuir Cognac',
          description: 'Empiècements en cuir de veau pleine fleur pour une durabilité inégalée.',
          category: 'utility'
        }
      ]
    }
  ],
  theme: defaultThemeConfig
};
