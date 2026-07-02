import { createContext, useContext, type ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Ctx = {
  setLabel: (name: string | null) => void;
  enabled: boolean;
};

const PartLabelCtx = createContext<Ctx>({ setLabel: () => {}, enabled: true });

export function PartLabelProvider({
  setLabel,
  enabled,
  children,
}: {
  setLabel: (name: string | null) => void;
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <PartLabelCtx.Provider value={{ setLabel, enabled }}>
      {children}
    </PartLabelCtx.Provider>
  );
}

/**
 * Wraps a 3D part so clicking any mesh inside surfaces its name.
 * Uses R3F event bubbling: innermost Part wins via stopPropagation.
 */
export function Part({
  name,
  position,
  children,
}: {
  name: string;
  position?: [number, number, number];
  children: ReactNode;
}) {
  const { setLabel, enabled } = useContext(PartLabelCtx);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    setLabel(name);
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (!enabled) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {children}
    </group>
  );
}
