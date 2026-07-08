import { useMemo } from "react";
import * as THREE from "three";
import { Part } from "./PartLabel";

/**
 * Topographical model of the Astangu street area used as the Substation scene site.
 * Layout is oriented with the road running along +X.
 *
 *   -Z (north)  buildings / parking lot
 *   -----------------------------------------
 *   sidewalk
 *   grass verge
 *   road lane 1  ->
 *   painted centerline
 *   road lane 2  <-
 *   grass verge
 *   sidewalk / bike path
 *   -----------------------------------------
 *   +Z (south)  grass, trees
 *
 * Units are meters. Ground is gently undulating using a sum-of-sines heightfield
 * to suggest topography without needing real elevation data.
 */

// ---------- terrain ----------

const TERRAIN_SIZE = 60;
const TERRAIN_SEG = 120;

function terrainHeight(x: number, z: number) {
  // gentle rolling ground, flattened around the road corridor
  const base =
    Math.sin(x * 0.12) * 0.25 +
    Math.cos(z * 0.18) * 0.2 +
    Math.sin((x + z) * 0.07) * 0.35;
  // flatten the road corridor (|z| < 5) so the asphalt sits flat
  const corridor = Math.exp(-(z * z) / 18); // ~1 at z=0, ~0 far away
  return base * (1 - corridor * 0.9);
}

function Terrain() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEG, TERRAIN_SEG);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, terrainHeight(x, z));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <Part name="Grass terrain">
      <mesh geometry={geom} receiveShadow castShadow>
        <meshStandardMaterial color="#6b8f4a" roughness={1} />
      </mesh>
    </Part>
  );
}

// ---------- road ----------

const ROAD_LENGTH = 60;
const LANE_WIDTH = 3.25;
const ROAD_WIDTH = LANE_WIDTH * 2; // 6.5 m two-lane
const SHOULDER = 0.25;

function Road() {
  return (
    <Part name="Asphalt road" position={[0, 0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH + SHOULDER * 2]} />
        <meshStandardMaterial color="#3a3a3c" roughness={0.95} />
      </mesh>
    </Part>
  );
}

function RoadMarkings() {
  // dashed centerline
  const dashes = useMemo(() => {
    const arr: number[] = [];
    const dashLen = 2;
    const gap = 3;
    const step = dashLen + gap;
    for (let x = -ROAD_LENGTH / 2 + 1; x < ROAD_LENGTH / 2; x += step) {
      arr.push(x + dashLen / 2);
    }
    return arr;
  }, []);

  // solid edge lines
  return (
    <Part name="Road markings" position={[0, 0.03, 0]}>
      <group>
        {dashes.map((x, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]}>
            <planeGeometry args={[2, 0.12]} />
            <meshStandardMaterial color="#f2efe4" roughness={0.6} />
          </mesh>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ROAD_WIDTH / 2 - 0.05]}>
          <planeGeometry args={[ROAD_LENGTH, 0.1]} />
          <meshStandardMaterial color="#f2efe4" roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -ROAD_WIDTH / 2 + 0.05]}>
          <planeGeometry args={[ROAD_LENGTH, 0.1]} />
          <meshStandardMaterial color="#f2efe4" roughness={0.6} />
        </mesh>
      </group>
    </Part>
  );
}

// ---------- verges & sidewalks ----------

const VERGE_WIDTH = 2.0;
const SIDEWALK_WIDTH = 1.8;
const CURB_HEIGHT = 0.12;

function Verge({ z }: { z: number }) {
  return (
    <Part name="Grass verge" position={[0, 0.025, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_LENGTH, VERGE_WIDTH]} />
        <meshStandardMaterial color="#7ea058" roughness={1} />
      </mesh>
    </Part>
  );
}

function Sidewalk({ z, name }: { z: number; name: string }) {
  return (
    <Part name={name} position={[0, CURB_HEIGHT / 2 + 0.02, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[ROAD_LENGTH, CURB_HEIGHT, SIDEWALK_WIDTH]} />
        <meshStandardMaterial color="#b5b1a8" roughness={0.9} />
      </mesh>
    </Part>
  );
}

// ---------- buildings ----------

type BuildingSpec = {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
};

const BUILDINGS: BuildingSpec[] = [
  // large warehouse / hall to the north (from map)
  { name: "Warehouse", position: [-15, 0, -14], size: [18, 4.5, 8], color: "#c9c4b8" },
  { name: "Building 31", position: [10, 0, -14], size: [16, 5, 9], color: "#d2ccbe" },
  // smaller building south-west (from map)
  { name: "Small building", position: [-22, 0, 14], size: [5, 3, 4], color: "#c2beb2" },
];

function Building({ spec }: { spec: BuildingSpec }) {
  const [w, h, d] = spec.size;
  return (
    <Part name={spec.name} position={[spec.position[0], h / 2, spec.position[2]]}>
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={spec.color ?? "#cfcac0"} roughness={0.9} />
        </mesh>
        {/* flat roof cap slightly darker */}
        <mesh position={[0, h / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#8a867d" roughness={1} />
        </mesh>
      </group>
    </Part>
  );
}

// ---------- parking lot (north side) ----------

function ParkingLot() {
  const stripes = useMemo(() => {
    const arr: number[] = [];
    for (let x = -30; x <= -6; x += 2.4) arr.push(x);
    return arr;
  }, []);
  return (
    <Part name="Parking lot" position={[-18, 0.02, -7]}>
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[26, 5]} />
          <meshStandardMaterial color="#4a4a4c" roughness={0.95} />
        </mesh>
        {stripes.map((x, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x + 18, 0.005, 0]}
          >
            <planeGeometry args={[0.08, 4.6]} />
            <meshStandardMaterial color="#f2efe4" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </Part>
  );
}

// ---------- trees ----------

function Tree({ position }: { position: [number, number, number] }) {
  const y = terrainHeight(position[0], position[2]);
  return (
    <Part name="Tree" position={[position[0], y, position[2]]}>
      <group>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 2.2, 8]} />
          <meshStandardMaterial color="#6b4a2a" roughness={1} />
        </mesh>
        <mesh position={[0, 2.8, 0]} castShadow>
          <sphereGeometry args={[1.2, 12, 12]} />
          <meshStandardMaterial color="#3f6b32" roughness={1} />
        </mesh>
        <mesh position={[0.4, 3.3, 0.2]} castShadow>
          <sphereGeometry args={[0.8, 10, 10]} />
          <meshStandardMaterial color="#4b7a3b" roughness={1} />
        </mesh>
      </group>
    </Part>
  );
}

const TREE_POSITIONS: [number, number, number][] = [
  [24, 0, 8], [26, 0, 13], [22, 0, 18], [18, 0, 10],
  [14, 0, 15], [8, 0, 19], [2, 0, 12], [-4, 0, 17],
  [-10, 0, 11], [-16, 0, 16], [-22, 0, 19], [-26, 0, 12],
  // north side scattered
  [-28, 0, -20], [24, 0, -19], [16, 0, -22],
];

// ---------- contour lines (topographic reference) ----------

function ContourLines() {
  // Sample the heightfield and draw thin lines at fixed elevations.
  const lines = useMemo(() => {
    const levels = [-0.4, -0.2, 0.2, 0.4, 0.6];
    const size = TERRAIN_SIZE;
    const seg = 80;
    const step = size / seg;
    const segments: THREE.Vector3[] = [];
    for (const lvl of levels) {
      for (let i = 0; i < seg; i++) {
        for (let j = 0; j < seg; j++) {
          const x0 = -size / 2 + i * step;
          const z0 = -size / 2 + j * step;
          const x1 = x0 + step;
          const z1 = z0 + step;
          const h00 = terrainHeight(x0, z0);
          const h10 = terrainHeight(x1, z0);
          const h01 = terrainHeight(x0, z1);
          const pts: THREE.Vector3[] = [];
          if ((h00 - lvl) * (h10 - lvl) < 0) {
            const t = (lvl - h00) / (h10 - h00);
            pts.push(new THREE.Vector3(x0 + t * step, lvl + 0.005, z0));
          }
          if ((h00 - lvl) * (h01 - lvl) < 0) {
            const t = (lvl - h00) / (h01 - h00);
            pts.push(new THREE.Vector3(x0, lvl + 0.005, z0 + t * step));
          }
          if (pts.length === 2) segments.push(pts[0], pts[1]);
        }
      }
    }
    return segments;
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(lines);
    return g;
  }, [lines]);

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color="#3d2a12" transparent opacity={0.35} />
    </lineSegments>
  );
}

// ---------- assembly ----------

export const SUBSTATION_STEPS = [
  "Site terrain",
  "Road corridor",
  "Sidewalks & verges",
  "Buildings & parking",
  "Vegetation",
];

export function Substation({ step }: { step: number }) {
  return (
    <group>
      {step >= 1 && (
        <>
          <Terrain />
          <ContourLines />
        </>
      )}
      {step >= 2 && (
        <>
          <Road />
          <RoadMarkings />
        </>
      )}
      {step >= 3 && (
        <>
          <Verge z={-(ROAD_WIDTH / 2 + SHOULDER + VERGE_WIDTH / 2)} />
          <Verge z={ROAD_WIDTH / 2 + SHOULDER + VERGE_WIDTH / 2} />
          <Sidewalk
            z={-(ROAD_WIDTH / 2 + SHOULDER + VERGE_WIDTH + SIDEWALK_WIDTH / 2)}
            name="North sidewalk"
          />
          <Sidewalk
            z={ROAD_WIDTH / 2 + SHOULDER + VERGE_WIDTH + SIDEWALK_WIDTH / 2}
            name="South bike path"
          />
        </>
      )}
      {step >= 4 && (
        <>
          {BUILDINGS.map((b) => (
            <Building key={b.name} spec={b} />
          ))}
          <ParkingLot />
        </>
      )}
      {step >= 5 && TREE_POSITIONS.map((p, i) => <Tree key={i} position={p} />)}
    </group>
  );
}
