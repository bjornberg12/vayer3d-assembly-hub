import { RoundedBox, Text } from "@react-three/drei";
import { THERMAL_MATERIALS as M, ThermalBolt } from "./ThermalDetails";
import { CHARGEPORT_PINS } from "./chargeportPins";

/**
 * Individually selectable inlet contact: AC wells get a metal socket tube with a
 * role-coloured ring, DC tubes a brass sleeve with a coloured centre, and the
 * CP/PP signal wells a small coloured contact. Local +Y points out of the socket.
 */
export function ChargePortTerminal({ pinId, color }: { pinId: string; color: string }) {
  const pin = CHARGEPORT_PINS.find((p) => p.id === pinId);
  if (!pin) return null;
  return <group name={`chargeport-contact-${pin.id}`} position={pin.local} rotation={pin.rotation}>
    {pin.kind === "dc" ? <>
      <mesh position={[0, -0.002, 0]}><cylinderGeometry args={[0.0075, 0.0075, 0.004, 20]} /><meshStandardMaterial color="#d8b26a" metalness={0.9} roughness={0.25} /></mesh>
      <mesh position={[0, 0.0005, 0]}><cylinderGeometry args={[0.0032, 0.0032, 0.002, 16]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.45} /></mesh>
    </> : pin.kind === "ac" ? <>
      <mesh position={[0, -0.002, 0]}><cylinderGeometry args={[0.0055, 0.0055, 0.004, 18]} /><meshStandardMaterial {...M.machined} /></mesh>
      <mesh position={[0, 0.0003, 0]}><cylinderGeometry args={[0.0035, 0.0035, 0.0018, 16]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.45} /></mesh>
    </> : <>
      <mesh position={[0, -0.001, 0]}><cylinderGeometry args={[0.0028, 0.0028, 0.003, 14]} /><meshStandardMaterial {...M.machined} /></mesh>
      <mesh position={[0, 0.0008, 0]}><cylinderGeometry args={[0.0016, 0.0016, 0.0016, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.45} /></mesh>
    </>}
  </group>;
}

/**
 * CCS2 (Combo 2) vehicle charge inlet: body-side mounting flange, a recessed
 * socket face with the round Type 2 upper section (five AC power wells plus the
 * small CP/PP signal wells) and the lower DC section with two large DC tubes,
 * a centre latch groove, a hinged flip lid and rear HV cable glands.
 * The selectable wire contacts stay at their existing positions on top of the
 * housing (layoutPins, y = 0.85), so all wiring and the solver are untouched.
 */
export function ChargePort() {
  const faceY = 0.8;
  return <group name="ccs2-charge-inlet">
    {/* Body-side mounting flange with fixing bolts. */}
    <RoundedBox args={[0.17, 0.15, 0.012]} radius={0.005} smoothness={3} position={[0, 0.755, -0.055]} castShadow receiveShadow>
      <meshStandardMaterial {...M.machined} />
    </RoundedBox>
    {[-0.07, 0.07].flatMap((x) => [-0.06, 0.06].map((y) => (
      <group key={`${x}-${y}`} position={[x, 0.755 + y, -0.049]} rotation={[Math.PI / 2, 0, 0]}>
        <ThermalBolt position={[0, 0, 0]} />
      </group>
    )))}
    {/* Inlet body behind the socket face. */}
    <RoundedBox args={[0.15, 0.13, 0.1]} radius={0.012} smoothness={4} position={[0, 0.76, 0]} castShadow receiveShadow>
      <meshStandardMaterial {...M.polymer} />
    </RoundedBox>
    {/* Socket face plate. */}
    <RoundedBox args={[0.13, 0.125, 0.012]} radius={0.01} smoothness={4} position={[0, faceY, 0.052]} castShadow>
      <meshStandardMaterial color="#22262a" metalness={0.15} roughness={0.6} />
    </RoundedBox>
    {/* Upper Type 2 round section: rim ring and five AC power wells. */}
    <mesh position={[0, faceY + 0.022, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.041, 0.004, 10, 32]} />
      <meshStandardMaterial {...M.machined} />
    </mesh>
    {[[-0.026, 0.012], [-0.013, 0.034], [0.013, 0.034], [0.026, 0.012], [0, 0.008]].map(([x, dy], i) => (
      <mesh key={i} position={[x, faceY + dy, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0075, 0.0075, 0.01, 16]} />
        <meshStandardMaterial {...M.seal} />
      </mesh>
    ))}
    {/* Small CP / PP signal wells in the upper section. */}
    {[[-0.02, 0.045], [0.02, 0.045]].map(([x, dy], i) => (
      <mesh key={i} position={[x, faceY + dy, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.01, 12]} />
        <meshStandardMaterial {...M.seal} />
      </mesh>
    ))}
    {/* Lower DC section: two large DC tubes with metal contact sleeves. */}
    <RoundedBox args={[0.1, 0.038, 0.01]} radius={0.006} smoothness={3} position={[0, faceY - 0.038, 0.056]}>
      <meshStandardMaterial color="#22262a" metalness={0.15} roughness={0.6} />
    </RoundedBox>
    {[-0.026, 0.026].map((x) => (
      <group key={x} position={[x, faceY - 0.038, 0.06]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.013, 0.013, 0.012, 20]} />
          <meshStandardMaterial {...M.seal} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.004]}>
          <cylinderGeometry args={[0.007, 0.007, 0.01, 16]} />
          <meshStandardMaterial color="#d8b26a" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    ))}
    {/* Centre latch groove between the sections (plug lock actuator). */}
    <RoundedBox args={[0.02, 0.008, 0.01]} radius={0.003} smoothness={2} position={[0, faceY - 0.012, 0.058]}>
      <meshStandardMaterial {...M.seal} />
    </RoundedBox>
    {/* Hinged flip lid, held open, with a short tether strap. */}
    <group position={[0, faceY + 0.068, 0.05]} rotation={[-1.15, 0, 0]}>
      <RoundedBox args={[0.125, 0.012, 0.1]} radius={0.008} smoothness={3} position={[0, 0, 0.045]} castShadow>
        <meshStandardMaterial {...M.polymer} />
      </RoundedBox>
      <mesh position={[0, -0.008, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.036, 0.0035, 8, 24]} />
        <meshStandardMaterial {...M.seal} />
      </mesh>
    </group>
    <mesh position={[0.062, faceY + 0.075, 0.03]} rotation={[0.5, 0, 0.35]}>
      <boxGeometry args={[0.006, 0.05, 0.012]} />
      <meshStandardMaterial {...M.seal} />
    </mesh>
    {/* Charge status light strip beside the socket. */}
    <RoundedBox args={[0.008, 0.07, 0.006]} radius={0.003} smoothness={2} position={[0.072, faceY, 0.04]}>
      <meshStandardMaterial color="#3ddc84" emissive="#3ddc84" emissiveIntensity={0.7} roughness={0.4} />
    </RoundedBox>
    {/* Rear HV cable glands: orange HV leads out of the housing back. */}
    {[-0.03, 0.03].map((x) => (
      <group key={x} position={[x, 0.74, -0.055]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.017, 0.02, 16]} />
          <meshStandardMaterial {...M.polymer} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
          <cylinderGeometry args={[0.008, 0.008, 0.045, 12]} />
          <meshStandardMaterial {...M.hv} />
        </mesh>
      </group>
    ))}
    {/* Identification labels on the housing side. */}
    <Text position={[0.076, 0.79, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.011} color="#c8ced4">CCS2 INLET</Text>
    <Text position={[0.076, 0.772, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.007} color="#8b939b">AC 3~ 11 kW · DC 150 kW</Text>
  </group>;
}
