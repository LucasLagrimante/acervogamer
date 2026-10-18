import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Color, MathUtils, Mesh, ShaderMaterial } from 'three';

// Valores > 1 nas cores neon fazem o Bloom (threshold 1) brilhar só nelas
const PINK = new Color('#ff2a6d').multiplyScalar(1.6);
const CYAN = new Color('#05d9e8').multiplyScalar(1.3);
const FOG = new Color('#0b0524');

const floorVertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying float vHeight;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec3 p = position;
    // montanhas nas laterais, vale plano no centro onde fica o acervo
    float side = smoothstep(7.0, 22.0, abs(p.x));
    float h = noise(vec2(p.x * 0.18, (p.y + uTime) * 0.18)) * 7.0 + noise(vec2(p.x * 0.5, (p.y + uTime) * 0.5)) * 1.5;
    p.z += h * side;
    vHeight = h * side;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const floorFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLine;
  uniform vec3 uGlow;
  uniform vec3 uFog;
  varying vec3 vWorld;
  varying float vHeight;

  float grid(vec2 p) {
    vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }

  void main() {
    vec2 uv = vec2(vWorld.x, vWorld.z - uTime);
    float line = grid(uv);
    float dist = length(vWorld.xz);
    float fade = exp(-dist * 0.035);
    vec3 base = mix(vec3(0.03, 0.01, 0.08), vec3(0.12, 0.02, 0.18), clamp(vHeight / 6.0, 0.0, 1.0));
    vec3 lineColor = mix(uLine, uGlow, clamp(vHeight / 4.0, 0.0, 1.0));
    vec3 color = base + lineColor * line * fade;
    color = mix(color, uFog, 1.0 - exp(-dist * 0.025));
    gl_FragColor = vec4(color, 1.0);
  }
`;

const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    // listras horizontais que afinam conforme sobem, como no sol synthwave clássico
    float y = vUv.y;
    float stripes = step(0.5, fract(y * 14.0 + uTime * 0.25));
    float cut = y < 0.48 ? mix(stripes, 1.0, smoothstep(0.0, 0.48, y)) : 1.0;
    if (cut < 0.5) discard;
    vec3 top = vec3(1.7, 1.15, 0.12);
    vec3 bottom = vec3(1.5, 0.08, 0.45);
    gl_FragColor = vec4(mix(bottom, top, smoothstep(0.1, 0.9, y)), 1.0);
  }
`;

const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SUN_Y = 5;

// `sunset`: o sol se põe quando a câmera sobe para o mapa
export function Synthwave({ reducedMotion, sunset }: { reducedMotion: boolean; sunset: boolean }) {
  const floor = useMemo(() => new ShaderMaterial({
    vertexShader: floorVertex,
    fragmentShader: floorFragment,
    uniforms: {
      uTime: { value: 0 },
      uLine: { value: PINK },
      uGlow: { value: CYAN },
      uFog: { value: FOG },
    },
  }), []);

  const sun = useMemo(() => new ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: sunFragment,
    uniforms: { uTime: { value: 0 } },
    toneMapped: false,
  }), []);

  const floorMesh = useRef<Mesh<never, ShaderMaterial>>(null);
  const sunMesh = useRef<Mesh<never, ShaderMaterial>>(null);

  useFrame((_, delta) => {
    if (!floorMesh.current || !sunMesh.current) return;
    const sunY = sunset ? -18 : SUN_Y;
    sunMesh.current.position.y = reducedMotion ? sunY : MathUtils.damp(sunMesh.current.position.y, sunY, 1.2, delta);
    if (reducedMotion) return;
    floorMesh.current.material.uniforms.uTime.value += delta * 0.35;
    sunMesh.current.material.uniforms.uTime.value += delta;
  });

  return (
    <group>
      <mesh ref={floorMesh} rotation-x={-Math.PI / 2} material={floor}>
        <planeGeometry args={[140, 140, 140, 140]} />
      </mesh>
      <mesh ref={sunMesh} position={[0, SUN_Y, -75]} material={sun}>
        <planeGeometry args={[34, 34]} />
      </mesh>
      <Stars radius={90} depth={40} count={2500} factor={4} saturation={0.4} fade speed={reducedMotion ? 0 : 0.6} />
    </group>
  );
}
