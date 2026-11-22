import { describe, expect, test } from "bun:test";
import { defaultDiff, defaultDistance, differentialTrip, directionalDecision, distanceZone, iecSI, suggestUpstream } from "./protectionAdvanced";

describe("advanced protection", () => {
  test("current lagging voltage by 45° with 45° characteristic angle is forward", () =>
    expect(directionalDecision({ mag: 1, angleDeg: 0 }, { mag: 1, angleDeg: -45 }, 45).direction).toBe("forward"));
  test("reversed current is reverse", () =>
    expect(directionalDecision({ mag: 1, angleDeg: 0 }, { mag: 1, angleDeg: 135 }, 45).direction).toBe("reverse"));
  const d = defaultDistance(1, 4);
  test("fault at 50 % of line is zone 1 instantaneous", () => expect(distanceZone(d, 0.5, 2)).toEqual({ zone: "Zone 1", timeS: 0 }));
  test("fault at 100 % of line is zone 2 at 0.3 s", () => expect(distanceZone(d, 1, 4).zone).toBe("Zone 2"));
  test("fault at 300 % is no trip", () => expect(distanceZone(d, 3, 12).zone).toBe("No trip"));
  test("through current 1 pu does not trip differential", () =>
    expect(differentialTrip(defaultDiff, { mag: 1, angleDeg: 0 }, { mag: 1, angleDeg: 180 }).trip).toBe(false));
  test("internal fault 3 pu from both ends trips differential", () =>
    expect(differentialTrip(defaultDiff, { mag: 3, angleDeg: 0 }, { mag: 3, angleDeg: 0 }).trip).toBe(true));
  test("IEC SI TMS 0.1 at 10× pickup is 0.297 s", () => expect(iecSI(0.1, 1000, 100)).toBeCloseTo(0.297, 3));
  test("upstream suggestion: 200 A load gives 240 A pickup and ≥0.3 s grading", () => {
    const s = suggestUpstream(200, 4000, 0.2);
    expect(s.pickupA).toBe(240);
    expect(s.timeS).toBeGreaterThanOrEqual(0.5);
  });
});
