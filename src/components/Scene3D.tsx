import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Text, Line, Html } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Eye, Ruler as RulerIcon, X, Layers, Upload, Plus, Trash2 } from "lucide-react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ElectricalPost, ASSEMBLY_STEPS } from "./ElectricalPost";
import { DistributionPanel, PANEL_STEPS } from "./DistributionPanel";
import { WoodenMast20kV, MAST_20KV_STEPS } from "./WoodenMast20kV";
import { AerialGround } from "./AerialGround";
import { PartLabelProvider } from "./PartLabel";
import { DraggablePanel } from "./DraggablePanel";
import vayerLogo from "@/assets/vayer-logo.png.asset.json";

type SceneId = "puitmast" | "puitmast20" | "jaotuskilp" | "alajaam";

const SCENES: { id: SceneId; name: string; subtitle: string; footprintM: number }[] = [
  { id: "puitmast", name: "Puitmast - 1kV", subtitle: "Wooden pole assembly", footprintM: 20 },
  { id: "puitmast20", name: "Puitmast -20kV", subtitle: "20 kV overhead line mast", footprintM: 95 },
  { id: "jaotuskilp", name: "Jaotuskilp", subtitle: "Distribution panel", footprintM: 10 },
  { id: "alajaam", name: "Alajaam 10kV/0,4kV", subtitle: "Substation", footprintM: 20 },
];

type ViewId = "front" | "top" | "side" | "iso";

const VIEWS: {
  id: ViewId;
  name: string;
  subtitle: string;
  position: [number, number, number];
  target: [number, number, number];
}[] = [
  { id: "iso", name: "Isometric", subtitle: "Default 3D angle", position: [14, 11, 16], target: [0, 5, 0] },
  { id: "front", name: "Front", subtitle: "Looking along +Z", position: [0, 6, 22], target: [0, 4, 0] },
  { id: "top", name: "Top", subtitle: "Bird's eye view", position: [0, 28, 0.01], target: [0, 0, 0] },
  { id: "side", name: "Side", subtitle: "Looking along +X", position: [22, 6, 0], target: [0, 4, 0] },
];

function CameraRig({
  view,
  controlsRef,
}: {
  view: (typeof VIEWS)[number];
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...view.position);
    const c = controlsRef.current;
    if (c) {
      c.target.set(...view.target);
      c.update();
    } else {
      camera.lookAt(...view.target);
    }
    camera.updateProjectionMatrix();
  }, [view, camera, controlsRef]);
  return null;
}



function GridLabels() {
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let i = -25; i <= 25; i += 5) if (i !== 0) arr.push(i);
    return arr;
  }, []);

  return (
    <group>
      {ticks.map((t) => (
        <Text
          key={`x${t}`}
          position={[t, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.45}
          color="#1a1a1a"
          anchorX="center"
          anchorY="middle"
        >
          {`${t}m`}
        </Text>
      ))}
      {ticks.map((t) => (
        <Text
          key={`z${t}`}
          position={[0, 0.05, t]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.45}
          color="#1a1a1a"
          anchorX="center"
          anchorY="middle"
        >
          {`${t}m`}
        </Text>
      ))}
      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.5}
        color="#000"
        anchorX="center"
        anchorY="middle"
      >
        0
      </Text>
    </group>
  );
}

function GroundPlane() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#8a8a8a" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <Grid
        position={[0, 0.005, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#8a8a8a"
        sectionSize={5}
        sectionThickness={0.9}
        sectionColor="#5a5a5a"
        fadeDistance={40}
        fadeStrength={1.6}
      />
      <GridLabels />
    </>
  );
}

function PlaceholderScene({ label }: { label: string }) {
  return (
    <group>
      <Text
        position={[0, 3, 0]}
        fontSize={0.8}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, 2, 0]}
        fontSize={0.35}
        color="#555"
        anchorX="center"
        anchorY="middle"
      >
        Scene coming soon
      </Text>
    </group>
  );
}

type Point3 = [number, number, number];

function Ruler({
  active,
  points,
  onAddPoint,
}: {
  active: boolean;
  points: Point3[];
  onAddPoint: (p: Point3) => void;
}) {
  const { camera, scene, gl } = useThree();

  useEffect(() => {
    if (!active) return;
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) return;
      const rect = dom.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster
        .intersectObjects(scene.children, true)
        .filter((h) => !h.object.userData.ruler && h.object.type !== "AxesHelper");
      if (hits.length) {
        const p = hits[0].point;
        onAddPoint([p.x, p.y, p.z]);
      }
    };
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointerup", onUp);
    return () => {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointerup", onUp);
    };
  }, [active, camera, scene, gl, onAddPoint]);

  if (points.length === 0) return null;

  const a = points[0];
  const b = points[1];
  const mid: Point3 | null = b
    ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.25, (a[2] + b[2]) / 2]
    : null;
  const dist = b
    ? Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    : 0;

  return (
    <group userData={{ ruler: true }}>
      {points.map((p, i) => (
        <mesh key={i} position={p} userData={{ ruler: true }}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {b && (
        <>
          <Line points={[a, b]} color="#ff3b30" lineWidth={3} userData={{ ruler: true }} />
          {mid && (
            <Text
              position={mid}
              fontSize={0.35}
              color="#ffffff"
              outlineColor="#000000"
              outlineWidth={0.025}
              anchorX="center"
              anchorY="middle"
            >
              {`${dist.toFixed(2)} m`}
            </Text>
          )}
        </>
      )}
    </group>
  );
}

function Placer({
  active,
  onPlace,
}: {
  active: boolean;
  onPlace: (p: Point3) => void;
}) {
  const { camera, gl } = useThree();
  useEffect(() => {
    if (!active) return;
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) return;
      const rect = dom.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        onPlace([
          Math.round(hit.x * 100) / 100,
          0,
          Math.round(hit.z * 100) / 100,
        ]);
      }
    };
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointerup", onUp);
    dom.style.cursor = "crosshair";
    return () => {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointerup", onUp);
      dom.style.cursor = "";
    };
  }, [active, camera, gl, onPlace]);
  return null;
}


function PartLabel3D({
  name,
  position,
  onDismiss,
}: {
  name: string;
  position: [number, number, number];
  onDismiss: () => void;
}) {
  const anchor: [number, number, number] = [
    position[0],
    position[1] + 1.2,
    position[2],
  ];
  return (
    <group>
      <Line points={[position, anchor]} color="#333333" lineWidth={1} />
      <Html position={anchor} center style={{ pointerEvents: "auto" }}>
        <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {name}
          <button
            onClick={onDismiss}
            aria-label="Dismiss label"
            className="ml-1 rounded-full p-0.5 text-neutral-500 transition hover:bg-black/10 hover:text-neutral-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </Html>
    </group>
  );
}

export function Scene3D() {
  const [sceneId, setSceneId] = useState<SceneId>("puitmast");
  const [step, setStep] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [viewId, setViewId] = useState<ViewId>("iso");
  const [rulerActive, setRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<Point3[]>([]);
  const [partLabel, setPartLabel] = useState<string | null>(null);
  const [partLabelPos, setPartLabelPos] = useState<[number, number, number] | null>(null);
  const [groundOpen, setGroundOpen] = useState(false);
  const [groundMode, setGroundMode] = useState<"off" | "default" | "custom">("default");
  const [customGroundUrl, setCustomGroundUrl] = useState<string | null>(null);
  const [customGroundWidthM, setCustomGroundWidthM] = useState<number>(30);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  type AddableType = "puitmast" | "puitmast20" | "jaotuskilp";
  const ADDABLES: { type: AddableType; name: string; subtitle: string }[] = [
    { type: "puitmast", name: "Puitmast - 1kV", subtitle: "Wooden pole" },
    { type: "puitmast20", name: "Puitmast - 20kV", subtitle: "20 kV mast" },
    { type: "jaotuskilp", name: "Jaotuskilp", subtitle: "Distribution panel" },
  ];
  const [addedItems, setAddedItems] = useState<
    { id: string; type: AddableType; position: [number, number, number] }[]
  >([]);
  const [pendingAdd, setPendingAdd] = useState<AddableType | null>(null);
  const placeItem = (type: AddableType, position: [number, number, number]) => {
    setAddedItems((prev) => [
      ...prev,
      {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        position,
      },
    ]);
  };
  const startPlacing = (type: AddableType) => {
    setPendingAdd(type);
    setAddOpen(false);
    setRulerActive(false);
  };
  const removeItem = (id: string) =>
    setAddedItems((prev) => prev.filter((i) => i.id !== id));
  const activeScene = SCENES.find((s) => s.id === sceneId)!;
  const activeView = VIEWS.find((v) => v.id === viewId)!;

  const stepLabels =
    sceneId === "puitmast"
      ? ASSEMBLY_STEPS
      : sceneId === "puitmast20"
      ? MAST_20KV_STEPS
      : sceneId === "jaotuskilp"
      ? PANEL_STEPS
      : null;
  const maxStep = stepLabels?.length ?? 0;

  const selectScene = (id: SceneId) => {
    setSceneId(id);
    setStep(1);
    setMenuOpen(false);
  };

  const selectView = (id: ViewId) => {
    setViewId(id);
    setViewsOpen(false);
  };

  const addRulerPoint = (p: Point3) => {
    setRulerPoints((prev) => (prev.length >= 2 ? [p] : [...prev, p]));
  };

  const clearRuler = () => setRulerPoints([]);

  const handleGroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomGroundUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setGroundMode("custom");
    e.target.value = "";
  };

  const groundUrl =
    groundMode === "default"
      ? undefined // AerialGround default (bundled aerial, known 95 m width)
      : groundMode === "custom" && customGroundUrl
      ? customGroundUrl
      : null;
  const showGround = groundUrl !== null;
  // Default aerial has a known real-world size (~95 m wide). For custom uploads
  // the scale is unknown, so the user picks the real width via the slider.
  const realWidth =
    groundMode === "custom" ? customGroundWidthM : undefined;

  return (
    <div className="relative h-full w-full">
      <img
        src={vayerLogo.url}
        alt="Vayer 3d"
        className="pointer-events-none absolute left-1/2 top-3 z-10 h-8 -translate-x-1/2 rounded-md shadow-md"
      />
      <Canvas
        shadows
        camera={{ position: [14, 11, 16], fov: 50, near: 0.01, far: 2000 }}
        style={{ background: "#f6f3ec" }}
        onPointerMissed={() => {
          setPartLabel(null);
          setPartLabelPos(null);
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[15, 25, 10]}
            intensity={1.1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <GroundPlane />
          {showGround && (
            <AerialGround url={groundUrl || undefined} realWidthM={realWidth} />
          )}
          <PartLabelProvider
            setLabel={(name, pos) => {
              setPartLabel(name);
              setPartLabelPos(pos ?? null);
            }}
            enabled={!rulerActive}
          >
            {sceneId === "puitmast" && <ElectricalPost step={step} />}
            {sceneId === "puitmast20" && <WoodenMast20kV step={step} />}
            {sceneId === "jaotuskilp" && <DistributionPanel step={step} />}
            {sceneId === "alajaam" && <PlaceholderScene label={activeScene.name} />}
            {addedItems.map((item) => (
              <group key={item.id} position={item.position}>
                {item.type === "puitmast" && (
                  <ElectricalPost step={ASSEMBLY_STEPS.length} />
                )}
                {item.type === "puitmast20" && (
                  <WoodenMast20kV step={MAST_20KV_STEPS.length} />
                )}
                {item.type === "jaotuskilp" && (
                  <DistributionPanel step={PANEL_STEPS.length} />
                )}
              </group>
            ))}
          </PartLabelProvider>
          <axesHelper args={[3]} />
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.6}
            maxPolarAngle={Math.PI / 2 - 0.02}
            zoomToCursor
            enablePan
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.PAN,
              RIGHT: THREE.MOUSE.DOLLY,
            }}
          />
          <CameraRig view={activeView} controlsRef={controlsRef} />
          <Ruler active={rulerActive} points={rulerPoints} onAddPoint={addRulerPoint} />
          <Placer
            active={pendingAdd !== null}
            onPlace={(p) => {
              if (pendingAdd) {
                placeItem(pendingAdd, p);
                setPendingAdd(null);
              }
            }}
          />
          {partLabel && partLabelPos && !rulerActive && (
            <PartLabel3D
              name={partLabel}
              position={partLabelPos}
              onDismiss={() => {
                setPartLabel(null);
                setPartLabelPos(null);
              }}
            />
          )}
        </Suspense>
      </Canvas>


      {/* Hamburger menus */}
      <div className="absolute left-4 top-4 flex gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen((o) => !o);
              setViewsOpen(false);
            }}
            aria-label="Open scene menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-white/30 text-neutral-900 shadow-lg backdrop-blur-md transition hover:bg-white/50"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setViewsOpen((o) => !o);
              setMenuOpen(false);
            }}
            aria-label="Open views menu"
            className="flex h-11 items-center gap-1.5 rounded-xl border border-white/40 bg-white/30 px-3 text-neutral-900 shadow-lg backdrop-blur-md transition hover:bg-white/50"
          >
            <Eye className="h-5 w-5" />
            <span className="text-sm font-medium">Views</span>
          </button>
          {viewsOpen && (
            <DraggablePanel initialX={70} initialY={64} title="Views" width={256}>
              <ul className="flex flex-col">
                {VIEWS.map((v) => {
                  const active = v.id === viewId;
                  return (
                    <li key={v.id}>
                      <button
                        onClick={() => selectView(v.id)}
                        className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition ${
                          active
                            ? "bg-white/70 font-semibold text-neutral-900"
                            : "text-neutral-800 hover:bg-white/50"
                        }`}
                      >
                        <span>{v.name}</span>
                        <span className="text-xs font-normal text-neutral-600">
                          {v.subtitle}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </DraggablePanel>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setGroundOpen((o) => !o);
              setMenuOpen(false);
              setViewsOpen(false);
            }}
            aria-label="Open ground menu"
            className="flex h-11 items-center gap-1.5 rounded-xl border border-white/40 bg-white/30 px-3 text-neutral-900 shadow-lg backdrop-blur-md transition hover:bg-white/50"
          >
            <Layers className="h-5 w-5" />
            <span className="text-sm font-medium">Ground</span>
          </button>
          {groundOpen && (
            <DraggablePanel initialX={170} initialY={64} title="Ground image" width={288}>
              <ul className="flex flex-col">
                <li>
                  <button
                    onClick={() => setGroundMode("off")}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition ${
                      groundMode === "off"
                        ? "bg-white/70 font-semibold text-neutral-900"
                        : "text-neutral-800 hover:bg-white/50"
                    }`}
                  >
                    <span>Off</span>
                    <span className="text-xs font-normal text-neutral-600">
                      Hide ground image
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setGroundMode("default")}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition ${
                      groundMode === "default"
                        ? "bg-white/70 font-semibold text-neutral-900"
                        : "text-neutral-800 hover:bg-white/50"
                    }`}
                  >
                    <span>Aerial parking (default)</span>
                    <span className="text-xs font-normal text-neutral-600">
                      Auto-scales to the active scene
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (customGroundUrl) setGroundMode("custom");
                      else fileInputRef.current?.click();
                    }}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition ${
                      groundMode === "custom"
                        ? "bg-white/70 font-semibold text-neutral-900"
                        : "text-neutral-800 hover:bg-white/50"
                    }`}
                  >
                    <span>
                      {customGroundUrl ? "Custom image" : "Custom image (none)"}
                    </span>
                    <span className="text-xs font-normal text-neutral-600">
                      {customGroundUrl
                        ? "Auto-fits to scene footprint"
                        : "Upload one below"}
                    </span>
                  </button>
                </li>
              </ul>
              <div className="flex items-center gap-2 border-t border-white/40 px-3 py-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/50 bg-white/40 px-3 py-2 text-xs font-semibold text-neutral-900 shadow-sm transition hover:bg-white/60"
                >
                  <Upload className="h-4 w-4" />
                  {customGroundUrl ? "Replace image" : "Upload image"}
                </button>
                {customGroundUrl && (
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(customGroundUrl);
                      setCustomGroundUrl(null);
                      if (groundMode === "custom") setGroundMode("off");
                    }}
                    aria-label="Remove custom image"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/50 bg-white/40 text-neutral-800 transition hover:bg-white/60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {groundMode === "custom" && customGroundUrl && (
                <div className="border-t border-white/40 px-4 py-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-neutral-800">
                    <span>Real width</span>
                    <span className="tabular-nums">{customGroundWidthM} m</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={200}
                    step={1}
                    value={customGroundWidthM}
                    onChange={(e) =>
                      setCustomGroundWidthM(Number(e.target.value))
                    }
                    className="w-full accent-neutral-800"
                  />
                  <p className="mt-1 text-[10px] leading-tight text-neutral-600">
                    Match a known distance in your image (e.g. a car ≈ 4.5 m).
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleGroundUpload}
                className="hidden"
              />
            </DraggablePanel>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setAddOpen((o) => !o);
              setMenuOpen(false);
              setViewsOpen(false);
              setGroundOpen(false);
            }}
            aria-label="Open add menu"
            className="flex h-11 items-center gap-1.5 rounded-xl border border-white/40 bg-white/30 px-3 text-neutral-900 shadow-lg backdrop-blur-md transition hover:bg-white/50"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add</span>
          </button>
          {addOpen && (
            <DraggablePanel initialX={290} initialY={64} title="Add component" width={288}>
              <ul className="flex flex-col">
                {ADDABLES.map((a) => (
                  <li key={a.type}>
                    <button
                      onClick={() => startPlacing(a.type)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-neutral-800 transition hover:bg-white/50"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-xs font-normal text-neutral-600">
                          {a.subtitle}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 text-neutral-600" />
                    </button>
                  </li>
                ))}
              </ul>
              {addedItems.length > 0 && (
                <>
                  <div className="border-t border-white/40 px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-700">
                    Added ({addedItems.length})
                  </div>
                  <ul className="flex max-h-48 flex-col overflow-y-auto">
                    {addedItems.map((item, i) => {
                      const meta = ADDABLES.find((a) => a.type === item.type)!;
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 px-4 py-1.5 text-xs text-neutral-800 hover:bg-white/40"
                        >
                          <span className="truncate">
                            {i + 1}. {meta.name}
                            <span className="ml-1 text-neutral-500">
                              ({item.position[0].toFixed(1)}, {item.position[2].toFixed(1)})
                            </span>
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${meta.name}`}
                            className="rounded-md p-1 text-neutral-600 transition hover:bg-black/10 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-white/40 px-3 py-2">
                    <button
                      onClick={() => setAddedItems([])}
                      className="w-full rounded-lg border border-white/50 bg-white/40 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm transition hover:bg-white/60"
                    >
                      Clear all added
                    </button>
                  </div>
                </>
              )}
            </DraggablePanel>
          )}
        </div>
        <button
          onClick={() => {
            setRulerActive((a) => !a);
            setMenuOpen(false);
            setViewsOpen(false);
          }}
          aria-label="Toggle ruler"
          className={`flex h-11 items-center gap-1.5 rounded-xl border px-3 shadow-lg backdrop-blur-md transition ${
            rulerActive
              ? "border-red-300/60 bg-red-500/80 text-white hover:bg-red-500/90"
              : "border-white/40 bg-white/30 text-neutral-900 hover:bg-white/50"
          }`}
        >
          <RulerIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Ruler</span>
        </button>
        {(rulerActive || rulerPoints.length > 0) && (
          <button
            onClick={clearRuler}
            aria-label="Clear ruler"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-white/30 text-neutral-900 shadow-lg backdrop-blur-md transition hover:bg-white/50"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {pendingAdd && (
        <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/40 bg-white/40 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-md backdrop-blur-md">
          <span>
            Click on the ground to place{" "}
            <strong>
              {ADDABLES.find((a) => a.type === pendingAdd)?.name}
            </strong>
          </span>
          <button
            onClick={() => setPendingAdd(null)}
            aria-label="Cancel placement"
            className="rounded-md p-0.5 text-neutral-600 transition hover:bg-black/10 hover:text-neutral-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}


      {rulerActive && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border border-white/40 bg-white/40 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-md backdrop-blur-md">
          {rulerPoints.length === 0
            ? "Ruler: click the first point"
            : rulerPoints.length === 1
            ? "Click the second point to measure"
            : `Distance: ${Math.hypot(
                rulerPoints[1][0] - rulerPoints[0][0],
                rulerPoints[1][1] - rulerPoints[0][1],
                rulerPoints[1][2] - rulerPoints[0][2]
              ).toFixed(2)} m — click again to restart`}
        </div>
      )}

      {/* Scene menu dropdown */}
      {menuOpen && (
        <DraggablePanel initialX={16} initialY={64} title="Scenes" width={256}>
          <ul className="flex flex-col">
            {SCENES.map((s) => {
              const active = s.id === sceneId;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => selectScene(s.id)}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-white/70 font-semibold text-neutral-900"
                        : "text-neutral-800 hover:bg-white/50"
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-xs font-normal text-neutral-600">
                      {s.subtitle}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DraggablePanel>
      )}


      {/* Active scene label */}
      <div className="pointer-events-none absolute right-4 top-4 rounded-xl border border-white/40 bg-white/30 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-md backdrop-blur-md">
        {activeScene.name}
      </div>


      {/* Step controls overlay */}
      {stepLabels && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-3">
          <div className="pointer-events-auto rounded-xl border border-white/40 bg-white/30 px-4 py-2 text-sm font-medium text-neutral-800 shadow-lg backdrop-blur-md">
            Step {step} / {maxStep} — {stepLabels[step - 1]}
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-xl border border-white/40 bg-white/25 px-6 py-2.5 text-sm font-semibold text-neutral-900 shadow-md backdrop-blur-md transition hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
              disabled={step === maxStep}
              className="rounded-xl border border-white/40 bg-white/25 px-6 py-2.5 text-sm font-semibold text-neutral-900 shadow-md backdrop-blur-md transition hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Forward →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
