/**
 * Medium-voltage gas-insulated switchgear (GIS) line-up with an automation relay
 * panel on top (RTU, Ethernet switch, router, antenna). Feeder bays reuse the
 * Cubicle model / switchgearWires from Switchgear.tsx (stored as JSON in "swg");
 * relay automation on/off is stored in the property value "relayAuto".
 */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import { cubicleConducts, makeCubicle, type Cubicle } from "./Switchgear";

export const GIS_BAY_W = 0.6;
const BAY_H = 2.1;
const BAY_D = 1.0;

export const defaultGIS = (): Cubicle[] => [
  { ...makeCubicle("cb", 1), id: "g1", label: "Incomer", pickupA: 400, scA: 4000 },
  { ...makeCubicle("cb", 2), id: "g2", label: "Feeder 1" },
  { ...makeCubicle("cb", 3), id: "g3", label: "Feeder 2" },
  { ...makeCubicle("cb", 4), id: "g4", label: "Feeder 3" },
];
export function parseGIS(v: unknown): Cubicle[] {
  if (typeof v === "string" && v) {
    try { const a = JSON.parse(v); if (Array.isArray(a)) return a; } catch { /* default */ }
  }
  return defaultGIS();
}
export const relayAutoOn = (v: unknown) => String(v ?? "1") !== "0";

const bayX = (k: number, n: number) => (k - (n - 1) / 2) * GIS_BAY_W;
/** Three phase cable terminations at the bottom front of bay k. */
export function gisTerminalLocals(k: number, n: number): [number, number, number][] {
  const x = bayX(k, n);
  return [-0.12, 0, 0.12].map((dx) => [x + dx, 0.25, BAY_D / 2 + 0.06] as [number, number, number]);
}

function Box({ p, s, c, m = 0.3, r = 0.5, e }: { p: [number, number, number]; s: [number, number, number]; c: string; m?: number; r?: number; e?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={m} roughness={r} emissive={e ? c : "#000"} emissiveIntensity={e ?? 0} />
    </mesh>
  );
}

function Led({ p, on, color }: { p: [number, number, number]; on: boolean; color: string }) {
  const c = on ? color : "#3f3f46";
  return (
    <mesh position={p}>
      <sphereGeometry args={[0.012, 8, 8]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={on ? 1.2 : 0} />
    </mesh>
  );
}

export function GISModel({ cubicles, relayAuto }: { cubicles: Cubicle[]; relayAuto: boolean }) {
  const n = Math.max(1, cubicles.length);
  const W = n * GIS_BAY_W;
  const fz = BAY_D / 2;
  const panelY = BAY_H;
  const PH = 0.8;
  return (
    <group>
      {/* plinth */}
      <Box p={[0, 0.05, 0]} s={[W + 0.06, 0.1, BAY_D + 0.06]} c="#52525b" m={0.6} />
      {cubicles.map((c, k) => {
        const x = bayX(k, n);
        const on = cubicleConducts(c);
        return (
          <Part key={c.id} name={`GIS · ${c.label} · ${c.tripped ? "TRIPPED" : c.earthed ? "Earthed" : on ? "CB closed" : "CB open"}`}>
            <group position={[x, 0, 0]}>
              <Box p={[0, BAY_H / 2 + 0.05, 0]} s={[GIS_BAY_W - 0.02, BAY_H - 0.1, BAY_D]} c="#cbd5e1" m={0.35} r={0.45} />
              {/* SF6 tank seam */}
              <Box p={[0, 1.25, fz + 0.005]} s={[GIS_BAY_W - 0.08, 0.7, 0.01]} c="#94a3b8" m={0.5} />
              {/* mimic + CB indicator */}
              <Box p={[0, 1.25, fz + 0.012]} s={[0.025, 0.55, 0.004]} c="#1f2937" />
              <mesh position={[0, 1.25, fz + 0.018]} rotation={[0, 0, on ? 0 : Math.PI / 2]}>
                <boxGeometry args={[0.04, 0.16, 0.006]} />
                <meshStandardMaterial color={on ? "#dc2626" : "#16a34a"} />
              </mesh>
              {/* protection relay HMI */}
              <Box p={[0, 1.8, fz + 0.02]} s={[0.26, 0.18, 0.04]} c="#1e293b" />
              <Box p={[-0.03, 1.81, fz + 0.042]} s={[0.15, 0.09, 0.002]} c={relayAuto ? "#38bdf8" : "#334155"} e={relayAuto ? 0.6 : 0} />
              <Led p={[0.09, 1.84, fz + 0.045]} on={!!c.tripped} color="#f97316" />
              <Led p={[0.09, 1.8, fz + 0.045]} on={on} color="#ef4444" />
              <Led p={[0.09, 1.76, fz + 0.045]} on={!on && !c.tripped} color="#22c55e" />
              {/* gas gauge */}
              <mesh position={[0.18, 1.55, fz + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.03, 20]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.4} />
              </mesh>
              {/* cable compartment + bushings */}
              <Box p={[0, 0.35, fz + 0.01]} s={[GIS_BAY_W - 0.1, 0.45, 0.02]} c="#64748b" m={0.4} />
              {[-0.12, 0, 0.12].map((dx) => (
                <mesh key={dx} position={[dx, 0.25, fz + 0.04]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.025, 0.035, 0.06, 12]} />
                  <meshStandardMaterial color="#b45309" roughness={0.6} />
                </mesh>
              ))}
              <Text position={[0, 2.0, fz + 0.012]} fontSize={0.045} color="#111827" anchorX="center">{c.label}</Text>
            </group>
          </Part>
        );
      })}
      {/* Automation relay panel on top */}
      <Part name={`Automation relay panel · ${relayAuto ? "Automation ON" : "Automation OFF"}`}>
        <group position={[0, panelY, 0]}>
          <Box p={[0, PH / 2, 0]} s={[Math.min(W, 1.6), PH, 0.55]} c="#e5e7eb" m={0.25} r={0.55} />
          <Box p={[0, PH / 2, 0.278]} s={[Math.min(W, 1.6) - 0.06, PH - 0.06, 0.004]} c="#d1d5db" />
          {/* DIN rack */}
          <Box p={[0, PH - 0.2, 0.29]} s={[Math.min(W, 1.6) - 0.15, 0.02, 0.01]} c="#9ca3af" m={0.8} />
          <Part name="RTU (remote terminal unit)">
            <group position={[-0.4, PH - 0.32, 0.3]}>
              <Box p={[0, 0, 0]} s={[0.3, 0.2, 0.06]} c="#1f2937" />
              <Led p={[-0.1, 0.06, 0.035]} on color="#22c55e" />
              <Led p={[-0.06, 0.06, 0.035]} on={relayAuto} color="#38bdf8" />
              <Text position={[0.03, -0.04, 0.032]} fontSize={0.035} color="#e5e7eb">RTU</Text>
            </group>
          </Part>
          <Part name="Industrial Ethernet switch">
            <group position={[0, PH - 0.32, 0.3]}>
              <Box p={[0, 0, 0]} s={[0.26, 0.16, 0.06]} c="#0f766e" />
              {[-0.08, -0.03, 0.02, 0.07].map((x) => (
                <group key={x}>
                  <Box p={[x, -0.03, 0.032]} s={[0.035, 0.03, 0.004]} c="#111827" />
                  <Led p={[x, 0.03, 0.035]} on={relayAuto} color="#facc15" />
                </group>
              ))}
            </group>
          </Part>
          <Part name="4G/LTE router">
            <group position={[0.4, PH - 0.32, 0.3]}>
              <Box p={[0, 0, 0]} s={[0.24, 0.16, 0.06]} c="#374151" />
              <Led p={[-0.07, 0.04, 0.035]} on color="#22c55e" />
              <Led p={[-0.03, 0.04, 0.035]} on={relayAuto} color="#22c55e" />
              <Text position={[0.03, -0.03, 0.032]} fontSize={0.03} color="#e5e7eb">ROUTER</Text>
            </group>
          </Part>
          <Text position={[0, 0.15, 0.285]} fontSize={0.05} color="#111827">AUTOMATION RELAY PANEL</Text>
          <Part name="Antenna (LTE)">
            <group position={[Math.min(W, 1.6) / 2 - 0.12, PH, 0]}>
              <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.6, 8]} />
                <meshStandardMaterial color="#9ca3af" metalness={0.8} />
              </mesh>
              <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.025, 0.03, 0.3, 12]} />
                <meshStandardMaterial color="#111827" />
              </mesh>
              <Led p={[0, 0.87, 0]} on={relayAuto} color="#ef4444" />
            </group>
          </Part>
        </group>
      </Part>
    </group>
  );
}
