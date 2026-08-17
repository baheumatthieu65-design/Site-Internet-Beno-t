V4 — éditeur directement sur la page + médias + Commandes

Fichiers à remplacer :
- src/components/SiteVisualEditor.tsx
- src/components/Navbar.tsx
- src/components/AdminBar.tsx
- package.json

Nouveau fichier :
- api/site-media.ts

Vercel :
- créer un Blob Store
- ajouter BLOB_READ_WRITE_TOKEN dans Environment Variables
- redéployer

Fonctionnalités :
- mode « Modifier directement sur la page »
- cliquer un titre/paragraphe/bouton/texte et modifier le texte
- cliquer une image ou vidéo et choisir un fichier
- sauvegarde des sélecteurs + textes + URLs dans Upstash
- Commandes retiré de la barre admin et ajouté au bandeau principal à côté de Commander

IMPORTANT :
Le fichier package.json doit être remplacé puis Vercel doit réinstaller les dépendances.
