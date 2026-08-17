# Intégration V1

## `src/types.ts`
Ajouter :
```ts
export type MediaType = 'image' | 'gif' | 'video';
export type AdminBarPosition = 'top' | 'bottom' | 'left' | 'right';
export interface BackgroundMedia {
  type: MediaType; url: string; poster?: string; overlay?: number;
  positionX?: number; positionY?: number; objectFit?: 'cover'|'contain';
}
export interface EditableSiteBlock {
  id: string; type: 'text'|'heading'|'button'|'image'|'video'|'spacer';
  section: SectionId; x:number; y:number; text?:string; url?:string;
  mediaUrl?:string; visible:boolean;
}
export interface AdminBarConfig { position: AdminBarPosition; collapsed:boolean; }
```
Dans `BrandConfig`, ajouter :
```ts
heroBackground?: BackgroundMedia;
adminBar?: AdminBarConfig;
editableBlocks?: EditableSiteBlock[];
```

## `App.tsx`
Importer :
```ts
import { SiteVisualEditor, SiteEditorConfig } from './components/SiteVisualEditor';
```
Ajouter l'état :
```ts
const [siteEditorConfig,setSiteEditorConfig]=useState<SiteEditorConfig>({
  adminBarPosition:'top', blocks:[]
});
```
Ajouter la sauvegarde :
```ts
const saveSiteConfig = async () => {
  const response=await fetch('/api/site-config',{
    method:'PUT', credentials:'include',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({config:{brandData,editorConfig:siteEditorConfig}})
  });
  if(!response.ok) throw new Error(`Sauvegarde site: ${response.status}`);
};
```
Puis, uniquement quand `isAdminLoggedIn` :
```tsx
<SiteVisualEditor
  brandData={brandData}
  config={siteEditorConfig}
  onChange={setSiteEditorConfig}
  onSave={saveSiteConfig}
/>
```

## `HeroSection.tsx`
Le fond actuel est `brandData.heroBgImage`. Il faut utiliser `brandData.heroBackground?.url` quand présent.
Pour `type === 'video'` :
```tsx
<video autoPlay muted loop playsInline src={...} />
```
Pour image/GIF :
```tsx
<img src={...} />
```
Garder les overlays actuels.

## `AdminBar.tsx`
Conserver toute la barre existante (commandes, catalogue, sécurité, etc.). Ajouter le bouton d'ouverture de l'éditeur visuel. La position top/bottom/left/right doit ensuite être appliquée par la classe du conteneur.

## Uploads
La V1 accepte une URL de média. Pour un bouton « Choisir un fichier », utiliser Vercel Blob dans une V2. Upstash stocke la configuration et les URLs, pas les MP4.

## Important
Ne pas remplacer `App.tsx`, `AdminBar.tsx` ou `HeroSection.tsx` en entier : ces fichiers contiennent déjà la logique catalogue/commandes/thèmes. Les composants fournis sont conçus pour être branchés à cette logique existante.
