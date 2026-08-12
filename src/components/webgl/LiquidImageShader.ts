import * as THREE from "three";

export const LiquidImageShader = {
  uniforms: {
    uTexture: { value: null },
    uTime: { value: 0 },
    uStrength: { value: 0.9 },
    uHoverStrength: { value: 1.8 },
    uRippleStrength: { value: 1.4 },
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

    // 2D Simplex Noise generator for rich organic water liquid distortion
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
      // Cover-fit UV aspect ratio mapping calculations
      vec2 s = uResolution;
      vec2 i = uImageBounds;
      float rs = s.x / s.y;
      float ri = i.x / i.y;
      vec2 newUv = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
      vec2 offset = (rs < ri ? vec2((newUv.x - s.x) / 2.0, 0.0) : vec2(0.0, (newUv.y - s.y) / 2.0)) / newUv;
      vec2 uv = vUv * s / newUv + offset;

      // 1. Edge Pinning Mask (Pins the outer borders to div card corners so water only ripples INSIDE)
      float edgeX = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
      float edgeY = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
      float edgeFactor = edgeX * edgeY;

      // 2. Aspect-corrected mouse distance & localized water ripple radius
      vec2 aspectUv = uv * vec2(s.x / s.y, 1.0);
      vec2 aspectMouse = uMouse * vec2(s.x / s.y, 1.0);
      float distToMouse = distance(aspectUv, aspectMouse);
      float cursorRadius = smoothstep(0.55, 0.0, distToMouse);

      // 3. Multi-frequency Organic Water Wave Simulation
      float wave1 = snoise(uv * 4.5 + vec2(uTime * 0.6, uTime * 0.5));
      float wave2 = snoise(uv * 9.0 - vec2(uTime * 0.8, uTime * 0.7));
      float organicWater = (wave1 * 0.6 + wave2 * 0.4);

      // 4. Mouse Velocity Vector & Directional Water Push
      float mouseSpeed = length(uMouseVelocity);
      vec2 mouseDirection = mouseSpeed > 0.0001 ? normalize(uMouseVelocity) : vec2(0.0);
      vec2 mousePush = mouseDirection * mouseSpeed * cursorRadius * uHover * uHoverStrength * uRippleStrength * 3.0;

      // 5. Total Organic Liquid Water Displacement
      vec2 waterRipple = (vec2(organicWater, -organicWater) * (0.12 + mouseSpeed * 0.2) + mousePush) * cursorRadius;
      vec2 totalDisplacement = waterRipple * uHover * uStrength * edgeFactor;
      vec2 distortedUv = uv + totalDisplacement;

      // 6. Refraction & Chromatic Aberration Dispersion on Water Wave Peaks
      float displacementMag = length(totalDisplacement);
      float r = texture2D(uTexture, distortedUv + vec2(displacementMag * 0.04, 0.0)).r;
      float g = texture2D(uTexture, distortedUv).g;
      float b = texture2D(uTexture, distortedUv - vec2(displacementMag * 0.04, 0.0)).b;
      float a = texture2D(uTexture, distortedUv).a;

      gl_FragColor = vec4(r, g, b, a);
    }
  `,
};
