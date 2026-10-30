import { describe, expect, test } from "bun:test";
import { solveCircuits } from "../sources/solver";
import { lvBreakerWireId, lvPanelLoads, lvPanelWires, lvSpdOwner, lvTripReason, makeLVDevice, type LVDevice } from "./LVPanel";

const src = { id: "s", kind: "AC", voltage: 400, internalR: 0 };
const feed = [
  { id: "f1", a: "s#l1", b: "p#l1", r: 1e-3 }, { id: "f2", a: "s#l2", b: "p#l2", r: 1e-3 },
  { id: "f3", a: "s#l3", b: "p#l3", r: 1e-3 }, { id: "fn", a: "s#n", b: "p#n", r: 1e-3 },
];
const mcb = (patch: Partial<LVDevice> = {}): LVDevice => ({ ...makeLVDevice("mcb", 1), id: "q1", poles: 1, phase: "L1", rating: 16, ...patch });
const run = (devs: LVDevice[], loadR: number) =>
  solveCircuits([src], [...feed, ...lvPanelWires("p", devs), { id: "load", a: "p#q1_o0", b: "p#nb1", r: loadR }], lvPanelLoads("p", devs));

describe("LV panel", () => {
  test("bus-fed closed MCB carries 230 V / R load current", () => {
    const I = run([mcb()], 23).wireCurrent[lvBreakerWireId("p", "q1", 0)];
    expect(I).toBeGreaterThan(9.9);
    expect(I).toBeLessThan(10.1);
  });
  test("switched-off MCB carries no current", () => {
    expect(run([mcb({ closed: false })], 23).wireCurrent[lvBreakerWireId("p", "q1", 0)] ?? 0).toBe(0);
  });
  test("manual feed without wires carries no current", () => {
    expect(run([mcb({ feed: "manual" })], 23).wireCurrent[lvBreakerWireId("p", "q1", 0)] ?? 0).toBe(0);
  });
  test("trips on overload at 1.45 × In and short circuit at 10 × In", () => {
    expect(lvTripReason(mcb(), 20)).toBeNull();
    expect(lvTripReason(mcb(), 24)).toContain("Overload");
    expect(lvTripReason(mcb(), 170)).toContain("Short circuit");
  });
  test("SPD reports protecting when the busbar is live", () => {
    const spd = { ...makeLVDevice("spd", 1), id: "sp" };
    expect(run([mcb(), spd], 23).partStatus[lvSpdOwner("p", "sp")]?.state).toBe("on");
  });
});
