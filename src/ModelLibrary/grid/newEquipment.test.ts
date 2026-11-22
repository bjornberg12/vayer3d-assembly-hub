import { describe, expect, test } from "bun:test";
import { gridInfeedImpedance, gridInfeedSource } from "../sources/GridInfeed";
import { solarAvailableKw, solarDefaults } from "../sources/SolarInverter";
import { storageEnergyKwh, storageSource } from "../sources/BatteryStorage";
import { defaultRMU, rmuTerminalLocals } from "../substations/RingMainUnit";
import { switchgearWires } from "../substations/Switchgear";
import { recloserWires } from "../substations/Recloser";
import { houseLoads, houseWires } from "../distribution/HouseConnection";
import { solveCircuits } from "../sources/solver";

describe("new grid equipment", () => {
  test("20 kV 500 MVA grid with X/R 10 has 0.8 Ω magnitude and 14.44 kA fault level", () => {
    const z = gridInfeedImpedance({ srcVoltage: 20000, gridFaultMVA: 500, gridXR: 10 });
    expect(z.z).toBeCloseTo(0.8, 10);
    expect(z.r).toBeCloseTo(0.0796025, 6);
    expect(z.faultA).toBeCloseTo(14433.76, 1);
  });

  test("AC source impedance limits a 400 V 1 MVA infeed on a 0.04 Ω fault", () => {
    const values = { srcVoltage: 400, gridFaultMVA: 1, gridXR: 0 };
    const result = solveCircuits(
      [gridInfeedSource("grid", values)],
      [{ id: "fault", a: "grid#l1", b: "grid#n", r: 0.04 }],
    );
    expect(result.wireCurrent.fault).toBeCloseTo(400 / Math.sqrt(3) / 0.2, 6);
  });

  test("30 kWp array produces 29.1 kW at STC and 13.276875 kW hot at half sun", () => {
    expect(solarAvailableKw(solarDefaults())).toBeCloseTo(29.1, 10);
    expect(solarAvailableKw({ ...solarDefaults(), pvIrradiance: 500, pvCellTemp: 50 })).toBeCloseTo(
      13.276875,
      8,
    );
  });

  test("100 kWh battery at 80% has 80 kWh and idle mode supplies no source", () => {
    const values = { storageCapacityKwh: 100, storageSoc: 80, storageMode: "idle" };
    expect(storageEnergyKwh(values)).toBe(80);
    expect(storageSource("bess", values)).toBeNull();
    expect(storageSource("bess", { ...values, storageMode: "discharge" })?.kind).toBe("AC");
  });

  test("RMU has three three-phase terminals and opening Ring A removes its three poles", () => {
    const cubicles = defaultRMU();
    expect(cubicles.map((c) => c.label)).toEqual(["Ring A", "Ring B", "Transformer feeder"]);
    expect(rmuTerminalLocals(0)).toHaveLength(3);
    expect(switchgearWires("rmu", cubicles)).toHaveLength(9);
    expect(
      switchgearWires(
        "rmu",
        cubicles.map((c, k) => (k === 0 ? { ...c, closed: false } : c)),
      ),
    ).toHaveLength(6);
  });

  test("recloser conducts three poles closed and none open or tripped", () => {
    expect(recloserWires("rec", { recClosed: 1, recTripped: "" })).toHaveLength(3);
    expect(recloserWires("rec", { recClosed: 0, recTripped: "" })).toHaveLength(0);
    expect(recloserWires("rec", { recClosed: 1, recTripped: "I>" })).toHaveLength(0);
  });

  test("12 kW house load is three 4 kW phases and an open main leaves only neutral", () => {
    const loads = houseLoads("house", { houseLoadKw: 12 });
    expect(loads).toHaveLength(3);
    expect(loads[0]?.r).toBeCloseTo(13.225, 10);
    expect(houseWires("house", { houseClosed: 1 })).toHaveLength(4);
    expect(houseWires("house", { houseClosed: 0 })).toHaveLength(1);
  });

  test("fed 12 kW house reports about 12 kW and balanced 17.39 A phase current", () => {
    const source = { id: "s", kind: "AC", voltage: 230 * Math.sqrt(3), internalR: 0 };
    const feed = [0, 1, 2, 3].map((phase) => ({
      id: `feed${phase}`,
      a: phase < 3 ? `s#l${phase + 1}` : "s#n",
      b: `h#in@${phase}`,
      r: 0.000001,
    }));
    const result = solveCircuits(
      [source],
      [...feed, ...houseWires("h", { houseClosed: 1 })],
      houseLoads("h", { houseLoadKw: 12 }),
    );
    expect(result.partStatus.h?.state).toBe("on");
    expect(result.partStatus.h?.powerW).toBeGreaterThan(11990);
    expect(result.partStatus.h?.powerW).toBeLessThan(12000);
    expect(result.partStatus.h?.current).toBeGreaterThan(17.38);
    expect(result.partStatus.h?.current).toBeLessThan(17.4);
  });
});
