import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import defaultAerial from "@/assets/aerial-parking.png.asset.json";

// The bundled aerial photo has a known real-world footprint (~95 m wide).
// For custom uploads we don't know the ground scale, so we fit the image to
// the active scene's footprint while preserving its natural aspect ratio.
const DEFAULT_URL = defaultAerial.url;
const DEFAULT_REAL_WIDTH_M = 95;
const DEFAULT_REAL_HEIGHT_M = DEFAULT_REAL_WIDTH_M * (548 / 771);

export function AerialGround({
  url = DEFAULT_URL,
  fitSizeM,
}: {
  url?: string;
  /** Scene footprint (meters). If provided, image is scaled to fit while
   *  preserving aspect ratio. If omitted and using the default image, uses
   *  its known real-world size. */
  fitSizeM?: number;
}) {
  const tex = useLoader(THREE.TextureLoader, url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const [w, h] = useMemo(() => {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const iw = img?.width ?? 1;
    const ih = img?.height ?? 1;
    const aspect = iw / ih;

    if (fitSizeM) {
      // Fit image inside a fitSizeM x fitSizeM square, preserve aspect.
      if (aspect >= 1) return [fitSizeM, fitSizeM / aspect];
      return [fitSizeM * aspect, fitSizeM];
    }
    if (url === DEFAULT_URL) {
      return [DEFAULT_REAL_WIDTH_M, DEFAULT_REAL_HEIGHT_M];
    }
    // Fallback: 20 m longest side.
    if (aspect >= 1) return [20, 20 / aspect];
    return [20 * aspect, 20];
  }, [tex, fitSizeM, url]);

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
