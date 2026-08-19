export type FloatingMediaItem = {
  id: string;
  moduleId: string;
  src: string;
  alt?: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  animation: "none" | "float" | "sway";
  mobileVisible: boolean;
};
