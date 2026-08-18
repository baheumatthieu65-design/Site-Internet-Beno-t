import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'src', 'App.tsx');

if (!fs.existsSync(appPath)) {
  console.error('❌ src/App.tsx introuvable. Lance ce script depuis la racine du projet.');
  process.exit(1);
}

let app = fs.readFileSync(appPath, 'utf8');

const start = app.indexOf('  const handleSaveBrandData = ');
const end = app.indexOf('\n\n  // ===========================================================================\n  // SAVE VISUAL EDITOR CONFIGURATION TO UPSTASH', start);

if (start === -1 || end === -1) {
  console.error('❌ Impossible de trouver handleSaveBrandData dans src/App.tsx.');
  console.error('Le fichier semble avoir une version différente de celle ciblée par ce correctif.');
  process.exit(1);
}

const replacement = `  const handleSaveBrandData = async (newData: BrandConfig) => {
    const normalizedData: BrandConfig = {
      ...newData,
      theme: {
        ...defaultThemeConfig,
        ...(newData.theme || {}),
      },
    };

    setBrandData(normalizedData);

    try {
      localStorage.setItem(
        'pyrenees_brand_config',
        JSON.stringify(normalizedData)
      );
    } catch (error) {
      console.error(
        'Impossible de sauvegarder la configuration locale:',
        error
      );
    }

    // IMPORTANT :
    // Les modifications de l'éditeur ne doivent pas rester uniquement
    // dans le localStorage de l'administrateur. On les publie aussi
    // dans Upstash afin que les visiteurs les récupèrent via GET /api/site-config.
    try {
      const response = await fetch('/api/site-config', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          config: {
            brandData: normalizedData,
            editorConfig: siteEditorConfig,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(\`Publication site: HTTP \${response.status}\`);
      }
    } catch (error) {
      console.error(
        'Impossible de publier la configuration du site dans Upstash:',
        error
      );

      setReorderToast(
        'Modification locale enregistrée, mais publication serveur impossible.'
      );

      window.setTimeout(() => {
        setReorderToast(null);
      }, 3500);
    }
  };`;

app = app.slice(0, start) + replacement + app.slice(end);

fs.writeFileSync(appPath, app, 'utf8');

console.log('✅ src/App.tsx corrigé : les modifications Brand/Theme sont maintenant publiées côté serveur.');
console.log('➡️ Remplace aussi src/components/SiteBlocksRenderer.tsx par celui fourni dans ce ZIP.');
