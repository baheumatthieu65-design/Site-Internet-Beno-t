export type FloatingMediaItem = {
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
