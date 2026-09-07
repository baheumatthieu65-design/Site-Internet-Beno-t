import React, { useMemo, useState } from "react";
import type { FloatingMediaItem } from "../data/floatingMedia";

type Props = {
  config: any;
  onChange: (next: any) => void;
  onSave?: (next: any) => Promise<void> | void;
};

type ModuleOption = {
  id: string;
  label: string;
  group: "boutique" | "gite";
};

const boutiqueModules: ModuleOption[] = [
  { id: "hero", label: "Boutique — Accueil", group: "boutique" },
  { id: "collection", label: "Boutique — Collection / Articles", group: "boutique" },
  { id: "comparatif", label: "Boutique — Tableau comparatif", group: "boutique" },
  { id: "origines", label: "Boutique — L’esprit Pyrénées", group: "boutique" },
  { id: "lookbook", label: "Boutique — Lookbook", group: "boutique" },
  { id: "contact", label: "Boutique — Contact & Atelier", group: "boutique" },
];

const giteModules: ModuleOption[] = [
  { id: "gite-accueil", label: "Gîte — Accueil", group: "gite" },
  { id: "gite-le-gite", label: "Gîte — Le gîte", group: "gite" },
  { id: "gite-region", label: "Gîte — La région", group: "gite" },
  { id: "gite-sejourner", label: "Gîte — Séjourner", group: "gite" },
  { id: "gite-acces", label: "Gîte — Accès", group: "gite" },
];

const fallbackSections = [...boutiqueModules, ...giteModules];

const makeId = () =>
  `floating-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Lecture de l'image impossible"));
    reader.readAsDataURL(file);
  });

const createItem = (section: string): FloatingMediaItem => ({
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

export const FloatingMediaManager: React.FC<Props> = ({ config, onChange, onSave }) => {
  const items: FloatingMediaItem[] = config?.floatingImages ?? [];
  const [draftModule, setDraftModule] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(items)
  );

  const hasUnsavedChanges = JSON.stringify(items) !== savedSnapshot;

  const configuredBlocks = Array.isArray(config?.blocks) ? config.blocks : [];

  const modules = useMemo<ModuleOption[]>(() => {
    const extras: ModuleOption[] = configuredBlocks
      .map((block: any) => {
        const id = block.section ?? block.id ?? block.key;
        if (!id || fallbackSections.some((m) => m.id === String(id))) {
          return null;
        }
        const isGite = String(id).toLowerCase().includes("gite");
        return {
          id: String(id),
          label: `${isGite ? "Gîte" : "Boutique"} — ${
            block.label ?? block.title ?? id
          }`,
          group: isGite ? "gite" : "boutique",
        } as ModuleOption;
      })
      .filter(Boolean) as ModuleOption[];

    return [...fallbackSections, ...extras];
  }, [configuredBlocks]);

  const update = (id: string, patch: Partial<FloatingMediaItem>) => {
    onChange({
      ...config,
      floatingImages: items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const addModule = (section: string) => {
    onChange({
      ...config,
      floatingImages: [...items, createItem(section)],
    });
    setDraftModule(null);
  };

  const remove = (id: string) => {
    onChange({
      ...config,
      floatingImages: items.filter((item) => item.id !== id),
    });
  };

  const saveChanges = async () => {
    try {
      if (onSave) await onSave(config);
      setSavedSnapshot(JSON.stringify(items));
    } catch {
      // Le parent affiche déjà son erreur d'enregistrement.
    }
  };

  const scrollToItem = (id: string) => {
    document
      .getElementById(`floating-item-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const renderModuleList = (group: "boutique" | "gite") => (
    <div className="space-y-2">
      {modules
        .filter((module) => module.group === group)
        .map((module) => {
          const count = items.filter(
            (item) => item.section === module.id
          ).length;
          const isDraft = draftModule === module.id;

          return (
            <div
              key={module.id}
              className={`rounded-lg border p-2.5 ${
                isDraft
                  ? "border-[#d4af37] bg-[#1d261f]"
                  : count
                    ? "border-[#56685b] bg-[#151b17]"
                    : "border-[#334138] bg-[#111612]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-[#e8e1d5]">
                    {module.label}
                  </div>
                  {count > 0 && (
                    <div className="mt-0.5 text-[10px] text-[#9eaaa0]">
                      {count} image{count > 1 ? "s" : ""} installée
                      {count > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDraftModule(isDraft ? null : module.id)
                  }
                  className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                    isDraft
                      ? "border-[#6b3939] text-red-300"
                      : "border-[#d4af37]/60 text-[#d4af37]"
                  }`}
                >
                  {isDraft ? "Annuler" : "Ajouter"}
                </button>
              </div>

              {isDraft && (
                <div className="mt-2 rounded-md border border-dashed border-[#d4af37]/50 p-2 text-[10px] text-[#c4ceb8]">
                  Cliquez sur Installer pour créer une nouvelle image
                  flottante dans ce module.
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

  return (
    <div className="space-y-4" data-floating-manager="true">
      <div className="overflow-hidden rounded-xl border border-[#3b473e] bg-[#111612]">
        <div className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
              Images flottantes
            </div>
            <div className="mt-1 text-[11px] text-[#87968a]">
              {items.length
                ? `${items.length} image${items.length > 1 ? "s" : ""} installée${items.length > 1 ? "s" : ""}`
                : "Aucune image installée"}
              {hasUnsavedChanges ? " • modifications en cours" : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="shrink-0 rounded-lg border border-[#455248] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#c4ceb8]"
          >
            {expanded ? "Réduire" : "Développer"}
          </button>
        </div>

        {expanded && (
          <div className="border-t border-[#2f3a32] p-3">
            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                Choisir le module
              </div>
              <div className="mt-1 text-[11px] text-[#87968a]">
                Ajoutez une image flottante sur le module voulu.
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

            {items.length > 0 && (
              <div className="mt-4 rounded-lg border border-[#334138] bg-[#0f1411] p-2">
                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#9eaaa0]">
                  Images installées — sélection rapide
                </div>
                <div className="space-y-1.5">
                  {items.map((item, index) => {
                    const module = modules.find(
                      (entry) => entry.id === item.section
                    );
                    return (
                      <button
                        key={`quick-${item.id}`}
                        type="button"
                        onClick={() => scrollToItem(item.id)}
                        className="flex w-full items-center gap-2 rounded-md border border-[#29342d] bg-[#141a16] px-2 py-1.5 text-left"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-[#3b473e] bg-[#0b0f0c] text-[10px]">
                          {item.url ? (
                            <img
                              src={item.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] text-[#d8d2c8]">
                            {module?.label ?? item.section}
                          </span>
                          <span className="block text-[9px] text-[#748077]">
                            Image {index + 1}
                          </span>
                        </span>
                        <span className="text-[10px] text-[#d4af37]">
                          Modifier
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end border-t border-[#2f3a32] pt-3">
              <button
                type="button"
                onClick={saveChanges}
                disabled={!hasUnsavedChanges}
                className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                  hasUnsavedChanges
                    ? "bg-[#d4af37] text-[#111612]"
                    : "border border-[#334138] text-[#66736a]"
                }`}
              >
                {hasUnsavedChanges
                  ? "Enregistrer les modifications"
                  : "Modifications enregistrées"}
              </button>
            </div>

            {/* Éditeur des images flottantes : volontairement dans le panneau
                réductible pour que tout le module puisse être masqué d'un clic. */}
            {items.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-[#2f3a32] pt-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#9eaaa0]">
                  Images flottantes installées — modifier
                </div>
                {items.map((item) => {
                  const module = modules.find((entry) => entry.id === item.section);

                  return (
                    <div
                      id={`floating-item-${item.id}`}
                      key={item.id}
                      className="space-y-3 rounded-xl border border-[#3b473e] bg-[#151b17] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="text-sm text-[#e8e1d5]">
                            Image flottante
                          </strong>
                          <div className="truncate text-[10px] text-[#87968a]">
                            {module?.label ?? item.section}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="shrink-0 text-xs text-red-300"
                        >
                          Supprimer
                        </button>
                      </div>

                      <input
                        value={item.url}
                        onChange={(event) =>
                          update(item.id, { url: event.target.value })
                        }
                        placeholder="URL de l'image..."
                        className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm"
                      />

                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer rounded-lg border border-[#d4af37]/50 bg-[#151b17] px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
                          Choisir une image sur mon PC
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                            className="sr-only"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              try {
                                update(item.id, { url: await readImageFile(file) });
                              } catch {
                                window.alert("Impossible de lire cette image.");
                              }
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>

                        {item.url && (
                          <button
                            type="button"
                            onClick={() => update(item.id, { url: "" })}
                            className="rounded-lg border border-[#6b3939] px-3 py-2 text-xs text-red-300"
                          >
                            Effacer
                          </button>
                        )}
                      </div>

                      {item.url && (
                        <div className="overflow-hidden rounded-lg border border-[#3b473e] bg-[#0d110e] p-2">
                          <img
                            src={item.url}
                            alt=""
                            className="mx-auto max-h-28 max-w-full object-contain"
                          />
                        </div>
                      )}

                      <input
                        value={item.alt ?? ""}
                        onChange={(event) =>
                          update(item.id, { alt: event.target.value })
                        }
                        placeholder="Texte alternatif..."
                        className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs text-[#9eaaa0]">
                          Taille : {item.size}px
                          <input
                            type="range"
                            min="40"
                            max="600"
                            value={item.size}
                            onChange={(event) =>
                              update(item.id, { size: +event.target.value })
                            }
                            className="w-full"
                          />
                        </label>

                        <label className="text-xs text-[#9eaaa0]">
                          Opacité : {item.opacity}%
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.opacity}
                            onChange={(event) =>
                              update(item.id, { opacity: +event.target.value })
                            }
                            className="w-full"
                          />
                        </label>

                        <label className="text-xs text-[#9eaaa0]">
                          Position X : {item.x}%
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.x}
                            onChange={(event) =>
                              update(item.id, { x: +event.target.value })
                            }
                            className="w-full"
                          />
                        </label>

                        <label className="text-xs text-[#9eaaa0]">
                          Position Y : {item.y}%
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.y}
                            onChange={(event) =>
                              update(item.id, { y: +event.target.value })
                            }
                            className="w-full"
                          />
                        </label>

                        <label className="text-xs text-[#9eaaa0]">
                          Rotation : {item.rotate}°
                          <input
                            type="range"
                            min="-45"
                            max="45"
                            value={item.rotate}
                            onChange={(event) =>
                              update(item.id, { rotate: +event.target.value })
                            }
                            className="w-full"
                          />
                        </label>
                      </div>

                      <select
                        value={item.animation}
                        onChange={(event) =>
                          update(item.id, {
                            animation: event.target.value as FloatingMediaItem["animation"],
                          })
                        }
                        className="w-full rounded-lg border border-[#3b473e] bg-[#101511] px-3 py-2 text-sm text-[#e8e1d5]"
                      >
                        <option value="none">Aucune animation</option>
                        <option value="float">Flottement doux</option>
                        <option value="sway">Balancement doux</option>
                      </select>

                      <div className="flex flex-wrap gap-4 text-xs text-[#c4ceb8]">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.visible}
                            onChange={(event) =>
                              update(item.id, { visible: event.target.checked })
                            }
                          />
                          Visible
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.mobile}
                            onChange={(event) =>
                              update(item.id, { mobile: event.target.checked })
                            }
                          />
                          Mobile
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex justify-end border-t border-[#2f3a32] pt-3">
              <button
                type="button"
                onClick={saveChanges}
                disabled={!hasUnsavedChanges}
                className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                  hasUnsavedChanges
                    ? "bg-[#d4af37] text-[#111612]"
                    : "border border-[#334138] text-[#66736a]"
                }`}
              >
                {hasUnsavedChanges
                  ? "Enregistrer les modifications"
                  : "Modifications enregistrées"}
              </button>
            </div>
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#455248] p-3 text-center text-xs text-[#87968a]">
          Aucune image flottante installée.
        </div>
      )}


    </div>
  );
};

export default FloatingMediaManager;
