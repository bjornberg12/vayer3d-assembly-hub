import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

/** User-uploaded ground image, scaled to a chosen real-world width. */
export function AerialGround({
  url,
  realWidthM,
}: {
  url: string;
  /** Real-world width in meters; height follows the image aspect ratio. */
  realWidthM?: number;
}) {
  const tex = useLoader(THREE.TextureLoader, url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const [w, h] = useMemo(() => {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const aspect = (img?.width ?? 1) / (img?.height ?? 1);
    const width = realWidthM ?? 30;
    return [width, width / aspect];
  }, [tex, realWidthM]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} roughness={1} transparent opacity={0.95} />
    </mesh>
  );
}
