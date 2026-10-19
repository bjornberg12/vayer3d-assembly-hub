import { RoundedBox } from "@react-three/drei";
import { CONVERTER_PINS } from "./converterPins";

const MATERIALS = {
  casting: { color: "#aeb7bd", metalness: 0.72, roughness: 0.43 },
  cover: { color: "#d1d7db", metalness: 0.68, roughness: 0.32 },
  steel: { color: "#929fa8", metalness: 0.85, roughness: 0.24 },
  seal: { color: "#24292c", metalness: 0.03, roughness: 0.84 },
  hv: { color: "#ed7625", metalness: 0.04, roughness: 0.5 },
  warning: { color: "#f1c541", metalness: 0.02, roughness: 0.68 },
};

/** Selectable terminal geometry ends at the same face used by wire routing. */
export function ConverterTerminal({ pinId, color }: { pinId: string; color: string }) {
  const pin = CONVERTER_PINS.find((p) => p.id === pinId);
  if (!pin) return null;
  const stud = pin.kind === "lv", control = pin.kind === "control";
  return <group position={pin.local} rotation={pin.rotation} name={`converter-contact-${pin.id}`}>
    <RoundedBox args={[control ? 0.034 : 0.042, 0.018, control ? 0.028 : 0.041]} radius={0.004} smoothness={2} position={[0, -0.018, 0]} castShadow>
      <meshStandardMaterial {...(pin.kind === "hv" ? MATERIALS.hv : MATERIALS.seal)} />
    </RoundedBox>
    <mesh position={[0, -0.006, 0]}><cylinderGeometry args={[0.015, 0.015, 0.005, 20]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.45} /></mesh>
    <mesh position={[0, -0.002, 0]}><cylinderGeometry args={[stud ? 0.009 : 0.0095, stud ? 0.009 : 0.0095, 0.004, stud ? 6 : 20]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
    {stud ? <mesh position={[0, 0.002, 0]}><cylinderGeometry args={[0.004, 0.004, 0.004, 16]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh> : <>
      <mesh position={[0, 0.0002, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.0055, 16]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
      {control && [-0.003, 0.003].map((x) => <mesh key={x} position={[x, 0.0004, 0]}><cylinderGeometry args={[0.0012, 0.0012, 0.002, 8]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>)}
    </>}
    {!stud && <mesh position={[0, -0.017, -0.023]}><boxGeometry args={[0.017, 0.008, 0.008]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>}
  </group>;
}

/** Liquid-cooled automotive housing; electrical model stays unchanged. */
export function DCConverter() {
  return <group name="dc-dc-converter-housing">
    <RoundedBox args={[0.216, 0.078, 0.174]} radius={0.009} smoothness={3} position={[0, 0.44, 0]} castShadow receiveShadow>
      <meshStandardMaterial {...MATERIALS.casting} />
    </RoundedBox>
    {/* Cooling plate, gasket seam and removable machined cover. */}
    <RoundedBox args={[0.224, 0.01, 0.18]} radius={0.006} smoothness={2} position={[0, 0.405, 0]} castShadow>
      <meshStandardMaterial {...MATERIALS.steel} />
    </RoundedBox>
    <RoundedBox args={[0.22, 0.004, 0.179]} radius={0.007} smoothness={2} position={[0, 0.479, 0]}>
      <meshStandardMaterial {...MATERIALS.seal} />
    </RoundedBox>
    <RoundedBox args={[0.22, 0.013, 0.177]} radius={0.008} smoothness={3} position={[0, 0.487, 0]} castShadow>
      <meshStandardMaterial {...MATERIALS.cover} />
    </RoundedBox>
    {/* Cast ribs on both sides, within the existing routing footprint. */}
    {[-1, 1].flatMap((side) => [-0.067, -0.0505, 0.065].map((z) => <mesh key={`${side}-${z}`} position={[side * 0.109, 0.439, z]} castShadow>
      <boxGeometry args={[0.007, 0.057, 0.004]} /><meshStandardMaterial {...MATERIALS.casting} />
    </mesh>))}
    {[-0.099, 0.099].flatMap((x) => [-0.071, 0.071].map((z) => <group key={`${x}-${z}`}>
      <RoundedBox args={[0.036, 0.009, 0.029]} radius={0.005} smoothness={2} position={[x, 0.403, z]} castShadow>
        <meshStandardMaterial {...MATERIALS.casting} />
      </RoundedBox>
      <mesh position={[x, 0.408, z]}><cylinderGeometry args={[0.007, 0.007, 0.002, 16]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
      <mesh position={[x, 0.41, z]}><cylinderGeometry args={[0.0035, 0.0035, 0.003, 6]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
      <mesh position={[x * 0.94, 0.495, z]}><cylinderGeometry args={[0.005, 0.005, 0.003, 6]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
      <mesh position={[x * 0.94, 0.4967, z]}><boxGeometry args={[0.004, 0.0005, 0.001]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
    </group>))}
    {/* Two sealed coolant hose fittings face the front of the enclosure. */}
    {[-0.058, 0.058].map((x) => <group key={x} position={[x, 0.427, -0.085]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh><cylinderGeometry args={[0.012, 0.012, 0.01, 6]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
      <mesh position={[0, 0.007, 0]}><cylinderGeometry args={[0.008, 0.008, 0.014, 20]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
      {[0.005, 0.01].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.008, 0.0015, 6, 20]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>)}
      <mesh position={[0, 0.0141, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.005, 16]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
    </group>)}
    {/* Recessed identification plate and high-voltage warning symbol. */}
    <RoundedBox args={[0.126, 0.002, 0.038]} radius={0.004} smoothness={2} position={[0, 0.494, 0.051]}><meshStandardMaterial {...MATERIALS.seal} /></RoundedBox>
    <mesh position={[-0.043, 0.4953, 0.052]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.014, 3]} /><meshStandardMaterial {...MATERIALS.warning} /></mesh>
    <mesh position={[-0.043, 0.4956, 0.052]} rotation={[0, 0.35, 0]}><boxGeometry args={[0.0025, 0.0005, 0.01]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>
    <mesh position={[0.021, 0.4953, 0.052]}><boxGeometry args={[0.066, 0.0008, 0.026]} /><meshStandardMaterial {...MATERIALS.cover} /></mesh>
    {Array.from({ length: 13 }, (_, i) => <mesh key={i} position={[-0.005 + i * 0.004, 0.4959, 0.055]}><boxGeometry args={[i % 3 === 0 ? 0.0018 : 0.0008, 0.0005, 0.012]} /><meshStandardMaterial {...MATERIALS.seal} /></mesh>)}
  </group>;
}