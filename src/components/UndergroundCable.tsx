import { useMemo } from "react";
import * as THREE from "three";
import { Part } from "./PartLabel";

// ---------------------------------------------------------------------------
// Low voltage underground cable (4-core: L1, L2, L3, PEN)
// ---------------------------------------------------------------------------

export type CableSizeId = "70" | "95" | "120" | "240";

export const CABLE_SIZES: {
  id: CableSizeId;
  area: number; // mm² per conductor
  label: string;
  coreD: number; // conductor diameter in meters
  outerD: number; // cable outer diameter in meters
}[] = [
  { id: "70", area: 70, label: "4×70 mm²", coreD: 0.0094, outerD: 0.04 },
  { id: "95", area: 95, label: "4×95 mm²", coreD: 0.011, outerD: 0.045 },
  { id: "120", area: 120, label: "4×120 mm²", coreD: 0.0124, outerD: 0.05 },
  { id: "240", area: 240, label: "4×240 mm²", coreD: 0.0175, outerD: 0.065 },
];

export type ConduitId = "none" | "750N" | "1250N";

export const CONDUITS: { id: ConduitId; label: string; subtitle: string; outerD: number }[] = [
  { id: "none", label: "No conduit", subtitle: "Cable laid in sand bed", outerD: 0 },
  { id: "750N", label: "Conduit 750N", subtitle: "Ø110 mm yellow PVC, light duty", outerD: 0.11 },
  { id: "1250N", label: "Conduit 1250N", subtitle: "Ø160 mm yellow PVC, heavy duty", outerD: 0.16 },
];

// Core colours: L1 brown, L2 black, L3 grey, PEN blue
const CORES: { name: string; color: string }[] = [
  { name: "L1", color: "#7a4a20" },
  { name: "L2", color: "#26262a" },
  { name: "L3", color: "#9aa0a6" },
  { name: "PEN", color: "#2f6fd0" },
];

const TRENCH_DEPTH = 0.7; // m below ground, typical LV burial depth
const CONDUIT_COLOR = "#e0b400";

export type CableSpec = {
  size: CableSizeId;
  conduit: ConduitId;
};

function routePoints(
  from: [number, number, number],
  to: [number, number, number],
  depth: number
): THREE.Vector3[] {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const aDown = new THREE.Vector3(a.x, -depth, a.z);
  const bDown = new THREE.Vector3(b.x, -depth, b.z);
  const dir = new THREE.Vector3().subVectors(bDown, aDown);
  const len = dir.length() || 1;
  dir.normalize();

  // Gradual bends: descend/ascend diagonally (like a real trench sweep,
  // roughly 30-40°) instead of dropping vertically at 90°.
  const pts: THREE.Vector3[] = [a.clone()];
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // ease the vertical drop while drifting along the run direction
    const drop = depth * t * t * (3 - 2 * t); // smoothstep
    const drift = Math.min(len * 0.12, depth * 0.9) * t * t * (3 - 2 * t);
    pts.push(
      new THREE.Vector3(a.x, a.y, a.z)
        .addScaledVector(dir, drift)
        .setY(a.y - drop)
    );
  }
  // Flat run along the trench bottom
  pts.push(aDown.clone().addScaledVector(dir, Math.min(len * 0.15, depth)));
  pts.push(bDown.clone().addScaledVector(dir, -Math.min(len * 0.15, depth)));
  for (let i = steps - 1; i >= 0; i--) {
    const t = i / steps;
    const drop = depth * t * t * (3 - 2 * t);
    const drift = Math.min(len * 0.12, depth * 0.9) * t * t * (3 - 2 * t);
    pts.push(
      new THREE.Vector3(b.x, b.y, b.z)
        .addScaledVector(dir, -drift)
        .setY(b.y - drop)
    );
  }
  return pts;
}

function TubeAlong({
  curve,
  radius,
  color,
  opacity = 1,
  transparent = false,
  metalness = 0.2,
  roughness = 0.6,
  offset,
}: {
  curve: THREE.CatmullRomCurve3;
  radius: number;
  color: string;
  opacity?: number;
  transparent?: boolean;
  metalness?: number;
  roughness?: number;
  offset?: [number, number];
}) {
  const geometry = useMemo(() => {
    let c = curve;
    if (offset && (offset[0] !== 0 || offset[1] !== 0)) {
      const pts = curve.getPoints(80).map((p, i, arr) => {
        const next = arr[Math.min(i + 1, arr.length - 1)];
        const prev = arr[Math.max(i - 1, 0)];
        const t = new THREE.Vector3().subVectors(next, prev).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(t, up);
        if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
        side.normalize();
        const vert = new THREE.Vector3().crossVectors(side, t).normalize();
        return p
          .clone()
          .addScaledVector(side, offset[0])
          .addScaledVector(vert, offset[1]);
      });
      c = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.2);
    }
    return new THREE.TubeGeometry(c, 140, radius, 12, false);
  }, [curve, radius, offset]);

  return (
    <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
      <meshStandardMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        metalness={metalness}
        roughness={roughness}
        side={transparent ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  );
}

export function UndergroundCable({
  from,
  to,
  spec,
  depth = TRENCH_DEPTH,
}: {
  from: [number, number, number];
  to: [number, number, number];
  spec: CableSpec;
  depth?: number;
}) {
  const size = CABLE_SIZES.find((s) => s.id === spec.size) ?? CABLE_SIZES[0];
  const conduit = CONDUITS.find((c) => c.id === spec.conduit) ?? CONDUITS[0];

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(routePoints(from, to, depth), false, "catmullrom", 0.2),
    [from, to, depth]
  );

  const coreR = size.coreD / 2;
  const insR = size.outerD / 2 / 2.1; // insulated core radius
  const ring = size.outerD / 2 - insR; // 2×2 bundle offset

  const label = `LV cable 4×${size.area} mm² (L1, L2, L3, PEN)`;

  return (
    <group>
      {/* Outer sheath */}
      <Part name={label}>
        <TubeAlong curve={curve} radius={size.outerD / 2} color="#1f1f22" roughness={0.75} />
      </Part>

      {/* Individual cores, arranged 2×2 inside the sheath */}
      {CORES.map((c, i) => {
        const ox = i === 0 || i === 3 ? -ring : ring;
        const oy = i < 2 ? ring : -ring;
        return (
          <Part key={c.name} name={`${c.name} conductor — ${size.area} mm² Al`}>
            <group>
              <TubeAlong
                curve={curve}
                radius={insR}
                color={c.color}
                offset={[ox, oy]}
                roughness={0.6}
              />
              <TubeAlong
                curve={curve}
                radius={coreR * 0.5}
                color="#c8ccd0"
                offset={[ox, oy]}
                metalness={0.85}
                roughness={0.35}
              />
            </group>
          </Part>
        );
      })}

      {/* Protective conduit pipe */}
      {conduit.id !== "none" && (
        <Part name={`Protective conduit pipe ${conduit.id} — ${conduit.subtitle}`}>
          <TubeAlong
            curve={curve}
            radius={conduit.outerD / 2}
            color={CONDUIT_COLOR}
            transparent
            opacity={0.42}
            metalness={0.1}
            roughness={0.4}
          />
        </Part>
      )}
    </group>
  );
}
