import React, { useMemo, useState } from "react";
import type { FloatingMediaItem } from "../data/floatingMedia";

type Props = {
  config: any;
  onChange: (next: any) => void;
};

type ModuleOption = {
  id: string;
  label: string;
  group: "boutique" | "gite";
};

const boutiqueModules: ModuleOption[] = [
  ["hero", "Boutique — Accueil", "boutique"],
  ["collection", "Boutique — Collection / Articles", "boutique"],
  ["comparatif", "Boutique — Tableau comparatif", "boutique"],
  ["origines", "Boutique — L’esprit Pyrénées", "boutique"],
  ["lookbook", "Boutique — Lookbook", "boutique"],
  ["contact", "Boutique — Contact & Atelier", "boutique"],
].map(([id, label, group]) => ({ id, label, group: group as ModuleOption["group"] }));

const giteModules: ModuleOption[] = [
  ["gite-hero", "Gîte — Accueil", "gite"],
  ["gite-presentation", "Gîte — Présentation", "gite"],
  ["gite-gallery", "Gîte — Galerie photos", "gite"],
  ["gite-video", "Gîte — Vidéo", "gite"],
  ["gite-amenities", "Gîte — Équipements", "gite"],
  ["gite-location", "Gîte — Localisation / Accès", "gite"],
  ["gite-surroundings", "Gîte — Aux alentours", "gite"],
  ["gite-booking", "Gîte — Séjourner / Airbnb / Booking", "gite"],
  ["gite-contact", "Gîte — Contact", "gite"],
].map(([id, label, group]) => ({ id, label, group: group as ModuleOption["group"] }));

const fallbackSections = [...boutiqueModules, ...giteModules];

const makeId = () => `floating-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("Lecture de l'image impossible"));
    reader.readAsDataURL(file);
  });

const newItem = (section: string): FloatingMediaItem => ({
  id: makeId(),
  section,
  url: "",
  alt: "",
  x: 88,
  y: 50,
  size: 160,
  rotate: 0,
  opacity: 100,
  animation: "float",
  mobile: true,
  visible: true,
});

export const FloatingMediaManager: React.FC<Props> = ({ config, onChange }) => {
  const items: FloatingMediaItem[] = config?.floatingImages ?? [];
  const [draftModule, setDraftModule] = useState<string | null>(null);

  const configuredBlocks = Array.isArray(config?.blocks) ? config.blocks : [];

  const dynamicModules = useMemo<ModuleOption[]>(() => {
    const extra: ModuleOption[] = configuredBlocks
      .map((b: any) => {
        const id = b.section ?? b.id ?? b.key;
        if (!id) return null;
        const label = b.label ?? b.title ?? id;
        if (fallbackSections.some(m => m.id === String(id))) return null;
        const isGite = String(id).toLowerCase().includes("gite");
        return {
          id: String(id),
          label: `${isGite ? "Gîte" : "Boutique"} — ${String(label)}`,
          group: isGite ? "gite" : "boutique",
        } as ModuleOption;
      })
      .filter(Boolean) as ModuleOption[];
    return [...fallbackSections, ...extra];
  }, [configuredBlocks]);

  const update = (id: string, patch: Partial<FloatingMediaItem>) =>
    onChange({
      ...config,
      floatingImages: items.map(i => (i.id === id ? { ...i, ...patch } : i)),
    });

  const addModule = (section: string) => {
    const item = newItem(section);
    onChange({ ...config, floatingImages: [...items, item] });
    setDraftModule(null);
  };

  const remove = (id: string) =>
    onChange({ ...config, floatingImages: items.filter(i => i.id !== id) });

  const installedCount = (id: string) => items.filter(i => i.section === id).length;

  const renderModuleList = (group: "boutique" | "gite") => {
    const modules = dynamicModules.filter(m => m.group === group);
    return (
      <div className="space-y-2">
        {modules.map(module => {
          const count = installedCount(module.id);
          const isDraft = draftModule === module.id;
          return (
            <div
              key={module.id}
              className={`rounded-lg border p-2.5 transition-all ${
                isDraft
                  ? "border-[#d4af37] bg-[#1d261f]"
                  : count
                    ? "border-[#56685b] bg-[#151b17]"
                    : "border-[#334138] bg-[#111612]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-[#e8e1d5]">{module.label}</div>
                  {count > 0 && (
                    <div className="mt-0.5 text-[10px] text-[#9eaaa0]">
                      {count} image{count > 1 ? "s" : ""} installée{count > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {isDraft ? (
                  <button
                    type="button"
                    onClick={() => setDraftModule(null)}
                    className="shrink-0 rounded-md border border-[#6b3939] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-300"
                  >
                    Annuler
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDraftModule(module.id)}
                    className="shrink-0 rounded-md border border-[#d4af37]/60 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/10"
                  >
                    Ajouter
                  </button>
                )}
              </div>

              {isDraft && (
                <div className="mt-2 rounded-md border border-dashed border-[#d4af37]/50 p-2 text-[10px] text-[#c4ceb8]">
                  Cliquez sur <strong>Installer</strong> pour créer l'image flottante dans ce module.
                  <button
                    type="button"
                    onClick={() => addModule(module.id)}
                    className="mt-2 w-full rounded-md bg-[#d4af37] px-2 py-1.5 font-semibold uppercase tracking-wider text-[#111612]"
                  >
                    Installer dans ce module
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4" data-floating-manager="true">
      <div className="rounded-xl border border-[#3b473e] bg-[#111612] p-3">
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
            Choisir le module
          </div>
          <div className="mt-1 text-[11px] text-[#87968a]">
            Ajoutez une image flottante sur le module voulu. Une fois installée, elle reste modifiable ou supprimable.
          </div>
        </div>

        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#aeb9b0]">
          Boutique
        </div>
        {renderModuleList("boutique")}

        <div className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-widest text-[#aeb9b0]">
          Gîte
        </div>
        {renderModuleList("gite")}
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#455248] p-3 text-center text-xs text-[#87968a]">
          Aucune image flottante installée.
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => {
          const module = dynamicModules.find(m => m.id === item.section);
          return (
            <div key={item.id} className="rounded-xl border border-[#3b473e] bg-[#151b17] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <strong className="text-sm text-[#e8e1d5]">Image flottante</strong>
                  <div className="truncate text-[10px] text-[#87968a]">
                    {module?.label ?? item.section}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="shrink-0 text-xs text-red-300 hover:text-red-100"
                >
                  Supprimer
                </button>
              </div>

              <input
                value={item.url}
                onChange={e => update(item.id, { url: e.target.value })}
                placeholder="URL de l'image..."
                className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm"
              />

              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer rounded-lg border border-[#d4af37]/50 bg-[#151b17] px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/10">
                  Choisir une image sur mon PC
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="sr-only"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        update(item.id, { url: await readImageFile(file) });
                      } catch {
                        window.alert("Impossible de lire cette image.");
                      }
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {item.url && (
                  <button
                    type="button"
                    onClick={() => update(item.id, { url: "" })}
                    className="rounded-lg border border-[#6b3939] px-3 py-2 text-xs text-red-300 hover:bg-red-950/20"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {item.url && (
                <div className="overflow-hidden rounded-lg border border-[#3b473e] bg-[#0d110e] p-2">
                  <img src={item.url} alt="" className="mx-auto max-h-28 max-w-full object-contain" />
                </div>
              )}

              <input
                value={item.alt ?? ""}
                onChange={e => update(item.id, { alt: e.target.value })}
                placeholder="Texte alternatif..."
                className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-[#9eaaa0]">Taille : {item.size}px
                  <input type="range" min="40" max="600" value={item.size} onChange={e => update(item.id, { size: +e.target.value })} className="w-full" />
                </label>
                <label className="text-xs text-[#9eaaa0]">Opacité : {item.opacity}%
                  <input type="range" min="0" max="100" value={item.opacity} onChange={e => update(item.id, { opacity: +e.target.value })} className="w-full" />
                </label>
                <label className="text-xs text-[#9eaaa0]">Position X : {item.x}%
                  <input type="range" min="0" max="100" value={item.x} onChange={e => update(item.id, { x: +e.target.value })} className="w-full" />
                </label>
                <label className="text-xs text-[#9eaaa0]">Position Y : {item.y}%
                  <input type="range" min="0" max="100" value={item.y} onChange={e => update(item.id, { y: +e.target.value })} className="w-full" />
                </label>
                <label className="text-xs text-[#9eaaa0]">Rotation : {item.rotate}°
                  <input type="range" min="-45" max="45" value={item.rotate} onChange={e => update(item.id, { rotate: +e.target.value })} className="w-full" />
                </label>
              </div>

              <select
                value={item.animation}
                onChange={e => update(item.id, { animation: e.target.value as FloatingMediaItem["animation"] })}
                className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm text-[#e8e1d5]"
              >
                <option value="none">Aucune animation</option>
                <option value="float">Flottement doux</option>
                <option value="sway">Balancement doux</option>
              </select>

              <div className="flex flex-wrap gap-4 text-xs text-[#c4ceb8]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={item.visible} onChange={e => update(item.id, { visible: e.target.checked })} />
                  Visible
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={item.mobile} onChange={e => update(item.id, { mobile: e.target.checked })} />
                  Mobile
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingMediaManager;
