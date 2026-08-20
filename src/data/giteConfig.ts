import type { GiteSiteConfig } from "../types";

export const defaultGiteConfig: GiteSiteConfig = {
  name: "Le Gîte",
  location: "Pyrénées",
  tagline: "Une parenthèse au cœur des montagnes.",
  heroImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=85",
  intro: { title: "Un lieu pour ralentir.", text: "Une maison chaleureuse pensée pour profiter du calme, des paysages et de l’authenticité des Pyrénées." },
  gallery: [
    {src:"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85",alt:"Intérieur du gîte"},
    {src:"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=85",alt:"Chambre du gîte"},
    {src:"https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=85",alt:"Salon chaleureux"},
    {src:"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=85",alt:"Gîte en montagne"}
  ],
  videoUrl:"", videoPoster:"",
  essentials:[{value:"6",label:"Voyageurs"},{value:"3",label:"Chambres"},{value:"2",label:"Salle de bain"},{value:"1",label:"Parking"}],
  bookingText:"Les disponibilités et tarifs sont consultables directement sur nos plateformes partenaires.",
  airbnbUrl:"#", bookingUrl:"#",
  nearby:[
    {title:"Randonnées",text:"Sentiers, cols et panoramas à proximité du gîte."},
    {title:"Villages",text:"Marchés, villages de montagne et producteurs locaux."},
    {title:"Activités",text:"Nature, neige, vélo et découvertes selon la saison."}
  ],
  access:{title:"Venir au gîte",text:"Les informations pratiques d’accès peuvent être personnalisées depuis l’éditeur."},
  modules:[
    {id:"gite-hero",label:"Le gîte — Accueil",visible:true,background:{type:"image",url:"https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=2200&q=85",overlay:25}},
    {id:"gite-experience",label:"Le gîte",visible:true,background:{type:"image",url:"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85",overlay:12}},
    {id:"gite-gallery",label:"Galerie",visible:true,background:{type:"image",url:"https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1800&q=85",overlay:10}},
    {id:"gite-video",label:"Vidéo",visible:true},
    {id:"gite-essentials",label:"Équipements",visible:true},
    {id:"gite-nearby",label:"La région",visible:true,background:{type:"image",url:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",overlay:12}},
    {id:"gite-stay",label:"Séjourner",visible:true},
    {id:"gite-access",label:"Accès",visible:true}
  ],
  navLabels:{experience:"Le gîte",gallery:"Galerie",video:"Vidéo",nearby:"La région",stay:"Séjourner"}
};

export const giteConfig = defaultGiteConfig;
