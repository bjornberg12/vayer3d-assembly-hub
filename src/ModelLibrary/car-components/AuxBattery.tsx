import { RoundedBox, Text } from "@react-three/drei";
import { AUX_BATTERY_PINS } from "./auxBatteryPins";

const MATERIALS = {
  case: { color: "#24282b", roughness: 0.77, metalness: 0.04 },
  lid: { color: "#383e42", roughness: 0.65, metalness: 0.05 },
  lead: { color: "#b7bdc1", roughness: 0.42, metalness: 0.7 },
  clamp: { color: "#cbd0d3", roughness: 0.3, metalness: 0.8 },
  label: { color: "#e5e8e6", roughness: 0.78, metalness: 0 },
  positive: { color: "#d54138", roughness: 0.6 },
  negative: { color: "#171a1c", roughness: 0.65 },
};

/** Tapered lead post, split metal cable clamp and pinch bolt. The top face is the wire endpoint. */
export function AuxBatteryTerminal({ pinId }: { pinId: string }) {
  const pin = AUX_BATTERY_PINS.find((p) => p.id === pinId);
  if (!pin) return null;
  const positive = pin.id === "p";
  const polarity = positive ? MATERIALS.positive : MATERIALS.negative;
  return <group position={pin.local} name={`aux-battery-contact-${pin.id}`}>
    <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.017, 0.017, 0.005, 24]} /><meshStandardMaterial {...polarity} /></mesh>
    <mesh position={[0, -0.018, 0]} castShadow><cylinderGeometry args={[pin.postRadius, pin.postRadius + 0.002, 0.036, 24]} /><meshStandardMaterial {...MATERIALS.lead} /></mesh>
    <mesh position={[0, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[pin.postRadius + 0.0025, 0.004, 8, 28, Math.PI * 1.8]} /><meshStandardMaterial {...MATERIALS.clamp} />
    </mesh>
    {[-0.0045, 0.0045].map((x) => <mesh key={x} position={[x, -0.013, 0.014]} castShadow><boxGeometry args={[0.004, 0.01, 0.013]} /><meshStandardMaterial {...MATERIALS.clamp} /></mesh>)}
    <mesh position={[0, -0.012, 0.017]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.002, 0.002, 0.018, 12]} /><meshStandardMaterial {...MATERIALS.clamp} /></mesh>
    <mesh position={[0.009, -0.012, 0.017]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.004, 0.004, 0.004, 6]} /><meshStandardMaterial {...MATERIALS.lead} /></mesh>
    <mesh position={[0, -0.013, -0.018]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.006, 0.006, 0.019, 16]} /><meshStandardMaterial {...MATERIALS.clamp} /></mesh>
    <mesh position={[0, -0.013, -0.03]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.0065, 0.0065, 0.006, 16]} /><meshStandardMaterial {...polarity} /></mesh>
  </group>;
}

/** Compact AGM auxiliary battery; preserves the original footprint and electrical equivalent. */
export function AuxBattery() {
  return <group name="aux-battery-housing">
    <RoundedBox args={[0.244, 0.161, 0.164]} radius={0.006} smoothness={3} position={[0, 0.59, 0]} castShadow receiveShadow><meshStandardMaterial {...MATERIALS.case} /></RoundedBox>
    <RoundedBox args={[0.25, 0.008, 0.17]} radius={0.003} smoothness={2} position={[0, 0.516, 0]} castShadow><meshStandardMaterial {...MATERIALS.lid} /></RoundedBox>
    <RoundedBox args={[0.249, 0.006, 0.169]} radius={0.003} smoothness={2} position={[0, 0.672, 0]}><meshStandardMaterial {...MATERIALS.case} /></RoundedBox>
    <RoundedBox args={[0.25, 0.018, 0.17]} radius={0.005} smoothness={3} position={[0, 0.684, 0]} castShadow><meshStandardMaterial {...MATERIALS.lid} /></RoundedBox>
    {/* Moulded side ribs and lower hold-down flange. */}
    {[-1, 1].flatMap((side) => [-0.052, -0.026, 0, 0.026, 0.052].map((z) => <mesh key={`${side}-${z}`} position={[side * 0.121, 0.589, z]} castShadow><boxGeometry args={[0.005, 0.133, 0.005]} /><meshStandardMaterial {...MATERIALS.lid} /></mesh>))}
    {/* Six flush cell plugs and a recessed folding carry handle. */}
    {[-0.093, -0.056, -0.019, 0.019, 0.056, 0.093].map((x) => <group key={x} position={[x, 0.695, 0.043]}>
      <mesh><cylinderGeometry args={[0.012, 0.012, 0.003, 20]} /><meshStandardMaterial {...MATERIALS.case} /></mesh>
      <mesh position={[0, 0.0017, 0]}><boxGeometry args={[0.014, 0.0007, 0.002]} /><meshStandardMaterial {...MATERIALS.lid} /></mesh>
    </group>)}
    <RoundedBox args={[0.126, 0.002, 0.022]} radius={0.003} smoothness={2} position={[0, 0.694, 0]}><meshStandardMaterial {...MATERIALS.case} /></RoundedBox>
    <RoundedBox args={[0.106, 0.006, 0.008]} radius={0.002} smoothness={2} position={[0, 0.697, 0]} castShadow><meshStandardMaterial {...MATERIALS.lid} /></RoundedBox>
    {[-0.054, 0.054].map((x) => <mesh key={x} position={[x, 0.696, 0.004]}><boxGeometry args={[0.009, 0.006, 0.022]} /><meshStandardMaterial {...MATERIALS.lid} /></mesh>)}
    {/* Embossed polarity marks next to each terminal. */}
    {AUX_BATTERY_PINS.map((pin) => <group key={pin.id} position={[pin.local[0], 0.694, -0.019]}>
      <mesh><boxGeometry args={[0.015, 0.001, 0.003]} /><meshStandardMaterial {...(pin.id === "p" ? MATERIALS.positive : MATERIALS.label)} /></mesh>
      {pin.id === "p" && <mesh><boxGeometry args={[0.003, 0.001, 0.015]} /><meshStandardMaterial {...MATERIALS.positive} /></mesh>}
    </group>)}
    {/* Front identification label, without inventing a manufacturer or changing capacity settings. */}
    <RoundedBox args={[0.166, 0.086, 0.001]} radius={0.003} smoothness={2} position={[0, 0.594, 0.0825]}><meshStandardMaterial {...MATERIALS.label} /></RoundedBox>
    <mesh position={[-0.065, 0.594, 0.0832]}><boxGeometry args={[0.007, 0.075, 0.0005]} /><meshStandardMaterial {...MATERIALS.positive} /></mesh>
    <Text position={[-0.05, 0.61, 0.0835]} fontSize={0.023} anchorX="left" color={MATERIALS.case.color}>12V AGM</Text>
    <Text position={[-0.05, 0.582, 0.0835]} fontSize={0.009} anchorX="left" color={MATERIALS.case.color}>AUXILIARY BATTERY</Text>
    {Array.from({ length: 19 }, (_, i) => <mesh key={i} position={[-0.046 + i * 0.004, 0.56, 0.0835]}><boxGeometry args={[i % 3 === 0 ? 0.0016 : 0.0007, 0.009, 0.0005]} /><meshStandardMaterial {...MATERIALS.case} /></mesh>)}
    {/* Side vent socket. */}
    <mesh position={[0.123, 0.663, 0.058]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.004, 0.004, 0.004, 16]} /><meshStandardMaterial {...MATERIALS.case} /></mesh>
  </group>;
}