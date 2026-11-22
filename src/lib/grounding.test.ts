import { describe, expect, test } from "bun:test";
import {
  DEFAULT_GROUNDING,
  groundingCheck,
  parseGrounding,
  resistancePath,
  type GroundingSettings,
  type GroundingSource,
} from "./grounding";
import { lvPanelWires, type LVDevice } from "@/ModelLibrary/distribution/LVPanel";

const source: GroundingSource = {
  id: "s",
  label: "400 V supply",
  voltageLL: 400,
  phases: ["s#l1", "s#l2", "s#l3"],
  pe: "s#pe",
};
const target = { id: "a#l1", label: "First enclosure", pe: "a#pe" };
const wires = [
  { id: "phase", a: "s#l1", b: "a#l1", r: 0.2 },
  { id: "pe", a: "a#pe", b: "s#pe", r: 0.3 },
];
const check = (patch: Partial<GroundingSettings> = {}, branches = wires) =>
  groundingCheck({ ...DEFAULT_GROUNDING, ...patch }, source, target, branches);

describe("grounding studies", () => {
  test("TN uses actual phase and PE resistance plus supply impedance", () => {
    const r = check();
    expect(r.available).toBe(true);
    if (!r.available) throw new Error(r.reason);
    expect(r.loopZ).toBeCloseTo(0.6, 5);
    expect(r.current).toBeCloseTo(400 / Math.sqrt(3) / 0.6, 3);
    expect(r.touch).toBeCloseTo(115.47, 3);
    expect(r.phaseWires).toEqual(["phase"]);
    expect(r.returnWires).toEqual(["pe"]);
    expect(r.touchOK).toBe(false);
    expect(r.protectionOK).toBe(true);
  });
  test("TN does not reinterpret a neutral conductor as a PE return", () => {
    const r = check({}, [wires[0], { id: "neutral", a: "a#n", b: "s#n", r: 0.3 }]);
    expect(r.available).toBe(false);
    if (r.available) throw new Error("Unexpected available result");
    expect(r.reason).toContain("No PE return");
  });
  test("parallel conductors reduce effective resistance", () => {
    const r = resistancePath(
      [...wires, { id: "parallel", a: "s#l1", b: "a#l1", r: 0.2 }],
      "s#l1",
      "a#l1",
    );
    expect(r?.resistance).toBeCloseTo(0.1, 5);
  });
  test("TT fault voltage is not clamped to the 30 mA RCD rating", () => {
    const r = check({ system: "TT", electrodeA: 20, electrodeB: 10, rcdEnabled: true, rcdMA: 30 }, [
      wires[0],
    ]);
    if (!r.available) throw new Error(r.reason);
    expect(r.current).toBeCloseTo(400 / Math.sqrt(3) / 30.3, 4);
    expect(r.touch).toBeCloseTo(r.current * 20, 4);
    expect(r.touch).toBeGreaterThan(150);
    expect(r.electrodeCriterion).toBe(true);
    expect(r.protectionOK).toBe(true);
  });
  test("TT requires a selected RCD and its RA criterion", () => {
    const noRcd = check({ system: "TT" }, [wires[0]]);
    if (!noRcd.available) throw new Error(noRcd.reason);
    expect(noRcd.protectionOK).toBe(false);
    const poorEarth = check({ system: "TT", electrodeA: 2000, rcdEnabled: true }, [wires[0]]);
    if (!poorEarth.available) throw new Error(poorEarth.reason);
    expect(poorEarth.electrodeCriterion).toBe(false);
  });
  test("clearing time is checked independently from current pickup", () => {
    const r = check({ clearingTime: 0.5, maxClearingTime: 0.4 });
    if (!r.available) throw new Error(r.reason);
    expect(r.pickup).toBe(true);
    expect(r.timeOK).toBe(false);
    expect(r.protectionOK).toBe(false);
  });
  test("IT uses total capacitance once, combined with insulation leakage", () => {
    const r = check(
      { system: "IT", sourceR: 0, electrodeA: 20, insulationR: 100000, capacitanceUF: 1 },
      [wires[0]],
    );
    if (!r.available) throw new Error(r.reason);
    const g = 1 / 100000,
      b = 2 * Math.PI * 50 * 1e-6;
    const expected =
      400 / Math.sqrt(3) / Math.hypot(20.2 + g / (g * g + b * b), -b / (g * g + b * b));
    expect(r.current).toBeCloseTo(expected, 6);
    expect(r.current).toBeLessThan(0.073);
    expect(r.touch).toBeCloseTo(expected * 20, 6);
    expect(r.firstIT).toBe(true);
    expect(r.protectionOK).toBeNull();
  });
  test("IT second fault uses two real phase routes and shared PE", () => {
    const second = { id: "b#l2", label: "Second enclosure", pe: "b#pe" };
    const branches = [
      wires[0],
      { id: "phase2", a: "s#l2", b: "b#l2", r: 0.4 },
      { id: "sharedPE", a: "a#pe", b: "b#pe", r: 0.3 },
    ];
    const r = groundingCheck(
      { ...DEFAULT_GROUNDING, system: "IT", secondFaultPin: second.id },
      source,
      target,
      branches,
      second,
    );
    if (!r.available) throw new Error(r.reason);
    expect(r.loopZ).toBeCloseTo(1.1, 5);
    expect(r.current).toBeCloseTo(400 / 1.1, 4);
    expect(r.touch).toBeCloseTo((400 / 1.1) * 0.3, 4);
    expect(r.secondFault).toBe(true);
  });
  test("IT second faults on the same phase are not treated as phase-to-phase faults", () => {
    const r = groundingCheck(
      { ...DEFAULT_GROUNDING, system: "IT", secondFaultPin: target.id },
      source,
      target,
      wires,
      target,
    );
    expect(r.available).toBe(false);
    if (r.available) throw new Error("Unexpected result");
    expect(r.reason).toContain("different phase");
  });
  test("an open modeled breaker blocks the phase fault route", () => {
    const dev: LVDevice = {
      id: "m1",
      kind: "mcb",
      label: "C16",
      poles: 1,
      phase: "L1",
      rating: 16,
      feed: "bus",
      closed: false,
    };
    const branches = [
      { id: "incoming", a: "s#l1", b: "panel#l1", r: 0.1 },
      ...lvPanelWires("panel", [dev]),
    ];
    const r = groundingCheck(
      DEFAULT_GROUNDING,
      source,
      { id: "panel#m1_o0", label: "MCB output", pe: "panel#pe" },
      branches,
    );
    expect(r.available).toBe(false);
    const closedWires = [
      { id: "incoming", a: "s#l1", b: "panel#l1", r: 0.1 },
      { id: "earth", a: "s#pe", b: "panel#pe", r: 0.1 },
      ...lvPanelWires("panel", [{ ...dev, closed: true }]),
    ];
    expect(
      groundingCheck(
        DEFAULT_GROUNDING,
        source,
        { id: "panel#m1_o0", label: "MCB output", pe: "panel#pe" },
        closedWires,
      ).available,
    ).toBe(true);
  });
  test("TT rejects an existing metallic PE return", () => {
    expect(check({ system: "TT" }).available).toBe(false);
  });
  test("IT rejects a modeled neutral-to-chassis bond", () => {
    const r = check({ system: "IT" }, [...wires, { id: "bond", a: "s#n", b: "a#pe", r: 0.001 }]);
    expect(r.available).toBe(false);
  });
  test("MV and unenergized supplies are outside this LV study", () => {
    expect(
      groundingCheck(DEFAULT_GROUNDING, { ...source, voltageLL: 10000 }, target, wires).available,
    ).toBe(false);
    expect(
      groundingCheck(DEFAULT_GROUNDING, { ...source, voltageLL: 0 }, target, wires).available,
    ).toBe(false);
  });
  test("grounding save validation rejects impossible numeric values", () => {
    expect(parseGrounding(undefined)).toEqual(DEFAULT_GROUNDING);
    expect(() => parseGrounding({ system: "other" })).toThrow();
    expect(() => parseGrounding({ electrodeA: 0 })).toThrow();
    expect(() => parseGrounding({ sourceX: Number.NaN })).toThrow();
  });
});
