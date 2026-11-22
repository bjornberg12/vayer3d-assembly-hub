import { describe, expect, test } from "bun:test";
import {
  activeRelayGroup,
  defaultMeasurement,
  defaultRelaySettings,
  evaluateRelay,
  fastestTrip,
  parseRelaySettings,
  recloseSequence,
  relayCurveTime,
} from "./relay";

describe("distribution relay setting groups", () => {
  test("four independent groups exist and the active group controls pickup", () => {
    const settings = defaultRelaySettings();
    expect(settings.groups).toHaveLength(4);
    settings.groups[1]!.phase51.pickupA = 100;
    settings.activeGroup = 1;
    expect(activeRelayGroup(settings).name).toBe("Maintenance");
    expect(fastestTrip(settings, { ...defaultMeasurement(), phaseA: [200, 200, 200] })?.ansi).toBe("51");
    settings.activeGroup = 0;
    expect(fastestTrip(settings, { ...defaultMeasurement(), phaseA: [200, 200, 200] })).toBeNull();
  });

  test("IEC SI and IEEE MI curves use their standard coefficients", () => {
    expect(relayCurveTime("IEC_SI", 100, 0.1, 1000)).toBeCloseTo(0.297, 3);
    expect(relayCurveTime("IEEE_MI", 100, 0.1, 1000)).toBeCloseTo(0.1206776, 4);
  });

  test("50 high-set trips before 51 inverse time and includes breaker opening time", () => {
    const settings = defaultRelaySettings();
    const trip = fastestTrip(settings, { ...defaultMeasurement(), phaseA: [2000, 2000, 2000] });
    expect(trip?.ansi).toBe("50");
    expect(trip?.totalTimeS).toBeCloseTo(0.12, 6);
  });

  test("51N uses residual current, not balanced phase current", () => {
    const settings = defaultRelaySettings();
    const balanced = evaluateRelay(settings, { ...defaultMeasurement(), phaseA: [1000, 1000, 1000], residualA: 0 });
    expect(balanced.some((op) => op.ansi === "51N" && Number.isFinite(op.timeS))).toBe(false);
    const earth = evaluateRelay(settings, { ...defaultMeasurement(), residualA: 100 });
    expect(earth.find((op) => op.ansi === "51N")?.timeS).toBeLessThan(2);
  });

  test("27, 59, 46, 47 and 81 settings produce their own operations", () => {
    const settings = defaultRelaySettings();
    const group = settings.groups[0]!;
    group.under27.enabled = true;
    group.over59.enabled = true;
    group.negative46.enabled = true;
    group.sequence47.enabled = true;
    group.frequency81.enabled = true;
    const result = evaluateRelay(settings, {
      ...defaultMeasurement(),
      lineV: [7000, 7000, 7000],
      negativeSequenceA: 100,
      negativeSequenceV: 4000,
      frequencyHz: 46,
      rocofHzS: -3,
    });
    for (const ansi of ["27", "46", "47", "81U/O", "81R"]) {
      expect(result.find((op) => op.ansi === ansi)?.timeS).toBeLessThan(Infinity);
    }
  });

  test("permanent fault performs configured shots then locks out", () => {
    const settings = defaultRelaySettings();
    settings.groups[0]!.reclose79.deadTimesS = [0.5, 15, 30];
    settings.groups[0]!.reclose79.shots = 3;
    const result = recloseSequence(settings, true);
    expect(result.events.filter((event) => event.state === "reclose")).toHaveLength(3);
    expect(result.lockout).toBe(true);
    expect(result.events.at(-1)?.state).toBe("lockout");
  });

  test("transient fault recloses once and resets after reclaim time", () => {
    const settings = defaultRelaySettings();
    const result = recloseSequence(settings, false, 1);
    expect(result.lockout).toBe(false);
    expect(result.events.filter((event) => event.state === "reclose")).toHaveLength(1);
    expect(result.events.at(-1)?.timeS).toBeCloseTo(30.5, 6);
  });

  test("saved legacy partial settings merge without losing new functions", () => {
    const parsed = parseRelaySettings(JSON.stringify({ activeGroup: 2, groups: [{ name: "Custom" }] }));
    expect(parsed.activeGroup).toBe(2);
    expect(parsed.groups[0]!.name).toBe("Custom");
    expect(parsed.groups[0]!.reclose79.shots).toBe(2);
    expect(parsed.groups[3]!.phase50.pickupA).toBe(1200);
  });
});
