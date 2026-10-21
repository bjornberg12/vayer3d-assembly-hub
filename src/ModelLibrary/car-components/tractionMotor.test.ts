/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { evLoads, evPinWorld, pinsOf, type EVPartRecord } from "./EVComponents";

const motor: EVPartRecord = { id: "existing-motor", type: "motor", position: [0, 0, 0], rotationY: 0, params: {} };
describe("traction motor visual refinement compatibility", () => {
  test("existing phase, ground and resolver wire contacts remain in place", () => {
    expect(pinsOf("motor").map((pin) => [pin.id, pin.role])).toEqual([["u", "U"], ["v", "V"], ["w", "W"], ["gnd", "PE"], ["sens", "sig"]]);
    [0.21, 0.255, 0.3, 0.345, 0.39].forEach((x, i) => {
      const pin = pinsOf("motor")[i];
      if (!pin) throw new Error("Missing motor terminal");
      const world = evPinWorld(motor, pin.id);
      expect(world?.[0]).toBeCloseTo(x);
      expect(world?.[1]).toBe(0.58);
      expect(world?.[2]).toBe(0);
    });
  });
  test("the existing 400 V three-phase 150 kW motor equivalent is preserved", () => {
    expect(evLoads(motor)).toEqual([
      { owner: motor.id, a: "existing-motor#u", b: "existing-motor#v", r: 3.2, ratedV: 400 },
      { owner: motor.id, a: "existing-motor#v", b: "existing-motor#w", r: 3.2, ratedV: 400 },
      { owner: motor.id, a: "existing-motor#w", b: "existing-motor#u", r: 3.2, ratedV: 400 },
    ]);
  });
});