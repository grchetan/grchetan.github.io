import * as THREE from "three";

export const LiquidImageShader = {
  uniforms: {
    uTexture: { value: null },
    uTime: { value: 0 },
    uStrength: { value: 0.7 },
    uHoverStrength: { value: 1.5 },
    uRippleStrength: { value: 1.2 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uPreviousMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseVelocity: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uImageBounds: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uStrength;
    uniform float uHoverStrength;
    uniform float uRippleStrength;
    uniform vec2 uMouse;
    uniform vec2 uPreviousMouse;
    uniform vec2 uMouseVelocity;
    uniform float uHover;
    uniform vec2 uResolution;
    uniform vec2 uImageBounds;

    varying vec2 vUv;

    // 2D Simplex Noise generator for organic liquid water surface distortion
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // Direct 1:1 UV mapping — Displays FULL image completely without any cropping or zooming
      vec2 uv = vUv;

      // 1. Edge Pinning Mask (Pins borders to div card corners so water stays inside)
      float edgeX = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
      float edgeY = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
      float edgeFactor = edgeX * edgeY;

      // 2. Compact Localized Cursor Water Touch Radius
      vec2 aspectUv = uv * vec2(uResolution.x / uResolution.y, 1.0);
      vec2 aspectMouse = uMouse * vec2(uResolution.x / uResolution.y, 1.0);
      float distToMouse = distance(aspectUv, aspectMouse);
      
      // Focused water ripple directly around mouse cursor
      float cursorRadius = smoothstep(0.25, 0.0, distToMouse);

      // 3. Fluid Water Wave Surface Displacement
      float wave1 = snoise(uv * 7.0 + vec2(uTime * 0.7, uTime * 0.6));
      float wave2 = snoise(uv * 12.0 - vec2(uTime * 0.9, uTime * 0.8));
      float organicWater = (wave1 * 0.65 + wave2 * 0.35);

      // 4. Directional Cursor Water Velocity Push
      float mouseSpeed = length(uMouseVelocity);
      vec2 mouseDirection = mouseSpeed > 0.0001 ? normalize(uMouseVelocity) : vec2(0.0);
      vec2 mousePush = mouseDirection * mouseSpeed * cursorRadius * uHover * uHoverStrength * uRippleStrength * 2.2;

      // 5. Total Smooth Water Liquid Displacement
      vec2 waterRipple = (vec2(organicWater, -organicWater) * 0.08 + mousePush) * cursorRadius;
      vec2 totalDisplacement = waterRipple * uHover * uStrength * edgeFactor;
      vec2 distortedUv = uv + totalDisplacement;

      // 6. Clean Liquid Refraction (Subtle dispersion for clean water effect)
      float displacementMag = length(totalDisplacement);
      float r = texture2D(uTexture, distortedUv + vec2(displacementMag * 0.012, 0.0)).r;
      float g = texture2D(uTexture, distortedUv).g;
      float b = texture2D(uTexture, distortedUv - vec2(displacementMag * 0.012, 0.0)).b;
      float a = texture2D(uTexture, distortedUv).a;

      gl_FragColor = vec4(r, g, b, a);
    }
  `,
};
