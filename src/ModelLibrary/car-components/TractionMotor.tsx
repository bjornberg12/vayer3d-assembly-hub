import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt, ThermalFitting } from "./ThermalDetails";
import { MOTOR_PINS } from "./motorPins";

/** Individually selectable phase lugs, ground stud and resolver plug face. */
export function MotorTerminal({ pinId, color }: { pinId: string; color: string }) {
  const pin = MOTOR_PINS.find((p) => p.id === pinId);
  if (!pin) return null;
  const ground = pin.kind === "ground", sensor = pin.kind === "sensor";
  return <group name={`motor-contact-${pin.id}`} position={pin.local} rotation={pin.rotation}>
    <mesh position={[0, -0.004, 0]}><cylinderGeometry args={[ground ? 0.011 : 0.013, ground ? 0.011 : 0.013, 0.003, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.48} /></mesh>
    {ground ? <>
      <mesh position={[0, -0.008, 0]}><cylinderGeometry args={[0.012, 0.012, 0.005, 24]} /><meshStandardMaterial {...M.steel} /></mesh>
      <mesh position={[0, -0.0025, 0]}><cylinderGeometry args={[0.0065, 0.0065, 0.004, 6]} /><meshStandardMaterial {...M.machined} /></mesh>
      <mesh position={[0, -0.0002, 0]}><cylinderGeometry args={[0.0032, 0.0032, 0.001, 16]} /><meshStandardMaterial {...M.steel} /></mesh>
    </> : sensor ? <>
      <mesh position={[0, -0.006, 0]}><cylinderGeometry args={[0.012, 0.012, 0.006, 20]} /><meshStandardMaterial {...M.polymer} /></mesh>
      <mesh position={[0, -0.002, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.012, 0.0014, 8, 24]} /><meshStandardMaterial {...M.seal} /></mesh>
      {[-0.004, 0, 0.004].map((x) => <mesh key={x} position={[x, -0.0005, 0]}><cylinderGeometry args={[0.0012, 0.0012, 0.001, 10]} /><meshStandardMaterial {...M.machined} /></mesh>)}
    </> : <>
      <mesh position={[0, -0.008, 0]}><cylinderGeometry args={[0.015, 0.015, 0.005, 24]} /><meshStandardMaterial {...M.hv} /></mesh>
      <mesh position={[0, -0.0025, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.0125, 0.0015, 8, 24]} /><meshStandardMaterial {...M.hv} /></mesh>
      <mesh position={[0, -0.001, 0]}><cylinderGeometry args={[0.0055, 0.0055, 0.002, 20]} /><meshStandardMaterial {...M.machined} /></mesh>
      <mesh position={[0, 0.0001, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.0032, 18]} /><meshStandardMaterial {...M.seal} /></mesh>
    </>}
  </group>;
}

/** Liquid-cooled PMSM housing. The original axle centre and all five pin faces stay unchanged. */
export function TractionMotor() {
  return <group name="traction-motor-housing">
    <group position={[0.3, 0.42, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.139, 0.139, 0.36, 48]} /><meshStandardMaterial {...M.casting} />
      </mesh>
      {/* Cast longitudinal ribs around the water jacket, leaving the terminal pad clear. */}
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        return <mesh key={i} position={[0, Math.sin(angle) * 0.139, Math.cos(angle) * 0.139]} rotation={[angle, 0, 0]} castShadow>
          <boxGeometry args={[0.32, 0.012, 0.008]} /><meshStandardMaterial {...M.casting} />
        </mesh>;
      })}
      {/* Gasketed end bells, machined bearing bosses and perimeter fasteners. */}
      {[-1, 1].map((side) => <group key={side}>
        <mesh position={[side * 0.183, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.15, 0.15, 0.004, 48]} /><meshStandardMaterial {...M.seal} /></mesh>
        <mesh position={[side * 0.194, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.018, 48]} /><meshStandardMaterial {...M.machined} /></mesh>
        <mesh position={[side * 0.208, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.071, 0.105, 0.016, 40]} /><meshStandardMaterial {...M.casting} /></mesh>
        <mesh position={[side * 0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.047, 0.047, 0.012, 32]} /><meshStandardMaterial {...M.steel} /></mesh>
        <mesh position={[side * 0.227, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.034, 0.034, 0.003, 32]} /><meshStandardMaterial {...M.seal} /></mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return <group key={i} position={[side * 0.204, Math.sin(angle) * 0.128, Math.cos(angle) * 0.128]} rotation={[0, 0, -side * Math.PI / 2]}><ThermalBolt position={[0, 0, 0]} /></group>;
        })}
        {/* CV joint dust boot with individual convolutions and retaining bands. */}
        <mesh position={[side * 0.277, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.038, 0.045, 0.08, 32]} /><meshStandardMaterial {...M.polymer} /></mesh>
        {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[side * (0.242 + i * 0.013), 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.039 + (5 - i) * 0.001, 0.005, 8, 32]} /><meshStandardMaterial {...M.seal} /></mesh>)}
        {[0.237, 0.318].map((x) => <mesh key={x} position={[side * x, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.042, 0.042, 0.006, 32]} /><meshStandardMaterial {...M.steel} /></mesh>)}
      </group>)}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.025, 0.025, 1.4, 32]} /><meshStandardMaterial {...M.steel} /></mesh>
      {/* Cast mounting feet with steel bushings. */}
      {[-0.125, 0.125].flatMap((x) => [-0.105, 0.105].map((z) => <group key={`${x}-${z}`} position={[x, -0.127, z]}>
        <RoundedBox args={[0.07, 0.03, 0.058]} radius={0.006} smoothness={3} castShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
        <mesh position={[0, 0.016, 0]}><cylinderGeometry args={[0.012, 0.012, 0.004, 24]} /><meshStandardMaterial {...M.steel} /></mesh>
        <mesh position={[0, 0.0182, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.0065, 20]} /><meshStandardMaterial {...M.seal} /></mesh>
      </group>))}
      <ThermalFitting position={[-0.105, 0.033, 0.132]} rotation={[Math.PI / 2, 0, 0]} radius={0.011} />
      <ThermalFitting position={[0.105, 0.033, 0.132]} rotation={[Math.PI / 2, 0, 0]} radius={0.011} />
      {/* Terminal bases support the existing independently selectable contacts at y = 0.58. */}
      <RoundedBox args={[0.139, 0.024, 0.046]} radius={0.005} smoothness={3} position={[-0.045, 0.132, 0]} castShadow><meshStandardMaterial {...M.hv} /></RoundedBox>
      <mesh position={[-0.045, 0.124, -0.027]}><boxGeometry args={[0.046, 0.008, 0.014]} /><meshStandardMaterial {...M.polymer} /></mesh>
      <mesh position={[0.045, 0.138, 0]}><cylinderGeometry args={[0.018, 0.018, 0.01, 24]} /><meshStandardMaterial {...M.machined} /></mesh>
      <RoundedBox args={[0.032, 0.022, 0.036]} radius={0.004} smoothness={3} position={[0.09, 0.133, 0]}><meshStandardMaterial {...M.polymer} /></RoundedBox>
      <RoundedBox args={[0.144, 0.036, 0.003]} radius={0.003} smoothness={2} position={[0, 0.048, -0.135]}><meshStandardMaterial {...M.polymer} /></RoundedBox>
      <Text position={[0, 0.052, -0.137]} rotation={[0, Math.PI, 0]} fontSize={0.012} color={M.machined.color}>PMSM DRIVE</Text>
      <Text position={[0, 0.037, -0.137]} rotation={[0, Math.PI, 0]} fontSize={0.006} color={M.machined.color}>LIQUID COOLED · 3 PHASE</Text>
    </group>
  </group>;
}