import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text, CatmullRomLine } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { ElectricalPost } from "./ElectricalPost";

const WOOD = "#b8956a";

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
  return (
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
        <ElectricalPost />
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
  );
}

export { WOOD };
