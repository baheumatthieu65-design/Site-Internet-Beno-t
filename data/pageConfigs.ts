export type PageId = "vitrine" | "gite";

export type PageModule = {
  id: string;
  label: string;
  visible: boolean;
};

export type PageNavigationItem = {
  id: string;
  label: string;
  targetModuleId?: string;
  visible: boolean;
  kind?: "module" | "home";
};

export type PageConfig = {
  id: PageId;
  title: string;
  modules: PageModule[];
  navigation: PageNavigationItem[];
};

export const pageConfigs: Record<PageId, PageConfig> = {
  vitrine: {
    id: "vitrine",
    title: "Site vitrine",
    modules: [],
    navigation: [],
  },
  gite: {
    id: "gite",
    title: "Gîte",
    modules: [
      { id: "gite-hero", label: "Accueil", visible: true },
      { id: "gite-experience", label: "Le gîte", visible: true },
      { id: "gite-gallery", label: "Galerie", visible: true },
      { id: "gite-video", label: "Vidéo", visible: true },
      { id: "gite-essentials", label: "Équipements", visible: true },
      { id: "gite-nearby", label: "La région", visible: true },
      { id: "gite-stay", label: "Séjourner", visible: true },
      { id: "gite-access", label: "Accès", visible: true },
    ],
    navigation: [
      { id: "gite-nav-experience", label: "Le gîte", targetModuleId: "gite-experience", visible: true },
      { id: "gite-nav-gallery", label: "Galerie", targetModuleId: "gite-gallery", visible: true },
      { id: "gite-nav-video", label: "Vidéo", targetModuleId: "gite-video", visible: true },
      { id: "gite-nav-nearby", label: "La région", targetModuleId: "gite-nearby", visible: true },
      { id: "gite-nav-stay", label: "Séjourner", targetModuleId: "gite-stay", visible: true },
      { id: "gite-nav-home", label: "Site vitrine", visible: true, kind: "home" },
    ],
  },
};

export function getVisiblePageNavigation(page: PageConfig) {
  const visibleIds = new Set(page.modules.filter(m => m.visible).map(m => m.id));
  return page.navigation.filter(item =>
    item.visible &&
    (item.kind === "home" || !item.targetModuleId || visibleIds.has(item.targetModuleId))
  );
}
