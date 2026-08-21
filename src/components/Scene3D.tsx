import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// three.js / @react-three/fiber need a real browser (WebGL, canvas, window),
// so the viewer module must never be evaluated during SSR. React.lazy keeps the
// import out of the server graph; ClientOnly keeps it out of the server render.
const Scene3DViewer = lazy(() => import("./Scene3DViewer"));

function ViewerFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading 3D viewer…</p>
    </div>
  );
}

export function Scene3D() {
  return (
    <ClientOnly fallback={<ViewerFallback />}>
      <Suspense fallback={<ViewerFallback />}>
        <Scene3DViewer />
      </Suspense>
    </ClientOnly>
  );
}
