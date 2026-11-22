import { solveCircuits, type SolverWire } from "@/ModelLibrary/sources/solver";

export type GroundingSystem = "TN" | "TT" | "IT";
export interface GroundingSettings {
  system: GroundingSystem;
  sourceId: string;
  faultPin: string;
  secondFaultPin: string;
  sourceR: number;
  sourceX: number;
  faultR: number;
  electrodeA: number;
  electrodeB: number;
  insulationR: number;
  capacitanceUF: number;
  frequency: number;
  touchLimit: number;
  tripCurrent: number;
  rcdEnabled: boolean;
  rcdMA: number;
  clearingTime: number;
  maxClearingTime: number;
}
export const DEFAULT_GROUNDING: GroundingSettings = {
  system: "TN",
  sourceId: "",
  faultPin: "",
  secondFaultPin: "",
  sourceR: 0.1,
  sourceX: 0,
  faultR: 0,
  electrodeA: 20,
  electrodeB: 1,
  insulationR: 100000,
  capacitanceUF: 1,
  frequency: 50,
  touchLimit: 50,
  tripCurrent: 160,
  rcdEnabled: false,
  rcdMA: 30,
  clearingTime: 0.2,
  maxClearingTime: 0.4,
};

export function parseGrounding(value: unknown): GroundingSettings {
  if (value === undefined) return { ...DEFAULT_GROUNDING };
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid grounding settings.");
  const raw = value as Record<string, unknown>;
  const result = { ...DEFAULT_GROUNDING };
  for (const key of ["sourceId", "faultPin", "secondFaultPin"] as const) {
    if (raw[key] !== undefined) {
      if (typeof raw[key] !== "string") throw new Error("Invalid grounding settings.");
      result[key] = raw[key];
    }
  }
  if (raw["system"] !== undefined) {
    if (raw["system"] !== "TN" && raw["system"] !== "TT" && raw["system"] !== "IT")
      throw new Error("Invalid grounding system.");
    result.system = raw["system"];
  }
  if (raw["rcdEnabled"] !== undefined) {
    if (typeof raw["rcdEnabled"] !== "boolean") throw new Error("Invalid RCD setting.");
    result.rcdEnabled = raw["rcdEnabled"];
  }
  for (const key of [
    "sourceR",
    "sourceX",
    "faultR",
    "electrodeA",
    "electrodeB",
    "insulationR",
    "capacitanceUF",
    "frequency",
    "touchLimit",
    "tripCurrent",
    "rcdMA",
    "clearingTime",
    "maxClearingTime",
  ] as const) {
    const v = raw[key];
    if (v === undefined) continue;
    const strictlyPositive = [
      "electrodeA",
      "electrodeB",
      "insulationR",
      "frequency",
      "touchLimit",
      "tripCurrent",
      "rcdMA",
      "clearingTime",
      "maxClearingTime",
    ].includes(key);
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || (strictlyPositive && v === 0))
      throw new Error(`Invalid grounding value: ${key}.`);
    result[key] = v;
  }
  return result;
}

export interface GroundingSource {
  id: string;
  label: string;
  voltageLL: number;
  phases: string[];
  pe: string;
}
export interface GroundingTarget {
  id: string;
  label: string;
  pe: string;
}

/** Effective resistance uses the existing MNA engine, so parallel routes count.
 * The path is a representative route, not a claim that parallel currents follow it exclusively. */
export function resistancePath(wires: SolverWire[], start: string, end: string) {
  if (start === end) return { resistance: 0, nodes: [start], wires: [] as string[] };
  const edges = wires.filter((w) => Number.isFinite(w.r) && w.r >= 0);
  const seen = new Set([start]);
  const previous = new Map<string, { node: string; wire: string }>();
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    for (const w of edges) {
      const next = w.a === node ? w.b : w.b === node ? w.a : null;
      if (next === null || seen.has(next)) continue;
      seen.add(next);
      previous.set(next, { node: String(node), wire: w.id });
      queue.push(next);
    }
  }
  if (!seen.has(end)) return null;
  const nodes = [end],
    route: string[] = [];
  let node = end;
  while (node !== start) {
    const step = previous.get(node);
    if (!step) return null;
    route.unshift(step.wire);
    nodes.unshift(step.node);
    node = step.node;
  }
  const probe = "__grounding_probe__";
  const result = solveCircuits(
    [{ id: probe, kind: "DC", voltage: 1, internalR: 0 }],
    [
      ...edges.filter((w) => seen.has(w.a) && seen.has(w.b)),
      { id: `${probe}a`, a: `${probe}#dcp`, b: start, r: 0 },
      { id: `${probe}b`, a: end, b: `${probe}#dcn`, r: 0 },
    ],
    [],
  );
  const loop = result.loops[probe]?.[0];
  if (!loop || !Number.isFinite(loop.resistance)) return null;
  return { resistance: Math.max(0, loop.resistance - 0.000003), nodes, wires: route };
}

export function groundingCheck(
  s: GroundingSettings,
  source: GroundingSource | undefined,
  target: GroundingTarget | undefined,
  wires: SolverWire[],
  second?: GroundingTarget,
) {
  const unavailable = (reason: string) => ({ available: false as const, reason });
  if (!source || !target) return unavailable("Select a supply and a fault location.");
  if (!Number.isFinite(source.voltageLL) || source.voltageLL <= 1)
    return unavailable("The selected supply is not energized.");
  if (source.voltageLL > 1000)
    return unavailable(
      "These checks cover LV AC systems up to 1,000 V only. MV requires a soil and earthing-grid study.",
    );
  if (!target.pe) return unavailable("The faulted device has no modeled PE/chassis terminal.");
  const neutral = source.phases[0]?.endsWith("#x1") ? `${source.id}#xn` : `${source.id}#n`;
  if (s.system !== "TN" && resistancePath(wires, target.pe, neutral))
    return unavailable(
      "A conducting N–PE bond contradicts the selected TT/IT assumptions. Remove the bond or use a TN study.",
    );
  if (s.system === "TT" && resistancePath(wires, target.pe, source.pe))
    return unavailable(
      "A metallic PE return joins the local and supply earths. The separate-electrode TT model does not apply.",
    );
  if (resistancePath(wires, target.id, target.pe))
    return unavailable(
      "Phase and chassis are already joined in the conducting graph. Clear that connection before applying a prospective fault.",
    );
  const feeds = source.phases.map((p, phase) => ({
    phase,
    path: resistancePath(wires, p, target.id),
  }));
  const feed = feeds.find((f) => f.path !== null);
  if (!feed?.path)
    return unavailable(
      "No conducting phase route from this supply to the fault point. Check wiring and breaker positions.",
    );
  if (feeds.filter((f) => f.path !== null).length !== 1)
    return unavailable(
      "Multiple supply phases are joined at this point. Resolve the phase short circuit first.",
    );
  const u0 = source.voltageLL / Math.sqrt(3);
  const forwardR = feed.path.resistance;
  let current: number, touch: number, loopZ: number;
  let returnNodes: string[] = [],
    returnWires: string[] = [];
  let pathText: string;
  let secondFault = false;
  if (s.system === "IT" && s.secondFaultPin) {
    if (!second || !second.pe)
      return unavailable("Select a second fault on a device with a PE/chassis terminal.");
    const secondFeeds = source.phases
      .map((p, phase) => ({ phase, path: resistancePath(wires, p, second.id) }))
      .filter((f) => f.path !== null);
    const next = secondFeeds[0];
    if (!next?.path || secondFeeds.length !== 1)
      return unavailable("The second fault needs a single conducting supply-phase route.");
    if (next.phase === feed.phase)
      return unavailable("An IT second-fault check needs a different phase.");
    const pe = resistancePath(wires, target.pe, second.pe);
    if (!pe)
      return unavailable(
        "No shared PE path between the two IT faulted devices. Separate-earth second faults require a dedicated study.",
      );
    loopZ = Math.hypot(
      forwardR + next.path.resistance + pe.resistance + 2 * (s.sourceR + s.faultR),
      2 * s.sourceX,
    );
    if (loopZ < 1e-6)
      return unavailable(
        "Enter a nonzero supply/fault impedance; an ideal short has no finite fault current.",
      );
    current = source.voltageLL / loopZ;
    touch = current * pe.resistance;
    returnNodes = [...pe.nodes, ...next.path.nodes.slice().reverse()];
    returnWires = [...pe.wires, ...next.path.wires];
    pathText = "Phase → first fault → shared PE → second fault → different phase";
    secondFault = true;
  } else if (s.system === "IT") {
    const conductance = 1 / s.insulationR;
    const susceptance = 2 * Math.PI * s.frequency * s.capacitanceUF * 1e-6;
    const admittanceSquared = conductance ** 2 + susceptance ** 2;
    const leakageR = conductance / admittanceSquared;
    const leakageX = -susceptance / admittanceSquared;
    loopZ = Math.hypot(
      forwardR + s.sourceR + s.faultR + s.electrodeA + leakageR,
      s.sourceX + leakageX,
    );
    current = u0 / loopZ;
    touch = current * s.electrodeA;
    pathText =
      "Phase → first fault → chassis → RA → distributed insulation/capacitance → isolated supply";
  } else {
    let returnR: number;
    if (s.system === "TN") {
      const pe = resistancePath(wires, target.pe, source.pe);
      if (!pe)
        return unavailable(
          "No PE return to the supply. A neutral cable core is not assumed to be PE/PEN. Add explicit PE wiring.",
        );
      returnR = pe.resistance;
      returnNodes = pe.nodes;
      returnWires = pe.wires;
      pathText = "Phase → fault → chassis → PE → supply N–PE bond → winding";
    } else {
      returnR = s.electrodeA + s.electrodeB;
      pathText = "Phase → fault → chassis → RA → soil → RB → supply neutral → winding";
    }
    loopZ = Math.hypot(forwardR + s.sourceR + s.faultR + returnR, s.sourceX);
    if (loopZ < 1e-6)
      return unavailable(
        "Enter a nonzero supply/fault impedance; an ideal short has no finite fault current.",
      );
    current = u0 / loopZ;
    touch = current * (s.system === "TN" ? returnR : s.electrodeA);
  }
  const firstIT = s.system === "IT" && !secondFault;
  const pickup =
    s.system === "TT" ? s.rcdEnabled && current >= s.rcdMA / 1000 : current >= s.tripCurrent;
  const electrodeCriterion =
    s.system === "TT" ? s.rcdEnabled && (s.electrodeA * s.rcdMA) / 1000 <= s.touchLimit : null;
  const timeOK = s.clearingTime <= s.maxClearingTime;
  const touchOK = touch <= s.touchLimit;
  const protectionOK = firstIT ? null : pickup && timeOK && electrodeCriterion !== false;
  return {
    available: true as const,
    current,
    touch,
    loopZ,
    forwardR,
    touchOK,
    protectionOK,
    electrodeCriterion,
    pickup,
    timeOK,
    firstIT,
    secondFault,
    pathText,
    phaseNodes: feed.path.nodes,
    phaseWires: feed.path.wires,
    returnNodes,
    returnWires,
  };
}
