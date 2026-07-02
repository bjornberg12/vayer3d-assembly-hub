import { useMemo } from "react";
import * as THREE from "three";
import { CatmullRomLine } from "@react-three/drei";

// Scale (meters) — 20 kV overhead line wooden mast (Elektrilevi P339-20)
const MAST_ABOVE = 11;
const MAST_BURIED = 1.8;
const MAST_TOTAL = MAST_ABOVE + MAST_BURIED;
const MAST_R_TOP = 0.12;
const MAST_R_BASE = 0.18;

const HOLE_RADIUS = 0.45;
const HOLE_DEPTH = MAST_BURIED;

const CROSSARM_LEN = 2.4;
const CROSSARM_Y = MAST_ABOVE - 0.3;

const WOOD_LIGHT = "#c9a777";
const WOOD_DARK = "#8a6a3f";
const METAL = "#4a4a4a";
const METAL_LIGHT = "#9aa0a6";
const INSULATOR = "#c9c4bb"; // ceramic grey
const ARRESTER = "#3a3a3a";
const CABLE = "#1a1a1a";
const DIRT = "#5a4630";
const HOLE_COLOR = "#3b2f22";

const SPAN = 30; // distance to next mast (typical span)
const NEXT_MAST_X = SPAN;

function Mast({
  position = [0, 0, 0] as [number, number, number],
  buried = true,
}: {
  position?: [number, number, number];
  buried?: boolean;
}) {
  const h = buried ? MAST_TOTAL : MAST_ABOVE;
  const yCenter = buried ? MAST_ABOVE / 2 - MAST_BURIED / 2 : MAST_ABOVE / 2;
  return (
    <mesh position={[position[0], yCenter + position[1], position[2]]} castShadow receiveShadow>
      <cylinderGeometry args={[MAST_R_TOP, MAST_R_BASE, h, 20]} />
      <meshStandardMaterial color={WOOD_LIGHT} roughness={0.9} />
    </mesh>
  );
}

function Hole() {
  return (
    <group>
      {/* Dark hole interior */}
      <mesh position={[0, -HOLE_DEPTH / 2, 0]} receiveShadow>
        <cylinderGeometry args={[HOLE_RADIUS, HOLE_RADIUS * 0.85, HOLE_DEPTH, 24, 1, true]} />
        <meshStandardMaterial color={HOLE_COLOR} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Hole bottom */}
      <mesh position={[0, -HOLE_DEPTH + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[HOLE_RADIUS * 0.85, 24]} />
        <meshStandardMaterial color={HOLE_COLOR} roughness={1} />
      </mesh>
      {/* Dirt pile next to hole */}
      <mesh position={[-1.4, 0.25, 0.6]} castShadow receiveShadow>
        <coneGeometry args={[0.9, 0.5, 16]} />
        <meshStandardMaterial color={DIRT} roughness={1} />
      </mesh>
      <mesh position={[-1.2, 0.15, -0.7]} castShadow receiveShadow>
        <coneGeometry args={[0.7, 0.3, 16]} />
        <meshStandardMaterial color={DIRT} roughness={1} />
      </mesh>
    </group>
  );
}

function Insulator({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pin */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Ceramic sheds (3 discs) */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.18 + i * 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.14, 0.09, 16]} />
          <meshStandardMaterial color={INSULATOR} roughness={0.5} />
        </mesh>
      ))}
      {/* Top cap */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function SurgeArrester({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Mounting bracket */}
      <mesh position={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[0.08, 0.06, 0.16]} />
        <meshStandardMaterial color={METAL_LIGHT} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Body — polymer housing with sheds */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.08 + i * 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.07, 14]} />
          <meshStandardMaterial color={ARRESTER} roughness={0.6} />
        </mesh>
      ))}
      {/* Top terminal */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 10]} />
        <meshStandardMaterial color={METAL_LIGHT} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Crossarm() {
  return (
    <group>
      {/* Horizontal steel crossarm */}
      <mesh position={[0, CROSSARM_Y, 0]} castShadow>
        <boxGeometry args={[0.08, 0.08, CROSSARM_LEN]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Diagonal braces */}
      {[-1, 1].map((s) => {
        const from = new THREE.Vector3(0, CROSSARM_Y - 0.04, s * (CROSSARM_LEN / 2 - 0.2));
        const to = new THREE.Vector3(0, CROSSARM_Y - 0.9, 0);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        const dir = to.clone().sub(from);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );
        return (
          <mesh key={s} position={mid} quaternion={q} castShadow>
            <cylinderGeometry args={[0.02, 0.02, len, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}
      {/* U-bolts around mast */}
      {[-0.05, 0.05].map((dy) => (
        <mesh key={dy} position={[0, CROSSARM_Y + dy, 0]} castShadow>
          <torusGeometry args={[MAST_R_TOP + 0.03, 0.012, 8, 20]} />
          <meshStandardMaterial color={METAL_LIGHT} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function ArresterBracket() {
  const y = MAST_ABOVE - 2.2;
  return (
    <group>
      <mesh position={[0, y, 0]} castShadow>
        <boxGeometry args={[0.08, 0.06, 1.0]} />
        <meshStandardMaterial color={METAL_LIGHT} metalness={0.7} roughness={0.4} />
      </mesh>
      {[-0.05, 0.05].map((dy) => (
        <mesh key={dy} position={[0, y + dy, 0]} castShadow>
          <torusGeometry args={[MAST_R_TOP + 0.05, 0.012, 8, 20]} />
          <meshStandardMaterial color={METAL_LIGHT} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function CableDown() {
  // Cable running from bottom to termination (~2.3m from ground)
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const startY = -HOLE_DEPTH + 0.2;
    const endY = MAST_ABOVE - 3.0;
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = startY + (endY - startY) * t;
      const offset = MAST_R_BASE + 0.05;
      pts.push([offset, y, 0.02]);
    }
    return pts;
  }, []);
  return (
    <group>
      <CatmullRomLine points={points} color={CABLE} lineWidth={3.5} segments={40} />
      {/* Distance nail clamps ~every 0.4m */}
      {Array.from({ length: 22 }).map((_, i) => {
        const y = 0.3 + i * 0.45;
        if (y > MAST_ABOVE - 3.2) return null;
        return (
          <mesh key={i} position={[MAST_R_BASE + 0.02, y, 0]} castShadow>
            <boxGeometry args={[0.06, 0.03, 0.08]} />
            <meshStandardMaterial color={METAL_LIGHT} metalness={0.6} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function CableTermination() {
  const y = MAST_ABOVE - 2.9;
  return (
    <group position={[MAST_R_TOP + 0.08, y, 0]}>
      {/* Cone-shaped termination body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.5, 14]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
      </mesh>
      {/* Sheds */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.1 + i * 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 14]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </mesh>
      ))}
      {/* Top lug */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        <meshStandardMaterial color={METAL_LIGHT} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ConnectingJumper({
  from,
  to,
  sag = 0.05,
}: {
  from: [number, number, number];
  to: [number, number, number];
  sag?: number;
}) {
  const points = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const segs = 16;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y -= sag * 4 * t * (1 - t);
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, [from, to, sag]);
  return <CatmullRomLine points={points} color={CABLE} lineWidth={2} segments={28} />;
}

function AerialLine({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const points = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const segs = 32;
    const span = a.distanceTo(b);
    const sag = Math.min(1.2, span * 0.03);
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y -= sag * 4 * t * (1 - t);
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, [start, end]);
  return <CatmullRomLine points={points} color={CABLE} lineWidth={2} segments={48} />;
}

// Phase positions on top crossarm
const phaseOffsets: [number, number, number][] = [
  [0, CROSSARM_Y + 0.08, -CROSSARM_LEN / 2 + 0.15],
  [0, CROSSARM_Y + 0.08, 0],
  [0, CROSSARM_Y + 0.08, CROSSARM_LEN / 2 - 0.15],
];

// Wire attach points (top of insulators)
const wireTops: [number, number, number][] = phaseOffsets.map((p) => [
  p[0],
  p[1] + 0.55,
  p[2],
]);

// Arrester positions (below crossarm, on secondary bracket)
const arresterOffsets: [number, number, number][] = [
  [0, MAST_ABOVE - 2.2 + 0.03, -0.4],
  [0, MAST_ABOVE - 2.2 + 0.03, 0],
  [0, MAST_ABOVE - 2.2 + 0.03, 0.4],
];

export function WoodenMast20kV({ step = 6 }: { step?: number }) {
  return (
    <group>
      {/* Step 1: dig the hole */}
      {step >= 1 && step < 2 && <Hole />}

      {/* Step 2+: mast placed (hole filled) */}
      {step >= 2 && <Mast />}

      {/* Step 3: metal crossarm + arrester bracket */}
      {step >= 3 && (
        <>
          <Crossarm />
          <ArresterBracket />
        </>
      )}

      {/* Step 4: insulators + surge arresters */}
      {step >= 4 && (
        <>
          {phaseOffsets.map((p, i) => (
            <Insulator key={`ins-${i}`} position={p} />
          ))}
          {arresterOffsets.map((p, i) => (
            <SurgeArrester key={`arr-${i}`} position={p} />
          ))}
        </>
      )}

      {/* Step 5: cable connected to the line (down the mast + termination + jumpers) */}
      {step >= 5 && (
        <>
          <CableDown />
          <CableTermination />
          {/* Jumper from termination up to middle phase, then to arrester */}
          <ConnectingJumper
            from={[MAST_R_TOP + 0.08, MAST_ABOVE - 2.9 + 0.6, 0]}
            to={wireTops[1]}
          />
          <ConnectingJumper
            from={[MAST_R_TOP + 0.08, MAST_ABOVE - 2.9 + 0.6, 0]}
            to={[arresterOffsets[1][0], arresterOffsets[1][1] + 0.6, arresterOffsets[1][2]]}
            sag={0.02}
          />
        </>
      )}

      {/* Step 6: aerial line spanning to next mast */}
      {step >= 6 && (
        <>
          {/* Second mast (simplified) */}
          <group position={[NEXT_MAST_X, 0, 0]}>
            <Mast />
            <group>
              <mesh position={[0, CROSSARM_Y, 0]} castShadow>
                <boxGeometry args={[0.08, 0.08, CROSSARM_LEN]} />
                <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />
              </mesh>
              {phaseOffsets.map((p, i) => (
                <Insulator key={`ins2-${i}`} position={p} />
              ))}
            </group>
          </group>
          {/* Three phase conductors */}
          {wireTops.map((p, i) => (
            <AerialLine
              key={`line-${i}`}
              start={p}
              end={[NEXT_MAST_X + p[0], p[1], p[2]]}
            />
          ))}
        </>
      )}
    </group>
  );
}

export const MAST_20KV_STEPS = [
  "Dig 1.8 m foundation hole",
  "Place wooden mast",
  "Install metal crossarm & brackets",
  "Mount insulators & surge arresters",
  "Connect cable to the line",
  "String aerial line to next mast",
];
