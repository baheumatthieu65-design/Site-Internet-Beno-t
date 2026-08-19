import React from "react";

export type FloatingModuleImageProps = {
  src: string;
  alt?: string;
  positionX?: number;
  positionY?: number;
  size?: number;
  rotate?: number;
  animation?: "none" | "float" | "sway";
  mobileVisible?: boolean;
};

export const FloatingModuleImage: React.FC<FloatingModuleImageProps> = ({
  src, alt = "", positionX = 50, positionY = 50, size = 180,
  rotate = 0, animation = "float", mobileVisible = true
}) => (
  <img
    src={src}
    alt={alt}
    className={`floating-module-image floating-module-image--${animation} ${mobileVisible ? "" : "floating-module-image--desktop-only"}`}
    style={{ left: `${positionX}%`, top: `${positionY}%`, width: size, transform: `translate(-50%,-50%) rotate(${rotate}deg)` }}
  />
);
export default FloatingModuleImage;
