import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt, ThermalFitting } from "./ThermalDetails";
import { HEATER_PINS } from "./heaterPins";

/** Individually selectable socket faces and chassis bonding stud. */
export function HeaterTerminal({ pinId, color }: { pinId: string; color: string }) {
  const pin = HEATER_PINS.find((p) => p.id === pinId);
  if (!pin) return null;
  const ground = pin.kind === "ground", control = pin.kind === "control";
  return <group name={`heater-contact-${pin.id}`} position={pin.local} rotation={pin.rotation}>
    <mesh position={[0, -0.005, 0]}><cylinderGeometry args={[ground ? 0.011 : 0.014, ground ? 0.011 : 0.014, 0.003, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.48} /></mesh>
    {ground ? <>
      <mesh position={[0, -0.009, 0]}><cylinderGeometry args={[0.013, 0.013, 0.005, 24]} /><meshStandardMaterial {...M.steel} /></mesh>
      <mesh position={[0, -0.003, 0]}><cylinderGeometry args={[0.007, 0.007, 0.004, 6]} /><meshStandardMaterial {...M.machined} /></mesh>
      <mesh position={[0, -0.0005, 0]}><cylinderGeometry args={[0.0035, 0.0035, 0.001, 16]} /><meshStandardMaterial {...M.steel} /></mesh>
    </> : <>
      <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[control ? 0.010 : 0.0105, 24]} /><meshStandardMaterial {...M.seal} /></mesh>
      <mesh position={[0, -0.0025, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.013, 0.0015, 8, 24]} /><meshStandardMaterial {...(control ? M.polymer : M.hv)} /></mesh>
      {control ? [-0.004, 0.004].flatMap((x) => [-0.003, 0.003].map((z) => <mesh key={`${x}-${z}`} position={[x, -0.0005, z]}><cylinderGeometry args={[0.00125, 0.00125, 0.001, 10]} /><meshStandardMaterial {...M.machined} /></mesh>)) : <>
        <mesh position={[0, -0.001, 0]}><cylinderGeometry args={[0.006, 0.006, 0.002, 24]} /><meshStandardMaterial {...M.machined} /></mesh>
        <mesh position={[0, 0.0001, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.0035, 20]} /><meshStandardMaterial {...M.seal} /></mesh>
      </>}
    </>}
  </group>;
}

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
    {/* Sealed two-pole HV receptacle, keyed latch and separate low-voltage control plug. */}
    <RoundedBox args={[0.09, 0.045, 0.034]} radius={0.005} smoothness={3} position={[-0.045, 0.751, -0.066]} castShadow><meshStandardMaterial {...M.hv} /></RoundedBox>
    <RoundedBox args={[0.096, 0.049, 0.004]} radius={0.005} smoothness={2} position={[-0.045, 0.751, -0.052]}><meshStandardMaterial {...M.seal} /></RoundedBox>
    <mesh position={[-0.045, 0.777, -0.07]}><boxGeometry args={[0.026, 0.008, 0.018]} /><meshStandardMaterial {...M.polymer} /></mesh>
    <mesh position={[-0.045, 0.776, -0.082]}><boxGeometry args={[0.019, 0.005, 0.005]} /><meshStandardMaterial {...M.hv} /></mesh>
    <RoundedBox args={[0.038, 0.031, 0.028]} radius={0.004} smoothness={3} position={[0.068, 0.751, -0.063]} castShadow><meshStandardMaterial {...M.polymer} /></RoundedBox>
    <mesh position={[0.068, 0.77, -0.066]}><boxGeometry args={[0.021, 0.007, 0.018]} /><meshStandardMaterial {...M.steel} /></mesh>
    <mesh position={[0.09, 0.805, 0.016]}><cylinderGeometry args={[0.015, 0.015, 0.006, 24]} /><meshStandardMaterial {...M.casting} /></mesh>
    <mesh position={[-0.084, 0.742, -0.052]}><boxGeometry args={[0.023, 0.04, 0.001]} /><meshStandardMaterial {...M.warning} /></mesh>
    <Text position={[0.025, 0.749, -0.054]} rotation={[0, Math.PI, 0]} fontSize={0.013} color={M.polymer.color}>PTC HEATER</Text>
    <Text position={[0.025, 0.727, -0.054]} rotation={[0, Math.PI, 0]} fontSize={0.007} color={M.polymer.color}>HV · COOLANT</Text>
    <mesh position={[-0.084, 0.742, -0.053]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.003, 0.024, 0.001]} /><meshStandardMaterial {...M.polymer} /></mesh>
  </group>;
}