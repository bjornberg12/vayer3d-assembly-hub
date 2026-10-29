/**
 * Low-voltage (0.4 kV) distribution panel with configurable DIN-rail devices:
 * MCCBs, MCBs, small control MCBs and surge protection devices (SPDs).
 * Devices are stored as JSON in the property value "lvdev".
 * Pins: incoming l1/l2/l3/n/pe (also the 3-phase cable end "<id>#ac"),
 * N / PE terminal bars (nb1.., pb1..), and per device "<dev>_i<p>" / "<dev>_o<p>".
 * Devices fed "bus" are internally connected to the busbar; "manual" devices are fed by user wires.
 */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import { PinTerminal, type PinDef, type PinRole } from "../car-components/EVComponents";
import type { SolverLoad, SolverWire } from "../sources/solver";

export type LVKind = "mccb" | "mcb" | "mini" | "spd";
export type LVPhase = "L1" | "L2" | "L3";
export type LVDevice = {
  id: string;
  label: string;
  kind: LVKind;
  rating: number; // A (SPD: kA discharge)
  poles: 1 | 3;
  phase: LVPhase; // used when poles = 1
  feed: "bus" | "manual";
  closed: boolean;
  tripped?: string;
};

export const LV_KIND_INFO: Record<LVKind, { label: string; ratings: number[]; poles: (1 | 3)[]; mod: number; h: number }> = {
  mccb: { label: "MCCB (moulded-case breaker)", ratings: [63, 100, 160, 250, 400], poles: [3], mod: 3, h: 0.16 },
  mcb: { label: "MCB (miniature breaker, C-curve)", ratings: [10, 16, 20, 25, 32, 40, 63], poles: [1, 3], mod: 1, h: 0.09 },
  mini: { label: "Small control breaker", ratings: [0.5, 1, 2, 4, 6], poles: [1], mod: 0.5, h: 0.07 },
  spd: { label: "SPD (surge protection)", ratings: [20, 40], poles: [1, 3], mod: 1, h: 0.09 },
};

const uid = () => `lv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export function makeLVDevice(kind: LVKind, n: number): LVDevice {
  const info = LV_KIND_INFO[kind];
  return {
    id: uid(), kind, label: kind === "spd" ? `SPD ${n}` : kind === "mccb" ? `Main ${n}` : kind === "mini" ? `Control ${n}` : `Q${n}`,
    rating: info.ratings[Math.min(1, info.ratings.length - 1)], poles: info.poles[info.poles.length - 1],
    phase: "L1", feed: "bus", closed: true,
  };
}
export const defaultLVPanel = (): LVDevice[] => [
  { ...makeLVDevice("mccb", 1), id: "lvm", rating: 160 },
  { ...makeLVDevice("spd", 1), id: "lvs" },
  { ...makeLVDevice("mcb", 1), id: "lvq1", rating: 25 },
  { ...makeLVDevice("mcb", 2), id: "lvq2", rating: 16, poles: 1, phase: "L2" },
  { ...makeLVDevice("mini", 1), id: "lvc1", rating: 2, poles: 1, phase: "L3" },
];
export function parseLVPanel(v: unknown): LVDevice[] {
  if (typeof v === "string" && v) {
    try { const a = JSON.parse(v); if (Array.isArray(a)) return a; } catch { /* default */ }
  }
  return defaultLVPanel();
}

export const lvConducts = (d: LVDevice) => d.kind !== "spd" && d.closed && !d.tripped;
const PH: LVPhase[] = ["L1", "L2", "L3"];
/** Busbar phase node index (0..2) for pole p of a device. */
export const lvPolePhase = (d: LVDevice, p: number) => (d.poles === 3 ? p : PH.indexOf(d.phase));

// Geometry (metres)
export const LV_W = 0.8;
const LV_H = 1.3;
const LV_D = 0.25;
const BASE_Y = 0.3;
const FRONT = 0.09;
const MODULE = 0.036;
const ROWS = [1.2, 0.95, 0.7];
const ROW_W = 0.68;
const BAR_N = 6;

type Placed = { d: LVDevice; x: number; y: number; w: number; h: number };
/** DIN-rail layout: devices fill rows left to right. */
export function lvLayout(devs: LVDevice[]): Placed[] {
  const out: Placed[] = [];
  let row = 0;
  let x = -ROW_W / 2;
  for (const d of devs) {
    const info = LV_KIND_INFO[d.kind];
    const w = Math.max(info.mod * (d.kind === "mccb" ? 1 : d.poles) * MODULE, MODULE * 0.6) + (d.kind === "mccb" ? MODULE * 0.6 : 0);
    if (x + w > ROW_W / 2 && x > -ROW_W / 2) { row++; x = -ROW_W / 2; }
    const y = BASE_Y + (ROWS[Math.min(row, ROWS.length - 1)] - BASE_Y) + (row >= ROWS.length ? -(row - ROWS.length + 1) * 0.2 : 0);
    out.push({ d, x: x + w / 2, y, w, h: info.h });
    x += w + 0.008;
  }
  return out;
}

const poleX = (pl: Placed, p: number) => (pl.d.poles === 1 ? pl.x : pl.x + (p - 1) * (pl.w / 3.2));

export function lvPanelPins(devs: LVDevice[]): PinDef[] {
  const pins: PinDef[] = [];
  const inc: [string, string, PinRole][] = [["l1", "Incoming L1", "L1"], ["l2", "Incoming L2", "L2"], ["l3", "Incoming L3", "L3"], ["n", "Incoming N", "N"], ["pe", "Incoming PE", "PE"]];
  inc.forEach(([id, label, role], k) => pins.push({ id, label, role, local: [-0.33 + k * 0.05, 1.47, FRONT] }));
  for (let k = 0; k < BAR_N; k++) {
    pins.push({ id: `nb${k + 1}`, label: `N bar ${k + 1}`, role: "N", local: [-0.3 + k * 0.035, 0.42, FRONT] });
    pins.push({ id: `pb${k + 1}`, label: `PE bar ${k + 1}`, role: "PE", local: [0.08 + k * 0.035, 0.42, FRONT] });
  }
  for (const pl of lvLayout(devs)) {
    const { d } = pl;
    for (let p = 0; p < d.poles; p++) {
      const role = PH[lvPolePhase(d, p)];
      pins.push({ id: `${d.id}_i${p}`, label: `${d.label} in ${role}`, role, local: [poleX(pl, p), pl.y + pl.h / 2 + 0.012, FRONT] });
      if (d.kind !== "spd") pins.push({ id: `${d.id}_o${p}`, label: `${d.label} out ${role}`, role, local: [poleX(pl, p), pl.y - pl.h / 2 - 0.012, FRONT] });
    }
    if (d.kind === "spd") pins.push({ id: `${d.id}_pe`, label: `${d.label} PE`, role: "PE", local: [pl.x, pl.y - pl.h / 2 - 0.012, FRONT] });
  }
  return pins;
}

/** 3-phase outgoing ends for cables: 3-pole breakers expose "<id>#o<dev>". */
export function lvCableEnds(devs: LVDevice[]): { dev: LVDevice; phases: [number, number, number][] }[] {
  return lvLayout(devs)
    .filter((pl) => pl.d.poles === 3 && pl.d.kind !== "spd")
    .map((pl) => ({ dev: pl.d, phases: [0, 1, 2].map((p) => [poleX(pl, p), BASE_Y - 0.25, 0] as [number, number, number]) }));
}

export const lvBreakerWireId = (pid: string, did: string, p: number) => `${pid}~cb${did}~${p}`;
const R0 = 1e-4;
export function lvPanelWires(pid: string, devs: LVDevice[]): SolverWire[] {
  const w: SolverWire[] = [];
  const bus = ["l1", "l2", "l3"];
  for (let k = 0; k < BAR_N; k++) {
    w.push({ id: `${pid}~nb${k}`, a: `${pid}#n`, b: `${pid}#nb${k + 1}`, r: R0 });
    w.push({ id: `${pid}~pb${k}`, a: `${pid}#pe`, b: `${pid}#pb${k + 1}`, r: R0 });
  }
  for (const d of devs) {
    for (let p = 0; p < d.poles; p++) {
      const inPin = `${pid}#${d.id}_i${p}`;
      if (d.feed === "bus") w.push({ id: `${pid}~f${d.id}~${p}`, a: `${pid}#${bus[lvPolePhase(d, p)]}`, b: inPin, r: R0 });
      if (lvConducts(d)) w.push({ id: lvBreakerWireId(pid, d.id, p), a: inPin, b: `${pid}#${d.id}_o${p}`, r: R0 });
      if (d.poles === 3 && d.kind !== "spd") w.push({ id: `${pid}~x${d.id}~${p}`, a: `${pid}#${d.id}_o${p}`, b: `${pid}#o${d.id}@${p}`, r: R0 });
    }
    if (d.poles === 3 && d.kind !== "spd") w.push({ id: `${pid}~x${d.id}~3`, a: `${pid}#n`, b: `${pid}#o${d.id}@3`, r: R0 });
    if (d.kind === "spd") w.push({ id: `${pid}~spe${d.id}`, a: `${pid}#${d.id}_pe`, b: `${pid}#pe`, r: R0 });
  }
  return w;
}

/** SPDs are monitored as very high-impedance loads phase → N, giving a voltage status. */
export const lvSpdOwner = (pid: string, did: string) => `${pid}:${did}`;
export function lvPanelLoads(pid: string, devs: LVDevice[]): SolverLoad[] {
  return devs.filter((d) => d.kind === "spd").flatMap((d) =>
    Array.from({ length: d.poles }, (_, p) => ({ owner: lvSpdOwner(pid, d.id), a: `${pid}#${d.id}_i${p}`, b: `${pid}#n`, r: 1e6, ratedV: 230 })),
  );
}

/** Trip decision from pole current: C-curve magnetic ≥ 10×In, thermal ≥ 1.45×In. */
export function lvTripReason(d: LVDevice, current: number): string | null {
  if (!lvConducts(d)) return null;
  if (current >= d.rating * 10) return `Short circuit (${current.toFixed(0)} A ≥ 10 × ${d.rating} A)`;
  if (current >= d.rating * 1.45) return `Overload (${current.toFixed(1)} A ≥ 1.45 × ${d.rating} A)`;
  return null;
}

function Box({ p, s, c, m = 0.2, r = 0.6, e = 0 }: { p: [number, number, number]; s: [number, number, number]; c: string; m?: number; r?: number; e?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={m} roughness={r} emissive={e ? c : "#000"} emissiveIntensity={e} />
    </mesh>
  );
}

const KIND_COLOR: Record<LVKind, string> = { mccb: "#374151", mcb: "#f5f5f4", mini: "#e7e5e4", spd: "#e5e7eb" };

export function LVPanelModel({ devices, spdOk }: { devices: LVDevice[]; spdOk?: Record<string, boolean> }) {
  const zf = LV_D / 2;
  return (
    <group>
      {/* legs / plinth */}
      <Box p={[0, BASE_Y / 2, 0]} s={[LV_W * 0.9, BASE_Y, LV_D * 0.9]} c="#6b7280" m={0.6} r={0.4} />
      {/* enclosure: back, sides, top, bottom (front open) */}
      <Box p={[0, BASE_Y + LV_H / 2, -zf + 0.01]} s={[LV_W, LV_H, 0.02]} c="#d6d3cd" />
      <Box p={[-LV_W / 2 + 0.01, BASE_Y + LV_H / 2, 0]} s={[0.02, LV_H, LV_D]} c="#d6d3cd" />
      <Box p={[LV_W / 2 - 0.01, BASE_Y + LV_H / 2, 0]} s={[0.02, LV_H, LV_D]} c="#d6d3cd" />
      <Box p={[0, BASE_Y + LV_H - 0.01, 0]} s={[LV_W, 0.02, LV_D]} c="#d6d3cd" />
      <Box p={[0, BASE_Y + 0.01, 0]} s={[LV_W, 0.02, LV_D]} c="#d6d3cd" />
      {/* open door hinged on the left */}
      <group position={[-LV_W / 2, 0, zf]} rotation={[0, -1.9, 0]}>
        <Box p={[LV_W / 2, BASE_Y + LV_H / 2, 0]} s={[LV_W, LV_H, 0.015]} c="#dcd9d2" />
      </group>
      {/* mounting plate */}
      <Box p={[0, BASE_Y + LV_H / 2, -zf + 0.03]} s={[LV_W - 0.06, LV_H - 0.06, 0.01]} c="#b8bcc2" m={0.5} />
      {/* busbars L1/L2/L3 */}
      {["#7c4a1e", "#1f1f1f", "#9ca3af"].map((c, k) => (
        <Box key={c} p={[0.05, 1.53 - k * 0.025, 0.0]} s={[0.6, 0.012, 0.004]} c={k === 0 ? "#b87333" : "#c08040"} m={0.85} r={0.3} />
      ))}
      <Text position={[0, 1.57, 0.02]} fontSize={0.025} color="#111827">L1 L2 L3 BUSBAR · 400 V</Text>
      {/* N and PE bars */}
      <Box p={[-0.21, 0.405, 0.06]} s={[0.22, 0.015, 0.012]} c="#2563eb" m={0.6} />
      <Box p={[0.17, 0.405, 0.06]} s={[0.22, 0.015, 0.012]} c="#84cc16" m={0.6} />
      {/* DIN rails */}
      {ROWS.map((y) => <Box key={y} p={[0, y, 0.03]} s={[ROW_W + 0.04, 0.035, 0.008]} c="#9aa0a6" m={0.85} r={0.35} />)}
      {lvLayout(devices).map((pl) => {
        const { d } = pl;
        const on = lvConducts(d);
        const ok = spdOk?.[d.id];
        const state = d.kind === "spd" ? (ok ? "Protecting" : "No voltage") : d.tripped ? "TRIPPED" : on ? "ON" : "OFF";
        return (
          <Part key={d.id} name={`${d.label} · ${LV_KIND_INFO[d.kind].label} · ${d.kind === "spd" ? `${d.rating} kA` : `${d.rating} A`} · ${state}`}>
            <group position={[pl.x, pl.y, 0.06]}>
              <Box p={[0, 0, 0]} s={[pl.w - 0.003, pl.h, 0.06]} c={KIND_COLOR[d.kind]} />
              {d.kind !== "spd" ? (
                <>
                  {/* toggle lever: up = ON */}
                  <mesh position={[0, on ? 0.012 : -0.012, 0.034]}>
                    <boxGeometry args={[Math.min(pl.w * 0.6, 0.05), 0.022, 0.012]} />
                    <meshStandardMaterial color={d.kind === "mccb" ? "#111827" : on ? "#dc2626" : "#16a34a"} />
                  </mesh>
                  {d.tripped && <Box p={[0, pl.h / 2 - 0.012, 0.032]} s={[pl.w * 0.5, 0.008, 0.004]} c="#f97316" e={1} />}
                </>
              ) : (
                <Box p={[0, 0.01, 0.032]} s={[pl.w * 0.5, 0.012, 0.004]} c={ok ? "#22c55e" : "#6b7280"} e={ok ? 0.9 : 0} />
              )}
              <Text position={[0, -pl.h / 2 + 0.012, 0.031]} fontSize={0.01} color={d.kind === "mccb" ? "#f9fafb" : "#111827"} anchorX="center">
                {d.kind === "spd" ? "SPD" : `C${d.rating}`}
              </Text>
            </group>
          </Part>
        );
      })}
      {lvPanelPins(devices).map((p) => <PinTerminal key={p.id} role={p.role} position={p.local} size={0.007} />)}
    </group>
  );
}
