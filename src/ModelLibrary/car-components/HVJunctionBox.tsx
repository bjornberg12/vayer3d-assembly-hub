import { RoundedBox } from "@react-three/drei";
import type { PinDef } from "./EVComponents";

const MATERIALS = {
  composite: { color: "#353a3d", metalness: 0.08, roughness: 0.72 },
  lid: { color: "#565d61", metalness: 0.16, roughness: 0.55 },
  seal: { color: "#161b1d", metalness: 0.02, roughness: 0.9 },
  socket: { color: "#eb7729", metalness: 0.04, roughness: 0.46 },
  steel: { color: "#b5bfc4", metalness: 0.78, roughness: 0.3 },
  warning: { color: "#f5c841", metalness: 0.02, roughness: 0.65 },
};

function Bolt({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh><cylinderGeometry args={[0.008, 0.008, 0.003, 20]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
    <mesh position={[0, 0.003, 0]}><cylinderGeometry args={[0.005, 0.005, 0.004, 6]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
    <mesh position={[0, 0.0052, 0]}><boxGeometry args={[0.005, 0.0006, 0.001]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
  </group>;
}

/** Sealed automotive PDU housing. Existing terminal positions remain authoritative. */
export function HVJunctionBox({ pins }: { pins: PinDef[] }) {
  const pairs = pins.filter((pin) => pin.role === "dc+").map((positive) => {
    const negative = pins.find((pin) => pin.id === positive.id.slice(0, -1) + "n");
    if (!negative) return null;
    return { id: positive.id, x: (positive.local[0] + negative.local[0]) / 2, z: positive.local[2] };
  });
  const ground = pins.find((pin) => pin.role === "PE");
  return <group name="hv-junction-box-housing">
    <RoundedBox args={[0.306, 0.119, 0.222]} radius={0.012} smoothness={3} position={[0, 0.4595, 0]} castShadow receiveShadow>
      <meshStandardMaterial {...MATERIALS.composite} />
    </RoundedBox>
    <RoundedBox args={[0.316, 0.005, 0.232]} radius={0.009} smoothness={2} position={[0, 0.514, 0]}>
      <meshStandardMaterial {...MATERIALS.seal} />
    </RoundedBox>
    <RoundedBox args={[0.312, 0.009, 0.228]} radius={0.009} smoothness={3} position={[0, 0.521, 0]} castShadow>
      <meshStandardMaterial {...MATERIALS.lid} />
    </RoundedBox>
    {/* Moulded reinforcing ribs and mounting ears stay inside the registered footprint. */}
    {[-1, 1].flatMap((side) => Array.from({ length: 7 }, (_, i) => <mesh key={`${side}-${i}`} position={[-0.12 + i * 0.04, 0.459, side * 0.111]} castShadow>
      <boxGeometry args={[0.006, 0.083, 0.007]} /><meshStandardMaterial {...MATERIALS.composite} />
    </mesh>))}
    {[-0.143, 0.143].flatMap((x) => [-0.099, 0.099].map((z) => <group key={`${x}-${z}`}>
      <RoundedBox args={[0.033, 0.01, 0.04]} radius={0.004} smoothness={2} position={[x, 0.405, z]} castShadow><meshStandardMaterial {...MATERIALS.composite} /></RoundedBox>
      <Bolt position={[x, 0.411, z]} />
      <mesh position={[x, 0.504, z]}><cylinderGeometry args={[0.011, 0.011, 0.038, 16]} /><meshStandardMaterial {...MATERIALS.composite} /></mesh>
      <Bolt position={[x, 0.526, z]} />
    </group>))}
    {pairs.map((pair) => pair && <group key={pair.id} position={[pair.x, 0.528, pair.z]}>
      <RoundedBox args={[0.084, 0.008, 0.039]} radius={0.004} smoothness={2}><meshStandardMaterial {...MATERIALS.seal} /></RoundedBox>
      <RoundedBox args={[0.079, 0.022, 0.035]} radius={0.005} smoothness={3} position={[0, 0.004, 0]} castShadow><meshStandardMaterial {...MATERIALS.socket} /></RoundedBox>
      {/* Keying ridge and latch identify each two-pole HV receptacle. */}
      <mesh position={[0, 0.002, -0.019]}><boxGeometry args={[0.026, 0.009, 0.006]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
      <mesh position={[0, 0.015, 0]}><boxGeometry args={[0.005, 0.005, 0.032]} /><meshStandardMaterial {...MATERIALS.socket} /></mesh>
    </group>)}
    {ground && <group position={[ground.local[0], 0.532, ground.local[2]]}>
      <mesh><cylinderGeometry args={[0.016, 0.016, 0.009, 20]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
      <mesh position={[0, 0.006, 0]}><cylinderGeometry args={[0.009, 0.009, 0.009, 6]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
    </group>}
    {/* Moulded service-cover recess, high-voltage warning and serial plate. */}
    <RoundedBox args={[0.205, 0.002, 0.042]} radius={0.004} smoothness={2} position={[0, 0.526, -0.071]}><meshStandardMaterial {...MATERIALS.seal} /></RoundedBox>
    <mesh position={[-0.07, 0.5272, -0.072]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.018, 3]} /><meshStandardMaterial {...MATERIALS.warning} />
    </mesh>
    <mesh position={[-0.07, 0.5275, -0.072]} rotation={[0, 0.38, 0]}><boxGeometry args={[0.003, 0.001, 0.015]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
    <mesh position={[0.025, 0.5273, -0.072]}><boxGeometry args={[0.094, 0.001, 0.027]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
    {Array.from({ length: 15 }, (_, i) => <mesh key={i} position={[-0.012 + i * 0.005, 0.528, -0.072]}><boxGeometry args={[i % 3 === 0 ? 0.002 : 0.001, 0.0005, 0.015]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>)}
  </group>;
}