/**
 * Configurable distribution protection relay. Settings use primary A/V and seconds.
 * The same evaluator is used by fault studies and live breaker/recloser trips.
 */
export type RelayCurve =
  | "DT"
  | "IEC_SI"
  | "IEC_VI"
  | "IEC_EI"
  | "IEC_LTI"
  | "IEEE_MI"
  | "IEEE_VI"
  | "IEEE_EI";

export type CurveConstants = { a: number; b: number; p: number };
export const RELAY_CURVES: Record<Exclude<RelayCurve, "DT">, CurveConstants> = {
  IEC_SI: { a: 0.14, b: 0, p: 0.02 },
  IEC_VI: { a: 13.5, b: 0, p: 1 },
  IEC_EI: { a: 80, b: 0, p: 2 },
  IEC_LTI: { a: 120, b: 0, p: 1 },
  IEEE_MI: { a: 0.0515, b: 0.11402, p: 0.02 },
  IEEE_VI: { a: 19.61, b: 0.491, p: 2 },
  IEEE_EI: { a: 28.2, b: 0.1217, p: 2 },
};

export const RELAY_CURVE_LABEL: Record<RelayCurve, string> = {
  DT: "Definite time",
  IEC_SI: "IEC standard inverse",
  IEC_VI: "IEC very inverse",
  IEC_EI: "IEC extremely inverse",
  IEC_LTI: "IEC long-time inverse",
  IEEE_MI: "IEEE moderately inverse",
  IEEE_VI: "IEEE very inverse",
  IEEE_EI: "IEEE extremely inverse",
};

/** IEC 60255-151 and IEEE C37.112 time–current operating equations. */
export function relayCurveTime(curve: RelayCurve, pickup: number, dial: number, current: number, delay = 0) {
  if (!(current > pickup) || pickup <= 0) return Infinity;
  if (curve === "DT") return Math.max(delay, 0);
  const c = RELAY_CURVES[curve];
  return Math.max(0, dial * (c.a / ((current / pickup) ** c.p - 1) + c.b) + delay);
}

export type Direction = "non-directional" | "forward" | "reverse";
export type OvercurrentStage = {
  enabled: boolean;
  pickupA: number;
  curve: RelayCurve;
  timeDial: number;
  delayS: number;
  resetS: number;
  direction: Direction;
  torqueAngleDeg: number;
};

export type RelayGroup = {
  name: string;
  phase51: OvercurrentStage;
  phase50: OvercurrentStage;
  phase50Hi: OvercurrentStage;
  earth51N: OvercurrentStage;
  earth50N: OvercurrentStage;
  negative46: { enabled: boolean; pickupA: number; curve: RelayCurve; timeDial: number; delayS: number };
  under27: { enabled: boolean; pickupV: number; delayS: number; hysteresisPct: number };
  over59: { enabled: boolean; pickupV: number; delayS: number; hysteresisPct: number };
  sequence47: { enabled: boolean; negativeSequencePct: number; delayS: number; blockWrongRotation: boolean };
  frequency81: {
    enabled: boolean;
    underHz: number;
    overHz: number;
    delayS: number;
    rocofHzS: number;
    rocofDelayS: number;
  };
  thermal49: { enabled: boolean; pickupA: number; timeConstantS: number; alarmPct: number };
  breakerFailure50BF: { enabled: boolean; pickupA: number; delayS: number; retrip: boolean };
  reclose79: {
    enabled: boolean;
    shots: number;
    deadTimesS: number[];
    reclaimTimeS: number;
    lockoutOnPermanent: boolean;
    resetAttemptsOnReclaim: boolean;
  };
};

export type RelaySettings = {
  activeGroup: number;
  groups: [RelayGroup, RelayGroup, RelayGroup, RelayGroup];
  ctPrimaryA: number;
  ctSecondaryA: number;
  vtPrimaryV: number;
  vtSecondaryV: number;
  nominalVoltageV: number;
  nominalFrequencyHz: number;
  breakerOpenTimeS: number;
  tripPulseS: number;
  minimumTripTimeS: number;
};

export type RelayMeasurement = {
  phaseA: [number, number, number];
  residualA: number;
  negativeSequenceA: number;
  lineV: [number, number, number];
  negativeSequenceV: number;
  wrongRotation: boolean;
  frequencyHz: number;
  rocofHzS: number;
  forward: boolean;
  thermalStatePct: number;
  breakerClosed: boolean;
  tripInitiated: boolean;
};

export type RelayOperation = {
  ansi: string;
  iec: string;
  name: string;
  measured: number;
  unit: "A" | "V" | "Hz" | "Hz/s" | "%";
  pickup: number;
  timeS: number;
};

const oc = (pickupA: number, curve: RelayCurve = "DT", timeDial = 0.1, delayS = 0.04): OvercurrentStage => ({
  enabled: true,
  pickupA,
  curve,
  timeDial,
  delayS,
  resetS: 0.05,
  direction: "non-directional",
  torqueAngleDeg: 90,
});

export function defaultRelayGroup(name = "Normal"): RelayGroup {
  return {
    name,
    phase51: { ...oc(400, "IEC_SI", 0.15, 0), resetS: 0.1 },
    phase50: oc(1200, "DT", 1, 0.06),
    phase50Hi: { ...oc(4000, "DT", 1, 0), enabled: false },
    earth51N: { ...oc(40, "IEC_SI", 0.1, 0), resetS: 0.1 },
    earth50N: oc(200, "DT", 1, 0.08),
    negative46: { enabled: false, pickupA: 60, curve: "DT", timeDial: 1, delayS: 1 },
    under27: { enabled: false, pickupV: 0.8 * 20000, delayS: 1, hysteresisPct: 3 },
    over59: { enabled: false, pickupV: 1.1 * 20000, delayS: 1, hysteresisPct: 3 },
    sequence47: { enabled: false, negativeSequencePct: 15, delayS: 1, blockWrongRotation: true },
    frequency81: { enabled: false, underHz: 47.5, overHz: 52, delayS: 0.5, rocofHzS: 2, rocofDelayS: 0.2 },
    thermal49: { enabled: false, pickupA: 400, timeConstantS: 600, alarmPct: 90 },
    breakerFailure50BF: { enabled: false, pickupA: 20, delayS: 0.15, retrip: true },
    reclose79: {
      enabled: true,
      shots: 2,
      deadTimesS: [0.5, 15],
      reclaimTimeS: 30,
      lockoutOnPermanent: true,
      resetAttemptsOnReclaim: true,
    },
  };
}

export function defaultRelaySettings(nominalVoltageV = 20000): RelaySettings {
  const groups = ["Normal", "Maintenance", "Islanded", "Emergency"].map((name) => {
    const group = defaultRelayGroup(name);
    group.under27.pickupV = 0.8 * nominalVoltageV;
    group.over59.pickupV = 1.1 * nominalVoltageV;
    return group;
  }) as [RelayGroup, RelayGroup, RelayGroup, RelayGroup];
  groups[2].phase51.pickupA = 250;
  groups[2].earth51N.pickupA = 20;
  return {
    activeGroup: 0,
    groups,
    ctPrimaryA: 600,
    ctSecondaryA: 1,
    vtPrimaryV: nominalVoltageV,
    vtSecondaryV: 100,
    nominalVoltageV,
    nominalFrequencyHz: 50,
    breakerOpenTimeS: 0.06,
    tripPulseS: 0.2,
    minimumTripTimeS: 0.02,
  };
}

export function activeRelayGroup(settings: RelaySettings): RelayGroup {
  return settings.groups[Math.min(3, Math.max(0, Math.round(settings.activeGroup)))] ?? settings.groups[0];
}

export const defaultMeasurement = (nominalVoltageV = 20000): RelayMeasurement => ({
  phaseA: [0, 0, 0],
  residualA: 0,
  negativeSequenceA: 0,
  lineV: [nominalVoltageV, nominalVoltageV, nominalVoltageV],
  negativeSequenceV: 0,
  wrongRotation: false,
  frequencyHz: 50,
  rocofHzS: 0,
  forward: true,
  thermalStatePct: 0,
  breakerClosed: true,
  tripInitiated: false,
});

function directionAllows(stage: OvercurrentStage, measurement: RelayMeasurement) {
  return stage.direction === "non-directional" ||
    (stage.direction === "forward" && measurement.forward) ||
    (stage.direction === "reverse" && !measurement.forward);
}

function overcurrentOperation(
  stage: OvercurrentStage,
  current: number,
  ansi: string,
  iec: string,
  name: string,
  measurement: RelayMeasurement,
): RelayOperation | null {
  if (!stage.enabled || !directionAllows(stage, measurement)) return null;
  return {
    ansi,
    iec,
    name,
    measured: current,
    unit: "A",
    pickup: stage.pickupA,
    timeS: relayCurveTime(stage.curve, stage.pickupA, stage.timeDial, current, stage.delayS),
  };
}

/** Return every started function; the fastest finite timeS is the first trip. */
export function evaluateRelay(settings: RelaySettings, measurement: RelayMeasurement): RelayOperation[] {
  const g = activeRelayGroup(settings);
  const phase = Math.max(...measurement.phaseA);
  const minV = Math.min(...measurement.lineV);
  const maxV = Math.max(...measurement.lineV);
  const operations: (RelayOperation | null)[] = [
    overcurrentOperation(g.phase51, phase, "51", "I>", "Phase time overcurrent", measurement),
    overcurrentOperation(g.phase50, phase, "50", "I>>", "Phase instantaneous overcurrent", measurement),
    overcurrentOperation(g.phase50Hi, phase, "50H", "I>>>", "Phase high-set overcurrent", measurement),
    overcurrentOperation(g.earth51N, measurement.residualA, "51N", "I0>", "Earth-fault time overcurrent", measurement),
    overcurrentOperation(g.earth50N, measurement.residualA, "50N", "I0>>", "Earth-fault instantaneous", measurement),
  ];
  if (g.negative46.enabled) operations.push({
    ansi: "46", iec: "I2>", name: "Negative-sequence overcurrent", measured: measurement.negativeSequenceA,
    unit: "A", pickup: g.negative46.pickupA,
    timeS: relayCurveTime(g.negative46.curve, g.negative46.pickupA, g.negative46.timeDial, measurement.negativeSequenceA, g.negative46.delayS),
  });
  if (g.under27.enabled && maxV > 1) operations.push({
    ansi: "27", iec: "U<", name: "Undervoltage", measured: minV, unit: "V", pickup: g.under27.pickupV,
    timeS: minV < g.under27.pickupV ? g.under27.delayS : Infinity,
  });
  if (g.over59.enabled && maxV > 1) operations.push({
    ansi: "59", iec: "U>", name: "Overvoltage", measured: maxV, unit: "V", pickup: g.over59.pickupV,
    timeS: maxV > g.over59.pickupV ? g.over59.delayS : Infinity,
  });
  const v2Pct = maxV > 1 ? (measurement.negativeSequenceV / maxV) * 100 : 0;
  if (g.sequence47.enabled) operations.push({
    ansi: "47", iec: "U2>", name: "Phase sequence / voltage unbalance", measured: v2Pct, unit: "%",
    pickup: g.sequence47.negativeSequencePct,
    timeS: (v2Pct > g.sequence47.negativeSequencePct || (g.sequence47.blockWrongRotation && measurement.wrongRotation)) ? g.sequence47.delayS : Infinity,
  });
  if (g.frequency81.enabled && measurement.frequencyHz > 1) {
    const f = measurement.frequencyHz;
    operations.push({
      ansi: "81U/O", iec: "f<>", name: "Under/overfrequency", measured: f, unit: "Hz",
      pickup: f < g.frequency81.underHz ? g.frequency81.underHz : g.frequency81.overHz,
      timeS: f < g.frequency81.underHz || f > g.frequency81.overHz ? g.frequency81.delayS : Infinity,
    });
    operations.push({
      ansi: "81R", iec: "df/dt", name: "Rate of change of frequency", measured: Math.abs(measurement.rocofHzS),
      unit: "Hz/s", pickup: g.frequency81.rocofHzS,
      timeS: Math.abs(measurement.rocofHzS) > g.frequency81.rocofHzS ? g.frequency81.rocofDelayS : Infinity,
    });
  }
  if (g.thermal49.enabled) {
    const ratio = phase / Math.max(g.thermal49.pickupA, 1e-9);
    const timeS = ratio <= 1 ? Infinity : Math.max(0, -g.thermal49.timeConstantS * Math.log(Math.max(1e-9, 1 - 1 / (ratio * ratio))));
    operations.push({ ansi: "49", iec: "θ>", name: "Thermal overload (cold state)", measured: phase, unit: "A", pickup: g.thermal49.pickupA, timeS });
  }
  if (g.breakerFailure50BF.enabled && measurement.breakerClosed && measurement.tripInitiated) operations.push({
    ansi: "50BF", iec: "CBFP", name: "Breaker failure", measured: phase, unit: "A", pickup: g.breakerFailure50BF.pickupA,
    timeS: phase > g.breakerFailure50BF.pickupA ? g.breakerFailure50BF.delayS : Infinity,
  });
  return operations.filter((op): op is RelayOperation => op !== null).sort((a, b) => a.timeS - b.timeS);
}

export function fastestTrip(settings: RelaySettings, measurement: RelayMeasurement) {
  const operation = evaluateRelay(settings, measurement).find((op) => Number.isFinite(op.timeS));
  if (!operation) return null;
  return { ...operation, totalTimeS: Math.max(operation.timeS, settings.minimumTripTimeS) + settings.breakerOpenTimeS };
}

export type AutomationEvent = { timeS: number; event: string; state: "trip" | "open" | "reclose" | "closed" | "lockout" | "reclaim" };

/** Deterministic 79 sequence used by the automation test and the live recloser controller. */
export function recloseSequence(settings: RelaySettings, permanent: boolean, clearAfterShot = 1) {
  const g = activeRelayGroup(settings);
  const events: AutomationEvent[] = [{ timeS: 0, event: "Protection trip — breaker open", state: "trip" }];
  if (!g.reclose79.enabled || g.reclose79.shots <= 0) {
    events.push({ timeS: settings.breakerOpenTimeS, event: "Reclosing disabled — lockout", state: "lockout" });
    return { events, lockout: true };
  }
  let t = 0;
  for (let shot = 1; shot <= g.reclose79.shots; shot++) {
    const dead = g.reclose79.deadTimesS[shot - 1] ?? g.reclose79.deadTimesS.at(-1) ?? 1;
    t += Math.max(dead, 0);
    events.push({ timeS: t, event: `Auto-reclose shot ${shot}`, state: "reclose" });
    if (!permanent && clearAfterShot <= shot) {
      t += Math.max(g.reclose79.reclaimTimeS, 0);
      events.push({ timeS: t, event: "Reclaim time complete — sequence reset", state: "reclaim" });
      return { events, lockout: false };
    }
    t += settings.breakerOpenTimeS;
    events.push({ timeS: t, event: `Fault still present — trip ${shot + 1}`, state: "trip" });
  }
  events.push({ timeS: t, event: g.reclose79.lockoutOnPermanent ? "Permanent fault — lockout" : "Reclose sequence complete", state: g.reclose79.lockoutOnPermanent ? "lockout" : "open" });
  return { events, lockout: g.reclose79.lockoutOnPermanent };
}

function mergeSaved<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(saved)) return base;
    if (base.some((item) => item && typeof item === "object" && !Array.isArray(item))) {
      return base.map((item, index) => mergeSaved(item, saved[index])) as T;
    }
    return saved as T;
  }
  if (base && typeof base === "object") {
    const input = saved && typeof saved === "object" && !Array.isArray(saved) ? saved as Record<string, unknown> : {};
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(base as Record<string, unknown>)) result[key] = mergeSaved(value, input[key]);
    return result as T;
  }
  return (typeof saved === typeof base ? saved : base) as T;
}

export function parseRelaySettings(value: unknown, nominalVoltageV = 20000): RelaySettings {
  const base = defaultRelaySettings(nominalVoltageV);
  if (typeof value === "string" && value) {
    try {
      const merged = mergeSaved(base, JSON.parse(value));
      merged.activeGroup = Math.min(3, Math.max(0, Math.round(Number(merged.activeGroup) || 0)));
      return merged;
    } catch {
      return base;
    }
  }
  if (value && typeof value === "object") return mergeSaved(base, value);
  return base;
}
