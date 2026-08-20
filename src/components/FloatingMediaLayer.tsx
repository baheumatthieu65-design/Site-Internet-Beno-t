import React from "react";
import type { FloatingMediaItem } from "../data/floatingMedia";

/** Renders floating media for exactly one page module/section.
 * The parent module must be position:relative so X/Y are scoped to that module.
 */
export const FloatingMediaLayer: React.FC<{ sectionId: string; items?: FloatingMediaItem[] }> = ({ sectionId, items = [] }) => (
  <>
    {items
      .filter((item) => item.visible && !!item.url && item.section === sectionId)
      .map((item) => (
        <img
          key={item.id}
          src={item.url}
          alt={item.alt || ""}
          className={`floating-media floating-media--${item.animation} ${item.mobile ? "" : "floating-media--desktop-only"}`}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.size}px`,
            opacity: item.opacity / 100,
            transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
          }}
        />
      ))}
  </>
);

export default FloatingMediaLayer;
