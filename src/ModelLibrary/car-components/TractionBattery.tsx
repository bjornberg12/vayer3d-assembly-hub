import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt, ThermalFitting } from "./ThermalDetails";
import { TRACTION_BATTERY_PINS } from "./tractionBatteryPins";

/** Contact faces are separate from the enclosure so every endpoint remains selectable. */
export function TractionBatteryTerminal({ pinId, color }: { pinId: string; color: string }) {
  const pin = TRACTION_BATTERY_PINS.find((p) => p.id === pinId);
  if (!pin) return null;
  return <group name={`battery-contact-${pin.id}`} position={pin.local} rotation={pin.rotation}>
    {pin.kind === "ground" ? <>
      <mesh position={[0, -0.008, 0]}><cylinderGeometry args={[0.007, 0.007, 0.017, 18]} /><meshStandardMaterial {...M.steel} /></mesh>
      <mesh position={[0, -0.004, 0]}><cylinderGeometry args={[0.011, 0.011, 0.007, 6]} /><meshStandardMaterial {...M.machined} /></mesh>
    </> : <>
      <mesh position={[0, -0.004, 0]}><cylinderGeometry args={[pin.kind === "hv" ? 0.012 : 0.005, pin.kind === "hv" ? 0.012 : 0.005, 0.009, 24]} /><meshStandardMaterial {...M.machined} /></mesh>
      <mesh position={[0, -0.001, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[pin.kind === "hv" ? 0.008 : 0.0035, 0.0015, 8, 24]} /><meshStandardMaterial {...M.steel} /></mesh>
    </>}
    <mesh position={[0, 0.001, 0]}><cylinderGeometry args={[pin.kind === "hv" ? 0.0065 : 0.003, pin.kind === "hv" ? 0.0065 : 0.003, 0.002, 18]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.45} /></mesh>
  </group>;
}

/** Sealed underfloor pack: shallow aluminium tray, stamped lid and forward connector bulkhead. */
export function TractionBattery() {
  return <group name="hv-traction-battery-pack">
    <RoundedBox args={[1.5, 0.14, 2.1]} radius={0.025} smoothness={3} position={[0, 0.38, 0]} castShadow receiveShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
    {/* Lower impact shield, gasket and bolted lid flange. */}
    <RoundedBox args={[1.48, 0.012, 2.08]} radius={0.015} smoothness={2} position={[0, 0.305, 0]} castShadow><meshStandardMaterial {...M.steel} /></RoundedBox>
    <RoundedBox args={[1.535, 0.008, 2.135]} radius={0.018} smoothness={2} position={[0, 0.443, 0]}><meshStandardMaterial {...M.seal} /></RoundedBox>
    <RoundedBox args={[1.55, 0.012, 2.15]} radius={0.019} smoothness={2} position={[0, 0.453, 0]} castShadow><meshStandardMaterial {...M.machined} /></RoundedBox>
    <RoundedBox args={[1.43, 0.018, 2.02]} radius={0.02} smoothness={3} position={[0, 0.462, 0]} castShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
    {/* Pressed transverse stiffening channels on the lid. */}
    {Array.from({ length: 6 }, (_, i) => <RoundedBox key={i} args={[1.32, 0.012, 0.045]} radius={0.005} smoothness={2} position={[0, 0.475, -0.83 + i * 0.32]} castShadow><meshStandardMaterial {...M.machined} /></RoundedBox>)}
    {[-0.75, 0.75].flatMap((x) => Array.from({ length: 10 }, (_, i) => <ThermalBolt key={`${x}-${i}`} position={[x, 0.461, -0.98 + i * 0.218]} />))}
    {[-1.047, 1.047].flatMap((z) => [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((x) => <ThermalBolt key={`${x}-${z}`} position={[x, 0.461, z]} />))}
    {/* Extruded side crash rails and mounting tabs with dark bolt recesses. */}
    {[-1, 1].map((s) => <group key={s}>
      <RoundedBox args={[0.045, 0.085, 1.97]} radius={0.006} smoothness={2} position={[s * 0.735, 0.372, 0]} castShadow><meshStandardMaterial {...M.machined} /></RoundedBox>
      {[-0.79, 0, 0.79].map((z) => <group key={z} position={[s * 0.774, 0.36, z]}>
        <RoundedBox args={[0.064, 0.019, 0.1]} radius={0.006} smoothness={2} castShadow><meshStandardMaterial {...M.steel} /></RoundedBox>
        <mesh position={[s * 0.009, 0.01, 0]}><cylinderGeometry args={[0.009, 0.009, 0.002, 20]} /><meshStandardMaterial {...M.seal} /></mesh>
      </group>)}
    </group>)}
    {/* Keyed HV receptacles, collars, locking tabs and separately rendered contacts. */}
    {TRACTION_BATTERY_PINS.filter((p) => p.kind !== "ground").map((pin) => <group key={pin.id} position={[pin.local[0], pin.local[1], 1.046]}>
      <RoundedBox args={[pin.kind === "hv" ? 0.084 : 0.054, 0.069, 0.021]} radius={0.006} smoothness={2} castShadow><meshStandardMaterial {...M.polymer} /></RoundedBox>
      <mesh position={[0, 0, 0.021]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[pin.kind === "hv" ? 0.028 : 0.017, pin.kind === "hv" ? 0.03 : 0.019, 0.035, 24]} /><meshStandardMaterial {...(pin.kind === "hv" ? M.hv : M.polymer)} /></mesh>
      <mesh position={[0, 0, 0.041]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[pin.kind === "hv" ? 0.017 : 0.009, pin.kind === "hv" ? 0.017 : 0.009, 0.004, 24]} /><meshStandardMaterial {...M.seal} /></mesh>
      <mesh position={[0, 0.031, 0.022]}><boxGeometry args={[0.022, 0.009, 0.023]} /><meshStandardMaterial {...M.polymer} /></mesh>
      <Text position={[0, 0.058, 0.014]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.018} color={M.polymer.color}>{pin.id === "dcp" ? "DC+" : pin.id === "dcn" ? "DC−" : pin.id.toUpperCase()}</Text>
    </group>)}
    <mesh position={[-0.58, 0.468, 0.89]}><cylinderGeometry args={[0.023, 0.023, 0.006, 24]} /><meshStandardMaterial {...M.machined} /></mesh>
    {/* Coolant quick-connects point forward but do not create electrical endpoints. */}
    {[-0.61, -0.49].map((x) => <ThermalFitting key={x} position={[x, 0.38, 1.06]} rotation={[Math.PI / 2, 0, 0]} radius={0.013} />)}
    {/* Manual service disconnect on the sealed lid. */}
    <RoundedBox args={[0.13, 0.022, 0.1]} radius={0.007} smoothness={2} position={[0.49, 0.485, 0.76]} castShadow><meshStandardMaterial {...M.polymer} /></RoundedBox>
    <RoundedBox args={[0.08, 0.022, 0.04]} radius={0.005} smoothness={2} position={[0.49, 0.503, 0.76]} castShadow><meshStandardMaterial {...M.hv} /></RoundedBox>
    <RoundedBox args={[0.31, 0.001, 0.14]} radius={0.002} smoothness={2} position={[0.33, 0.473, 0.42]}><meshStandardMaterial {...M.polymer} /></RoundedBox>
    <Text position={[0.33, 0.475, 0.399]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.02} color={M.machined.color}>HV BATTERY</Text>
    <Text position={[0.33, 0.475, 0.439]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.012} color={M.machined.color}>LI-ION · LIQUID COOLED</Text>
    <RoundedBox args={[0.17, 0.001, 0.1]} radius={0.002} smoothness={2} position={[-0.34, 0.473, 0.42]}><meshStandardMaterial {...M.warning} /></RoundedBox>
    <Text position={[-0.34, 0.475, 0.42]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.017} color={M.seal.color}>⚡ HIGH VOLTAGE</Text>
  </group>;
}