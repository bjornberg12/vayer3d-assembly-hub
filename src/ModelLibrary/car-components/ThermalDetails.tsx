import { RoundedBox } from "@react-three/drei";

export const THERMAL_MATERIALS = {
  casting: { color: "#a9b3ba", metalness: 0.68, roughness: 0.48 },
  machined: { color: "#d2d8dc", metalness: 0.8, roughness: 0.3 },
  steel: { color: "#9ba7ad", metalness: 0.82, roughness: 0.28 },
  polymer: { color: "#30363a", metalness: 0.04, roughness: 0.72 },
  seal: { color: "#171c1e", metalness: 0.02, roughness: 0.85 },
  hv: { color: "#e7782d", metalness: 0.03, roughness: 0.55 },
  warning: { color: "#edcf4a", metalness: 0, roughness: 0.65 },
};

export function ThermalBolt({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh><cylinderGeometry args={[0.0055, 0.0055, 0.0015, 20]} /><meshStandardMaterial {...THERMAL_MATERIALS.steel} /></mesh>
    <mesh position={[0, 0.002, 0]}><cylinderGeometry args={[0.0037, 0.0037, 0.003, 6]} /><meshStandardMaterial {...THERMAL_MATERIALS.machined} /></mesh>
    <mesh position={[0, 0.0036, 0]}><cylinderGeometry args={[0.0016, 0.0016, 0.0004, 6]} /><meshStandardMaterial {...THERMAL_MATERIALS.seal} /></mesh>
  </group>;
}

/** Hollow hose connection with sealing rings; local +Y is the outward direction. */
export function ThermalFitting({ position, rotation, radius = 0.009 }: { position: [number, number, number]; rotation: [number, number, number]; radius?: number }) {
  return <group position={position} rotation={rotation}>
    <mesh><cylinderGeometry args={[radius * 1.4, radius * 1.4, 0.008, 6]} /><meshStandardMaterial {...THERMAL_MATERIALS.steel} /></mesh>
    <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[radius, radius, 0.022, 24]} /><meshStandardMaterial {...THERMAL_MATERIALS.machined} /></mesh>
    {[0.009, 0.018].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.0012, 6, 24]} /><meshStandardMaterial {...THERMAL_MATERIALS.seal} /></mesh>)}
    <mesh position={[0, 0.0232, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[radius * 0.68, 24]} /><meshStandardMaterial {...THERMAL_MATERIALS.seal} /></mesh>
  </group>;
}

/** Shrouds support the existing pin locations; pins remain separately selectable. */
export function ThermalConnectors({ y }: { y: number }) {
  return <group>
    <RoundedBox args={[0.085, 0.019, 0.041]} radius={0.004} smoothness={2} position={[-0.045, y - 0.023, 0]} castShadow><meshStandardMaterial {...THERMAL_MATERIALS.hv} /></RoundedBox>
    <mesh position={[-0.045, y - 0.023, -0.025]}><boxGeometry args={[0.027, 0.008, 0.012]} /><meshStandardMaterial {...THERMAL_MATERIALS.hv} /></mesh>
    <RoundedBox args={[0.03, 0.017, 0.032]} radius={0.003} smoothness={2} position={[0.0675, y - 0.023, 0]} castShadow><meshStandardMaterial {...THERMAL_MATERIALS.polymer} /></RoundedBox>
    <mesh position={[0.0675, y - 0.02, -0.02]}><boxGeometry args={[0.015, 0.005, 0.01]} /><meshStandardMaterial {...THERMAL_MATERIALS.polymer} /></mesh>
    <mesh position={[0.0225, y - 0.018, 0]}><cylinderGeometry args={[0.014, 0.014, 0.006, 20]} /><meshStandardMaterial {...THERMAL_MATERIALS.machined} /></mesh>
  </group>;
}