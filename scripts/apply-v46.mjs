import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const write=(p,s)=>fs.writeFileSync(p,s);

const mainPath="src/main.tsx";
let main=read(mainPath);
if(!main.includes("components/GitePage")) {
  main=main.replace("import App from './App.tsx';", "import App from './App.tsx';\nimport GitePage from './components/GitePage';\nimport './styles/gite-v46.css';");
  main=main.replace("createRoot(rootElement).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n);",
`const isGite = window.location.pathname.replace(/\\\\/+$/, '') === '/gite';\n\ncreateRoot(rootElement).render(\n  <StrictMode>\n    {isGite ? <GitePage /> : <App />}\n  </StrictMode>,\n);`);
  write(mainPath,main);
}

const editorPath="src/components/SiteVisualEditor.tsx";
let ed=read(editorPath);
if(!ed.includes("FloatingMediaManager")) {
  ed=ed.replace("import { Check, Image as ImageIcon, Loader2, Move, Save, Settings2, Type, X } from 'lucide-react';",
    "import { Check, Image as ImageIcon, Loader2, Move, Save, Settings2, Type, X } from 'lucide-react';\nimport { FloatingMediaManager } from './FloatingMediaManager';");
  ed=ed.replace("  blocks: EditorBlock[];\n}", "  blocks: EditorBlock[];\n  floatingImages?: import('./FloatingMediaLayer').FloatingMedia[];\n}");
  ed=ed.replace("          {adminToolbar && (", "          <FloatingMediaManager config={config} onChange={onChange} />\n\n          {adminToolbar && (");
  write(editorPath,ed);
}

const appPath="src/App.tsx";
let app=read(appPath);
if(!app.includes("FloatingMediaLayer")) {
  app=app.replace("import { SiteBlocksRenderer } from './components/SiteBlocksRenderer';",
    "import { SiteBlocksRenderer } from './components/SiteBlocksRenderer';\nimport { FloatingMediaLayer } from './components/FloatingMediaLayer';");
  app=app.replace("<div key={sectionId}>\n          {content}\n        </div>",
    "<div key={sectionId} className=\"relative\">\n          {content}\n          <FloatingMediaLayer sectionId={sectionId} items={siteEditorConfig.floatingImages} />\n        </div>");
  app=app.replace("        {content}\n      </div>\n    );", "        {content}\n        <FloatingMediaLayer sectionId={sectionId} items={siteEditorConfig.floatingImages} />\n      </div>\n    );");
  write(appPath,app);
}
console.log("V46 appliquée: /gite + images flottantes + gestionnaire admin.");
