# V5 — véritable éditeur visuel de page

Cette V5 inclut la V4 + un vrai système de blocs persistants.

## Fichiers à remplacer
- `src/App.tsx`
- `src/components/SiteVisualEditor.tsx`
- `src/components/SiteBlocksRenderer.tsx` (nouveau)
- `src/components/Navbar.tsx`
- `src/components/AdminBar.tsx`
- `api/site-media.ts`
- `package.json`

## Fonctionnement

### Modifier un texte existant
1. Ouvrir le bouton rond admin.
2. Cliquer `Modifier directement la page`.
3. Cliquer sur n'importe quel texte (titres, paragraphes, boutons, liens...).
4. Écrire directement sur la page.
5. Cliquer `Enregistrer les modifications`.

Les sélecteurs CSS des éléments modifiés sont enregistrés dans Upstash.

### Remplacer une image
Même mode : cliquer sur une image puis `Importer` ou `Bibliothèque`.

### Bibliothèque
Les médias envoyés sont stockés dans Vercel Blob et la liste est disponible via `Bibliothèque`.

### Ajouter
- Texte
- Titre
- Bouton
- Média

Pour un nouveau bloc texte/titre/bouton :
1. saisir le texte (et le lien si bouton);
2. cliquer le type;
3. cliquer à l'endroit voulu sur la section Accueil.

Pour un média :
1. cliquer `Média`;
2. cliquer à l'endroit voulu;
3. choisir le fichier.

Les blocs sont rendus publiquement via `SiteBlocksRenderer` et enregistrés dans Upstash.

## Vercel
Ajouter dans Environment Variables :
`BLOB_READ_WRITE_TOKEN`

Le package `@vercel/blob` est déjà présent.

## Important
Le V5 est prévu pour être installé en remplacement de la V2/V3 actuelle. Ne mélange pas une ancienne version de `SiteVisualEditor.tsx` avec celle-ci.
