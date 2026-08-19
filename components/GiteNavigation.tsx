import React from "react";
import { getVisiblePageNavigation, pageConfigs } from "../data/pageConfigs";

type Props = {
  onBackToVitrine?: () => void;
  onAdmin?: () => void;
};

export const GiteNavigation: React.FC<Props> = ({ onBackToVitrine, onAdmin }) => {
  const items = getVisiblePageNavigation(pageConfigs.gite);
  return (
    <nav className="gite-navigation" aria-label="Navigation du gîte">
      <button className="gite-nav-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        {pageConfigs.gite.title}
      </button>
      <div className="gite-nav-links">
        {items.map(item => item.kind === "home" ? (
          <button key={item.id} type="button" onClick={onBackToVitrine}>← {item.label}</button>
        ) : (
          <button key={item.id} type="button" onClick={() => item.targetModuleId && document.getElementById(item.targetModuleId)?.scrollIntoView({behavior:"smooth",block:"start"})}>
            {item.label}
          </button>
        ))}
        <button className="gite-nav-admin" type="button" onClick={onAdmin}>●</button>
      </div>
    </nav>
  );
};
export default GiteNavigation;
