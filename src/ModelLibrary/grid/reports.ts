/** Deliverables (Phase 7): bill of materials, cable schedule CSV and study report text. */
export type ScheduleRow = { id: string; from: string; to: string; conductor: string; lengthM: number; loadKW: number; currentA: number; dropPct: number; loadingPct: number; status: string };
const csvCell = (v: unknown) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCSV = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");

export function cableScheduleCSV(rows: ScheduleRow[]) {
  return toCSV(["ID", "From", "To", "Conductor", "Length m", "Load kW", "Current A", "Voltage drop %", "Loading %", "Status"],
    rows.map((r) => [r.id, r.from, r.to, r.conductor, r.lengthM.toFixed(1), r.loadKW.toFixed(1), r.currentA.toFixed(1), r.dropPct.toFixed(2), r.loadingPct.toFixed(0), r.status]));
}

/** BOM: conductors summed by type with 5 % reserve, objects counted by type. */
export function bom(rows: { conductor: string; lengthM: number }[], objects: string[]) {
  const len = new Map<string, number>();
  for (const r of rows) len.set(r.conductor, (len.get(r.conductor) ?? 0) + r.lengthM);
  const cnt = new Map<string, number>();
  for (const o of objects) cnt.set(o, (cnt.get(o) ?? 0) + 1);
  return [
    ...[...len].map(([k, m]) => ({ item: k, qty: Math.ceil(m * 1.05), unit: "m" })),
    ...[...cnt].map(([k, n]) => ({ item: k, qty: n, unit: "pcs" })),
  ];
}
export const bomCSV = (b: ReturnType<typeof bom>) => toCSV(["Item", "Quantity", "Unit"], b.map((r) => [r.item, r.qty, r.unit]));
