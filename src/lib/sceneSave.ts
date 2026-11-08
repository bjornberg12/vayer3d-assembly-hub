/** Save/load the whole simulation scene as a portable text (JSON) file. */
export const SAVE_FORMAT = "vayer3d-scene";
export const SAVE_VERSION = 1;

export interface SceneData {
  sceneId: string;
  addedItems: unknown[];
  connections: unknown[];
  cables: unknown[];
  feeders: Record<string, unknown>;
  evParts: unknown[];
  evWires: unknown[];
  objectProps: Record<string, unknown>;
  weather: Record<string, unknown>;
  groundMode: string;
  customGroundWidthM: number;
  showFlow: boolean;
}

export interface SceneSave {
  format: typeof SAVE_FORMAT;
  version: number;
  savedAt: string;
  data: SceneData;
}

export function serializeScene(data: SceneData, now = new Date()): string {
  const save: SceneSave = {
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    savedAt: now.toISOString(),
    data,
  };
  return JSON.stringify(save, null, 2);
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

export function parseScene(text: string): SceneData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not a valid scene save.");
  }
  if (!isObj(raw) || raw.format !== SAVE_FORMAT)
    throw new Error("This file is not a valid scene save.");
  if (typeof raw.version !== "number" || raw.version > SAVE_VERSION)
    throw new Error("This save was made with a newer version of the app.");
  const d = raw.data;
  if (!isObj(d)) throw new Error("The save file is damaged.");
  for (const k of ["addedItems", "connections", "cables", "evParts", "evWires"])
    if (!Array.isArray(d[k])) throw new Error("The save file is damaged.");
  for (const k of ["feeders", "objectProps", "weather"])
    if (!isObj(d[k])) throw new Error("The save file is damaged.");
  return {
    sceneId: typeof d.sceneId === "string" ? d.sceneId : "blank",
    addedItems: d.addedItems as unknown[],
    connections: d.connections as unknown[],
    cables: d.cables as unknown[],
    feeders: d.feeders as Record<string, unknown>,
    evParts: d.evParts as unknown[],
    evWires: d.evWires as unknown[],
    objectProps: d.objectProps as Record<string, unknown>,
    weather: d.weather as Record<string, unknown>,
    groundMode: typeof d.groundMode === "string" ? d.groundMode : "off",
    customGroundWidthM: typeof d.customGroundWidthM === "number" ? d.customGroundWidthM : 30,
    showFlow: d.showFlow !== false,
  };
}
