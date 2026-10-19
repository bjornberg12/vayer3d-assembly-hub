/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { evPinWorld, evLoads, pinsOf, type EVPartRecord } from "./EVComponents";
import { CONVERTER_PINS } from "./converterPins";

const part: EVPartRecord = { id: "converter-existing", type: "dcdc", position: [2, 0, 3], rotationY: 0, params: {} };
describe("DC-DC connector compatibility", () => {
  test("all existing endpoints and their electrical behavior remain available", () => {
    expect(pinsOf("dcdc").map((p) => [p.id, p.role])).toEqual([
      ["hvp", "dc+"], ["hvn", "dc-"], ["lvp", "12+"], ["lvn", "12-"], ["en", "sig"],
    ]);
    expect(evLoads(part)).toEqual([{ owner: "converter-existing", a: "converter-existing#hvp", b: "converter-existing#hvn", r: 64, ratedV: 400 }]);
  });
  test("existing wires track side-mounted contacts after movement and rotation", () => {
    expect(pinsOf("dcdc")).toBe(CONVERTER_PINS);
    for (const pin of CONVERTER_PINS) {
      expect(evPinWorld(part, pin.id)).toEqual([2 + pin.local[0], pin.local[1], 3 + pin.local[2]]);
      const rotated = evPinWorld({ ...part, position: [4, 1, 5], rotationY: Math.PI / 2 }, pin.id);
      expect(rotated?.[0]).toBeCloseTo(4 + pin.local[2]);
      expect(rotated?.[1]).toBeCloseTo(1 + pin.local[1]);
      expect(rotated?.[2]).toBeCloseTo(5 - pin.local[0]);
    }
  });
});