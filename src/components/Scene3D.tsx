import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import { ElectricalPost, ASSEMBLY_STEPS } from "./ElectricalPost";



function GridLabels() {
  // Label every 5m along X and Z axes from -25 to 25
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
      {/* 1m grid */}
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

export function Scene3D() {
  const [step, setStep] = useState(1);
  const maxStep = ASSEMBLY_STEPS.length;

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
          <ElectricalPost step={step} />
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

      {/* Step controls overlay */}
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
    </div>
  );
}
