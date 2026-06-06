import { createFileRoute } from "@tanstack/react-router";
import { Scene3D } from "@/components/Scene3D";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vayer3d Electrical Assembly" },
      {
        name: "description",
        content:
          "Interactive 3D viewer for electrical infrastructure models and step-by-step assembly instructions.",
      },
      { property: "og:title", content: "Vayer3d Electrical Assembly" },
      {
        property: "og:description",
        content:
          "Interactive 3D viewer for electrical infrastructure models and step-by-step assembly instructions.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Vayer3d electrical assembly
        </h1>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          3D Viewer
        </span>
      </header>
      <main className="relative flex-1">
        <Scene3D />
      </main>
    </div>
  );
}
