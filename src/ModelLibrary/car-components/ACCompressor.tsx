import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt, ThermalConnectors, ThermalFitting } from "./ThermalDetails";

/** Electrically driven scroll compressor; no belt pulley on an EV compressor. */
export function ACCompressor() {
  return <group name="electric-ac-compressor-housing">
    <mesh position={[-0.016, 0.594, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[0.068, 0.068, 0.206, 40]} /><meshStandardMaterial {...M.casting} /></mesh>
    <mesh position={[0.092, 0.594, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.074, 0.074, 0.018, 40]} /><meshStandardMaterial {...M.machined} /></mesh>
    <mesh position={[0.103, 0.594, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.071, 0.071, 0.004, 40]} /><meshStandardMaterial {...M.seal} /></mesh>
    <mesh position={[0.116, 0.594, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.063, 0.071, 0.022, 40]} /><meshStandardMaterial {...M.casting} /></mesh>
    <mesh position={[-0.12, 0.594, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.062, 0.066, 0.009, 40]} /><meshStandardMaterial {...M.machined} /></mesh>
    {/* Longitudinal cast ribs around the motor barrel. */}
    {Array.from({ length: 10 }, (_, i) => {
      const angle = i * Math.PI * 2 / 10;
      return <mesh key={i} position={[-0.017, 0.594 + Math.cos(angle) * 0.068, Math.sin(angle) * 0.068]} rotation={[angle, 0, 0]} castShadow><boxGeometry args={[0.171, 0.008, 0.005]} /><meshStandardMaterial {...M.casting} /></mesh>;
    })}
    {/* Bolted scroll end cover. */}
    {Array.from({ length: 6 }, (_, i) => {
      const angle = i * Math.PI / 3;
      return <group key={i} position={[0.128, 0.594 + Math.cos(angle) * 0.054, Math.sin(angle) * 0.054]} rotation={[0, 0, -Math.PI / 2]}><ThermalBolt position={[0, 0, 0]} /></group>;
    })}
    <RoundedBox args={[0.181, 0.026, 0.074]} radius={0.006} smoothness={3} position={[-0.008, 0.65, 0]} castShadow><meshStandardMaterial {...M.polymer} /></RoundedBox>
    <RoundedBox args={[0.185, 0.008, 0.078]} radius={0.005} smoothness={2} position={[-0.008, 0.667, 0]}><meshStandardMaterial {...M.machined} /></RoundedBox>
    {[-0.086, 0.071].flatMap((x) => [-0.03, 0.03].map((z) => <ThermalBolt key={`${x}-${z}`} position={[x, 0.672, z]} />))}
    <ThermalConnectors y={0.69} />
    {/* Different bore sizes distinguish refrigerant suction and discharge ports. */}
    <ThermalFitting position={[0.071, 0.611, 0.061]} rotation={[Math.PI / 2, 0, 0]} radius={0.012} />
    <ThermalFitting position={[0.095, 0.567, 0.058]} rotation={[Math.PI / 2, 0, 0]} radius={0.008} />
    {[-0.083, 0.074].flatMap((x) => [-0.063, 0.063].map((z) => <group key={`${x}-${z}`}>
      <RoundedBox args={[0.034, 0.022, 0.034]} radius={0.004} smoothness={2} position={[x, 0.533, z]} castShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
      <ThermalBolt position={[x, 0.545, z]} />
    </group>))}
    <RoundedBox args={[0.076, 0.035, 0.001]} radius={0.002} smoothness={2} position={[-0.047, 0.597, 0.071]}><meshStandardMaterial {...M.machined} /></RoundedBox>
    <Text position={[-0.047, 0.605, 0.072]} fontSize={0.009} color={M.polymer.color}>E-COMPRESSOR</Text>
    <Text position={[-0.047, 0.592, 0.072]} fontSize={0.006} color={M.polymer.color}>HV · ELECTRIC SCROLL</Text>
  </group>;
}