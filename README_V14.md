# V14 — publication GitHub + premier rendu sans flash

Cette version est conçue pour ton architecture actuelle.

## Fichiers

AJOUTER :
- api/site-publish.ts
- src/data/site-content.generated.ts
- src/lib/publishedSite.ts
- apply-v14.mjs

## Installation

1. Dézipper à la racine du projet.
2. Ajouter les 4 nouveaux fichiers à GitHub.
3. Depuis la racine du projet, lancer :
   `node apply-v14.mjs`
4. Vérifier `git diff`.
5. Commit / push.
6. Vercel redéploie.

Le script ne remplace pas App.tsx en entier. Il cherche le useState BrandData et le raccorde au fichier généré.

## Vercel

Variables obligatoires :
GITHUB_TOKEN
GITHUB_REPOSITORY=baheumatthieu65-design/Site-Internet-Beno-t
GITHUB_BRANCH=main
GITHUB_PUBLISHED_FILE=src/data/site-content.generated.ts

Important :
- GITHUB_TOKEN doit être un Fine-grained PAT GitHub.
- Repository access : uniquement Site-Internet-Beno-t.
- Repository permission : Contents = Read and write.
- Ne jamais mettre le token dans une variable VITE_*.

## Publication

L'éditeur doit appeler :
PUT /api/site-publish

avec :
{
  "config": {
    "brandData": ...,
    "editorConfig": ...
  }
}

L'API lit la version actuelle du fichier sur GitHub pour récupérer son SHA,
puis fait un commit sur la branche main.

## Pourquoi le flash disparaît

Après une publication :
GitHub -> Vercel -> build
Le fichier `site-content.generated.ts` contient les dernières valeurs.
Au prochain chargement, App initialise BrandData avec ces valeurs avant
la récupération dynamique Upstash.

## IMPORTANT — sécurité

L'API accepte la publication seulement si ADMIN_SECRET est configuré et si
le cookie `admin_session` correspond à cette valeur.

Si ton projet utilise déjà une autre méthode d'authentification admin,
adapte uniquement cette vérification dans api/site-publish.ts.
Ne mets jamais GITHUB_TOKEN côté client.

## Test

Après déploiement :
1. modifier un texte ;
2. enregistrer ;
3. vérifier que PUT /api/site-publish répond 200 ;
4. vérifier qu'un commit "chore(site-editor): publish visual site changes" apparaît sur GitHub ;
5. attendre le déploiement Vercel ;
6. ouvrir en navigation privée.

Si le commit apparaît mais Vercel ne redéploie pas, vérifier les réglages
Git integration de Vercel.
