/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { EV_DEFS, evLoads, evPinWorld, pinsOf, type EVPartRecord } from "./EVComponents";
import { TRACTION_BATTERY_PINS } from "./tractionBatteryPins";
import { solveCircuits } from "../sources/solver";

const pack: EVPartRecord = { id: "existing-pack", type: "battery", position: [0, 0, 0], rotationY: 0, params: {} };
describe("HV battery connector compatibility", () => {
  test("preserves the five electrical endpoint IDs and 400 V charging equivalent", () => {
    expect(pinsOf("battery").map((p) => [p.id, p.role])).toEqual([["dcp", "dc+"], ["dcn", "dc-"], ["gnd", "PE"], ["bms", "sig"], ["hvil", "sig"]]);
    expect(evLoads(pack)).toEqual([{ owner: pack.id, a: "existing-pack#dcp", b: "existing-pack#dcn", r: 160000 / 11000, ratedV: 400 }]);
  });
  test("wire endpoints follow the bulkhead contacts when the pack moves and rotates", () => {
    expect(pinsOf("battery")).toBe(TRACTION_BATTERY_PINS);
    const moved = { ...pack, position: [2, 0.5, -1] as [number, number, number], rotationY: Math.PI / 2 };
    for (const pin of TRACTION_BATTERY_PINS) {
      expect(evPinWorld(pack, pin.id)).toEqual(pin.local);
      const world = evPinWorld(moved, pin.id);
      expect(world?.[0]).toBeCloseTo(2 + pin.local[2]);
      expect(world?.[1]).toBeCloseTo(0.5 + pin.local[1]);
      expect(world?.[2]).toBeCloseTo(-1 - pin.local[0]);
      expect(Math.abs(pin.local[0]) + 0.012).toBeLessThan(EV_DEFS.battery.footprint[0] / 2);
      expect(Math.abs(pin.local[2]) + 0.012).toBeLessThan(EV_DEFS.battery.footprint[1] / 2);
    }
  });
  test("the relocated DC contacts still power the pack charging load", () => {
    const wires = [{ id: "positive", a: "supply#p", b: `${pack.id}#dcp`, r: 0.001 }, { id: "negative", a: `${pack.id}#dcn`, b: "supply#n", r: 0.001 }];
    const result = solveCircuits([{ id: "supply", kind: "DC", voltage: 400, internalR: 0 }], wires, evLoads(pack));
    expect(result.partStatus[pack.id]?.state).toBe("on");
    expect(result.partStatus[pack.id]?.powerW).toBeGreaterThan(10990);
    expect(result.partStatus[pack.id]?.powerW).toBeLessThan(11000);
    expect(result.wireCurrent.positive).toBeGreaterThan(27.4);
    expect(result.wireCurrent.positive).toBeLessThan(27.5);
    expect(solveCircuits([], wires, evLoads(pack)).partStatus[pack.id]?.state).toBe("off");
  });
});