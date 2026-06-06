import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { Suspense } from "react";

function GroundPlane() {
  // XY plane = ground (gray). In three.js Y is up by default, so rotate to lay flat on XZ.
  return (
    <>
      {/* Gray ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#6e6e6e"
        sectionSize={10}
        sectionThickness={1.2}
        sectionColor="#444"
        fadeDistance={80}
        fadeStrength={1.2}
        infiniteGrid
      />
    </>
  );
}

export function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [12, 10, 14], fov: 50 }}
      // Off-white "air" background
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
        {/* Origin reference */}
        <axesHelper args={[3]} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minDistance={3}
          maxDistance={120}
        />
      </Suspense>
    </Canvas>
  );
}
