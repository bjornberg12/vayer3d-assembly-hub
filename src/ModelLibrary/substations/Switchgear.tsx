/**
 * MV (10 kV) switchgear inside the kiosk substation: a row of ring-main cubicles
 * on a common 3-phase busbar. Each cubicle has a main switch (load-break switch
 * or circuit breaker), an earthing switch and protection settings (breakers).
 * Stored as JSON in the substation's property value "swg".
 * Each cubicle exposes a 3-phase terminal end "<substation>#mv<k>" for cables/lines.
 */
import { Part } from "@/components/PartLabel";
import type { SolverWire } from "../sources/solver";

export type CubicleKind = "lbs" | "cb";
export type Cubicle = {
  id: string;
  label: string;
  kind: CubicleKind;
  closed: boolean;
  earthed: boolean;
  tripped?: string; // trip reason
  pickupA: number; // I> overcurrent pickup
  scA: number; // I>> short-circuit pickup
};

export const CUBICLE_KIND_LABEL: Record<CubicleKind, string> = {
  lbs: "Load-break switch (cable)",
  cb: "Circuit breaker (protected)",
};

const uid = () => `cub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
export const makeCubicle = (kind: CubicleKind, n: number): Cubicle => ({
  id: uid(), label: kind === "cb" ? `Breaker ${n}` : `Cable ${n}`, kind, closed: true, earthed: false, pickupA: 40, scA: 400,
});
export const defaultSwitchgear = (): Cubicle[] => [
  { ...makeCubicle("lbs", 1), id: "c1" },
  { ...makeCubicle("lbs", 2), id: "c2" },
  { ...makeCubicle("cb", 1), id: "c3" },
];
export function parseSwitchgear(v: unknown): Cubicle[] {
  if (typeof v === "string" && v) {
    try { const a = JSON.parse(v); if (Array.isArray(a)) return a; } catch { /* fall through */ }
  }
  return defaultSwitchgear();
}

/** Bus is energised through closed, non-tripped main switches. */
export const cubicleConducts = (c: Cubicle) => c.closed && !c.tripped;

/** Local position of cubicle k on the substation's front wall (+z face). */
export function cubicleLocal(k: number, count: number): [number, number, number] {
  const pitch = 0.42;
  return [-1.55 + pitch * 0.5 + k * pitch - (count > 6 ? 0 : 0), 0, 1.13];
}
/** Three phase attachment points (cable bushings) under cubicle k. */
export function cubicleTerminalLocals(k: number, count: number): [number, number, number][] {
  const [x, , z] = cubicleLocal(k, count);
  return [-0.1, 0, 0.1].map((dx) => [x + dx, 0.25, z + 0.04] as [number, number, number]);
}

/** Solver branches for one substation's switchgear (per phase). */
export function switchgearWires(subId: string, cubicles: Cubicle[]): SolverWire[] {
  const out: SolverWire[] = [];
  cubicles.forEach((c, k) => {
    for (let p = 0; p < 3; p++) {
      const term = `${subId}#mv${k + 1}@${p}`;
      if (cubicleConducts(c)) out.push({ id: `${subId}~sw${k}~${p}`, a: term, b: `${subId}#bus@${p}`, r: 1e-4 });
      if (c.earthed) out.push({ id: `${subId}~es${k}~${p}`, a: term, b: `${subId}#earth`, r: 1e-4 });
    }
  });
  return out;
}


export function SwitchgearModel({ cubicles }: { cubicles: Cubicle[] }) {
  return (
    <group>
      {cubicles.map((c, k) => {
        const [x, , z] = cubicleLocal(k, cubicles.length);
        const lamp = c.tripped ? "#f97316" : c.earthed ? "#eab308" : cubicleConducts(c) ? "#ef4444" : "#22c55e";
        return (
          <Part key={c.id} name={`${c.label} · ${c.tripped ? "TRIPPED" : c.earthed ? "Earthed" : c.closed ? "Closed" : "Open"}`}>
            <group position={[x, 0, z]}>
              <mesh position={[0, 0.95, 0]} castShadow>
                <boxGeometry args={[0.38, 1.4, 0.06]} />
                <meshStandardMaterial color={c.kind === "cb" ? "#c7ccd1" : "#d9dcdf"} metalness={0.3} roughness={0.5} />
              </mesh>
              {/* mimic diagram line */}
              <mesh position={[0, 1.15, 0.031]}>
                <boxGeometry args={[0.025, 0.5, 0.004]} />
                <meshStandardMaterial color="#1f2937" />
              </mesh>
              {/* switch position indicator */}
              <mesh position={[0, 1.15, 0.036]} rotation={[0, 0, cubicleConducts(c) ? 0 : Math.PI / 2]}>
                <boxGeometry args={[0.03, 0.14, 0.006]} />
                <meshStandardMaterial color={cubicleConducts(c) ? "#dc2626" : "#16a34a"} />
              </mesh>
              {/* status lamp */}
              <mesh position={[0, 1.55, 0.035]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshStandardMaterial color={lamp} emissive={lamp} emissiveIntensity={0.9} />
              </mesh>
              {/* cable compartment with bushings */}
              <mesh position={[0, 0.35, 0.01]}>
                <boxGeometry args={[0.36, 0.3, 0.05]} />
                <meshStandardMaterial color="#6b7280" metalness={0.3} roughness={0.6} />
              </mesh>
            </group>
          </Part>
        );
      })}
    </group>
  );
}
