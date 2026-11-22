import { describe, expect, test } from "bun:test";
import { calculateFault, voltageFactor } from "./shortCircuit";
import { buildSceneFaultNetwork, faultAtNode, sequenceImpedanceAt, type FaultNetwork } from "./faultNetwork";

describe("symmetrical component faults", () => {
  const z = { r: 0.1, x: 1 };
  test("line-line current is sqrt(3)/2 of three-phase current", () => {
    const three = calculateFault({ un: 20000, z1: z, type: "3ph" });
    const ll = calculateFault({ un: 20000, z1: z, type: "ll" });
    expect(ll.ik / three.ik).toBeCloseTo(Math.sqrt(3) / 2, 8);
  });
  test("single-phase current equals three-phase current when Z0=Z1=Z2", () => {
    const three = calculateFault({ un: 20000, z1: z, z0: z, type: "3ph" });
    const lg = calculateFault({ un: 20000, z1: z, z0: z, type: "lg" });
    expect(lg.ik).toBeCloseTo(three.ik, 8);
    expect(lg.residualA).toBeCloseTo(lg.phaseA[0], 8);
  });
  test("LV maximum and minimum voltage factors are 1.05 and 0.95", () => {
    expect(voltageFactor(400, "max")).toBe(1.05);
    expect(voltageFactor(400, "min")).toBe(0.95);
    expect(voltageFactor(20000, "max")).toBe(1.1);
  });
});

describe("meshed fault network", () => {
  test("two equal parallel sources halve driving-point impedance", () => {
    const network: FaultNetwork = {
      nodes: { s1: { label: "S1", un: 20000 }, s2: { label: "S2", un: 20000 }, f: { label: "Fault", un: 20000 } },
      branches: [
        { id: "b1", a: "s1", b: "f", z1: { r: 0.1, x: 1 } },
        { id: "b2", a: "s2", b: "f", z1: { r: 0.1, x: 1 } },
      ],
      sources: [
        { id: "s1", node: "s1", un: 20000, z1: { r: 0.1, x: 1 } },
        { id: "s2", node: "s2", un: 20000, z1: { r: 0.1, x: 1 } },
      ],
      transformers: [],
      frequencyHz: 50,
    };
    const z = sequenceImpedanceAt(network, "f", "positive")!;
    expect(z.r).toBeCloseTo(0.1, 6);
    expect(z.x).toBeCloseTo(1, 6);
  });

  test("scene grid, MV cable, transformer and LV cable produce a lower LV fault", () => {
    const network = buildSceneFaultNetwork(
      [
        { id: "grid", type: "gridinfeed", values: { srcVoltage: 20000, gridFaultMVA: 500, gridXR: 10 } },
        { id: "tx", type: "transformer", values: { tfPrimaryV: 20000, tfSecondaryV: 400, tfRatedKVA: 630, tfUk: 4, tfUkr: 1, tfVector: "Dyn11" } },
      ],
      [
        { id: "mv", a: "grid#ac", b: "tx#hv", sceneType: "mv95", lengthM: 1000 },
        { id: "lv", a: "tx#lv", b: "panel", sceneType: "95", lengthM: 100 },
      ],
    );
    const hv = faultAtNode(network, "tx#hv", "3ph")!;
    const lv = faultAtNode(network, "panel", "3ph")!;
    expect(hv.ik).toBeGreaterThan(10000);
    expect(lv.ik).toBeGreaterThan(5000);
    expect(lv.ik).toBeLessThan(10000);
    expect(lv.phaseA[0]).toBeCloseTo(lv.ik, 8);
  });

  test("open switch disconnects the only source", () => {
    const network = buildSceneFaultNetwork(
      [{ id: "grid", type: "gridinfeed", values: { srcVoltage: 20000, gridFaultMVA: 500 } }],
      [{ id: "c", a: "grid#ac", b: "rec#in", sceneType: "mv95", lengthM: 100 }],
      [{ id: "rec", a: "rec#in", b: "rec#out", closed: false }],
    );
    expect(faultAtNode(network, "rec#out", "3ph")).toBeNull();
  });
});
