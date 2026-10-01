import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { Part } from "./PartLabel";

// Compact kiosk substation 10kV/0,4kV — scaled from the reference photo.
// Overall: 3.5 m wide, 2.5 m tall (incl. roof), ~2.2 m deep.
const W = 3.5;
const H = 2.32; // cabinet body height (roof adds the rest -> ~2.5 m total)
const D = 2.2;

const PLINTH_H = 0.12;
const PLINTH_OVER = 0.08; // plinth sticks out around the body
const ROOF_H = 0.16;
const ROOF_OVER = 0.14;

const BODY = "#dedbd4"; // light grey RAL 7035-ish
const BODY_DARK = "#c9c6bf";
const ROOF_COLOR = "#e6e4de";
const PLINTH = "#2f2f2f";
const METAL = "#9aa0a6";
const DARK_METAL = "#4a4a4a";
const COPPER = "#b87333";

const GROUND_RING_DEPTH = 0.5;
const GROUND_RING_R = 2.6;
const ROD_LENGTH = 2.0;

function Plinth() {
  return (
    <group>
      <mesh position={[0, PLINTH_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + PLINTH_OVER * 2, PLINTH_H, D + PLINTH_OVER * 2]} />
        <meshStandardMaterial color={PLINTH} roughness={0.85} />
      </mesh>
      {/* concrete pad flush with ground */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W + 0.8, D + 0.8]} />
        <meshStandardMaterial color="#8d8a83" roughness={1} />
      </mesh>
    </group>
  );
}

function Louver({
  position,
  width,
  height,
}: {
  position: [number, number, number];
  width: number;
  height: number;
}) {
  const rows = Math.max(3, Math.round(height / 0.055));
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#b7b4ad" roughness={0.8} />
      </mesh>
      {Array.from({ length: rows }).map((_, i) => (
        <mesh key={i} position={[0, height / 2 - (i + 0.5) * (height / rows), 0.004]}>
          <planeGeometry args={[width * 0.96, height / rows * 0.42]} />
          <meshStandardMaterial color="#6f6c66" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Body() {
  const y0 = PLINTH_H;
  return (
    <group position={[0, y0, 0]}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={BODY} metalness={0.15} roughness={0.75} />
      </mesh>
    </group>
  );
}

function Roof() {
  const y = PLINTH_H + H;
  return (
    <group>
      <mesh position={[0, y + ROOF_H / 2, 0]} castShadow>
        <boxGeometry args={[W + ROOF_OVER * 2, ROOF_H, D + ROOF_OVER * 2]} />
        <meshStandardMaterial color={ROOF_COLOR} metalness={0.2} roughness={0.6} />
      </mesh>
      {/* thin drip edge */}
      <mesh position={[0, y + 0.01, 0]}>
        <boxGeometry args={[W + ROOF_OVER * 2 + 0.02, 0.02, D + ROOF_OVER * 2 + 0.02]} />
        <meshStandardMaterial color="#b9b6af" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Doors() {
  const zFront = D / 2 + 0.004;
  const doorH = H - 0.14;
  const doorY = PLINTH_H + doorH / 2 + 0.06;
  // Front face: two wide LV doors in the middle, a narrow MV door on the right.
  const doors: { x: number; w: number }[] = [
    { x: -W / 2 + 0.42, w: 0.72 },
    { x: -W / 2 + 1.2, w: 0.72 },
    { x: -W / 2 + 1.96, w: 0.72 },
    { x: W / 2 - 0.42, w: 0.7 },
  ];
  return (
    <group>
      {doors.map((d, i) => (
        <group key={i}>
          {/* recessed door panel */}
          <mesh position={[d.x, doorY, zFront]}>
            <planeGeometry args={[d.w, doorH]} />
            <meshStandardMaterial color={BODY_DARK} roughness={0.78} />
          </mesh>
          {/* handle / lock */}
          <mesh
            position={[d.x + d.w / 2 - 0.07, doorY + 0.15, zFront + 0.01]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.022, 0.022, 0.03, 14]} />
            <meshStandardMaterial color={DARK_METAL} metalness={0.8} roughness={0.35} />
          </mesh>
          {/* hinges */}
          {[-0.35, 0.35].map((dy) => (
            <mesh key={dy} position={[d.x - d.w / 2 + 0.02, doorY + dy, zFront + 0.008]}>
              <boxGeometry args={[0.03, 0.09, 0.02]} />
              <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ventilation louvers low on the two centre doors */}
      <Louver position={[-W / 2 + 1.2, PLINTH_H + 0.42, zFront + 0.012]} width={0.52} height={0.5} />
      <Louver position={[-W / 2 + 1.96, PLINTH_H + 0.42, zFront + 0.012]} width={0.52} height={0.5} />
      {/* Side louver */}
      <group position={[W / 2 + 0.006, PLINTH_H + 0.9, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Louver position={[0, 0, 0]} width={0.7} height={0.5} />
      </group>

      {/* Warning / rating plates on the upper front */}
      <mesh position={[-W / 2 + 0.42, PLINTH_H + H - 0.34, zFront + 0.014]}>
        <circleGeometry args={[0.055, 3]} />
        <meshStandardMaterial color="#f5c518" />
      </mesh>
      {[0.9, 1.66, 2.4].map((x) => (
        <mesh key={x} position={[-W / 2 + x, PLINTH_H + H - 0.34, zFront + 0.014]}>
          <planeGeometry args={[0.16, 0.1]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function GroundingRing() {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segs = 72;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push([
        Math.cos(a) * GROUND_RING_R,
        -GROUND_RING_DEPTH,
        Math.sin(a) * GROUND_RING_R * 0.8,
      ]);
    }
    return pts;
  }, []);
  return <Line points={points} color={COPPER} lineWidth={3} />;
}

function GroundingRod() {
  const x = GROUND_RING_R;
  const topY = -GROUND_RING_DEPTH + 0.05;
  return (
    <group>
      <mesh position={[x, topY - ROD_LENGTH / 2, 0]}>
        <cylinderGeometry args={[0.014, 0.005, ROD_LENGTH, 12]} />
        <meshStandardMaterial color={COPPER} metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[x, -GROUND_RING_DEPTH, 0]}>
        <torusGeometry args={[0.03, 0.007, 8, 16]} />
        <meshStandardMaterial color="#7a4a20" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  );
}

function GroundingConductor() {
  const start: [number, number, number] = [W / 2 - 0.1, PLINTH_H + 0.25, D / 2 - 0.05];
  const mid: [number, number, number] = [W / 2 + 0.1, -0.15, D / 2 - 0.05];
  const end: [number, number, number] = [
    Math.cos(Math.PI / 5) * GROUND_RING_R,
    -GROUND_RING_DEPTH,
    Math.sin(Math.PI / 5) * GROUND_RING_R * 0.8,
  ];
  return <Line points={[start, mid, end]} color={COPPER} lineWidth={2.5} />;
}

export const SUBSTATION_STEPS = [
  "Grounding rod",
  "Grounding ring",
  "Concrete foundation plinth",
  "Substation enclosure",
  "Roof, doors & ventilation",
];

export function Substation({ step = SUBSTATION_STEPS.length }: { step?: number }) {
  return (
    <group>
      {step >= 1 && (
        <Part name="Grounding rod">
          <GroundingRod />
        </Part>
      )}
      {step >= 2 && (
        <Part name="Grounding ring">
          <GroundingRing />
        </Part>
      )}
      {step >= 3 && (
        <Part name="Foundation plinth">
          <Plinth />
        </Part>
      )}
      {step >= 4 && (
        <>
          <Part name="Substation enclosure">
            <Body />
          </Part>
          <Part name="Grounding conductor">
            <GroundingConductor />
          </Part>
        </>
      )}
      {step >= 5 && (
        <>
          <Part name="Roof">
            <Roof />
          </Part>
          <Part name="Access doors & ventilation">
            <Doors />
          </Part>
        </>
      )}
    </group>
  );
}
