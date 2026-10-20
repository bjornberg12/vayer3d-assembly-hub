/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { EV_DEFS, evLoads, evPinWorld, pinsOf, type EVPartRecord } from "./EVComponents";
import { HEATER_PINS } from "./heaterPins";

const part: EVPartRecord = { id: "heater-existing", type: "heater", position: [2, 0, 3], rotationY: 0, params: {} };
describe("PTC heater connector compatibility", () => {
  test("power, ground and control endpoint IDs and electrical load remain unchanged", () => {
    expect(pinsOf("heater").map((p) => [p.id, p.role])).toEqual([["dcp", "dc+"], ["dcn", "dc-"], ["gnd", "PE"], ["ctl", "sig"]]);
    expect(evLoads(part)).toEqual([{ owner: part.id, a: "heater-existing#dcp", b: "heater-existing#dcn", r: 32, ratedV: 400 }]);
  });
  test("wires follow the actual connector faces after moving and rotating", () => {
    expect(pinsOf("heater")).toBe(HEATER_PINS);
    for (const pin of HEATER_PINS) {
      expect(evPinWorld(part, pin.id)).toEqual([2 + pin.local[0], pin.local[1], 3 + pin.local[2]]);
      const moved = evPinWorld({ ...part, position: [4, 1, 5], rotationY: Math.PI / 2 }, pin.id);
      expect(moved?.[0]).toBeCloseTo(4 + pin.local[2]);
      expect(moved?.[1]).toBeCloseTo(1 + pin.local[1]);
      expect(moved?.[2]).toBeCloseTo(5 - pin.local[0]);
      expect(Math.abs(pin.local[0]) + 0.014).toBeLessThan(EV_DEFS.heater.footprint[0] / 2);
      expect(Math.abs(pin.local[2])).toBeLessThan(EV_DEFS.heater.footprint[1] / 2);
    }
  });
});