import React from "react";
import {giteConfig as c} from "../data/giteConfig";
import {GiteNavigation} from "./GiteNavigation";
import { BrandConfig } from "../types";
export const GitePage:React.FC<{brandData: BrandConfig; onBackToVitrine:()=>void;onAdmin:()=>void}>=({brandData,onBackToVitrine,onAdmin})=><main className="gite-page">
<GiteNavigation brandData={brandData} onBackToVitrine={onBackToVitrine} onAdmin={onAdmin}/>
<section id="gite-hero" className="gite-hero"><img src={c.heroImage} alt={c.name}/><div className="gite-hero-overlay"><p>{c.location}</p><h1>{c.name}</h1><p>{c.tagline}</p></div></section>
<section id="gite-experience" className="gite-section"><p className="gite-eyebrow">L'expérience</p><h2>{c.intro.title}</h2><p>{c.intro.text}</p></section>
<section id="gite-gallery" className="gite-section"><p className="gite-eyebrow">Le gîte en images</p><div className="gite-gallery">{c.gallery.map(i=><img key={i.src} src={i.src} alt={i.alt}/>)}</div></section>
<section id="gite-video" className="gite-video"><video controls playsInline poster={c.videoPoster||undefined}><source src={c.videoUrl}/></video></section>
<section id="gite-essentials" className="gite-section"><p className="gite-eyebrow">Les essentiels</p><div className="gite-essentials">{c.essentials.map(i=><div className="gite-card" key={i.label}><strong>{i.value}</strong><span>{i.label}</span></div>)}</div></section>
<section id="gite-nearby" className="gite-section"><p className="gite-eyebrow">Aux alentours</p><div className="gite-nearby">{c.nearby.map(i=><article key={i.title}><h3>{i.title}</h3><p>{i.text}</p></article>)}</div></section>
<section id="gite-stay" className="gite-section gite-stay"><p className="gite-eyebrow">Séjourner</p><h2>Consulter les disponibilités</h2><p>{c.bookingText}</p><div className="gite-booking-links"><a href={c.airbnbUrl}>Airbnb</a><a href={c.bookingUrl}>Booking.com</a></div></section>
<section id="gite-access" className="gite-section"><p className="gite-eyebrow">Accès</p><h2>{c.access.title}</h2><p>{c.access.text}</p></section>
</main>;
export default GitePage;
