import type { ReactNode } from "react";

/** Shared small details for grid-equipment housings. Dimensions are metres. */
export function EquipmentBox({
  position,
  size,
  color,
  metalness = 0.25,
  roughness = 0.55,
  emissive = 0,
  children,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  metalness?: number;
  roughness?: number;
  emissive?: number;
  children?: ReactNode;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        emissive={emissive ? color : "#000000"}
        emissiveIntensity={emissive}
      />
      {children}
    </mesh>
  );
}

export function StatusLed({
  position,
  on,
  color = "#22c55e",
  size = 0.018,
}: {
  position: [number, number, number];
  on: boolean;
  color?: string;
  size?: number;
}) {
  const c = on ? color : "#454b52";
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 12, 10]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={on ? 1.1 : 0} />
    </mesh>
  );
}

export function EquipmentBolt({
  position,
  size = 0.012,
}: {
  position: [number, number, number];
  size?: number;
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[size, size, size * 0.55, 6]} />
      <meshStandardMaterial color="#c7ccd1" metalness={0.9} roughness={0.28} />
    </mesh>
  );
}

export function CableSocket({
  position,
  color = "#b45309",
  size = 0.035,
}: {
  position: [number, number, number];
  color?: string;
  size?: number;
}) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[size * 1.3, size * 1.3, size * 0.65, 16]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, size * 0.55, 0]}>
        <cylinderGeometry args={[size, size * 0.8, size, 16]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    </group>
  );
}
