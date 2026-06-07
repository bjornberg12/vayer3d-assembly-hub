import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

// Dimensions (meters) inferred from reference drawing
const BODY_W = 0.5;
const BODY_D = 0.32;
const BODY_H = 1.0; // upper cabinet height
const BRACKET_H = 0.4; // metallic mounting bracket
const ABOVE_GROUND_BRACKET = 0.2; // bracket portion above ground
const BELOW_GROUND_BRACKET = BRACKET_H - ABOVE_GROUND_BRACKET; // 0.2m below

const BODY_COLOR = "#d9d6cf"; // light grey / RAL 7035-ish
const METAL_COLOR = "#9aa0a6";
const COPPER = "#b87333";

const GROUND_RING_DEPTH = 0.3; // 0.3m below ground
const GROUND_RING_RADIUS = 1.2;
const ROD_LENGTH = 1.5;

function Bracket() {
  // Centered at ground (y=0): top at +ABOVE_GROUND_BRACKET, bottom at -BELOW_GROUND_BRACKET
  const cy = (ABOVE_GROUND_BRACKET - BELOW_GROUND_BRACKET) / 2;
  return (
    <group>
      <mesh position={[0, cy, 0]} castShadow receiveShadow>
        <boxGeometry args={[BODY_W * 0.95, BRACKET_H, BODY_D * 0.95]} />
        <meshStandardMaterial color={METAL_COLOR} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* bolt heads on front */}
      {[-0.15, 0.15].map((x) =>
        [-0.1, 0.1].map((y) => (
          <mesh
            key={`${x}-${y}`}
            position={[x, cy + y, BODY_D * 0.475 + 0.005]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.012, 12]} />
            <meshStandardMaterial color="#5a5e63" metalness={0.9} roughness={0.4} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Body() {
  const baseY = ABOVE_GROUND_BRACKET;
  return (
    <group position={[0, baseY, 0]}>
      {/* main cabinet */}
      <mesh position={[0, BODY_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BODY_W, BODY_H, BODY_D]} />
        <meshStandardMaterial color={BODY_COLOR} metalness={0.2} roughness={0.7} />
      </mesh>
      {/* roof cap */}
      <mesh position={[0, BODY_H + 0.012, 0]} castShadow>
        <boxGeometry args={[BODY_W + 0.04, 0.024, BODY_D + 0.04]} />
        <meshStandardMaterial color={BODY_COLOR} metalness={0.25} roughness={0.6} />
      </mesh>
      {/* door seam (recessed front panel) */}
      <mesh position={[0, BODY_H / 2, BODY_D / 2 + 0.001]}>
        <planeGeometry args={[BODY_W * 0.9, BODY_H * 0.95]} />
        <meshStandardMaterial color="#c9c6bf" metalness={0.2} roughness={0.75} />
      </mesh>
      {/* lock */}
      <mesh position={[0, BODY_H - 0.12, BODY_D / 2 + 0.004]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01, 16]} rotateX={Math.PI / 2} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* hazard label (yellow triangle) */}
      <mesh position={[0, BODY_H - 0.28, BODY_D / 2 + 0.003]}>
        <circleGeometry args={[0.05, 3]} />
        <meshStandardMaterial color="#f5c518" />
      </mesh>
      {/* grounding wire stub from body down to bracket (green/yellow) */}
      <mesh position={[BODY_W / 2 - 0.04, -0.05, BODY_D / 2 - 0.02]}>
        <cylinderGeometry args={[0.006, 0.006, 0.18, 8]} />
        <meshStandardMaterial color="#e7c200" />
      </mesh>
    </group>
  );
}

function GroundingRing() {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segs = 64;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push([Math.cos(a) * GROUND_RING_RADIUS, -GROUND_RING_DEPTH, Math.sin(a) * GROUND_RING_RADIUS]);
    }
    return pts;
  }, []);
  return <Line points={points} color={COPPER} lineWidth={3} />;
}

function GroundingRod() {
  // vertical rod from ring depth going down ROD_LENGTH
  const rodX = GROUND_RING_RADIUS;
  const rodZ = 0;
  const topY = -GROUND_RING_DEPTH + 0.05;
  const cy = topY - ROD_LENGTH / 2;
  return (
    <group>
      <mesh position={[rodX, cy, rodZ]}>
        <cylinderGeometry args={[0.012, 0.004, ROD_LENGTH, 12]} />
        <meshStandardMaterial color={COPPER} metalness={0.8} roughness={0.35} />
      </mesh>
      {/* clamp to ring */}
      <mesh position={[rodX, -GROUND_RING_DEPTH, rodZ]}>
        <torusGeometry args={[0.025, 0.006, 8, 16]} />
        <meshStandardMaterial color="#7a4a20" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  );
}

function GroundingConnection() {
  // copper wire from panel bracket down into earth to the ring
  const start: [number, number, number] = [BODY_W / 2 - 0.05, ABOVE_GROUND_BRACKET - 0.05, BODY_D / 2 - 0.02];
  const ringPoint: [number, number, number] = [
    Math.cos(Math.PI / 6) * GROUND_RING_RADIUS,
    -GROUND_RING_DEPTH,
    Math.sin(Math.PI / 6) * GROUND_RING_RADIUS,
  ];
  const mid: [number, number, number] = [start[0] + 0.05, -0.05, start[2] + 0.05];
  return <Line points={[start, mid, ringPoint]} color={COPPER} lineWidth={2.5} />;
}

export function DistributionPanel() {
  return (
    <group>
      <Bracket />
      <Body />
      <GroundingRing />
      <GroundingRod />
      <GroundingConnection />
    </group>
  );
}
