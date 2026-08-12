import * as THREE from "three";

export const LiquidImageShader = {
  uniforms: {
    uTexture: { value: null },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uStrength: { value: 0.65 },
    uHoverStrength: { value: 1.2 },
    uScrollStrength: { value: 0.55 },
    uRippleStrength: { value: 1.0 },
    uVelocity: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uPreviousMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseVelocity: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uImageBounds: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    uniform float uVelocity;
    uniform float uScrollStrength;
    uniform float uTime;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Vertical mesh wave curve based on scroll velocity
      float wave = sin(pos.y * 3.5 + uTime * 2.5) * uVelocity * uScrollStrength * 0.08;
      pos.z += wave;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uStrength;
    uniform float uHoverStrength;
    uniform float uScrollStrength;
    uniform float uRippleStrength;
    uniform float uVelocity;
    uniform vec2 uMouse;
    uniform vec2 uPreviousMouse;
    uniform vec2 uMouseVelocity;
    uniform float uHover;
    uniform vec2 uResolution;
    uniform vec2 uImageBounds;

    varying vec2 vUv;

    // 2D Simplex Noise generator for organic liquid fluid distortion
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

      // 1. Localized Mouse Falloff Field
      vec2 aspectUv = uv * vec2(s.x / s.y, 1.0);
      vec2 aspectMouse = uMouse * vec2(s.x / s.y, 1.0);
      float distToMouse = distance(aspectUv, aspectMouse);
      
      // Radius of liquid interaction around cursor (0.45 aspect units wide)
      float cursorRadius = smoothstep(0.48, 0.0, distToMouse);

      // 2. Mouse Velocity Directional Push
      float mouseSpeed = length(uMouseVelocity);
      vec2 mouseDirection = mouseSpeed > 0.001 ? normalize(uMouseVelocity) : vec2(0.0);
      vec2 mousePush = mouseDirection * mouseSpeed * cursorRadius * uHover * uHoverStrength * uRippleStrength * 1.8;

      // 3. Multi-frequency Organic Water Wave Noise
      float wave1 = snoise(uv * 4.0 + vec2(uTime * 0.5, uTime * 0.4));
      float wave2 = snoise(uv * 8.0 - vec2(uTime * 0.7, uTime * 0.6));
      float organicNoise = (wave1 * 0.65 + wave2 * 0.35);

      // 4. Cursor Fluid Ripple Displacement
      vec2 mouseDisplacement = (vec2(organicNoise, -organicNoise) * 0.15 + mousePush) * cursorRadius * uHover * uHoverStrength;

      // 5. Scroll Velocity Liquid Stretch
      vec2 scrollDisplacement = vec2(
        organicNoise * uVelocity * uScrollStrength * 0.1,
        snoise(uv * 3.5 + uTime * 0.6) * uVelocity * uScrollStrength * 0.18 + (uVelocity * uScrollStrength * 0.05)
      );

      // 6. Combined UV Distortion Offset
      vec2 finalDistortion = (mouseDisplacement + scrollDisplacement) * uStrength;
      vec2 distortedUv = uv + finalDistortion;

      // 7. Chromatic Aberration Dispersion on Peak Distortion
      float distortionMag = length(finalDistortion);
      float r = texture2D(uTexture, distortedUv + vec2(distortionMag * 0.025, 0.0)).r;
      float g = texture2D(uTexture, distortedUv).g;
      float b = texture2D(uTexture, distortedUv - vec2(distortionMag * 0.025, 0.0)).b;
      float a = texture2D(uTexture, distortedUv).a;

      gl_FragColor = vec4(r, g, b, a);
    }
  `,
};
