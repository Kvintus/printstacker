"use client";

import { Minus, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

import { ColorPicker } from "@/components/color-picker";
import { LogoMark } from "@/components/logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  findPreset,
  isNozzleId,
  LAYER_PRESETS,
  nozzleFromId,
  nozzleLabel,
  NOZZLES,
  presetLabel,
  presetValue,
  STANDARD_LAYER_HEIGHT,
  type Nozzle,
} from "@/lib/presets";
import {
  getPrintSettingsServerSnapshot,
  getPrintSettingsSnapshot,
  subscribePrintSettings,
  updatePrintSettings,
} from "@/lib/settings";
import {
  layoutStack,
  MAX_GAP_LAYERS,
  MAX_STACK_COUNT,
  MIN_GAP_LAYERS,
  MIN_STACK_COUNT,
  Z_LIMIT_MM,
} from "@/lib/stack";
import { parseStl, type TriangleMesh } from "@/lib/stl";
import {
  build3mf,
  isSlicerId,
  slicerFromId,
  slicerLabel,
  SLICER_IDS,
  stackDownloadName,
  type Slicer,
} from "@/lib/threemf";

const StackPreview = dynamic(
  () => import("@/components/stack-preview").then((mod) => mod.StackPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading preview
      </div>
    ),
  },
);

type LoadedModel = {
  filename: string;
  mesh: TriangleMesh;
};

function formatMm(value: number): string {
  return value.toFixed(2);
}

function commitInteger(text: string, min: number, max: number, fallback: number): number {
  const parsed = Number(text);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function IntegerStepper({
  id,
  value,
  min,
  max,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (next: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [trackedValue, setTrackedValue] = useState(value);
  if (value !== trackedValue) {
    setTrackedValue(value);
    setText(String(value));
  }

  function commit(next: number) {
    onChange(next);
    setText(String(next));
  }

  return (
    <div className="flex h-8 items-center rounded-lg border border-input bg-input/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-muted-foreground"
        disabled={value <= min}
        aria-label={decreaseLabel}
        onClick={() => commit(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <Input
        id={id}
        inputMode="numeric"
        value={text}
        className="h-8 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 text-center font-mono shadow-none focus-visible:ring-0 dark:bg-transparent"
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);
          const parsed = Number(nextText);
          if (Number.isInteger(parsed) && parsed >= min && parsed <= max) {
            onChange(parsed);
          }
        }}
        onBlur={() => commit(commitInteger(text, min, max, value))}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-muted-foreground"
        disabled={value >= max}
        aria-label={increaseLabel}
        onClick={() => commit(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}

export default function HomePage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<LoadedModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const settings = useSyncExternalStore(
    subscribePrintSettings,
    getPrintSettingsSnapshot,
    getPrintSettingsServerSnapshot,
  );
  const { nozzle, layerHeight, slicer, count, gapLayers, color } = settings;

  const preset = findPreset(nozzle, layerHeight);
  const layout = useMemo(() => {
    if (!loaded) {
      return null;
    }
    return layoutStack(loaded.mesh.bounds, count, layerHeight, gapLayers);
  }, [loaded, count, layerHeight, gapLayers]);

  const downloadName = loaded ? stackDownloadName(loaded.filename, count) : null;
  const overZLimit = layout !== null && layout.totalHeight > Z_LIMIT_MM;

  async function loadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".stl")) {
      setError("Choose an STL file.");
      return;
    }
    try {
      const mesh = parseStl(await file.arrayBuffer());
      setLoaded({ filename: file.name, mesh });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read that STL.");
    }
  }

  function download() {
    if (!loaded || !downloadName) {
      return;
    }
    const bytes = build3mf({
      mesh: loaded.mesh,
      filename: loaded.filename,
      count,
      gapLayers,
      nozzle,
      preset,
      slicer,
    });
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const url = URL.createObjectURL(new Blob([copy], { type: "model/3mf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="flex h-full min-h-0 bg-background text-foreground"
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        setDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files[0];
        if (file) {
          void loadFile(file);
        }
      }}
    >
      <aside className="flex h-full w-80 shrink-0 flex-col border-r border-border">
        <div className="flex h-12 items-center px-3">
          <h1 className="flex items-center gap-2 text-sm font-medium tracking-tight">
            <LogoMark className="size-4 shrink-0" />
            Print Stacker
          </h1>
        </div>
        <Separator />
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle>File</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className={`rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground transition-colors hover:bg-muted/40 ${
                  dragOver ? "border-foreground bg-muted/50" : "border-border"
                }`}
              >
                Drop an STL or click to browse
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".stl,model/stl"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void loadFile(file);
                  }
                  event.target.value = "";
                }}
              />
              {loaded ? (
                <p className="truncate font-mono text-xs">{loaded.filename}</p>
              ) : null}
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Process</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Nozzle</Label>
                <Select
                  value={nozzle.toFixed(1)}
                  onValueChange={(value) => {
                    if (!isNozzleId(value)) {
                      return;
                    }
                    const next = nozzleFromId(value);
                    updatePrintSettings({
                      nozzle: next,
                      layerHeight: STANDARD_LAYER_HEIGHT[next],
                    });
                  }}
                >
                  <SelectTrigger className="w-full font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {NOZZLES.map((option) => (
                      <SelectItem key={option} value={option.toFixed(1)}>
                        {nozzleLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Layer height</Label>
                <Select
                  value={presetValue(preset)}
                  onValueChange={(value) => {
                    const next = LAYER_PRESETS[nozzle].find(
                      (candidate) => presetValue(candidate) === value,
                    );
                    if (next) {
                      updatePrintSettings({ layerHeight: next.layerHeight });
                    }
                  }}
                >
                  <SelectTrigger className="w-full font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {LAYER_PRESETS[nozzle].map((option) => (
                      <SelectItem key={presetValue(option)} value={presetValue(option)}>
                        {presetLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Slicer</Label>
                <Select
                  value={slicer}
                  onValueChange={(value) => {
                    if (!isSlicerId(value)) {
                      return;
                    }
                    updatePrintSettings({ slicer: slicerFromId(value) });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {SLICER_IDS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {slicerLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Stack</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="stack-count" className="text-xs text-muted-foreground">
                  Copies high
                </Label>
                <IntegerStepper
                  id="stack-count"
                  value={count}
                  min={MIN_STACK_COUNT}
                  max={MAX_STACK_COUNT}
                  decreaseLabel="Decrease copies"
                  increaseLabel="Increase copies"
                  onChange={(next) => updatePrintSettings({ count: next })}
                />
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="gap-layers" className="text-xs text-muted-foreground">
                    Gap layers
                  </Label>
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      className="text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2"
                    >
                      ?
                    </TooltipTrigger>
                    <TooltipContent>
                      Gap is layer height times gap layers, so copies stay on whole
                      layers.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <IntegerStepper
                  id="gap-layers"
                  value={gapLayers}
                  min={MIN_GAP_LAYERS}
                  max={MAX_GAP_LAYERS}
                  decreaseLabel="Decrease gap layers"
                  increaseLabel="Increase gap layers"
                  onChange={(next) => updatePrintSettings({ gapLayers: next })}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="preview-color" className="text-xs text-muted-foreground">
                  Color
                </Label>
                <ColorPicker
                  id="preview-color"
                  value={color}
                  onChange={(next) => updatePrintSettings({ color: next })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border-t border-border p-3">
          {downloadName ? (
            <p className="mb-2 truncate font-mono text-[11px] text-muted-foreground">
              {downloadName}
            </p>
          ) : null}
          <Button className="w-full" disabled={!loaded} onClick={download}>
            Download 3MF
          </Button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div
          className={`relative min-h-0 flex-1 border-b border-border ${
            dragOver ? "outline outline-1 outline-foreground" : ""
          }`}
        >
          {loaded && layout ? (
            <StackPreview mesh={loaded.mesh} layout={layout} color={color} />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-950 text-sm text-muted-foreground">
              Drop an STL
            </div>
          )}
        </div>
        <div className="flex h-10 shrink-0 items-center gap-3 px-3 font-mono text-[11px] text-muted-foreground">
          <span>Part {layout ? `${formatMm(layout.partHeight)} mm` : "—"}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Gap {layout ? `${formatMm(layout.gap)} mm` : "—"}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Copies {count}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Stack {layout ? `${formatMm(layout.totalHeight)} mm` : "—"}</span>
          {overZLimit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive">May exceed Bambu Z limit</Badge>
              </TooltipTrigger>
              <TooltipContent>
                Total height is above {Z_LIMIT_MM} mm and may exceed a Bambu printer Z
                limit.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </section>
    </div>
  );
}
