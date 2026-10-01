import { Part } from "./PartLabel";

// ---------------------------------------------------------------------------
// Distribution panel feeders (incoming / outgoing) with a chosen breaker
// ---------------------------------------------------------------------------

export type FeederDirection = "in" | "out";

export type Breaker = {
  id: string;
  label: string;
  kind: "MCB" | "MCCB" | "Fuse";
  rating: number; // A
  poles: 1 | 3;
  note: string;
};

export const BREAKERS: Breaker[] = [
  { id: "mcb-1p-16", label: "MCB 1P C16", kind: "MCB", rating: 16, poles: 1, note: "Lighting / socket circuit" },
  { id: "mcb-1p-20", label: "MCB 1P C20", kind: "MCB", rating: 20, poles: 1, note: "Socket circuit" },
  { id: "mcb-3p-16", label: "MCB 3P C16", kind: "MCB", rating: 16, poles: 3, note: "Small three-phase load" },
  { id: "mcb-3p-25", label: "MCB 3P C25", kind: "MCB", rating: 25, poles: 3, note: "Three-phase load" },
  { id: "mcb-3p-32", label: "MCB 3P C32", kind: "MCB", rating: 32, poles: 3, note: "Three-phase load" },
  { id: "mcb-3p-40", label: "MCB 3P C40", kind: "MCB", rating: 40, poles: 3, note: "Three-phase load" },
  { id: "mcb-3p-63", label: "MCB 3P C63", kind: "MCB", rating: 63, poles: 3, note: "Service / sub-feed" },
  { id: "mccb-3p-100", label: "MCCB 3P 100 A", kind: "MCCB", rating: 100, poles: 3, note: "Sub-distribution feed" },
  { id: "mccb-3p-160", label: "MCCB 3P 160 A", kind: "MCCB", rating: 160, poles: 3, note: "Main / sub-feed" },
  { id: "mccb-3p-250", label: "MCCB 3P 250 A", kind: "MCCB", rating: 250, poles: 3, note: "Main incomer" },
  { id: "fuse-3p-63", label: "Fuse switch 3P 63 A", kind: "Fuse", rating: 63, poles: 3, note: "NH fuse base" },
  { id: "fuse-3p-160", label: "Fuse switch 3P 160 A", kind: "Fuse", rating: 160, poles: 3, note: "NH fuse base" },
  { id: "fuse-3p-250", label: "Fuse switch 3P 250 A", kind: "Fuse", rating: 250, poles: 3, note: "NH main fuse base" },
];

export const breakerById = (id: string): Breaker =>
  BREAKERS.find((b) => b.id === id) ?? BREAKERS[0];

export type Feeder = {
  id: string;
  name: string;
  direction: FeederDirection;
  breakerId: string;
};

export function makeFeeder(direction: FeederDirection, index: number): Feeder {
  return {
    id: `feeder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: direction === "in" ? `Incoming ${index}` : `Feeder ${index}`,
    direction,
    breakerId: direction === "in" ? "fuse-3p-160" : "mcb-3p-25",
  };
}

export const feederLabel = (f: Feeder) => {
  const b = breakerById(f.breakerId);
  return `${f.direction === "in" ? "Incoming" : "Outgoing"} — ${f.name} · ${b.label}`;
};

// Panel body geometry (mirrors DistributionPanel.tsx)
const BODY_W = 0.5;
const BODY_D = 0.32;
const ABOVE_GROUND_BRACKET = 0.2;

const IN_COLOR = "#22c55e";
const OUT_COLOR = "#3b82f6";

/**
 * Small breaker blocks on the panel front: incoming on the upper rail,
 * outgoing on the lower rail. Clicking a block names the feeder.
 */
export function FeederBlocks({ feeders }: { feeders: Feeder[] }) {
  if (feeders.length === 0) return null;
  const z = BODY_D / 2 + 0.012;
  const rows: { dir: FeederDirection; y: number }[] = [
    { dir: "in", y: ABOVE_GROUND_BRACKET + 0.82 },
    { dir: "out", y: ABOVE_GROUND_BRACKET + 0.56 },
  ];

  return (
    <group>
      {rows.map((row) => {
        const list = feeders.filter((f) => f.direction === row.dir);
        if (list.length === 0) return null;
        const w = 0.032;
        const gap = 0.012;
        const total = list.length * w + (list.length - 1) * gap;
        const startX = -Math.min(total, BODY_W * 0.82) / 2 + w / 2;
        const stride = list.length > 1 ? (Math.min(total, BODY_W * 0.82) - w) / (list.length - 1) : 0;
        return (
          <group key={row.dir}>
            {/* DIN rail */}
            <mesh position={[0, row.y, z - 0.004]}>
              <boxGeometry args={[BODY_W * 0.86, 0.016, 0.008]} />
              <meshStandardMaterial color="#9aa0a6" metalness={0.85} roughness={0.35} />
            </mesh>
            {list.map((f, i) => {
              const b = breakerById(f.breakerId);
              const h = b.kind === "MCB" ? 0.09 : 0.13;
              const width = w * (b.poles === 3 ? 2.2 : 1);
              return (
                <Part key={f.id} name={feederLabel(f)}>
                  <group position={[startX + stride * i, row.y + h / 2 + 0.012, z]}>
                    <mesh castShadow>
                      <boxGeometry args={[width, h, 0.045]} />
                      <meshStandardMaterial
                        color={row.dir === "in" ? IN_COLOR : OUT_COLOR}
                        metalness={0.15}
                        roughness={0.65}
                      />
                    </mesh>
                    {/* toggle lever */}
                    <mesh position={[0, h / 2 - 0.014, 0.026]}>
                      <boxGeometry args={[width * 0.5, 0.02, 0.012]} />
                      <meshStandardMaterial color="#f5f5f4" roughness={0.6} />
                    </mesh>
                  </group>
                </Part>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
