/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { BMS_PINS } from "./bmsPins";
import { EV_DEFS, defaultEVLayout, evLoads, evPinWorld, pinsOf, type EVPartRecord } from "./EVComponents";
import { solveCircuits } from "../sources/solver";

const bms: EVPartRecord = { id: "existing-bms", type: "bms", position: [0, 0, 0], rotationY: 0, params: {} };

describe("BMS harness compatibility", () => {
  test("retains all four endpoint IDs, roles and the 12 V / 5 W supply load", () => {
    expect(pinsOf("bms")).toBe(BMS_PINS);
    expect(BMS_PINS.map((p) => [p.id, p.role])).toEqual([["vp", "12+"], ["vn", "12-"], ["sense", "sig"], ["can", "sig"]]);
    expect(evLoads(bms)).toEqual([{ owner: bms.id, a: "existing-bms#vp", b: "existing-bms#vn", r: 28.8, ratedV: 12 }]);
  });
  test("each existing wire follows the contact face when moved or rotated", () => {
    const moved = { ...bms, position: [2, 0.5, -1] as [number, number, number], rotationY: Math.PI / 2 };
    for (const pin of BMS_PINS) {
      expect(evPinWorld(bms, pin.id)).toEqual(pin.local);
      const world = evPinWorld(moved, pin.id);
      expect(world?.[0]).toBeCloseTo(2 + pin.local[2]);
      expect(world?.[1]).toBeCloseTo(0.5 + pin.local[1]);
      expect(world?.[2]).toBeCloseTo(-1 - pin.local[0]);
      expect(Math.abs(pin.local[0]) + 0.003).toBeLessThan(EV_DEFS.bms.footprint[0] / 2);
      expect(Math.abs(pin.local[2]) + 0.003).toBeLessThan(EV_DEFS.bms.footprint[1] / 2);
    }
    const layout = defaultEVLayout();
    const defaultBms = layout.parts.find((p) => p.type === "bms");
    expect(layout.wires.filter((w) => w.b.startsWith(`${defaultBms?.id}#`)).map((w) => w.b.split("#")[1])).toEqual(["vp", "vn", "sense"]);
  });
  test("the relocated supply contacts power the BMS and an open circuit stays off", () => {
    const wires = [{ id: "positive", a: "supply#dcp", b: "existing-bms#vp", r: 0.001 }, { id: "negative", a: "existing-bms#vn", b: "supply#dcn", r: 0.001 }];
    const sources = [{ id: "supply", kind: "DC" as const, voltage: 12, internalR: 0 }];
    const result = solveCircuits(sources, wires, evLoads(bms));
    expect(result.partStatus[bms.id]?.state).toBe("on");
    expect(result.partStatus[bms.id]?.powerW).toBeGreaterThan(4.99);
    expect(result.partStatus[bms.id]?.powerW).toBeLessThan(5);
    expect(result.wireCurrent.positive).toBeCloseTo(0.41664, 4);
    expect(solveCircuits(sources, wires.slice(0, 1), evLoads(bms)).partStatus[bms.id]?.state).toBe("off");
  });
});