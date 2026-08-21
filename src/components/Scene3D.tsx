import { ClientOnly } from "@tanstack/react-router";
import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from "react";

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

class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("3D viewer failed to render", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-background px-6">
          <div className="max-w-sm text-center">
            <p className="font-medium text-foreground">The 3D viewer could not load.</p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-3 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function Scene3D() {
  return (
    <ClientOnly fallback={<ViewerFallback />}>
      <ViewerErrorBoundary>
        <Suspense fallback={<ViewerFallback />}>
          <Scene3DViewer />
        </Suspense>
      </ViewerErrorBoundary>
    </ClientOnly>
  );
}
