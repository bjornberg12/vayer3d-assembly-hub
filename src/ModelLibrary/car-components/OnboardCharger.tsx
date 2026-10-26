import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt, ThermalFitting } from "./ThermalDetails";

/** Sealed liquid-cooled OBC; the existing separately selectable pins stay intact. */
export function OnboardCharger() {
  return <group name="onboard-charger-housing">
    <RoundedBox args={[0.29, 0.096, 0.236]} radius={0.008} smoothness={3} position={[0, 0.451, 0]} castShadow receiveShadow>
      <meshStandardMaterial {...M.casting} />
    </RoundedBox>
    <RoundedBox args={[0.298, 0.012, 0.244]} radius={0.006} smoothness={2} position={[0, 0.401, 0]} castShadow>
      <meshStandardMaterial {...M.machined} />
    </RoundedBox>
    <RoundedBox args={[0.293, 0.003, 0.239]} radius={0.007} smoothness={2} position={[0, 0.5, 0]}>
      <meshStandardMaterial {...M.seal} />
    </RoundedBox>
    <RoundedBox args={[0.294, 0.012, 0.24]} radius={0.007} smoothness={3} position={[0, 0.507, 0]} castShadow>
      <meshStandardMaterial {...M.machined} />
    </RoundedBox>
    {/* Cast wall ribs and four mounting ears remain inside the routing footprint. */}
    {[-1, 1].flatMap((side) => [-0.089, -0.06, -0.03, 0, 0.03, 0.06, 0.089].map((z) =>
      <mesh key={`${side}-${z}`} position={[side * 0.146, 0.45, z]} castShadow>
        <boxGeometry args={[0.005, 0.074, 0.005]} /><meshStandardMaterial {...M.casting} />
      </mesh>
    ))}
    {[-0.142, 0.142].flatMap((x) => [-0.098, 0.098].map((z) => <group key={`${x}-${z}`}>
      <RoundedBox args={[0.034, 0.01, 0.033]} radius={0.005} smoothness={2} position={[x, 0.401, z]} castShadow>
        <meshStandardMaterial {...M.casting} />
      </RoundedBox>
      <mesh position={[x, 0.408, z]}><cylinderGeometry args={[0.007, 0.007, 0.004, 20]} /><meshStandardMaterial {...M.steel} /></mesh>
      <mesh position={[x, 0.4103, z]}><cylinderGeometry args={[0.0038, 0.0038, 0.0006, 20]} /><meshStandardMaterial {...M.seal} /></mesh>
    </group>))}
    {[-0.131, 0.131].flatMap((x) => [-0.102, -0.04, 0.04, 0.102].map((z) =>
      <ThermalBolt key={`${x}-${z}`} position={[x, 0.514, z]} />
    ))}
    {/* Shrouds sit below the original contact faces (y .53); no endpoint relocation. */}
    <RoundedBox args={[0.214, 0.012, 0.033]} radius={0.004} smoothness={2} position={[-0.0225, 0.516, 0]} castShadow>
      <meshStandardMaterial {...M.hv} />
    </RoundedBox>
    <mesh position={[-0.0225, 0.519, -0.021]}><boxGeometry args={[0.034, 0.006, 0.013]} /><meshStandardMaterial {...M.polymer} /></mesh>
    <RoundedBox args={[0.032, 0.012, 0.033]} radius={0.004} smoothness={2} position={[0.1125, 0.516, 0]}>
      <meshStandardMaterial {...M.polymer} />
    </RoundedBox>
    <RoundedBox args={[0.08, 0.012, 0.033]} radius={0.004} smoothness={2} position={[0, 0.516, 0.045]} castShadow>
      <meshStandardMaterial {...M.hv} />
    </RoundedBox>
    <mesh position={[0, 0.519, 0.068]}><boxGeometry args={[0.025, 0.007, 0.012]} /><meshStandardMaterial {...M.polymer} /></mesh>
    {/* Two coolant quick-connects with seals and visible bores. */}
    {[-0.085, 0.085].map((x) => <ThermalFitting key={x} position={[x, 0.447, -0.112]} rotation={[-Math.PI / 2, 0, 0]} radius={0.01} />)}
    <RoundedBox args={[0.158, 0.0018, 0.027]} radius={0.003} smoothness={2} position={[0, 0.5145, -0.071]}>
      <meshStandardMaterial {...M.polymer} />
    </RoundedBox>
    <Text position={[0, 0.516, -0.071]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.0105} color={M.machined.color} anchorX="center" anchorY="middle">ON-BOARD CHARGER</Text>
    <Text position={[0, 0.515, 0.091]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.0075} color={M.polymer.color} anchorX="center" anchorY="middle">AC / DC · LIQUID COOLED</Text>
    <mesh position={[-0.102, 0.5145, -0.071]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.014, 3]} /><meshStandardMaterial {...M.warning} /></mesh>
    <Text position={[-0.102, 0.5155, -0.071]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.015} color={M.seal.color} anchorX="center" anchorY="middle">!</Text>
  </group>;
}