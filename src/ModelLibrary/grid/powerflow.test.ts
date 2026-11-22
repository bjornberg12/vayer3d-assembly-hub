import { describe, expect, it } from "vitest";
import { meshedPowerFlow } from "./powerflow";
import { radialLoadFlow } from "./loadflow";
import { conductorOf } from "./conductors";
import { earthFaultCurrent, earthingCheck, meshResistance, permissibleTouchVoltage, rodResistance } from "./earthing";

const cond = "axmk-4x240";

describe("meshed power flow", () => {
  it("matches radial sweep on a radial feeder", () => {
    const r = radialLoadFlow(400, [{ id: "s" }, { id: "a", parent: "s", p: 50e3 }], [{ to: "a", conductor: cond, lengthM: 200 }]);
    const m = meshedPowerFlow(400, [{ id: "s", slack: true }, { id: "a", p: 50e3 }], [{ id: "b", from: "s", to: "a", conductor: cond, lengthM: 200 }]);
    expect(m.converged).toBe(true);
    expect(m.buses["a"]!.u).toBeCloseTo(r.nodes["a"]!.u, 1);
  });
  it("ring feeding splits current in half for symmetric ring", () => {
    const m = meshedPowerFlow(400, [{ id: "s", slack: true }, { id: "a", p: 60e3 }], [
      { id: "l", from: "s", to: "a", conductor: cond, lengthM: 100 }, { id: "r", from: "s", to: "a", conductor: cond, lengthM: 100 }]);
    expect(m.branches["l"]!.i).toBeCloseTo(m.branches["r"]!.i, 6);
  });
  it("PV export above load gives reverse flow and voltage rise", () => {
    const m = meshedPowerFlow(400, [{ id: "s", slack: true }, { id: "a", p: 10e3, genP: 60e3 }], [{ id: "b", from: "s", to: "a", conductor: cond, lengthM: 300 }]);
    expect(m.reverseFlow).toBe(true);
    expect(m.buses["a"]!.u).toBeGreaterThan(400);
  });
});

describe("earthing", () => {
  it("3 m rod in 100 Ωm soil ≈ 33 Ω", () => expect(rodResistance(100, 3)).toBeCloseTo(33.4, 0));
  it("mesh 20x20 m, 160 m conductor, 100 Ωm ≈ 2.7 Ω", () => expect(meshResistance(100, 400, 160)).toBeCloseTo(2.7, 0));
  it("permissible touch voltage at 0.5 s is 220 V", () => expect(permissibleTouchVoltage(0.5)).toBe(220));
  it("isolated 20 kV network with 10 µF earth capacitance ≈ 109 A", () => expect(earthFaultCurrent("isolated", 20e3, { c0F: 10e-6 })).toBeCloseTo(108.8, 0));
  it("EPR above 2·UTP and high touch fails", () => expect(earthingCheck(5, 200, 0.5).pass).toBe(false));
});
