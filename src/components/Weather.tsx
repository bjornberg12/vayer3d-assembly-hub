import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export interface WeatherState {
  active: boolean;
  rain: boolean;
  wind: boolean;
  night: boolean;
  windSpeed: number; // m/s
  temperature: number; // °C (air temperature)
}

export const DEFAULT_WEATHER: WeatherState = {
  active: false,
  rain: false,
  wind: false,
  night: false,
  windSpeed: 5,
  temperature: 12,
};

/**
 * Wind chill (JAG/TI, Environment Canada formula), valid for T <= 10 °C and
 * v >= 1.34 m/s. Outside that range the felt temperature equals the air
 * temperature, so the value stays physically sensible for warm/still weather.
 */
export function feelsLike(tempC: number, windSpeedMs: number): number {
  const kmh = windSpeedMs * 3.6;
  if (tempC > 10 || kmh < 4.8) return tempC;
  const v = Math.pow(kmh, 0.16);
  return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v;
}

const AREA = 40;
const HEIGHT = 26;

function Rain({ windSpeed, night }: { windSpeed: number; night: boolean }) {
  const count = 4000;
  const ref = useRef<THREE.Points>(null);
  const speeds = useRef<Float32Array>(new Float32Array(count));

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA * 2;
      positions[i * 3 + 1] = Math.random() * HEIGHT;
      positions[i * 3 + 2] = (Math.random() - 0.5) * AREA * 2;
      speeds.current[i] = 8 + Math.random() * 8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const d = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const iy = i * 3 + 1;
      arr[iy] -= speeds.current[i] * d;
      // Wind drags the droplets sideways as they fall.
      arr[i * 3] += windSpeed * 0.35 * d;
      if (arr[iy] < 0) {
        arr[iy] = HEIGHT;
        arr[i * 3] = (Math.random() - 0.5) * AREA * 2;
        arr[i * 3 + 2] = (Math.random() - 0.5) * AREA * 2;
      }
      if (arr[i * 3] > AREA) arr[i * 3] -= AREA * 2;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.07}
        color={night ? "#9fc4e8" : "#5f7d99"}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function WindParticles({
  windSpeed,
  night,
}: {
  windSpeed: number;
  night: boolean;
}) {
  const count = 900;
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA * 2;
      positions[i * 3 + 1] = Math.random() * 14 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * AREA * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((state, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const d = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += windSpeed * d;
      arr[i * 3 + 1] += Math.sin(t * 1.5 + i) * 0.15 * d * windSpeed;
      if (arr[i * 3] > AREA) {
        arr[i * 3] = -AREA;
        arr[i * 3 + 1] = Math.random() * 14 + 0.2;
        arr[i * 3 + 2] = (Math.random() - 0.5) * AREA * 2;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.12}
        color={night ? "#cbd5e1" : "#ffffff"}
        transparent
        opacity={Math.min(0.15 + windSpeed * 0.02, 0.6)}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function WeatherEffects({ weather }: { weather: WeatherState }) {
  if (!weather.active) return null;
  return (
    <>
      {weather.rain && (
        <Rain windSpeed={weather.wind ? weather.windSpeed : 0} night={weather.night} />
      )}
      {weather.wind && (
        <WindParticles windSpeed={Math.max(weather.windSpeed, 0.5)} night={weather.night} />
      )}
      {weather.night && <fog attach="fog" args={["#0b1020", 25, 130]} />}
    </>
  );
}
