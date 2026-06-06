import { useMemo } from "react";
import * as THREE from "three";
import { CatmullRomLine } from "@react-three/drei";

const WOOD_LIGHT = "#c9a777";
const WOOD_DARK = "#8a6a3f";
const INSULATOR_RED = "#8b1a1a";
const METAL = "#3a3a3a";

const MAST_HEIGHT = 10;
const MAST_RADIUS = 0.18;
const CROSSARM_LENGTH = 3.2;
const CROSSARM_HEIGHT = 9.6;

function Pole({
  from,
  to,
  radius = MAST_RADIUS,
  color = WOOD_LIGHT,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    return { position: mid, quaternion: q, length: len };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 1.05, length, 16]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Insulator({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.16 + i * 0.13, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.18, 0.1, 16]} />
          <meshStandardMaterial color={INSULATOR_RED} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function PhaseLine({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const points = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const segments = 20;
    const span = a.distanceTo(b);
    const sag = Math.min(0.6, span * 0.04);
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      const s = 4 * t * (1 - t);
      p.y -= sag * s;
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, [start, end]);

  return (
    <CatmullRomLine
      points={points}
      color="#1a1a1a"
      lineWidth={1.8}
      segments={32}
    />
  );
}

export function ElectricalPost({ step = 4 }: { step?: number }) {
  const mainTop: [number, number, number] = [0, MAST_HEIGHT, 0];
  const mainBottom: [number, number, number] = [0, 0, 0];
  const braceBottom: [number, number, number] = [-1.8, 0, 0];
  const braceTop: [number, number, number] = [-0.25, MAST_HEIGHT - 0.5, 0];

  const crossarmY = CROSSARM_HEIGHT;
  const crossarmStart: [number, number, number] = [0, crossarmY, -CROSSARM_LENGTH / 2];
  const crossarmEnd: [number, number, number] = [0, crossarmY, CROSSARM_LENGTH / 2];

  const phasePositions: [number, number, number][] = [
    [0, crossarmY + 0.12, -CROSSARM_LENGTH / 2 + 0.2],
    [0, crossarmY + 0.12, 0],
    [0, crossarmY + 0.12, CROSSARM_LENGTH / 2 - 0.2],
  ];

  const wireY = crossarmY + 0.7;

  return (
    <group>
      {/* Step 1: Main mast */}
      <Pole from={mainBottom} to={mainTop} color={WOOD_LIGHT} />

      {/* Step 2: Brace / support pole + crossarm */}
      {step >= 2 && (
        <>
          <Pole from={braceBottom} to={braceTop} radius={0.16} color={WOOD_DARK} />
          <Pole
            from={crossarmStart}
            to={crossarmEnd}
            radius={0.09}
            color={WOOD_DARK}
          />
          <mesh position={[0, crossarmY, 0]} castShadow>
            <torusGeometry args={[MAST_RADIUS + 0.03, 0.025, 8, 24]} />
            <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, crossarmY - 0.6, 0]} castShadow>
            <torusGeometry args={[MAST_RADIUS + 0.03, 0.02, 8, 24]} />
            <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
          </mesh>
        </>
      )}

      {/* Step 3: Insulators */}
      {step >= 3 &&
        phasePositions.map((p, i) => <Insulator key={i} position={p} />)}

      {/* Step 4: Phase lines */}
      {step >= 4 &&
        phasePositions.map((p, i) => {
          const wireStart: [number, number, number] = [p[0], wireY, p[2]];
          const left: [number, number, number] = [-18, wireY - 1.5, p[2]];
          const right: [number, number, number] = [18, wireY - 1.2, p[2]];
          return (
            <group key={`wire-${i}`}>
              <PhaseLine start={left} end={wireStart} />
              <PhaseLine start={wireStart} end={right} />
            </group>
          );
        })}
    </group>
  );
}

export const ASSEMBLY_STEPS = [
  "Vertical mast",
  "Support pole & crossarm",
  "Ceramic insulators",
  "Phase conductors",
];
