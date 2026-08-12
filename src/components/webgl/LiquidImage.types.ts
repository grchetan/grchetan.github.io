import * as THREE from "three";

export interface LiquidImageProps {
  src: string;
  alt?: string;
  className?: string;
  intensity?: number;
  hoverStrength?: number;
  rippleStrength?: number;
  aspectRatio?: number;
  skeletonHeight?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export interface LiquidShaderUniforms {
  uTexture: { value: THREE.Texture | null };
  uTime: { value: number };
  uStrength: { value: number };
  uHoverStrength: { value: number };
  uRippleStrength: { value: number };
  uMouse: { value: THREE.Vector2 };
  uPreviousMouse: { value: THREE.Vector2 };
  uMouseVelocity: { value: THREE.Vector2 };
  uHover: { value: number };
  uResolution: { value: THREE.Vector2 };
  uImageBounds: { value: THREE.Vector2 };
}
