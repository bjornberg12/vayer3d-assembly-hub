import { describe, expect, test } from "bun:test";
import { relayTime, selectivity, autoReclose, flisr, tripTime } from "./protection";
import { sag, clearanceCheck } from "./lineMechanics";
import { cableScheduleCSV, bom } from "./reports";
import { studyLinks, suggestConductor } from "./sceneStudy";

describe("protection", () => {
  test("IEC standard inverse, TMS 0.1 at 10× Is trips in 0.297 s", () => {
    expect(relayTime("SI", 100, 0.1, 1000)).toBeCloseTo(0.297, 2);
  });
  test("extremely inverse at 10× Is with TMS 1 trips in 0.808 s", () => {
    expect(relayTime("EI", 100, 1, 1000)).toBeCloseTo(0.808, 2);
  });
  test("C-curve MCB 16 A trips instantly at 160 A", () => {
    expect(tripTime({ id: "q", type: "mcb", char: "C", in: 16 }, 160)).toBeLessThanOrEqual(0.01);
  });
  test("160 A upstream fuse is selective with 16 A MCB up to 1 kA", () => {
    expect(selectivity({ id: "f", type: "fuse", in: 160 }, { id: "m", type: "mcb", char: "C", in: 16 }, 50, 1000).selective).toBe(true);
  });
  test("two equal relays are not selective", () => {
    const d = { id: "r", type: "relay" as const, curve: "SI" as const, is: 100, tms: 0.1 };
    expect(selectivity(d, d, 200, 5000).selective).toBe(false);
  });
  test("permanent fault locks out after 2 shots", () => {
    const r = autoReclose({ shots: 2, deadTimes: [0.5, 15], permanent: true });
    expect(r.lockout).toBe(true);
    expect(r.log.filter((x) => x.startsWith("Reclose")).length).toBe(2);
  });
  test("FLISR isolates section 2 of 5 and restores both sides", () => {
    expect(flisr(5, 2)).toEqual({ isolate: [2], fedFromA: [0, 1], fedFromB: [3, 4] });
  });
});

describe("line mechanics", () => {
  test("AC-70 sag on 80 m span at 5 kN ≈ 0.43 m", () => {
    expect(sag(80, 0.275, 5000)).toBeCloseTo(0.432, 2);
  });
  test("10 m MV pole with 4.5 m sag fails 6 m clearance", () => {
    expect(clearanceCheck(10, 4.5, 20000).ok).toBe(false);
  });
});

describe("scene study and reports", () => {
  const opts = { cosPhi: 0.95, ikA: 10000, clearS: 0.4, tempC: 70 };
  test("150 kW on 200 m of 4×70 fails and auto-sizing suggests 4×240", () => {
    const l = { id: "c1", from: "tx", to: "panel", sceneType: "70", lengthM: 200, loadKW: 150 };
    expect(studyLinks([l], opts)[0]!.status.startsWith("FAIL")).toBe(true);
    expect(suggestConductor("70", l, opts)).toBe("240");
  });
  test("BOM adds 5 % reserve and counts objects", () => {
    const b = bom([{ conductor: "AXMK 4×95", lengthM: 100 }], ["Pole", "Pole"]);
    expect(b).toEqual([{ item: "AXMK 4×95", qty: 105, unit: "m" }, { item: "Pole", qty: 2, unit: "pcs" }]);
  });
  test("cable schedule CSV has header and row", () => {
    const csv = cableScheduleCSV([{ id: "c1", from: "a", to: "b", conductor: "X", lengthM: 1, loadKW: 1, currentA: 1, dropPct: 1, loadingPct: 1, status: "OK" }]);
    expect(csv.split("\n").length).toBe(2);
  });
});
