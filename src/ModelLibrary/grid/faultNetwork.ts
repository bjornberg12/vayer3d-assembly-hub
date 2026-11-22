/** Meshed positive/negative/zero-sequence network for IEC 60909 fault studies. */
import {
  calculateFault,
  gridImpedance,
  lineImpedance,
  transformerImpedance,
  voltageFactor,
  zMul,
  type FaultResult,
  type FaultType,
  type Z,
} from "./shortCircuit";
import { conductorOf, rAt, SCENE_CONDUCTOR } from "./conductors";

export type FaultNode = { label: string; un: number };
export type FaultBranch = { id: string; a: string; b: string; z1: Z; z0?: Z };
export type FaultSource = { id: string; node: string; un: number; z1: Z; z0?: Z };
export type FaultTransformer = {
  id: string;
  hv: string;
  lv: string;
  ratio: number;
  zLv: Z;
  zeroSequence: "pass" | "block";
};
export type FaultNetwork = {
  nodes: Record<string, FaultNode>;
  branches: FaultBranch[];
  sources: FaultSource[];
  transformers: FaultTransformer[];
  frequencyHz: number;
};

type Complex = { r: number; x: number };
const cAdd = (a: Complex, b: Complex): Complex => ({ r: a.r + b.r, x: a.x + b.x });
const cSub = (a: Complex, b: Complex): Complex => ({ r: a.r - b.r, x: a.x - b.x });
const cMul = (a: Complex, b: Complex): Complex => ({ r: a.r * b.r - a.x * b.x, x: a.r * b.x + a.x * b.r });
const cDiv = (a: Complex, b: Complex): Complex => {
  const d = Math.max(b.r * b.r + b.x * b.x, 1e-30);
  return { r: (a.r * b.r + a.x * b.x) / d, x: (a.x * b.r - a.r * b.x) / d };
};
const cAbs = (a: Complex) => Math.hypot(a.r, a.x);

function solveLinear(matrix: Complex[][], rhs: Complex[]): Complex[] | null {
  const n = rhs.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (cAbs(matrix[row]![col]!) > cAbs(matrix[pivot]![col]!)) pivot = row;
    if (cAbs(matrix[pivot]![col]!) < 1e-16) return null;
    [matrix[col], matrix[pivot]] = [matrix[pivot]!, matrix[col]!];
    [rhs[col], rhs[pivot]] = [rhs[pivot]!, rhs[col]!];
    for (let row = col + 1; row < n; row++) {
      const factor = cDiv(matrix[row]![col]!, matrix[col]![col]!);
      if (cAbs(factor) < 1e-20) continue;
      for (let k = col; k < n; k++) matrix[row]![k] = cSub(matrix[row]![k]!, cMul(factor, matrix[col]![k]!));
      rhs[row] = cSub(rhs[row]!, cMul(factor, rhs[col]!));
    }
  }
  const result = Array.from({ length: n }, () => ({ r: 0, x: 0 }));
  for (let row = n - 1; row >= 0; row--) {
    let value = rhs[row]!;
    for (let k = row + 1; k < n; k++) value = cSub(value, cMul(matrix[row]![k]!, result[k]!));
    result[row] = cDiv(value, matrix[row]![row]!);
  }
  return result;
}

/** Driving-point impedance obtained by injecting 1 A with every source set to zero. */
export function sequenceImpedanceAt(network: FaultNetwork, faultNode: string, sequence: "positive" | "negative" | "zero"): Z | null {
  if (!network.nodes[faultNode]) return null;
  const index = new Map<string, number>();
  const node = (id: string) => {
    if (!index.has(id)) index.set(id, index.size);
    return index.get(id)!;
  };
  network.branches.forEach((b) => { node(b.a); node(b.b); });
  network.sources.forEach((s) => node(s.node));
  const activeTransformers = network.transformers.filter((t) => sequence !== "zero" || t.zeroSequence === "pass");
  activeTransformers.forEach((t) => { node(t.hv); node(t.lv); node(`${t.id}__sequence_internal`); });
  node(faultNode);
  const n = index.size;
  const size = n + activeTransformers.length;
  if (!size) return null;
  const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ r: 0, x: 0 })));
  const rhs = Array.from({ length: size }, () => ({ r: 0, x: 0 }));
  const stamp = (a: number, b: number, impedance: Z) => {
    const y = cDiv({ r: 1, x: 0 }, { r: Math.max(Math.abs(impedance.r), 1e-9) * Math.sign(impedance.r || 1), x: impedance.x });
    matrix[a]![a] = cAdd(matrix[a]![a]!, y);
    matrix[b]![b] = cAdd(matrix[b]![b]!, y);
    matrix[a]![b] = cSub(matrix[a]![b]!, y);
    matrix[b]![a] = cSub(matrix[b]![a]!, y);
  };
  for (const branch of network.branches) {
    const z = sequence === "zero" ? branch.z0 ?? zMul(branch.z1, 3) : branch.z1;
    stamp(node(branch.a), node(branch.b), z);
  }
  // A source is its sequence impedance to the zero-voltage reference.
  for (const source of network.sources) {
    const z = sequence === "zero" ? source.z0 ?? source.z1 : source.z1;
    const y = cDiv({ r: 1, x: 0 }, { r: Math.max(z.r, 1e-9), x: z.x });
    const a = node(source.node);
    matrix[a]![a] = cAdd(matrix[a]![a]!, y);
  }
  activeTransformers.forEach((transformer, k) => {
    const h = node(transformer.hv);
    const internal = node(`${transformer.id}__sequence_internal`);
    const lv = node(transformer.lv);
    const ratio = Math.max(transformer.ratio, 1e-9);
    const z = sequence === "zero" ? zMul(transformer.zLv, 3) : transformer.zLv;
    stamp(internal, lv, z);
    const row = n + k;
    // Vh = ratio × Vi; branch current is an additional unknown.
    matrix[h]![row] = cAdd(matrix[h]![row]!, { r: 1, x: 0 });
    matrix[internal]![row] = cSub(matrix[internal]![row]!, { r: ratio, x: 0 });
    matrix[row]![h] = cAdd(matrix[row]![h]!, { r: 1, x: 0 });
    matrix[row]![internal] = cSub(matrix[row]![internal]!, { r: ratio, x: 0 });
  });
  rhs[node(faultNode)] = { r: 1, x: 0 };
  const solved = solveLinear(matrix, rhs);
  if (!solved) return null;
  const voltage = solved[node(faultNode)]!;
  if (!Number.isFinite(voltage.r) || !Number.isFinite(voltage.x) || cAbs(voltage) > 1e9) return null;
  return { r: Math.max(voltage.r, 0), x: voltage.x };
}

export function faultAtNode(network: FaultNetwork, nodeId: string, type: FaultType, range: "max" | "min" = "max", faultR = 0): FaultResult | null {
  const node = network.nodes[nodeId];
  if (!node) return null;
  const z1 = sequenceImpedanceAt(network, nodeId, "positive");
  if (!z1) return null;
  const z2 = sequenceImpedanceAt(network, nodeId, "negative") ?? z1;
  const z0 = sequenceImpedanceAt(network, nodeId, "zero") ?? zMul(z1, 3);
  return calculateFault({ un: node.un, z1, z2, z0, type, c: voltageFactor(node.un, range), faultR, frequency: network.frequencyHz });
}

export type SceneFaultDevice = {
  id: string;
  type: string;
  values: Record<string, string | number | undefined>;
};
export type SceneFaultLink = { id: string; a: string; b: string; sceneType: string; lengthM: number };
export type SceneFaultSwitch = { id: string; a: string; b: string; closed: boolean };

const numberValue = (values: SceneFaultDevice["values"], key: string, fallback: number) => {
  const value = Number(values[key] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
};

/** Convert placed scene equipment and conductors into a study-only sequence network. */
export function buildSceneFaultNetwork(devices: SceneFaultDevice[], links: SceneFaultLink[], switches: SceneFaultSwitch[] = []): FaultNetwork {
  const nodes: Record<string, FaultNode> = {};
  const branches: FaultBranch[] = [];
  const sources: FaultSource[] = [];
  const transformers: FaultTransformer[] = [];
  const ensure = (id: string, label = id, un?: number) => {
    const current = nodes[id];
    if (!current) nodes[id] = { label, un: un ?? 0 };
    else if (un && !current.un) current.un = un;
    return nodes[id]!;
  };

  for (const device of devices) {
    const v = device.values;
    const name = String(v.name ?? device.type);
    ensure(device.id, name, numberValue(v, "nominalVoltage", 0));
    if (device.type === "gridinfeed") {
      const un = Math.max(numberValue(v, "srcVoltage", 20000), 1);
      const sk = Math.max(numberValue(v, "gridFaultMVA", 500), 0.001) * 1e6;
      const z1 = gridImpedance(sk, Math.max(numberValue(v, "gridXR", 10), 0), un, 1);
      ensure(`${device.id}#ac`, `${name} grid terminal`, un);
      sources.push({ id: device.id, node: `${device.id}#ac`, un, z1, z0: zMul(z1, 1) });
    } else if (device.type === "vsource" && String(v.sourceKind ?? "AC") !== "DC") {
      const un = Math.max(numberValue(v, "srcVoltage", 400), 1);
      const r = Math.max(numberValue(v, "internalR", 0), 1e-6);
      ensure(`${device.id}#ac`, `${name} AC terminal`, un);
      sources.push({ id: device.id, node: `${device.id}#ac`, un, z1: { r, x: r * 0.2 } });
    } else if ((device.type === "solar" || device.type === "storage") && String(v.storageMode ?? "discharge") !== "idle") {
      const un = Math.max(numberValue(v, device.type === "solar" ? "pvVoltage" : "storageVoltage", 400), 1);
      const r = Math.max(numberValue(v, "internalR", 0.02), 1e-6);
      ensure(`${device.id}#ac`, `${name} AC terminal`, un);
      sources.push({ id: device.id, node: `${device.id}#ac`, un, z1: { r, x: r * 2 } });
    } else if (device.type === "transformer") {
      const hv = Math.max(numberValue(v, "tfPrimaryV", 10000), 1);
      const lv = Math.max(numberValue(v, "tfSecondaryV", 400), 1);
      const tap = numberValue(v, "tfTap", 0) / 100;
      const ratedVA = Math.max(numberValue(v, "tfRatedKVA", 630), 0.1) * 1000;
      const zLv = transformerImpedance(ratedVA, Math.max(numberValue(v, "tfUk", 4), 0.01), Math.max(numberValue(v, "tfUkr", 1), 0.01), lv);
      ensure(`${device.id}#hv`, `${name} HV`, hv);
      ensure(`${device.id}#lv`, `${name} LV`, lv);
      transformers.push({ id: device.id, hv: `${device.id}#hv`, lv: `${device.id}#lv`, ratio: (hv * (1 + tap)) / lv, zLv, zeroSequence: String(v.tfVector ?? "Dyn11") === "YNyn0" ? "pass" : "block" });
    }
  }

  for (const link of links) {
    const conductor = conductorOf(SCENE_CONDUCTOR[link.sceneType] ?? "");
    if (!conductor) continue;
    const z1 = lineImpedance(rAt(conductor, 20), conductor.x, Math.max(link.lengthM, 0.01));
    ensure(link.a, link.a);
    ensure(link.b, link.b);
    if (!nodes[link.a]!.un && !nodes[link.b]!.un) {
      nodes[link.a]!.un = conductor.un;
      nodes[link.b]!.un = conductor.un;
    }
    branches.push({ id: link.id, a: link.a, b: link.b, z1, z0: zMul(z1, 3) });
  }
  for (const item of switches.filter((s) => s.closed)) {
    ensure(item.a, item.a);
    ensure(item.b, item.b);
    branches.push({ id: item.id, a: item.a, b: item.b, z1: { r: 0.0001, x: 0.00001 } });
  }

  // Propagate voltage zones through conductors and closed switch branches.
  for (let pass = 0; pass < devices.length + links.length + switches.length + 2; pass++) {
    let changed = false;
    for (const branch of branches) {
      const a = ensure(branch.a);
      const b = ensure(branch.b);
      if (a.un && !b.un) { b.un = a.un; changed = true; }
      if (b.un && !a.un) { a.un = b.un; changed = true; }
    }
    if (!changed) break;
  }
  Object.values(nodes).forEach((node) => { if (!node.un) node.un = 400; });
  return { nodes, branches, sources, transformers, frequencyHz: 50 };
}
