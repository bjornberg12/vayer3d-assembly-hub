import { useMemo } from "react";
import * as THREE from "three";
import { Part, PartOwner } from "@/components/PartLabel";
import type { BaseDefaults } from "../properties";

export type EVType =
  | "battery"
  | "motor"
  | "inverter"
  | "obc"
  | "dcdc"
  | "pdu"
  | "chargeport"
  | "aux12"
  | "bms"
  | "heater"
  | "compressor";

export type PinRole = "dc+" | "dc-" | "L1" | "L2" | "L3" | "N" | "PE" | "U" | "V" | "W" | "12+" | "12-" | "sig";
export type PinDef = { id: string; label: string; role: PinRole; local: [number, number, number] };

export const PIN_COLORS: Record<PinRole, string> = {
  "dc+": "#dc2626", "dc-": "#111111", L1: "#7c4a1e", L2: "#1f1f1f", L3: "#9ca3af", N: "#2563eb", PE: "#84cc16",
  U: "#7c4a1e", V: "#1f1f1f", W: "#9ca3af", "12+": "#f87171", "12-": "#374151", sig: "#a855f7",
};
const PHASE: PinRole[] = ["L1", "L2", "L3", "U", "V", "W"];
/** True when two pin roles should not normally be joined. */
export function pinsIncompatible(a?: PinRole, b?: PinRole) {
  if (!a || !b || a === b) return false;
  if (PHASE.includes(a) && PHASE.includes(b)) return false;
  return true;
}
/** Lays pins out in rows of 6 on the part's top at height y. */
export function layoutPins(list: [string, string, PinRole][], y: number, x0 = 0, z0 = 0): PinDef[] {
  const S = 0.045, perRow = 6;
  return list.map(([id, label, role], i) => {
    const row = Math.floor(i / perRow), col = i % perRow;
    const n = Math.min(perRow, list.length - row * perRow);
    return { id, label, role, local: [x0 + (col - (n - 1) / 2) * S, y, z0 + row * S] };
  });
}
const DCP: [string, string, PinRole][] = [["dcp", "DC+", "dc+"], ["dcn", "DC−", "dc-"]];
const AC5: [string, string, PinRole][] = [["l1", "L1", "L1"], ["l2", "L2", "L2"], ["l3", "L3", "L3"], ["n", "N", "N"], ["pe", "PE", "PE"]];
const pr = (pre: string, lab: string): [string, string, PinRole][] => [[`${pre}p`, `${lab} DC+`, "dc+"], [`${pre}n`, `${lab} DC−`, "dc-"]];
const PIN_LISTS: Record<string, [string, string, PinRole][]> = {
  battery: [...DCP, ["gnd", "Chassis ground", "PE"], ["bms", "BMS signal", "sig"], ["hvil", "HVIL interlock", "sig"]],
  pdu: [...pr("bat", "Battery"), ...pr("inv", "Inverter"), ...pr("obc", "OBC"), ...pr("dcdc", "DC-DC"), ...pr("htr", "Heater"), ...pr("cmp", "Compressor"), ...pr("port", "Charge port"), ["gnd", "Ground", "PE"]],
  inverter: [...DCP, ["u", "U", "U"], ["v", "V", "V"], ["w", "W", "W"], ["gnd", "Ground", "PE"], ["ctl", "Resolver / control", "sig"]],
  motor: [["u", "U", "U"], ["v", "V", "V"], ["w", "W", "W"], ["gnd", "Ground", "PE"], ["sens", "Resolver / temp", "sig"]],
  obc: [...AC5, ...DCP, ["can", "CAN / control", "sig"]],
  dcdc: [["hvp", "HV DC+", "dc+"], ["hvn", "HV DC−", "dc-"], ["lvp", "12 V +", "12+"], ["lvn", "12 V −", "12-"], ["en", "Enable", "sig"]],
  chargeport: [...AC5, ...DCP, ["cp", "CP (control pilot)", "sig"], ["pp", "PP (proximity)", "sig"]],
  aux12: [["p", "+", "12+"], ["n", "−", "12-"]],
  bms: [["vp", "12 V +", "12+"], ["vn", "12 V −", "12-"], ["sense", "Cell sense", "sig"], ["can", "CAN", "sig"]],
  heater: [...DCP, ["gnd", "Ground", "PE"], ["ctl", "12 V control / CAN", "sig"]],
  compressor: [...DCP, ["gnd", "Ground", "PE"], ["ctl", "12 V control / CAN", "sig"]],
};

export type EVParamDef = { key: string; label: string; unit: string; min: number; max: number; step: number };

export type EVPartRecord = {
  id: string;
  type: EVType;
  position: [number, number, number];
  rotationY: number;
  params: Record<string, number>;
};

export type EVWireRecord = {
  id: string;
  a: string;
  b: string;
  crossSection: number;
  wireType?: string;
  waypoints?: [number, number][];
  routingMode?: "freehand" | "auto";
  material?: "copper" | "aluminium";
  /** Current the wire is carrying (A), user-set until the circuit solver exists. */
  currentA?: number;
};

type Def = {
  name: string;
  subtitle: string;
  lowVoltage?: boolean;
  /** Height of the wiring terminal above the part's origin. */
  terminalY: number;
  /** Model-specific parameters (in addition to the shared basic properties). */
  params: (EVParamDef & { value: number })[];
  /** Shared basic properties: which are on by default and their values. */
  base: BaseDefaults;
  /** X/Z footprint used by physical wire routing. */
  footprint: [number, number];
};

const p = (key: string, label: string, unit: string, value: number, min: number, max: number, step = 1) => ({
  key, label, unit, value, min, max, step,
});

const DC = "DC";
export const EV_DEFS: Record<EVType, Def> = {
  battery: { name: "HV traction battery", subtitle: "Li-ion pack, underfloor", terminalY: 0.5, footprint: [1.5, 2.1],
    params: [p("capacity", "Capacity", "kWh", 75, 10, 200, 1), p("maxPower", "Max discharge", "kW", 250, 20, 600, 5)],
    base: { active: ["mass", "nominalVoltage", "ratedCurrent", "maxCurrent"], values: { mass: 450, material: "Li-ion NMC / aluminium", nominalVoltage: 400, voltageKind: DC, ratedCurrent: 250, maxCurrent: 625, height: 0.14, width: 1.5, depth: 2.1 } } },
  motor: { name: "Traction motor", subtitle: "PMSM drive unit", terminalY: 0.62, footprint: [0.55, 0.45],
    params: [p("torque", "Peak torque", "Nm", 310, 50, 1000, 10), p("rpm", "Max speed", "rpm", 16000, 6000, 25000, 500)],
    base: { active: ["mass", "ratedPower", "nominalVoltage", "phases"], values: { mass: 45, material: "Steel / copper / aluminium", ratedPower: 150, nominalVoltage: 400, voltageKind: "AC", phases: 3 } } },
  inverter: { name: "Traction inverter", subtitle: "DC → 3-phase AC", terminalY: 0.86, footprint: [0.4, 0.3],
    params: [p("efficiency", "Efficiency", "%", 97, 85, 99.5, 0.5)],
    base: { active: ["mass", "ratedPower", "nominalVoltage", "maxCurrent"], values: { mass: 9, material: "Aluminium", ratedPower: 160, nominalVoltage: 400, voltageKind: DC, maxCurrent: 450 } } },
  obc: { name: "On-board charger", subtitle: "AC → DC charging", terminalY: 0.58, footprint: [0.32, 0.28],
    params: [],
    base: { active: ["mass", "ratedPower", "nominalVoltage", "phases", "frequency"], values: { mass: 6, material: "Aluminium", ratedPower: 11, nominalVoltage: 400, voltageKind: "AC", phases: 3, frequency: 50, ratedCurrent: 16 } } },
  dcdc: { name: "DC-DC converter", subtitle: "HV → 12 V", terminalY: 0.55, footprint: [0.24, 0.2],
    params: [p("outVoltage", "Output voltage", "V", 12, 12, 48, 36)],
    base: { active: ["mass", "ratedPower", "nominalVoltage"], values: { mass: 3, material: "Aluminium", ratedPower: 2.5, nominalVoltage: 400, voltageKind: DC } } },
  pdu: { name: "HV junction box (PDU)", subtitle: "Fuses & contactors", terminalY: 0.6, footprint: [0.32, 0.24],
    params: [p("fuse", "Main fuse", "A", 350, 50, 800, 10)],
    base: { active: ["mass", "nominalVoltage", "ratedCurrent", "maxCurrent"], values: { mass: 4, material: "Plastic / copper busbars", nominalVoltage: 400, voltageKind: DC, ratedCurrent: 300, maxCurrent: 400 } } },
  chargeport: { name: "Charge port", subtitle: "CCS2 inlet", terminalY: 0.8, footprint: [0.18, 0.18],
    params: [p("acPower", "Max AC power", "kW", 11, 3.7, 22, 0.1), p("dcPower", "Max DC power", "kW", 150, 50, 350, 10)],
    base: { active: ["mass", "maxCurrent"], values: { mass: 1.2, material: "Plastic / copper", maxCurrent: 200, nominalVoltage: 400 } } },
  aux12: { name: "12 V auxiliary battery", subtitle: "Low voltage supply", lowVoltage: true, terminalY: 0.72, footprint: [0.25, 0.17],
    params: [p("capacity", "Capacity", "Ah", 60, 20, 120, 5)],
    base: { active: ["mass", "nominalVoltage"], values: { mass: 15, material: "Lead-acid (AGM)", nominalVoltage: 12, voltageKind: DC } } },
  bms: { name: "Battery management system", subtitle: "Cell monitoring", lowVoltage: true, terminalY: 0.5, footprint: [0.2, 0.14],
    params: [p("cells", "Cells in series", "", 96, 24, 216, 4), p("balanceCurrent", "Balancing current", "mA", 200, 50, 1000, 50)],
    base: { active: ["mass", "nominalVoltage"], values: { mass: 0.3, material: "PCB (FR-4)", nominalVoltage: 12, voltageKind: DC } } },
  heater: { name: "PTC heater", subtitle: "Cabin / battery heating", terminalY: 0.85, footprint: [0.26, 0.14],
    params: [],
    base: { active: ["mass", "ratedPower", "nominalVoltage"], values: { mass: 2, material: "Aluminium / ceramic", ratedPower: 5, nominalVoltage: 400, voltageKind: DC } } },
  compressor: { name: "Electric A/C compressor", subtitle: "Thermal management", terminalY: 0.75, footprint: [0.28, 0.18],
    params: [],
    base: { active: ["mass", "ratedPower", "nominalVoltage"], values: { mass: 7, material: "Aluminium", ratedPower: 4, nominalVoltage: 400, voltageKind: DC } } },
};

const PIN_TOPS: Record<EVType, number> = { battery: 0.48, motor: 0.58, inverter: 0.73, obc: 0.53, dcdc: 0.51, pdu: 0.55, chargeport: 0.85, aux12: 0.7, bms: 0.49, heater: 0.83, compressor: 0.69 };
export const pinsOf = (t: EVType): PinDef[] => layoutPins(PIN_LISTS[t], PIN_TOPS[t], t === "motor" ? 0.3 : t === "inverter" ? -0.15 : 0);
export const ownerOfEnd = (id: string) => id.split("#")[0];

export function pinWorldOf(local: [number, number, number], pos: [number, number, number], rotY: number): [number, number, number] {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  return [pos[0] + local[0] * c + local[2] * s, pos[1] + local[1], pos[2] - local[0] * s + local[2] * c];
}
export function evPinWorld(part: EVPartRecord, pinId: string): [number, number, number] | null {
  const pin = pinsOf(part.type).find((q) => q.id === pinId);
  return pin ? pinWorldOf(pin.local, part.position, part.rotationY) : null;
}

export const EV_TYPES = Object.keys(EV_DEFS) as EVType[];
export const WIRE_SECTIONS = [2.5, 16, 35, 50, 70, 95];

export function defaultParams(t: EVType) {
  return Object.fromEntries(EV_DEFS[t].params.map((d) => [d.key, d.value]));
}

let counter = 0;
export function makeEVPart(type: EVType, position: [number, number, number], rotationY = 0): EVPartRecord {
  counter += 1;
  return { id: `ev-${type}-${Date.now()}-${counter}`, type, position, rotationY, params: defaultParams(type) };
}

/** Default layout of a typical rear-wheel-drive EV (car front = +Z). */
export function defaultEVLayout(): { parts: EVPartRecord[]; wires: EVWireRecord[] } {
  const L: [EVType, number, number][] = [
    ["battery", 0, -0.1], ["bms", 0.55, 0.85], ["pdu", 0, 1.25], ["inverter", 0, -1.55],
    ["motor", 0, -1.55], ["obc", -0.35, 1.7], ["dcdc", 0.35, 1.7], ["chargeport", -0.85, -1.85],
    ["aux12", 0.5, 1.95], ["heater", -0.3, 1.2], ["compressor", 0.4, 2.05],
  ];
  const parts = L.map(([t, x, z], i) => ({ ...makeEVPart(t, [x, 0, z]), id: `ev-default-${t}-${i}` }));
  const id = (t: EVType) => parts.find((q) => q.type === t)!.id;
  const W: [EVType, string, EVType, string, number][] = [];
  const add = (a: EVType, b: EVType, pairs: [string, string][], mm: number) => pairs.forEach(([x, y]) => W.push([a, x, b, y, mm]));
  add("battery", "pdu", [["dcp", "batp"], ["dcn", "batn"]], 95);
  add("pdu", "inverter", [["invp", "dcp"], ["invn", "dcn"]], 70);
  add("inverter", "motor", [["u", "u"], ["v", "v"], ["w", "w"]], 70);
  add("pdu", "obc", [["obcp", "dcp"], ["obcn", "dcn"]], 16);
  add("pdu", "dcdc", [["dcdcp", "hvp"], ["dcdcn", "hvn"]], 16);
  add("chargeport", "pdu", [["dcp", "portp"], ["dcn", "portn"]], 50);
  add("chargeport", "obc", [["l1", "l1"], ["l2", "l2"], ["l3", "l3"], ["n", "n"], ["pe", "pe"]], 6);
  add("dcdc", "aux12", [["lvp", "p"], ["lvn", "n"]], 16);
  add("aux12", "bms", [["p", "vp"], ["n", "vn"]], 2.5);
  add("battery", "bms", [["bms", "sense"]], 2.5);
  add("pdu", "heater", [["htrp", "dcp"], ["htrn", "dcn"]], 16);
  add("pdu", "compressor", [["cmpp", "dcp"], ["cmpn", "dcn"]], 16);
  return { parts, wires: W.map(([a, pa, b, pb, s], i) => ({ id: `evw-default-${i}`, a: `${id(a)}#${pa}`, b: `${id(b)}#${pb}`, crossSection: s })) };
}

export function terminalPoint(part: EVPartRecord): [number, number, number] {
  // Motor and inverter share a footprint: offset the motor terminal slightly.
  const dx = part.type === "motor" ? 0.3 : 0;
  const c = Math.cos(part.rotationY), s = Math.sin(part.rotationY);
  return [part.position[0] + dx * c, EV_DEFS[part.type].terminalY, part.position[2] - dx * s];
}

export function isHVWire(w: EVWireRecord, parts: EVPartRecord[]) {
  const a = parts.find((x) => x.id === ownerOfEnd(w.a));
  const b = parts.find((x) => x.id === ownerOfEnd(w.b));
  return !(a && EV_DEFS[a.type].lowVoltage) && !(b && EV_DEFS[b.type].lowVoltage);
}

export function wireLength(w: EVWireRecord, parts: EVPartRecord[]) {
  const a = parts.find((x) => x.id === w.a);
  const b = parts.find((x) => x.id === w.b);
  if (!a || !b) return 0;
  const curve = wireCurve(terminalPoint(a), terminalPoint(b));
  return curve.getLength();
}

export function wireCurveLength(a: [number, number, number], b: [number, number, number]) {
  return wireCurve(a, b).getLength();
}

export function wireCurve(a: [number, number, number], b: [number, number, number]) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const lift = Math.max(va.y, vb.y) + 0.12 + va.distanceTo(vb) * 0.06;
  return new THREE.CatmullRomCurve3([
    va,
    new THREE.Vector3(va.x, lift, va.z).lerp(vb, 0.15).setY(lift),
    new THREE.Vector3().lerpVectors(va, vb, 0.85).setY(lift),
    vb,
  ]);
}

const M = {
  housing: { color: "#3a3f45", metalness: 0.6, roughness: 0.45 },
  alu: { color: "#b9bec4", metalness: 0.85, roughness: 0.3 },
  orange: { color: "#f07a1a", metalness: 0.1, roughness: 0.5 },
  black: { color: "#161616", metalness: 0.2, roughness: 0.7 },
  green: { color: "#1f7a3a", metalness: 0.2, roughness: 0.6 },
};

function Box({ size, pos, mat }: { size: [number, number, number]; pos: [number, number, number]; mat: keyof typeof M }) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...M[mat]} />
    </mesh>
  );
}

function Model({ type }: { type: EVType }) {
  switch (type) {
    case "battery":
      return (<>
        <Box size={[1.5, 0.14, 2.1]} pos={[0, 0.38, 0]} mat="housing" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} size={[1.3, 0.025, 0.28]} pos={[0, 0.465, -0.85 + i * 0.34]} mat="alu" />
        ))}
      </>);
    case "motor":
      return (<>
        <mesh position={[0.3, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.4, 24]} />
          <meshStandardMaterial {...M.alu} />
        </mesh>
        <mesh position={[0.3, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 12]} />
          <meshStandardMaterial {...M.black} />
        </mesh>
      </>);
    case "inverter":
      return (<>
        <Box size={[0.4, 0.14, 0.3]} pos={[-0.15, 0.62, 0]} mat="alu" />
        <Box size={[0.4, 0.03, 0.3]} pos={[-0.15, 0.71, 0]} mat="housing" />
      </>);
    case "obc":
      return <Box size={[0.32, 0.12, 0.28]} pos={[0, 0.46, 0]} mat="alu" />;
    case "dcdc":
      return <Box size={[0.24, 0.1, 0.2]} pos={[0, 0.45, 0]} mat="housing" />;
    case "pdu":
      return <Box size={[0.32, 0.14, 0.24]} pos={[0, 0.47, 0]} mat="housing" />;
    case "chargeport":
      return (<>
        <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 20]} />
          <meshStandardMaterial {...M.black} />
        </mesh>
        <Box size={[0.03, 0.18, 0.14]} pos={[-0.05, 0.75, 0]} mat="housing" />
      </>);
    case "aux12":
      return (<>
        <Box size={[0.25, 0.18, 0.17]} pos={[0, 0.6, 0]} mat="black" />
        <mesh position={[-0.08, 0.705, 0]}><boxGeometry args={[0.03, 0.03, 0.03]} /><meshStandardMaterial color="#1e40af" /></mesh>
      </>);
    case "bms":
      return (<><Box size={[0.2, 0.02, 0.14]} pos={[0, 0.47, 0]} mat="green" /><Box size={[0.05, 0.015, 0.05]} pos={[0.03, 0.485, 0]} mat="black" /></>);
    case "heater":
      return (<>
        <Box size={[0.26, 0.14, 0.06]} pos={[0, 0.75, 0]} mat="alu" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} size={[0.01, 0.12, 0.065]} pos={[-0.1 + i * 0.05, 0.75, 0]} mat="housing" />
        ))}
      </>);
    case "compressor":
      return (<>
        <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.26, 20]} />
          <meshStandardMaterial {...M.alu} />
        </mesh>
      </>);
  }
}

export function EVPart({ part }: { part: EVPartRecord }) {
  return (
    <group position={part.position} rotation={[0, part.rotationY, 0]}>
      <PartOwner id={part.id}>
        <Part name={EV_DEFS[part.type].name}>
          <Model type={part.type} />
        </Part>
        {pinsOf(part.type).map((pin) => (
          <Part key={pin.id} name={`${EV_DEFS[part.type].name} · ${pin.label}`}>
            <mesh position={pin.local}>
              <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
              <meshStandardMaterial color={PIN_COLORS[pin.role]} metalness={0.4} roughness={0.4} />
            </mesh>
          </Part>
        ))}
      </PartOwner>
    </group>
  );
}

export function EVWire({
  from, to, hv, crossSection, selected, onSelect, color,
}: {
  color?: string;
  from: [number, number, number];
  to: [number, number, number];
  hv: boolean;
  crossSection: number;
  selected: boolean;
  onSelect: (e: { ctx: boolean }) => void;
}) {
  const geo = useMemo(() => {
    const r = Math.max(0.006, Math.sqrt(crossSection / Math.PI) / 1000 * 2.2);
    return new THREE.TubeGeometry(wireCurve(from, to), 48, r, 10, false);
  }, [from[0], from[1], from[2], to[0], to[1], to[2], crossSection]);
  return (
    <mesh
      geometry={geo}
      castShadow
      onClick={(e) => { e.stopPropagation(); onSelect({ ctx: e.ctrlKey || e.metaKey }); }}
      onContextMenu={(e) => { e.stopPropagation(); e.nativeEvent?.preventDefault?.(); onSelect({ ctx: true }); }}
    >
      <meshStandardMaterial
        color={selected ? "#facc15" : color ?? (hv ? "#f07a1a" : "#1a1a1a")}
        emissive={selected ? "#a16207" : "#000000"}
        roughness={0.55}
      />
    </mesh>
  );
}

/** Faint car body outline and wheels for orientation (not selectable). */
export function EVChassisGhost() {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.85, 1.15, 4.7)), []);
  return (
    <group raycast={() => null}>
      <lineSegments geometry={edges} position={[0, 0.85, 0]} raycast={() => null}>
        <lineBasicMaterial color="#64748b" transparent opacity={0.45} />
      </lineSegments>
      <mesh position={[0, 0.3, 0]} raycast={() => null}>
        <boxGeometry args={[1.7, 0.02, 4.4]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.18} />
      </mesh>
      {[[-0.82, 1.45], [0.82, 1.45], [-0.82, -1.55], [0.82, -1.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.33, z]} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
          <cylinderGeometry args={[0.33, 0.33, 0.22, 28]} />
          <meshStandardMaterial color="#222" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}
