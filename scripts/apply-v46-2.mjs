import fs from "node:fs";
import path from "node:path";

const app = path.resolve("App.tsx");
const editor = path.resolve("src/components/SiteVisualEditor.tsx");
const indexCss = path.resolve("src/index.css");

function backup(file){ if(fs.existsSync(file)) fs.copyFileSync(file, file+".v46.2.bak"); }
function patch(file, fn){
  if(!fs.existsSync(file)) throw new Error(`Fichier introuvable: ${file}`);
  const old=fs.readFileSync(file,"utf8"); const next=fn(old);
  if(next===old) throw new Error(`Aucune modification sûre détectée dans ${file}. Aucun fichier n'a été modifié.`);
  backup(file); fs.writeFileSync(file,next);
}

patch(app, s => {
  if(!s.includes('import GitePage from')) {
    const anchor="import { Footer } from './components/Footer';";
    if(!s.includes(anchor)) throw new Error("Anchor Footer introuvable dans App.tsx");
    s=s.replace(anchor, anchor+"\nimport GitePage from './components/GitePage';\nimport './styles/gite-v46.css';");
  }
  if(!s.includes("window.location.pathname === '/gite'")) {
    const marker="export default function App() {";
    if(!s.includes(marker)) throw new Error("Déclaration App introuvable");
    s=s.replace(marker, marker+"\n  if (window.location.pathname === '/gite') return <GitePage />;");
  }
  return s;
});

patch(indexCss, s => {
  if(!s.includes("/* V46.2 floating media */")) return s+"\n/* V46.2 floating media */\n.floating-module-image{position:absolute;z-index:5;max-width:none;pointer-events:none;object-fit:contain}.floating-module-image--float{animation:giteFloat 5s ease-in-out infinite}.floating-module-image--sway{animation:giteSway 6s ease-in-out infinite}@keyframes giteFloat{0%,100%{margin-top:0}50%{margin-top:-10px}}@keyframes giteSway{0%,100%{margin-left:0}50%{margin-left:8px}}@keyframes giteSway{0%,100%{margin-left:0}50%{margin-left:8px}}";
  return s;
});

console.log("V46.2 intégrée. Sauvegardes .v46.2.bak créées. Lancez npm run build avant commit.");
