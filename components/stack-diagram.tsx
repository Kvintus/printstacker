import { cn } from "@/lib/utils";

type StackDiagramProps = {
  copies?: number;
  className?: string;
};

export function StackDiagram({ copies = 3, className }: StackDiagramProps) {
  const layers = Array.from({ length: copies }, (_, index) => index);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex flex-col items-center justify-end gap-1.5 rounded-2xl border border-border/60 bg-card/40 p-6 ring-1 ring-foreground/5",
        className,
      )}
    >
      <div className="absolute inset-x-6 bottom-6 h-px bg-primary/40" />
      <div className="absolute inset-x-6 bottom-6 top-6 border-x border-dashed border-border/40" />

      {layers.map((layer) => (
        <div key={layer} className="relative w-full max-w-[10rem]">
          <div
            className="h-7 w-full rounded-md bg-linear-to-r from-zinc-100/90 to-zinc-300/70 shadow-sm ring-1 ring-white/10"
            style={{ opacity: 1 - layer * 0.12 }}
          />
          {layer < copies - 1 ? (
            <div className="mx-auto my-1 h-1 w-[85%] rounded-full bg-primary/70" />
          ) : null}
        </div>
      ))}

      <span className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Build plate
      </span>
    </div>
  );
}
