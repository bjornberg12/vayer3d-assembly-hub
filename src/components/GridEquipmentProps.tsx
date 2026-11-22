import type { LoopResult, PartStatus } from "@/ModelLibrary/sources/solver";
import type { PropValues } from "@/ModelLibrary/properties";
import { GRID_INFEED_PARAMS, gridInfeedImpedance } from "@/ModelLibrary/sources/GridInfeed";
import { SOLAR_PARAMS, solarAvailableKw } from "@/ModelLibrary/sources/SolarInverter";
import { STORAGE_PARAMS, storageEnergyKwh } from "@/ModelLibrary/sources/BatteryStorage";
import { RECLOSER_PARAMS, recloserConducts } from "@/ModelLibrary/substations/Recloser";
import { HOUSE_PARAMS } from "@/ModelLibrary/distribution/HouseConnection";
import { RelayEditor } from "./RelayEditor";
import { activeRelayGroup, defaultMeasurement, parseRelaySettings } from "@/ModelLibrary/grid/relay";

type NumericParam = {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
};

const INPUT =
  "w-full min-w-0 rounded-lg border border-border bg-card/70 px-2 py-1 font-mono text-xs text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring/30";
const BUTTON = (on: boolean) =>
  `rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
    on
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card/60 text-card-foreground hover:bg-accent"
  }`;

function Heading({ children }: { children: string }) {
  return (
    <div className="border-b border-border pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

function NumberFields({
  params,
  values,
  onChange,
}: {
  params: readonly NumericParam[];
  values: PropValues;
  onChange: (patch: PropValues) => void;
}) {
  return (
    <>
      {params.map((param) => (
        <div
          key={param.key}
          className="grid grid-cols-[118px_minmax(0,1fr)_auto] items-center gap-2"
        >
          <span className="text-[11px] text-foreground">{param.label}</span>
          <input
            type="number"
            aria-label={param.label}
            min={param.min}
            max={param.max}
            step={param.step}
            value={Number(values[param.key] ?? 0)}
            onChange={(event) => {
              const value = Number(event.target.value);
              const patch: PropValues = { [param.key]: value };
              if (["srcVoltage", "pvVoltage", "storageVoltage"].includes(param.key))
                patch.nominalVoltage = value;
              if (["pvDcKw", "storageMaxKw", "houseLoadKw"].includes(param.key))
                patch.ratedPower = value;
              if (param.key === "houseMainA") {
                patch.ratedCurrent = value;
                patch.maxCurrent = value;
              }
              onChange(patch);
            }}
            className={INPUT}
          />
          <span className="w-10 text-[10px] text-muted-foreground">{param.unit}</span>
        </div>
      ))}
    </>
  );
}

function SourceCurrents({ loops }: { loops: LoopResult[] }) {
  if (!loops.length)
    return (
      <div className="text-[11px] text-muted-foreground">
        No current — connect a closed load circuit.
      </div>
    );
  return (
    <div className="rounded-md border border-border bg-card/45 px-2 py-1 font-mono text-[10px] text-foreground">
      {loops.map((loop) => (
        <div key={loop.from}>
          {loop.from.toUpperCase()}–{loop.to.toUpperCase()}: {loop.current.toFixed(2)} A
        </div>
      ))}
      <div>
        Estimated output:{" "}
        {(loops.reduce((sum, loop) => sum + loop.voltage * loop.current, 0) / 1000).toFixed(2)} kW
      </div>
    </div>
  );
}

export function GridEquipmentProps({
  modelId,
  values,
  onChange,
  loops = [],
  partStatus,
  current = 0,
}: {
  modelId: string;
  values: PropValues;
  onChange: (patch: PropValues) => void;
  loops?: LoopResult[];
  partStatus?: PartStatus;
  current?: number;
}) {
  if (modelId === "gridinfeed") {
    const z = gridInfeedImpedance(values);
    return (
      <div className="space-y-2 text-xs text-foreground">
        <Heading>Utility source data</Heading>
        <NumberFields params={GRID_INFEED_PARAMS} values={values} onChange={onChange} />
        <div className="rounded-md border border-border bg-card/45 px-2 py-1 font-mono text-[10px] leading-relaxed text-foreground">
          <div>
            Ik3 = {(z.faultA / 1000).toFixed(2)} kA · Z = {z.z.toFixed(4)} Ω
          </div>
          <div>
            R = {z.r.toFixed(4)} Ω · X = {z.x.toFixed(4)} Ω per phase
          </div>
        </div>
        <Heading>Live operation</Heading>
        <SourceCurrents loops={loops} />
        <p className="text-[10px] text-muted-foreground">
          The live solver uses the resistive per-phase equivalent R; X is retained for short-circuit
          studies.
        </p>
      </div>
    );
  }

  if (modelId === "solar") {
    const available = solarAvailableKw(values);
    const output = loops.reduce((sum, loop) => sum + loop.voltage * loop.current, 0) / 1000;
    return (
      <div className="space-y-2 text-xs text-foreground">
        <Heading>Solar array and inverter</Heading>
        <NumberFields params={SOLAR_PARAMS} values={values} onChange={onChange} />
        <div className="rounded-md border border-border bg-card/45 px-2 py-1 text-[11px] text-foreground">
          Available AC output: <strong>{available.toFixed(2)} kW</strong>
          {output > available * 1.05 && output > 0.1 && (
            <div className="font-semibold text-destructive">
              Connected demand exceeds available PV power.
            </div>
          )}
        </div>
        <Heading>Live operation</Heading>
        <SourceCurrents loops={loops} />
        <p className="text-[10px] text-muted-foreground">
          Simplified islanded AC-source model. Grid-following control and MPPT dynamics are not
          simulated.
        </p>
      </div>
    );
  }

  if (modelId === "storage") {
    const energy = storageEnergyKwh(values);
    const discharging = String(values.storageMode ?? "discharge") !== "idle";
    const output = loops.reduce((sum, loop) => sum + loop.voltage * loop.current, 0) / 1000;
    const limit = Math.max(Number(values.storageMaxKw ?? 50), 0);
    return (
      <div className="space-y-2 text-xs text-foreground">
        <Heading>Battery storage and PCS</Heading>
        <div className="grid grid-cols-2 gap-1">
          <button
            className={BUTTON(discharging)}
            onClick={() => onChange({ storageMode: "discharge" })}
          >
            Discharge
          </button>
          <button
            className={BUTTON(!discharging)}
            onClick={() => onChange({ storageMode: "idle" })}
          >
            Idle
          </button>
        </div>
        <NumberFields params={STORAGE_PARAMS} values={values} onChange={onChange} />
        <div className="rounded-md border border-border bg-card/45 px-2 py-1 text-[11px] text-foreground">
          Energy available: <strong>{energy.toFixed(1)} kWh</strong>
          {output > 0.05 && <div>Runtime at present output: {(energy / output).toFixed(2)} h</div>}
          {output > limit * 1.05 && (
            <div className="font-semibold text-destructive">PCS power limit exceeded.</div>
          )}
        </div>
        <Heading>Live operation</Heading>
        <SourceCurrents loops={loops} />
        <p className="text-[10px] text-muted-foreground">
          Discharge and idle are supported; charging is not simulated yet.
        </p>
      </div>
    );
  }

  if (modelId === "recloser") {
    const tripped = String(values.recTripped ?? "");
    const closed = recloserConducts(values);
    const automatic = Number(values.recAuto ?? 1) !== 0;
    const relay = parseRelaySettings(values.relay, Number(values.nominalVoltage ?? 20000));
    const group = activeRelayGroup(relay);
    const measurement = { ...defaultMeasurement(relay.nominalVoltageV), phaseA: [current, current, current] as [number, number, number] };
    return (
      <div className="space-y-2 text-xs text-foreground">
        <Heading>Recloser control and protection</Heading>
        <div className="flex flex-wrap gap-1">
          <button
            className={BUTTON(closed)}
            disabled={!!tripped}
            onClick={() => onChange({ recClosed: Number(values.recClosed ?? 1) ? 0 : 1 })}
          >
            {closed ? "Closed — open" : "Open — close"}
          </button>
          <button
            className={BUTTON(automatic)}
            onClick={() => onChange({ recAuto: automatic ? 0 : 1 })}
          >
            Auto-reclose {automatic ? "ON" : "OFF"}
          </button>
          {tripped && (
            <button
              className={BUTTON(false)}
              onClick={() => onChange({ recTripped: "", recClosed: 1, recAttempts: 0 })}
            >
              Reset trip
            </button>
          )}
        </div>
        <NumberFields params={RECLOSER_PARAMS} values={values} onChange={onChange} />
        <div className="rounded-md border border-border bg-card/45 px-2 py-1 font-mono text-[10px] text-foreground">
          {tripped ? (
            <strong className="text-destructive">TRIPPED: {tripped}</strong>
          ) : closed ? (
            "Closed"
          ) : (
            "Open"
          )}
          <div>
            I = {current.toFixed(1)} A / pickup {Number(values.recTripA ?? 400).toFixed(0)} A
          </div>
          <div>Active group: {group.name} · reclose attempts {Number(values.recAttempts ?? 0)} / {group.reclose79.shots}</div>
        </div>
        <RelayEditor
          value={relay}
          measurement={measurement}
          onChange={(next) => {
            const active = activeRelayGroup(next);
            onChange({
              relay: JSON.stringify(next),
              recTripA: active.phase51.pickupA,
              recAuto: active.reclose79.enabled ? 1 : 0,
            });
          }}
        />
      </div>
    );
  }

  if (modelId === "house") {
    const closed = Number(values.houseClosed ?? 1) !== 0;
    const rating = Math.max(Number(values.houseMainA ?? 63), 1);
    const actual = partStatus?.current ?? 0;
    return (
      <div className="space-y-2 text-xs text-foreground">
        <Heading>House service and demand</Heading>
        <button
          className={BUTTON(closed)}
          onClick={() => onChange({ houseClosed: closed ? 0 : 1 })}
        >
          {closed ? "Main breaker closed — open" : "Main breaker open — close"}
        </button>
        <NumberFields params={HOUSE_PARAMS} values={values} onChange={onChange} />
        <div className="rounded-md border border-border bg-card/45 px-2 py-1 font-mono text-[10px] leading-relaxed text-foreground">
          <div>
            Status:{" "}
            {partStatus?.state === "on"
              ? "Powered"
              : partStatus?.state === "low"
                ? "Undervoltage"
                : "Off"}
          </div>
          <div>
            U phase = {(partStatus?.voltage ?? 0).toFixed(1)} V · I phase = {actual.toFixed(2)} A
          </div>
          <div>P total = {((partStatus?.powerW ?? 0) / 1000).toFixed(2)} kW</div>
          <div>Main breaker loading = {((actual / rating) * 100).toFixed(0)}%</div>
          {actual > rating && (
            <strong className="text-destructive">Main breaker rating exceeded.</strong>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Incoming and outgoing four-conductor connectors support cables and lines. Load is balanced
          across three phases.
        </p>
      </div>
    );
  }

  return null;
}
