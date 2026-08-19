import React from "react";

export type FloatingMedia = {
  id: string;
  section: string;
  url: string;
  alt?: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  opacity: number;
  animation: "none" | "float" | "sway";
  mobile: boolean;
  visible: boolean;
};

export const FloatingMediaLayer: React.FC<{sectionId:string; items?:FloatingMedia[]}> = ({sectionId,items=[]}) => (
  <>
    {items.filter(i=>i.visible && i.section===sectionId).map(i=>(
      <img key={i.id} src={i.url} alt={i.alt||""}
        className={`floating-media floating-media--${i.animation} ${i.mobile?"":"floating-media--desktop-only"}`}
        style={{left:`${i.x}%`,top:`${i.y}%`,width:`${i.size}px`,opacity:i.opacity/100,transform:`translate(-50%,-50%) rotate(${i.rotate}deg)`}}
      />
    ))}
  </>
);
