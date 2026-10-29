import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt } from "./ThermalDetails";
import { BMS_PINS } from "./bmsPins";

/** Separate contact groups keep each existing harness endpoint selectable. */
export function BMSTerminal({ pinId, color }: { pinId: string; color: string }) {
  const pin = BMS_PINS.find((p) => p.id === pinId);
  if (!pin) return null;
  return <group name={`bms-contact-${pin.id}`} position={pin.local} rotation={pin.rotation}>
    {/* Recessed plated contact with a light insulator and role-coloured rim. */}
    <mesh position={[0, -0.001, 0]}><boxGeometry args={[0.008, 0.003, 0.01]} /><meshStandardMaterial {...M.machined} /></mesh>
    <mesh position={[0, 0.001, 0]}><boxGeometry args={[0.005, 0.002, 0.006]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} /></mesh>
    {pin.kind !== "power" && [-1, 1].map((s) => <mesh key={s} position={[s * 0.008, -0.001, 0]}><boxGeometry args={[0.002, 0.003, 0.005]} /><meshStandardMaterial {...M.machined} /></mesh>)}
  </group>;
}

/** Automotive BMS master ECU: gasketed enclosure and keyed low-voltage harness sockets. */
export function BatteryManagementSystem() {
  const sockets = [
    { x: -0.066, width: 0.044, label: "12V + / −" },
    { x: 0.013, width: 0.069, label: "CELL SENSE" },
    { x: 0.082, width: 0.033, label: "CAN" },
  ];
  return <group name="battery-management-system-ecu">
    <RoundedBox args={[0.22, 0.034, 0.15]} radius={0.006} smoothness={3} position={[0, 0.469, 0]} castShadow receiveShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
    <RoundedBox args={[0.224, 0.003, 0.154]} radius={0.005} smoothness={2} position={[0, 0.484, 0]}><meshStandardMaterial {...M.seal} /></RoundedBox>
    <RoundedBox args={[0.228, 0.007, 0.158]} radius={0.006} smoothness={3} position={[0, 0.489, 0]} castShadow><meshStandardMaterial {...M.machined} /></RoundedBox>
    {/* Lid fasteners and cast mounting ears with through-hole recesses. */}
    {[-0.098, 0.098].flatMap((x) => [-0.064, 0.064].map((z) => <ThermalBolt key={`${x}-${z}`} position={[x, 0.493, z]} />))}
    {[-1, 1].map((s) => <group key={s} position={[s * 0.12, 0.456, -0.025]}>
      <RoundedBox args={[0.035, 0.006, 0.035]} radius={0.005} smoothness={2} castShadow><meshStandardMaterial {...M.casting} /></RoundedBox>
      <mesh position={[s * 0.005, 0.0035, 0]}><cylinderGeometry args={[0.005, 0.005, 0.001, 20]} /><meshStandardMaterial {...M.seal} /></mesh>
      <mesh position={[s * 0.005, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.006, 0.001, 6, 20]} /><meshStandardMaterial {...M.steel} /></mesh>
    </group>)}
    {/* Low-profile cast side ribs, not a high-voltage power connector. */}
    {[-1, 1].flatMap((s) => [-0.045, -0.022, 0, 0.022, 0.045].map((z) => <mesh key={`${s}-${z}`} position={[s * 0.11, 0.467, z]} castShadow><boxGeometry args={[0.004, 0.025, 0.008]} /><meshStandardMaterial {...M.casting} /></mesh>))}
    {sockets.map((socket) => <group key={socket.label} position={[socket.x, 0.472, 0.076]}>
      <RoundedBox args={[socket.width + 0.006, 0.026, 0.01]} radius={0.003} smoothness={2} castShadow><meshStandardMaterial {...M.seal} /></RoundedBox>
      {/* Four walls leave a real open mouth instead of burying the contacts. */}
      {[-1, 1].map((s) => <group key={s}>
        <mesh position={[0, s * 0.012, 0.016]}><boxGeometry args={[socket.width, 0.004, 0.03]} /><meshStandardMaterial {...M.polymer} /></mesh>
        <mesh position={[s * (socket.width / 2 - 0.002), 0, 0.016]}><boxGeometry args={[0.004, 0.02, 0.03]} /><meshStandardMaterial {...M.polymer} /></mesh>
      </group>)}
      <mesh position={[0, 0.015, 0.015]}><boxGeometry args={[socket.width * 0.4, 0.004, 0.012]} /><meshStandardMaterial {...M.polymer} /></mesh>
      <Text position={[0, 0.024, -0.006]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.006} color={M.polymer.color}>{socket.label}</Text>
    </group>)}
    <RoundedBox args={[0.117, 0.001, 0.068]} radius={0.002} smoothness={2} position={[0, 0.493, -0.012]}><meshStandardMaterial {...M.polymer} /></RoundedBox>
    <Text position={[0, 0.495, -0.027]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.014} color={M.machined.color}>BMS</Text>
    <Text position={[0, 0.495, -0.005]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.0055} color={M.machined.color}>BATTERY MANAGEMENT</Text>
    <Text position={[0, 0.495, 0.009]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.005} color={M.machined.color}>12V DC · CELL MONITOR / CAN</Text>
    {/* Breather vent on the rear wall. */}
    <mesh position={[0.071, 0.47, -0.078]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.008, 0.008, 0.004, 20]} /><meshStandardMaterial {...M.polymer} /></mesh>
  </group>;
}