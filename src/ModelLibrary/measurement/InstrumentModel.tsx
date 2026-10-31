import { Part } from "@/components/PartLabel";
import { PinTerminal } from "../car-components/EVComponents";
import { instrumentPins, type InstrumentKind } from "./instruments";
import { Text } from "@react-three/drei";

const materials = { resin: "#d2d7dc", core: "#41484a", copper: "#bd7b42", face: "#eef1f2", label: "#263235" };
export function InstrumentModel({ kind }: { kind: InstrumentKind }) {
  return <Part name={kind === "ct" ? "Current transformer + transmitter" : "Voltage transformer + transmitter"}>
    {kind === "ct" ? <>
      <mesh position={[0, 0.15, 0]}><torusGeometry args={[0.105, 0.047, 12, 32]} /><meshStandardMaterial color={materials.resin} roughness={0.6} /></mesh>
      <mesh position={[0, 0.15, 0.048]}><torusGeometry args={[0.105, 0.009, 8, 32]} /><meshStandardMaterial color={materials.core} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.14, 0.15, 0]}><boxGeometry args={[0.026, 0.065, 0.095]} /><meshStandardMaterial color={materials.core} metalness={0.7} /></mesh>)}
    </> : <>
      <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.3, 0.24, 0.18]} /><meshStandardMaterial color={materials.resin} roughness={0.5} /></mesh>
      {[-0.08, 0.08].map((x) => <mesh key={x} position={[x, 0.13, 0.092]}><cylinderGeometry args={[0.045, 0.045, 0.12, 16]} /><meshStandardMaterial color={materials.copper} metalness={0.6} /></mesh>)}
    </>}
    <mesh position={[0, 0.26, 0.08]}><boxGeometry args={[0.23, 0.055, 0.085]} /><meshStandardMaterial color={materials.core} /></mesh>
    <mesh position={[0, 0.21, 0.102]}><boxGeometry args={[0.15, 0.04, 0.008]} /><meshStandardMaterial color={materials.face} /></mesh>
    <Text position={[0, 0.21, 0.108]} fontSize={0.014} color={materials.label}>{kind.toUpperCase()} · RMS</Text>
    {instrumentPins(kind).map((p) => <PinTerminal key={p.id} role={p.role} position={p.local} size={0.016} />)}
  </Part>;
}