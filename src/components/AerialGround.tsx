import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import defaultAerial from "@/assets/aerial-parking.png.asset.json";

// The bundled aerial photo has a known real-world footprint (~95 m wide),
// calibrated so cars in the picture read at true scale next to the models.
export const DEFAULT_AERIAL_URL = defaultAerial.url;
export const DEFAULT_AERIAL_REAL_WIDTH_M = 95;

export function AerialGround({
  url = DEFAULT_AERIAL_URL,
  realWidthM,
}: {
  url?: string;
  /** Real-world width the image should cover, in meters. Height is derived
   *  from the image's natural aspect ratio. Defaults to the known real width
   *  when using the bundled aerial, otherwise 30 m. */
  realWidthM?: number;
}) {
  const tex = useLoader(THREE.TextureLoader, url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const [w, h] = useMemo(() => {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const iw = img?.width ?? 1;
    const ih = img?.height ?? 1;
    const aspect = iw / ih;
    const width =
      realWidthM ??
      (url === DEFAULT_AERIAL_URL ? DEFAULT_AERIAL_REAL_WIDTH_M : 30);
    return [width, width / aspect];
  }, [tex, realWidthM, url]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        map={tex}
        roughness={1}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}
