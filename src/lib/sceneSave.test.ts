import { describe, expect, test } from "bun:test";
import { parseScene, serializeScene, type SceneData } from "./sceneSave";
import { DEFAULT_GROUNDING } from "./grounding";

const data: SceneData = {
  sceneId: "electriccar",
  addedItems: [{ id: "vs1", type: "vsource", position: [1, 0, 2], rotation: 0.5 }],
  connections: [],
  cables: [{ id: "c1", from: "tf1#lv", to: "pt:3,4" }],
  feeders: {},
  evParts: [{ id: "heater", type: "heater", position: [0, 0, 0] }],
  evWires: [{ id: "w1", from: "vs1#dcp", to: "heater#dcp", material: "aluminium" }],
  objectProps: { vs1: { values: { srcVoltage: 400 } } },
  weather: { rain: true, windMs: 12 },
  groundMode: "default",
  customGroundWidthM: 40,
  showFlow: false,
};

describe("scene save", () => {
  test("round trip keeps items, pin wires and property values", () => {
    const back = parseScene(serializeScene(data));
    expect(back).toEqual(data);
    expect((back.evWires[0] as { from: string }).from).toBe("vs1#dcp");
  });
  test("rejects non-save files", () => {
    expect(() => parseScene("hello")).toThrow("not a valid scene save");
    expect(() => parseScene(JSON.stringify({ format: "other" }))).toThrow("not a valid scene save");
  });
  test("rejects saves from a newer version", () => {
    const s = JSON.parse(serializeScene(data));
    s.version = 99;
    expect(() => parseScene(JSON.stringify(s))).toThrow("newer version");
  });
  test("preserves TT earth and protection settings offline", () => {
    const grounding = {
      ...DEFAULT_GROUNDING,
      system: "TT" as const,
      electrodeA: 35,
      rcdEnabled: true,
      rcdMA: 30,
      sourceId: "vs1",
      faultPin: "panel#l1",
    };
    expect(parseScene(serializeScene({ ...data, grounding })).grounding).toEqual(grounding);
  });
  test("older saves without grounding remain loadable", () => {
    expect(parseScene(serializeScene(data)).grounding).toBeUndefined();
  });
  test("rejects invalid grounding values before restoring a scene", () => {
    const raw = JSON.parse(serializeScene(data));
    raw.data.grounding = { system: "TT", electrodeA: -1 };
    expect(() => parseScene(JSON.stringify(raw))).toThrow("Invalid grounding value");
  });
});
