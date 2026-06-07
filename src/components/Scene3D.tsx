import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { ElectricalPost, ASSEMBLY_STEPS } from "./ElectricalPost";
import { DistributionPanel } from "./DistributionPanel";

type SceneId = "puitmast" | "jaotuskilp" | "alajaam";

const SCENES: { id: SceneId; name: string; subtitle: string }[] = [
  { id: "puitmast", name: "Puitmast - 1kV", subtitle: "Wooden pole assembly" },
  { id: "jaotuskilp", name: "Jaotuskilp", subtitle: "Distribution panel" },
  { id: "alajaam", name: "Alajaam 10kV/0,4kV", subtitle: "Substation" },
];

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
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>
      <Grid
        position={[0, 0.005, 0]}
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#6e6e6e"
        sectionSize={5}
        sectionThickness={1.4}
        sectionColor="#2b2b2b"
        fadeDistance={90}
        fadeStrength={1.2}
        infiniteGrid
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

export function Scene3D() {
  const [sceneId, setSceneId] = useState<SceneId>("puitmast");
  const [step, setStep] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const maxStep = ASSEMBLY_STEPS.length;
  const activeScene = SCENES.find((s) => s.id === sceneId)!;

  const selectScene = (id: SceneId) => {
    setSceneId(id);
    setStep(1);
    setMenuOpen(false);
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [14, 11, 16], fov: 50 }}
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
          {sceneId === "jaotuskilp" && <DistributionPanel />}
          {sceneId === "alajaam" && <PlaceholderScene label={activeScene.name} />}
          <axesHelper args={[3]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2 - 0.02}
            minDistance={3}
            maxDistance={120}
            target={[0, 5, 0]}
          />
        </Suspense>
      </Canvas>

      {/* Hamburger menu */}
      <div className="absolute left-4 top-4">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Open scene menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-white/30 text-neutral-900 shadow-lg backdrop-blur-md transition hover:bg-white/50"
        >
          <Menu className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="mt-2 w-64 overflow-hidden rounded-xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md">
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
      </div>

      {/* Active scene label */}
      <div className="pointer-events-none absolute right-4 top-4 rounded-xl border border-white/40 bg-white/30 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-md backdrop-blur-md">
        {activeScene.name}
      </div>

      {/* Step controls overlay — only for assembly scene */}
      {sceneId === "puitmast" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-3">
          <div className="pointer-events-auto rounded-xl border border-white/40 bg-white/30 px-4 py-2 text-sm font-medium text-neutral-800 shadow-lg backdrop-blur-md">
            Step {step} / {maxStep} — {ASSEMBLY_STEPS[step - 1]}
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
