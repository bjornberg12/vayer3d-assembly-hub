import { expect, test } from "bun:test";
import { gridImpedance, transformerImpedance, lineImpedance, zAdd, shortCircuit3ph, voltageDropPct, breakingCapacityOk } from "./shortCircuit";

test("630 kVA 4% transformer on 250 MVA grid gives ~22 kA at LV", () => {
  const z = zAdd(gridImpedance(250e6, 10, 400), transformerImpedance(630e3, 4, 1, 400));
  const { ik } = shortCircuit3ph(400, z);
  expect(ik).toBeGreaterThan(21000);
  expect(ik).toBeLessThan(24000);
});
test("cable adds impedance and lowers fault current", () => {
  const base = zAdd(gridImpedance(250e6, 10, 400), transformerImpedance(630e3, 4, 1, 400));
  const far = zAdd(base, lineImpedance(0.32, 0.08, 200));
  expect(shortCircuit3ph(400, far).ik).toBeLessThan(shortCircuit3ph(400, base).ik / 2);
});
test("voltage drop 100 A over 0.1 Ω resistive line at pf 1 is 4.33 %", () => {
  expect(voltageDropPct(400, 100, { r: 0.1, x: 0 }, 1)).toBeCloseTo(4.33, 2);
});
test("breaker with 10 kA Icu fails a 22 kA fault", () => {
  expect(breakingCapacityOk(10000, 22000)).toBe(false);
});
