import { describe, expect, test } from "bun:test";
import { radialLoadFlow, velanderPeakKW } from "./loadflow";
import { checkLoadFlow, checkBreaking, checkThermal } from "./checks";
import { conductorOf, maxFaultTime, rAt } from "./conductors";

describe("radial load flow", () => {
  test("single 100 kW feeder on 300 m AXMK 4×185 drops about 4.5 % (hand calc)", () => {
    const r = radialLoadFlow(400, [{ id: "tx" }, { id: "end", parent: "tx", p: 100000, q: 48000 }], [{ to: "end", conductor: "axmk-4x185", lengthM: 300, tempC: 70 }]);
    expect(r.converged).toBe(true);
    expect(r.nodes["end"]!.dropPct).toBeGreaterThan(4.2);
    expect(r.nodes["end"]!.dropPct).toBeLessThan(4.9);
  });
  test("overloaded 4×16 cable is flagged as fail", () => {
    const r = radialLoadFlow(400, [{ id: "tx" }, { id: "a", parent: "tx", p: 80000 }], [{ to: "a", conductor: "axmk-4x16", lengthM: 50 }]);
    expect(checkLoadFlow(r).some((f) => f.rule === "loading" && f.severity === "fail")).toBe(true);
  });
  test("loads downstream add to upstream branch current", () => {
    const r = radialLoadFlow(400, [{ id: "s" }, { id: "a", parent: "s", p: 20000 }, { id: "b", parent: "a", p: 20000 }], [
      { to: "a", conductor: "axmk-4x120", lengthM: 100 }, { to: "b", conductor: "axmk-4x120", lengthM: 100 }]);
    expect(r.branches["a"]!.i).toBeGreaterThan(1.9 * r.branches["b"]!.i);
  });
});

describe("conductor data and checks", () => {
  test("Al resistance at 90 °C is ~28 % higher than at 20 °C", () => {
    const c = conductorOf("axmk-4x185")!;
    expect(rAt(c, 90) / c.r20).toBeCloseTo(1.282, 2);
  });
  test("185 mm² Al XLPE withstands 10 kA for about 3 s", () => {
    expect(maxFaultTime(conductorOf("axmk-4x185")!, 10000)).toBeCloseTo(3.02, 1);
  });
  test("6 kA device fails against 10 kA fault", () => {
    expect(checkBreaking("Q1", 6, 10000)?.severity).toBe("fail");
    expect(checkBreaking("Q1", 16, 10000)).toBeNull();
  });
  test("16 mm² cannot withstand 5 kA for 0.4 s", () => {
    expect(checkThermal("c1", "axmk-4x16", 5000, 0.4)?.rule).toBe("thermal-withstand");
  });
  test("Velander: 20 houses × 5000 kWh ≈ 41.6 kW", () => {
    expect(velanderPeakKW(20, 5000)).toBeCloseTo(41.65, 1);
  });
});
