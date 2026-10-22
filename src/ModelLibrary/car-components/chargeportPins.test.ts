/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { EV_DEFS, evLoads, evPinWorld, pinsOf, type EVPartRecord } from "./EVComponents";

const part: EVPartRecord = { id: "port-existing", type: "chargeport", position: [-0.85, 0, -1.85], rotationY: 0, params: {} };
describe("Charge port connector compatibility", () => {
  test("AC, DC and signal endpoint IDs and electrical loads remain unchanged", () => {
    expect(pinsOf("chargeport").map((p) => [p.id, p.role])).toEqual([
      ["l1", "L1"], ["l2", "L2"], ["l3", "L3"], ["n", "N"], ["pe", "PE"],
      ["dcp", "dc+"], ["dcn", "dc-"], ["cp", "sig"], ["pp", "sig"],
    ]);
    expect(evLoads(part)).toEqual([
      { owner: part.id, a: "port-existing#dcp", b: "port-existing#dcn", r: 160000 / 30, ratedV: 400 },
      { owner: part.id, a: "port-existing#l1", b: "port-existing#n", r: 5290, ratedV: 230 },
      { owner: part.id, a: "port-existing#l2", b: "port-existing#n", r: 5290, ratedV: 230 },
      { owner: part.id, a: "port-existing#l3", b: "port-existing#n", r: 5290, ratedV: 230 },
    ]);
  });
  test("wires follow the existing contact faces after moving and rotating", () => {
    for (const pin of pinsOf("chargeport")) {
      expect(evPinWorld(part, pin.id)).toEqual([-0.85 + pin.local[0], pin.local[1], -1.85 + pin.local[2]]);
      const moved = evPinWorld({ ...part, position: [1, 0.5, 2], rotationY: Math.PI / 2 }, pin.id);
      expect(moved?.[0]).toBeCloseTo(1 + pin.local[2]);
      expect(moved?.[1]).toBeCloseTo(0.5 + pin.local[1]);
      expect(moved?.[2]).toBeCloseTo(2 - pin.local[0]);
      expect(Math.abs(pin.local[0])).toBeLessThan(EV_DEFS.chargeport.footprint[0]);
      expect(Math.abs(pin.local[2])).toBeLessThan(EV_DEFS.chargeport.footprint[1]);
    }
  });
});
