import React from "react";
import type { FloatingMediaItem } from "../data/floatingMedia";

export const FloatingMediaLayer: React.FC<{sectionId:string; items?:FloatingMediaItem[]}> = ({sectionId,items=[]}) => (
  <>
    {items.filter(i=>i.visible && i.url && i.section===sectionId).map(i=>(
      <img key={i.id} src={i.url} alt={i.alt||""}
        className={`floating-media floating-media--${i.animation} ${i.mobile?"":"floating-media--desktop-only"}`}
        style={{left:`${i.x}%`,top:`${i.y}%`,width:`${i.size}px`,opacity:i.opacity/100,transform:`translate(-50%,-50%) rotate(${i.rotate}deg)`}}
      />
    ))}
  </>
);
export default FloatingMediaLayer;
