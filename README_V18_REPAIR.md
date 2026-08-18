# V18 — paquet de réparation

À remplacer dans GitHub, exactement :

1. `src/App.tsx`
2. `src/data/site-content.generated.ts`
3. `index.html`

Ne pas les ajouter à la fin des fichiers.

Cette version :
- retire le chargement infini de V17 ;
- remet l'index.html simple ;
- donne au système de contenu publié une vraie valeur initiale au lieu de
  `brandData: null`.

Important : ne supprime pas `src/data/brandData.ts`, car
`site-content.generated.ts` s'appuie dessus pour le premier démarrage.

Après le commit, attendre le déploiement Vercel avant de tester.
