/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { evPinWorld, evLoads, pinsOf, type EVPartRecord } from "./EVComponents";
import { INVERTER_PINS } from "./inverterPins";

const part: EVPartRecord = { id: "inverter-existing", type: "inverter", position: [2, 0, 3], rotationY: 0, params: {} };
describe("inverter connector compatibility", () => {
  test("all seven existing electrical endpoints and roles remain available", () => {
    expect(pinsOf("inverter").map((p) => [p.id, p.role])).toEqual([
      ["dcp", "dc+"], ["dcn", "dc-"], ["u", "U"], ["v", "V"], ["w", "W"], ["gnd", "PE"], ["ctl", "sig"],
    ]);
    expect(evLoads(part)).toEqual([{ owner: "inverter-existing", a: "inverter-existing#dcp", b: "inverter-existing#dcn", r: 1, ratedV: 400 }]);
  });
  test("existing wires follow the relocated contact faces when the inverter rotates", () => {
    expect(evPinWorld(part, "dcp")).toEqual([1.72, 0.648, 3.176]);
    const rotated = evPinWorld({ ...part, rotationY: Math.PI / 2 }, "dcp");
    expect(rotated?.[0]).toBeCloseTo(2.176);
    expect(rotated?.[1]).toBeCloseTo(0.648);
    expect(rotated?.[2]).toBeCloseTo(3.28);
    expect(pinsOf("inverter")).toBe(INVERTER_PINS);
  });
});