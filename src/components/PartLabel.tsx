import { createContext, useContext, type ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Ctx = {
  setLabel: (name: string | null, position?: [number, number, number] | null) => void;
  openProperties?: (name: string, ownerId?: string | null) => void;
  enabled: boolean;
};

const PartLabelCtx = createContext<Ctx>({ setLabel: () => {}, enabled: true });

/** Identifies which placed object a part belongs to (null = fixed scene model). */
const PartOwnerCtx = createContext<string | null>(null);

export function PartOwner({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return <PartOwnerCtx.Provider value={id}>{children}</PartOwnerCtx.Provider>;
}

export function PartLabelProvider({
  setLabel,
  openProperties,
  enabled,
  children,
}: {
  setLabel: (name: string | null, position?: [number, number, number] | null) => void;
  openProperties?: (name: string, ownerId?: string | null) => void;
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <PartLabelCtx.Provider value={{ setLabel, openProperties, enabled }}>
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
  const { setLabel, openProperties, enabled } = useContext(PartLabelCtx);
  const ownerId = useContext(PartOwnerCtx);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    // Ctrl / Cmd + left click opens the properties panel instead of the label.
    if (e.ctrlKey || e.metaKey) {
      openProperties?.(name, ownerId);
      return;
    }
    setLabel(name, e.point.toArray() as [number, number, number]);
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    e.nativeEvent?.preventDefault?.();
    openProperties?.(name, ownerId);
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
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
