import { describe, expect, test } from "bun:test";
import { instrumentDefaults, instrumentPins, instrumentReading } from "./instruments";
import { solveCircuits } from "../sources/solver";

describe("CT and VT measurement transmitters", () => {
  test("4–20 mA maps zero, half and full primary range", () => {
    const v = instrumentDefaults("ct");
    expect(instrumentReading("ct", v, 0, true).output).toBeCloseTo(0.004, 8);
    expect(instrumentReading("ct", v, 200, true).output).toBeCloseTo(0.012, 8);
    expect(instrumentReading("ct", v, 400, true).output).toBeCloseTo(0.020, 8);
    expect(instrumentReading("ct", v, 800, true).overrange).toBe(true);
    expect(instrumentReading("ct", v, 800, true).output).toBeCloseTo(0.020, 8);
  });
  test("VT ratio and voltage transmitter are proportional", () => {
    const v = { ...instrumentDefaults("vt"), outputMode: "0-10V" };
    expect(instrumentReading("vt", v, 5000, true).secondary).toBe(50);
    expect(instrumentReading("vt", v, 5000, true).output).toBe(5);
    expect(instrumentReading("vt", { ...v, outputMode: "0-5V" }, 5000, true).output).toBe(2.5);
  });
  test("missing primary and unsupported DC do not emit measurements", () => {
    expect(instrumentReading("ct", instrumentDefaults("ct"), null, true).output).toBe(0);
    expect(instrumentReading("vt", instrumentDefaults("vt"), 400, false).valid).toBe(false);
  });
  test("stable analog pins and explicit VT reference pins", () => {
    expect(instrumentPins("ct").map((p) => p.id)).toEqual(["outp", "outn"]);
    expect(instrumentPins("vt").map((p) => p.id)).toEqual(["outp", "outn", "p1", "p2"]);
  });
  test("VT measures differential node voltage, not wire drop", () => {
    const circuit = solveCircuits([{ id: "s", kind: "AC", voltage: 400, internalR: 0 }], [{ id: "phase", a: "s#l1", b: "load#p", r: 0.1 }], [{ owner: "load", a: "load#p", b: "s#n", r: 23, ratedV: 230 }]);
    expect(circuit.voltageBetween("s#l1", "s#l2").ac).toBeCloseTo(400, 4);
    expect(circuit.voltageAlong("s#l1", "load#p", 0.5, "s#n").ac).toBeGreaterThan(230);
    expect(circuit.wireCurrent.phase).toBeGreaterThan(9);
  });
  test("12mA current loop delivers proportional voltage into 250 ohm receiver", () => {
    const c = solveCircuits([], [{ id: "signal", a: "ct#outp", b: "adc#in", r: 0.1 }, { id: "return", a: "adc#com", b: "ct#outn", r: 0.1 }], [{ owner: "adc", a: "adc#in", b: "adc#com", r: 250, ratedV: 5 }], [], [{ id: "ct", a: "ct#outp", b: "ct#outn", value: 0.012, mode: "current", resistance: 1e12, complianceV: 24 }]);
    expect(c.wireCurrent.signal).toBeCloseTo(0.012, 6);
    expect(c.voltageBetween("adc#in", "adc#com").dc).toBeCloseTo(3, 4);
    expect(c.voltageBetween("s#l1", "s#n").dc).toBe(0);
  });
  test("open 20mA loop is limited to 24V compliance", () => {
    const c = solveCircuits([], [], [], [], [{ id: "ct", a: "ct#outp", b: "ct#outn", value: 0.020, mode: "current", resistance: 1e12, complianceV: 24 }]);
    expect(c.voltageBetween("ct#outp", "ct#outn").dc).toBeCloseTo(24, 4);
  });
  test("voltage outputs drive real secondary loads with output resistance", () => {
    const c = solveCircuits([], [{ id: "signal", a: "vt#outp", b: "vt#outn", r: 1000 }], [], [], [{ id: "vt", a: "vt#outp", b: "vt#outn", value: 10, mode: "voltage", resistance: 10 }]);
    expect(c.wireCurrent.signal).toBeCloseTo(10 / 1010, 6);
  });
});
