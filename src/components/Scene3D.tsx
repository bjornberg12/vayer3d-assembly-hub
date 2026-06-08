import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Text, Line } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Eye, Ruler as RulerIcon, X } from "lucide-react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ElectricalPost, ASSEMBLY_STEPS } from "./ElectricalPost";
import { DistributionPanel, PANEL_STEPS } from "./DistributionPanel";

type SceneId = "puitmast" | "jaotuskilp" | "alajaam";

const SCENES: { id: SceneId; name: string; subtitle: string }[] = [
  { id: "puitmast", name: "Puitmast - 1kV", subtitle: "Wooden pole assembly" },
  { id: "jaotuskilp", name: "Jaotuskilp", subtitle: "Distribution panel" },
  { id: "alajaam", name: "Alajaam 10kV/0,4kV", subtitle: "Substation" },
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

export function Scene3D() {
  const [sceneId, setSceneId] = useState<SceneId>("puitmast");
  const [step, setStep] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [viewId, setViewId] = useState<ViewId>("iso");
  const [rulerActive, setRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<Point3[]>([]);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const activeScene = SCENES.find((s) => s.id === sceneId)!;
  const activeView = VIEWS.find((v) => v.id === viewId)!;

  const stepLabels =
    sceneId === "puitmast"
      ? ASSEMBLY_STEPS
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

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [14, 11, 16], fov: 50, near: 0.01, far: 2000 }}
        style={{ background: "#f6f3ec" }}
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
          {sceneId === "puitmast" && <ElectricalPost step={step} />}
          {sceneId === "jaotuskilp" && <DistributionPanel step={step} />}
          {sceneId === "alajaam" && <PlaceholderScene label={activeScene.name} />}
          <axesHelper args={[3]} />
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.6}
            maxPolarAngle={Math.PI / 2 - 0.02}
            minDistance={0.05}
            maxDistance={120}
            zoomToCursor
          />
          <CameraRig view={activeView} controlsRef={controlsRef} />
          <Ruler active={rulerActive} points={rulerPoints} onAddPoint={addRulerPoint} />
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
            <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-neutral-700">
                Views
              </div>
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
            </div>
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
        <div className="absolute left-4 top-16 w-64 overflow-hidden rounded-xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-neutral-700">
            Scenes
          </div>
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
        </div>
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
