/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { evLoads, evPinWorld, pinsOf, type EVPartRecord } from "./EVComponents";
import { AUX_BATTERY_PINS } from "./auxBatteryPins";

const part: EVPartRecord = { id: "existing-aux12", type: "aux12", position: [2, 0, 3], rotationY: 0, params: { capacity: 60 } };
describe("auxiliary battery terminal compatibility", () => {
  test("preserves positive and negative endpoints and the existing electrical load", () => {
    expect(pinsOf("aux12").map((pin) => [pin.id, pin.role])).toEqual([["p", "12+"], ["n", "12-"]]);
    expect(evLoads(part)).toEqual([{ owner: "existing-aux12", a: "existing-aux12#p", b: "existing-aux12#n", r: 0.288, ratedV: 12 }]);
  });
  test("wires follow the actual post faces when moved and rotated", () => {
    expect(pinsOf("aux12")).toBe(AUX_BATTERY_PINS);
    expect(evPinWorld(part, "p")).toEqual([1.916, 0.735, 2.953]);
    expect(evPinWorld(part, "n")).toEqual([2.084, 0.735, 2.953]);
    for (const pin of AUX_BATTERY_PINS) {
      const world = evPinWorld({ ...part, position: [4, 1, 5], rotationY: Math.PI / 2 }, pin.id);
      expect(world?.[0]).toBeCloseTo(4 + pin.local[2]);
      expect(world?.[1]).toBeCloseTo(1.735);
      expect(world?.[2]).toBeCloseTo(5 - pin.local[0]);
    }
  });
});