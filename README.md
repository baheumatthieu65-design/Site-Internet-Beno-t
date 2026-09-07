<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e2458074-0c0b-459a-8a6f-438e4e509dbd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🗺️ Orthophoto hors-ligne

Pâtur'GPS peut utiliser un fond orthophoto IGN local autour d'Ilhet (rayon 30 km), limité au zoom 13 pour garder une taille raisonnable sur mobile. Voir `OFFLINE-MAP.md` et `scripts/download-offline-ortho.mjs` pour constituer le paquet de tuiles.
