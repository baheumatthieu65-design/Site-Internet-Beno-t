import type { GiteSiteConfig } from "../types";

/**
 * Gîte intentionally starts as a blank canvas. Content is created from the
 * freeform editor; only navigation/module structure is provided by default.
 */
export const defaultGiteConfig: GiteSiteConfig = {
  name: "Le Gîte",
  location: "Pyrénées",
  tagline: "",
  heroImage: "",
  intro: { title: "", text: "" },
  gallery: [],
  videoUrl: "",
  videoPoster: "",
  essentials: [],
  bookingText: "",
  airbnbUrl: "",
  bookingUrl: "",
  nearby: [],
  access: { title: "", text: "" },
  modules: [
    { id: "gite-accueil", label: "Accueil", visible: true, width: 100, height: 520 },
    { id: "gite-le-gite", label: "Le gîte", visible: true, width: 100, height: 520 },
    { id: "gite-region", label: "La région", visible: true, width: 100, height: 520 },
    { id: "gite-sejourner", label: "Séjourner", visible: true, width: 100, height: 520 },
    { id: "gite-acces", label: "Accès", visible: true, width: 100, height: 520 },
  ],
  navLabels: {
    "gite-accueil": "Accueil",
    "gite-le-gite": "Le gîte",
    "gite-region": "La région",
    "gite-sejourner": "Séjourner",
    "gite-acces": "Accès",
  },
  navOrder: ["gite-accueil", "gite-le-gite", "gite-region", "gite-sejourner", "gite-acces"],
  navCta: { label: "Réserver", link: "", visible: false },
  navAdminLabel: "⌂",
  contentBlocks: [],
};

export const giteConfig = defaultGiteConfig;
