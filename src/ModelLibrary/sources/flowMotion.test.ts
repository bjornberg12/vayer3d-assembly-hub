import { expect, test } from "bun:test";
import { flowSpeed } from "./flowMotion";
import { solveCircuits } from "./solver";

test("a closed powered device circuit drives electron motion", () => {
  const result = solveCircuits(
    [{ id: "source", kind: "DC", voltage: 400, internalR: 0 }],
    [{ id: "positive", a: "source#dcp", b: "heater#dcp", r: 0.01 },
     { id: "return", a: "heater#dcn", b: "source#dcn", r: 0.01 }],
    [{ owner: "heater", a: "heater#dcp", b: "heater#dcn", r: 32, ratedV: 400 }],
  );
  expect(result.partStatus.heater.state).toBe("on");
  expect(flowSpeed(result.wireCurrent.positive)).toBeGreaterThan(0);
  expect(flowSpeed(result.wireCurrent.return)).toBeGreaterThan(0);
  expect(result.wireFlow.positive.dir).toBe(1);
});

test("open circuits and numerical leakage do not animate", () => {
  const result = solveCircuits(
    [{ id: "source", kind: "DC", voltage: 400, internalR: 0 }],
    [{ id: "positive", a: "source#dcp", b: "heater#dcp", r: 0.01 }],
    [{ owner: "heater", a: "heater#dcp", b: "heater#dcn", r: 32, ratedV: 400 }],
  );
  expect(flowSpeed(result.wireCurrent.positive ?? 0)).toBe(0);
  expect(flowSpeed(0)).toBe(0);
  expect(flowSpeed(NaN)).toBe(0);
});