/**
 * Visualises current in a wire: blue electrons drift opposite to conventional
 * current, amber arrows show the electric-field direction (E points + → −).
 * AC wires oscillate back and forth at a slowed-down mains frequency.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ElectronFlow({
  curve,
  current,
  dir,
  ac,
  phaseDeg,
  radius,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  current: number;
  dir: number;
  ac: boolean;
  phaseDeg: number;
  radius: number;
}) {
  const length = curve.getLength();
  const count = Math.min(240, Math.max(8, Math.round(length * 24)));
  const arrows = Math.min(40, Math.max(2, Math.round(length * 3)));
  const eRef = useRef<THREE.InstancedMesh>(null);
  const aRef = useRef<THREE.InstancedMesh>(null);
  const offset = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ t: i / count, a: Math.random() * Math.PI * 2, r: Math.random() })), [count]);
  // Visual drift speed (m/s): grows logarithmically with current so tiny and huge currents stay readable.
  const speed = current > 0 && Number.isFinite(current) ? Math.min(0.15 + Math.log10(1 + current) * 0.35, 2.5) : 0;
  const up = new THREE.Vector3(0, 1, 0);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    // Electrons move opposite to conventional current.
    const v = ac ? Math.cos(t * Math.PI * 2 * 0.5 + (phaseDeg * Math.PI) / 180) : 1;
    offset.current += (-dir * v * speed * dt) / Math.max(length, 0.01);
    const e = eRef.current;
    if (e) {
      seeds.forEach((s, i) => {
        const u = (((s.t + offset.current) % 1) + 1) % 1;
        const p = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        const side = new THREE.Vector3().crossVectors(tan, up);
        if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
        side.normalize();
        const vert = new THREE.Vector3().crossVectors(side, tan).normalize();
        const rr = radius * 0.6 * s.r;
        dummy.position.copy(p).addScaledVector(side, Math.cos(s.a + t * 3) * rr).addScaledVector(vert, Math.sin(s.a + t * 3) * rr);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        e.setMatrixAt(i, dummy.matrix);
      });
      e.instanceMatrix.needsUpdate = true;
    }
    const a = aRef.current;
    if (a) {
      const fieldDir = dir * (ac ? Math.sign(v) || 1 : 1);
      const strength = ac ? Math.abs(v) : 1;
      for (let i = 0; i < arrows; i++) {
        const u = (i + 0.5) / arrows;
        const p = curve.getPointAt(u);
        const tan = curve.getTangentAt(u).multiplyScalar(fieldDir);
        dummy.position.copy(p);
        dummy.quaternion.setFromUnitVectors(up, tan);
        dummy.scale.setScalar(0.3 + 0.7 * strength);
        dummy.updateMatrix();
        a.setMatrixAt(i, dummy.matrix);
      }
      a.instanceMatrix.needsUpdate = true;
    }
  });

  if (speed === 0) return null;
  const er = Math.max(radius * 0.35, 0.002);
  return (
    <group raycast={() => null}>
      <instancedMesh ref={eRef} args={[undefined, undefined, count]} raycast={() => null}>
        <sphereGeometry args={[er, 8, 6]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={aRef} args={[undefined, undefined, arrows]} raycast={() => null}>
        <coneGeometry args={[radius * 1.6, radius * 4, 8]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.75} depthTest={false} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
