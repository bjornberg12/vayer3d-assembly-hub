import { useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const MATERIALS = {
  cast: { color: "#aab1b7", metalness: 0.65, roughness: 0.48 },
  lid: { color: "#d2d7db", metalness: 0.72, roughness: 0.32 },
  steel: { color: "#84929b", metalness: 0.82, roughness: 0.26 },
  seal: { color: "#24282b", metalness: 0.05, roughness: 0.85 },
  hv: { color: "#ed7625", metalness: 0.05, roughness: 0.42 },
};

/** Detailed liquid-cooled enclosure; wiring pins remain owned by EVComponents. */
export function TractionInverter() {
  const detail = useMemo(() => {
    const fins: THREE.BufferGeometry[] = [];
    const bolts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 13; i++) {
      const fin = new THREE.BoxGeometry(0.004, 0.068, 0.264);
      fin.translate(-0.322 + i * 0.0285, 0.62, 0);
      fins.push(fin);
    }
    for (const x of [-0.326, -0.21, -0.09, 0.026]) {
      for (const z of [-0.126, 0.126]) {
        const bolt = new THREE.CylinderGeometry(0.007, 0.007, 0.005, 6);
        bolt.translate(x, 0.714, z);
        bolts.push(bolt);
      }
    }
    const finMesh = mergeGeometries(fins);
    const boltMesh = mergeGeometries(bolts);
    [...fins, ...bolts].forEach((geometry) => geometry.dispose());
    return { finMesh, boltMesh };
  }, []);
  const label = useMemo(() => {
    // Data texture avoids browser-only canvas access and external font loading.
    const w = 128, h = 64;
    const pixels = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const warning = x < 44;
      const triangle = warning && y > 8 && y < 54 && Math.abs(x - 22) < (y - 8) * 0.42;
      const lightning = triangle && ((y > 22 && y < 35 && x > 20 && x < 25) || (y > 32 && y < 43 && x > 17 && x < 22));
      const bar = x > 54 && x < 118 && (y === 14 || y === 15 || y === 24 || y === 25 || (y > 39 && y < 51 && x % 5 < 2));
      const c = triangle && !lightning ? [249, 192, 35] : lightning || bar ? [25, 29, 32] : [224, 229, 231];
      const i = (y * w + x) * 4;
      pixels.set([...c, 255], i);
    }
    const texture = new THREE.DataTexture(pixels, w, h);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => {
    detail.finMesh?.dispose();
    detail.boltMesh?.dispose();
    label.dispose();
  }, [detail, label]);
  return (
    <group name="traction-inverter-housing">
      <RoundedBox args={[0.392, 0.12, 0.282]} radius={0.014} smoothness={3} position={[-0.15, 0.622, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...MATERIALS.cast} />
      </RoundedBox>
      {detail.finMesh && <mesh geometry={detail.finMesh} castShadow><meshStandardMaterial {...MATERIALS.cast} /></mesh>}
      <RoundedBox args={[0.4, 0.009, 0.294]} radius={0.008} smoothness={2} position={[-0.15, 0.69, 0]}>
        <meshStandardMaterial {...MATERIALS.seal} />
      </RoundedBox>
      <RoundedBox args={[0.398, 0.02, 0.292]} radius={0.009} smoothness={3} position={[-0.15, 0.705, 0]} castShadow>
        <meshStandardMaterial {...MATERIALS.lid} />
      </RoundedBox>
      {detail.boltMesh && <mesh geometry={detail.boltMesh}><meshStandardMaterial {...MATERIALS.steel} /></mesh>}
      {/* Sealed DC / three-phase connector bases directly below existing pins. */}
      {[-0.24, -0.1275].map((x, i) => (
        <RoundedBox key={x} args={[i === 0 ? 0.085 : 0.128, 0.02, 0.033]} radius={0.005} smoothness={2} position={[x, 0.716, 0]}>
          <meshStandardMaterial {...MATERIALS.hv} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.046, 0.017, 0.033]} radius={0.004} smoothness={2} position={[-0.2625, 0.718, 0.045]}>
        <meshStandardMaterial {...MATERIALS.seal} />
      </RoundedBox>
      {/* Coolant hose barbs, facing +Z, inside the original 0.4 × 0.3 footprint. */}
      {[-0.26, -0.07].map((x) => (
        <group key={x} position={[x, 0.611, 0.134]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh><cylinderGeometry args={[0.014, 0.014, 0.026, 16]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>
          {[-0.008, 0.004].map((y) => <mesh key={y} position={[0, y, 0]}><torusGeometry args={[0.014, 0.002, 6, 16]} /><meshStandardMaterial {...MATERIALS.steel} /></mesh>)}
        </group>
      ))}
      {[-0.32, 0.02].flatMap((x) => [-0.122, 0.122].map((z) => (
        <group key={`${x}-${z}`} position={[x, 0.554, z]}>
          <mesh castShadow><boxGeometry args={[0.049, 0.009, 0.045]} /><meshStandardMaterial {...MATERIALS.cast} /></mesh>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.004, 0.009, 12]} /><meshStandardMaterial {...MATERIALS.seal} side={THREE.DoubleSide} /></mesh>
        </group>
      )))}
      <mesh position={[-0.118, 0.7153, 0.083]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.098, 0.045]} />
        <meshStandardMaterial map={label} roughness={0.68} metalness={0.05} />
      </mesh>
    </group>
  );
}