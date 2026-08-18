import fs from 'node:fs';
import path from 'node:path';

const p=path.join(process.cwd(),'src','App.tsx');
let s=fs.readFileSync(p,'utf8');

// Make the save function accept the exact config produced by the editor.
// This avoids the React state race where onChange() is followed immediately
// by onSave() using the old state.
const re=/const saveSiteConfig = async \(\) => \{[\s\S]*?\n\s*\};/;
const replacement=`const saveSiteConfig = async (configOverride?: SiteEditorConfig) => {
  const editorConfigToSave = configOverride || siteEditorConfig;

  const response = await fetch('/api/site-config', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      config: {
        brandData,
        editorConfig: editorConfigToSave,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(\`Sauvegarde site: \${response.status}\${detail ? \` — \${detail}\` : ''}\`);
  }

  setSiteEditorConfig(editorConfigToSave);
};`;

if(!re.test(s)){console.error('saveSiteConfig introuvable — aucune modification faite');process.exit(1)}
s=s.replace(re,replacement);
fs.writeFileSync(p,s,'utf8');
console.log('App.tsx: saveSiteConfig accepte maintenant la configuration exacte du dernier clic.');
