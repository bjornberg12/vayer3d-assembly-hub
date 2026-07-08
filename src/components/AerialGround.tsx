import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import aerial from "@/assets/aerial-parking.png.asset.json";

// Image is 771 x 548 px. Cars in the parking row measure roughly 35 px long
// against a real car length of ~4.5 m, giving ~0.13 m/px, i.e. the photo
// covers roughly 100 m x 71 m of ground. We use 95 m x 67.5 m so a real
// car in the picture reads at true scale against the 11 m tall mast.
const WIDTH_M = 95;
const HEIGHT_M = WIDTH_M * (548 / 771);

export function AerialGround() {
  const tex = useLoader(THREE.TextureLoader, aerial.url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[WIDTH_M, HEIGHT_M]} />
      <meshStandardMaterial
        map={tex}
        roughness={1}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}
