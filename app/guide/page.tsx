import type { Metadata } from "next";
import {
  AlertTriangle,
  Download,
  FileBox,
  Layers3,
  Ruler,
  Settings2,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Guide — Print Stacker",
  description:
    "How to use Print Stacker: upload an STL, configure the stack, and download a 3MF.",
};

const steps = [
  {
    icon: Upload,
    title: "Upload your STL",
    description:
      "Drop a file or click to browse. Binary and ASCII STL both work. The preview updates as soon as the mesh is parsed.",
  },
  {
    icon: Settings2,
    title: "Set nozzle and layer height",
    description:
      "Pick a nozzle size and a matching Bambu layer-height preset. Changing the nozzle resets the layer height to that nozzle's standard value.",
  },
  {
    icon: FileBox,
    title: "Choose your slicer format",
    description:
      "Bambu Studio writes a full project with layer height and ironing. Generic 3MF is the stacked mesh only — configure the rest in your slicer.",
  },
  {
    icon: Layers3,
    title: "Configure the stack",
    description:
      "Set copies high (2–20) and gap layers (1–3). Gap layers multiply your layer height, keeping separation on whole layers for clean ironing.",
  },
  {
    icon: Download,
    title: "Download the 3MF",
    description:
      "The file is named {part}_{count}high.3mf. Open it in your slicer, verify the stack, slice, and print.",
  },
] as const;

const formulas = [
  {
    label: "Gap",
    formula: "layer height × gap layers",
    example: "0.20 mm × 1 = 0.20 mm gap",
  },
  {
    label: "Step",
    formula: "part height + gap",
    example: "Copy n starts at n × step from the plate",
  },
  {
    label: "Total height",
    formula: "copies × part height + (copies − 1) × gap",
    example: "Used for the status bar and Z-limit warning",
  },
] as const;

export default function GuidePage() {
  return (
    <SiteShell>
      <div className="grid gap-14">
        <section className="grid max-w-2xl gap-4">
          <Badge variant="secondary" className="w-fit">
            Documentation
          </Badge>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            How to use Print Stacker
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            From a single STL to a vertically stacked 3MF ready for your slicer.
            Everything runs in the browser — nothing is uploaded.
          </p>
          <Button asChild className="w-fit">
            <Link href="/">Open the tool</Link>
          </Button>
        </section>

        <section className="grid gap-5">
          <div className="grid gap-1">
            <h2 className="text-lg font-medium tracking-tight">Workflow</h2>
            <p className="text-sm text-muted-foreground">
              Five steps from upload to download.
            </p>
          </div>

          <div className="grid gap-3">
            {steps.map((step, index) => (
              <Card
                key={step.title}
                size="sm"
                className="bg-card/60 backdrop-blur-sm transition-colors hover:bg-card/80"
              >
                <CardHeader className="grid grid-cols-[auto_1fr] items-start gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <step.icon className="size-4 text-primary" />
                      <CardTitle>{step.title}</CardTitle>
                    </div>
                    <CardDescription className="leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ruler className="size-4 text-primary" />
                <CardTitle>Status bar</CardTitle>
              </div>
              <CardDescription>
                Live measurements while you tune the stack.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>
                The bar below the preview shows part height, gap size, copy count,
                and total stack height in millimeters.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  Above 250 mm total height, a badge warns the stack may exceed a
                  Bambu printer Z limit.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Saved settings</CardTitle>
              <CardDescription>
                Your choices persist in the browser between visits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {[
                  "Nozzle and layer height",
                  "Slicer format",
                  "Copy count and gap layers",
                  "Preview color",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5">
          <div className="grid gap-1">
            <h2 className="text-lg font-medium tracking-tight">
              How the stack is built
            </h2>
            <p className="text-sm text-muted-foreground">
              Heights are in millimeters. The part is centered on a 256 mm plate.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {formulas.map((item) => (
              <Card key={item.label} size="sm" className="bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm">{item.label}</CardTitle>
                  <CardDescription className="font-mono text-xs text-foreground/80">
                    {item.formula}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.example}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Layer heights follow the usual Bambu presets for 0.2, 0.4, 0.6, and
            0.8 mm nozzles. Defaults are 0.08, 0.20, 0.24, and 0.24 mm.
          </p>
        </section>

        <Separator />

        <section className="grid gap-5">
          <div className="grid gap-1">
            <h2 className="text-lg font-medium tracking-tight">
              What the 3MF contains
            </h2>
            <p className="text-sm text-muted-foreground">
              Two export modes for different slicers.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <Badge className="mb-2 w-fit">Recommended for Bambu</Badge>
                <CardTitle>Bambu Studio</CardTitle>
                <CardDescription>
                  A project file the slicer opens with the stack already placed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {[
                    "One mesh with one build item per copy",
                    "Plate and assemble metadata for each instance",
                    "Layer height and initial layer height preset",
                    "Top ironing enabled",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <Badge variant="outline" className="mb-2 w-fit">
                  Universal
                </Badge>
                <CardTitle>Generic 3MF</CardTitle>
                <CardDescription>
                  Core 3MF model without Bambu project settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {[
                    "Same stacked mesh geometry",
                    "No Bambu-specific metadata",
                    "Open in any slicer that reads 3MF",
                    "Set layer height and ironing yourself",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
