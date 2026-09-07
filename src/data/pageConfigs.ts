export const pageConfigs={gite:{modules:[
{id:"gite-hero",label:"Accueil",visible:true},{id:"gite-experience",label:"Le gîte",visible:true},
{id:"gite-gallery",label:"Galerie",visible:true},{id:"gite-video",label:"Vidéo",visible:true},
{id:"gite-essentials",label:"Équipements",visible:true},{id:"gite-nearby",label:"La région",visible:true},
{id:"gite-stay",label:"Séjourner",visible:true},{id:"gite-access",label:"Accès",visible:true}],
navigation:[
{id:"gite-nav-experience",label:"Le gîte",targetModuleId:"gite-experience",visible:true},
{id:"gite-nav-gallery",label:"Galerie",targetModuleId:"gite-gallery",visible:true},
{id:"gite-nav-video",label:"Vidéo",targetModuleId:"gite-video",visible:true},
{id:"gite-nav-nearby",label:"La région",targetModuleId:"gite-nearby",visible:true},
{id:"gite-nav-stay",label:"Séjourner",targetModuleId:"gite-stay",visible:true},
{id:"gite-nav-home",label:"Site vitrine",visible:true,kind:"home"}]}};
export const getVisiblePageNavigation=(page:any)=>page.navigation.filter((i:any)=>i.visible&&(!i.targetModuleId||page.modules.some((m:any)=>m.id===i.targetModuleId&&m.visible)));
