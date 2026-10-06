/**
 * MV (10 kV) switchgear inside the kiosk substation: a row of ring-main cubicles
 * on a common 3-phase busbar. Each cubicle has a main switch (load-break switch
 * or circuit breaker), an earthing switch, protection settings (breakers) and an
 * inspection record. Stored as JSON in the substation's property value "swg".
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
  // inspection record
  insulationMOhm?: number;
  gasBar?: number;
  visualOk?: boolean;
  tripTestA?: number;
  tripTestResult?: "pass" | "fail";
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

export type ChecklistItem = { id: string; label: string; status: "pass" | "fail" | "todo"; detail: string };

/** Inspection / commissioning checklist for one cubicle. */
export function cubicleChecklist(c: Cubicle, live: boolean, loadA: number): ChecklistItem[] {
  const ins = c.insulationMOhm, gas = c.gasBar;
  const items: ChecklistItem[] = [
    { id: "visual", label: "Visual inspection (no damage, clean, labels)", status: c.visualOk === undefined ? "todo" : c.visualOk ? "pass" : "fail", detail: c.visualOk === undefined ? "Not done" : c.visualOk ? "OK" : "Defect noted" },
    { id: "gas", label: "SF6 gas pressure ≥ 1.2 bar", status: gas === undefined ? "todo" : gas >= 1.2 ? "pass" : "fail", detail: gas === undefined ? "Not measured" : `${gas.toFixed(2)} bar` },
    { id: "ins", label: "Insulation resistance ≥ 1000 MΩ (5 kV test)", status: ins === undefined ? "todo" : ins >= 1000 ? "pass" : "fail", detail: ins === undefined ? "Not measured" : `${ins} MΩ` },
    { id: "interlock", label: "Interlock: earthing switch blocked while main switch closed", status: c.closed && c.earthed ? "fail" : "pass", detail: c.closed && c.earthed ? "Both closed!" : "Verified" },
    { id: "dead", label: "Earthed only when de-energised", status: c.earthed && live ? "fail" : "pass", detail: c.earthed ? (live ? "Earthed on a live circuit" : "Dead and earthed") : "Not earthed" },
  ];
  if (c.kind === "cb") {
    items.push(
      { id: "settings", label: "Protection: I> below I>>", status: c.pickupA < c.scA ? "pass" : "fail", detail: `I> ${c.pickupA} A · I>> ${c.scA} A` },
      { id: "load", label: "I> above present load current", status: c.pickupA > loadA ? "pass" : "fail", detail: `Load ${loadA.toFixed(1)} A` },
      { id: "trip", label: "Secondary injection trip test", status: c.tripTestResult ? c.tripTestResult : "todo", detail: c.tripTestA ? `${c.tripTestA} A injected → ${c.tripTestResult === "pass" ? "tripped" : "no trip"}` : "Not tested" },
    );
  }
  return items;
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
