import React from "react";
import { giteConfig as c } from "../data/giteConfig";
import { FloatingModuleImage } from "./FloatingModuleImage";

type Props = {
  onBackToVitrine?: () => void;
  isAdmin?: boolean;
};

export const GitePage: React.FC<Props> = ({ onBackToVitrine, isAdmin = false }) => (
  <main className="gite-page">
    <section id="gite-hero" className="gite-hero">
      <img src={c.heroImage} alt={c.name} />
      <div className="gite-hero-overlay">
        <p>{c.location}</p><h1>{c.name}</h1><p>{c.tagline}</p>
      </div>
    </section>

    <section id="gite-experience" className="gite-section gite-intro">
      <p className="gite-eyebrow">L'expérience</p><h2>{c.intro.title}</h2><p>{c.intro.text}</p>
    </section>

    <section id="gite-gallery" className="gite-section gite-module">
      <p className="gite-eyebrow">Le gîte en images</p>
      <div className="gite-gallery">{c.gallery.map(i=><img key={i.src} src={i.src} alt={i.alt}/>)}</div>
      <FloatingModuleImage src="/gite/decor-1.png" alt="" positionX={96} positionY={25} size={150} animation="float" />
    </section>

    <section id="gite-video" className="gite-video gite-module">
      {c.videoUrl ? <video controls playsInline preload="metadata" poster={c.videoPoster}><source src={c.videoUrl}/></video> : <div className="gite-video-placeholder">Votre vidéo de présentation apparaîtra ici.</div>}
    </section>

    <section id="gite-essentials" className="gite-section gite-module">
      <p className="gite-eyebrow">Les essentiels</p>
      <div className="gite-essentials">{c.essentials.map(i=><div className="gite-card" key={i.label}><strong>{i.value}</strong><span>{i.label}</span></div>)}</div>
    </section>

    <section id="gite-nearby" className="gite-section gite-module">
      <p className="gite-eyebrow">Aux alentours</p>
      <div className="gite-nearby">{c.nearby.map(i=><article key={i.title}><h3>{i.title}</h3><p>{i.text}</p></article>)}</div>
    </section>

    <section id="gite-stay" className="gite-section gite-stay gite-module">
      <p className="gite-eyebrow">Séjourner</p><h2>Consulter les disponibilités</h2><p>{c.bookingText}</p>
      <div className="gite-booking-links"><a href={c.airbnbUrl} target="_blank" rel="noreferrer">Voir sur Airbnb</a><a href={c.bookingUrl} target="_blank" rel="noreferrer">Voir sur Booking.com</a></div>
    </section>

    <section id="gite-access" className="gite-section gite-module">
      <p className="gite-eyebrow">Accès</p><h2>{c.access.title}</h2><p>{c.access.text}</p>
    </section>

    <button className="gite-return-button" type="button" onClick={onBackToVitrine}>← Site vitrine</button>
    {isAdmin && <span className="gite-admin-context">Administration active</span>}
  </main>
);

export default GitePage;
