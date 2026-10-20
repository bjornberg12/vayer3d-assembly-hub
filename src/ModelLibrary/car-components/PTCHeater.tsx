import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt, ThermalConnectors, ThermalFitting } from "./ThermalDetails";

/** Sealed liquid PTC heater with cast coolant chamber and integrated control cover. */
export function PTCHeater() {
  return <group name="ptc-heater-housing">
    <RoundedBox args={[0.234, 0.094, 0.094]} radius={0.007} smoothness={3} position={[0, 0.734, 0]} castShadow receiveShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
    <RoundedBox args={[0.24, 0.005, 0.1]} radius={0.006} smoothness={2} position={[0, 0.782, 0]}><meshStandardMaterial {...M.seal} /></RoundedBox>
    <RoundedBox args={[0.24, 0.018, 0.1]} radius={0.006} smoothness={3} position={[0, 0.793, 0]} castShadow><meshStandardMaterial {...M.machined} /></RoundedBox>
    {/* Cast heat-transfer ribs on both long walls. */}
    {[-1, 1].flatMap((side) => Array.from({ length: 11 }, (_, i) => <mesh key={`${side}-${i}`} position={[-0.103 + i * 0.0206, 0.735, side * 0.049]} castShadow><boxGeometry args={[0.004, 0.077, 0.009]} /><meshStandardMaterial {...M.casting} /></mesh>))}
    {[-0.107, 0.107].flatMap((x) => [-0.038, 0.038].map((z) => <ThermalBolt key={`${x}-${z}`} position={[x, 0.803, z]} />))}
    {/* Mounting ears and recessed fixing holes. */}
    {[-0.112, 0.112].flatMap((x) => [-0.039, 0.039].map((z) => <group key={`${x}-${z}`}>
      <RoundedBox args={[0.033, 0.008, 0.029]} radius={0.004} smoothness={2} position={[x, 0.691, z]} castShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
      <mesh position={[x, 0.6953, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.004, 20]} /><meshStandardMaterial {...M.seal} /></mesh>
    </group>))}
    <ThermalFitting position={[-0.071, 0.736, 0.046]} rotation={[Math.PI / 2, 0, 0]} />
    <ThermalFitting position={[0.071, 0.736, 0.046]} rotation={[Math.PI / 2, 0, 0]} />
    <ThermalConnectors y={0.83} />
    <mesh position={[-0.084, 0.742, -0.052]}><boxGeometry args={[0.023, 0.04, 0.001]} /><meshStandardMaterial {...M.warning} /></mesh>
    <Text position={[0.025, 0.749, -0.054]} rotation={[0, Math.PI, 0]} fontSize={0.013} color={M.polymer.color}>PTC HEATER</Text>
    <Text position={[0.025, 0.727, -0.054]} rotation={[0, Math.PI, 0]} fontSize={0.007} color={M.polymer.color}>HV · COOLANT</Text>
    <mesh position={[-0.084, 0.742, -0.053]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.003, 0.024, 0.001]} /><meshStandardMaterial {...M.polymer} /></mesh>
  </group>;
}