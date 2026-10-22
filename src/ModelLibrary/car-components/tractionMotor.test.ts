/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { evLoads, evPinWorld, pinsOf, type EVPartRecord } from "./EVComponents";
import { MOTOR_PINS } from "./motorPins";
import { solveCircuits } from "../sources/solver";

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
  test("realistic connector layout keeps stable ids and tracks part movement", () => {
    expect(pinsOf("motor")).toBe(MOTOR_PINS);
    expect(MOTOR_PINS.map((pin) => pin.kind)).toEqual(["phase", "phase", "phase", "ground", "sensor"]);
    const moved: EVPartRecord = { ...motor, position: [2, 0, -1], rotationY: Math.PI / 2 };
    const u = evPinWorld(moved, "u");
    expect(u?.[0]).toBeCloseTo(2);
    expect(u?.[1]).toBeCloseTo(0.58);
    expect(u?.[2]).toBeCloseTo(-1.21);
    const sens = evPinWorld(moved, "sens");
    expect(sens?.[0]).toBeCloseTo(2);
    expect(sens?.[2]).toBeCloseTo(-1.39);
  });
  test("the existing 400 V three-phase 150 kW motor equivalent is preserved", () => {
    expect(evLoads(motor)).toEqual([
      { owner: motor.id, a: "existing-motor#u", b: "existing-motor#v", r: 3.2, ratedV: 400 },
      { owner: motor.id, a: "existing-motor#v", b: "existing-motor#w", r: 3.2, ratedV: 400 },
      { owner: motor.id, a: "existing-motor#w", b: "existing-motor#u", r: 3.2, ratedV: 400 },
    ]);
  });
  test("the motor still produces the powered state that drives the wheels", () => {
    const wires = ["u", "v", "w"].map((pin, i) => ({ id: `phase-${i}`, a: `supply#l${i + 1}`, b: `${motor.id}#${pin}`, r: 0.001 }));
    const result = solveCircuits([{ id: "supply", kind: "AC", voltage: 400, internalR: 0 }], wires, evLoads(motor));
    expect(result.partStatus[motor.id]?.state).toBe("on");
    expect(result.partStatus[motor.id]?.powerW).toBeGreaterThan(149000);
    expect(result.partStatus[motor.id]?.powerW).toBeLessThan(150000);
    for (const wire of wires) {
      expect(result.wireCurrent[wire.id]).toBeGreaterThan(215);
      expect(result.wireCurrent[wire.id]).toBeLessThan(217);
    }
    expect(solveCircuits([], wires, evLoads(motor)).partStatus[motor.id]?.state).toBe("off");
  });
});
