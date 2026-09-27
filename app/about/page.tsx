import type { Metadata } from "next";
import {
  ArrowUpRight,
  Box,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { StackDiagram } from "@/components/stack-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About — Print Stacker",
  description:
    "What Print Stacker is, where the idea came from, and why vertical stack printing works.",
};

const features = [
  {
    icon: Shield,
    title: "Runs in your browser",
    description:
      "STL parsing, 3D preview, and 3MF packaging happen locally. Your files never leave the device.",
  },
  {
    icon: Layers,
    title: "Layer-aligned gaps",
    description:
      "Gap spacing snaps to whole layer heights so each copy can be ironed before the next one starts.",
  },
  {
    icon: Sparkles,
    title: "Live preview",
    description:
      "Rotate the stack, inspect gap layers in accent color, and check total height before you download.",
  },
  {
    icon: Zap,
    title: "Slicer-ready output",
    description:
      "Export a Bambu Studio project with presets baked in, or a generic 3MF for any slicer.",
  },
] as const;

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="grid gap-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="grid gap-5">
            <Badge variant="secondary" className="w-fit">
              Browser-based stack printing
            </Badge>
            <div className="grid gap-3">
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
                Stack copies vertically.
                <span className="block text-primary">Print once, pull apart.</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                Print Stacker takes one STL and builds a stacked 3MF with every copy
                placed on the build plate and a thin gap between them — so you can
                batch-print identical parts in a single job.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/">Open the tool</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/guide">Read the guide</Link>
              </Button>
            </div>
          </div>

          <StackDiagram copies={4} className="mx-auto w-full max-w-xs lg:max-w-none" />
        </section>

        <section className="grid gap-5">
          <div className="grid gap-1">
            <h2 className="text-lg font-medium tracking-tight">Built for makers</h2>
            <p className="text-sm text-muted-foreground">
              A focused workflow from STL upload to downloadable 3MF.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} size="sm" className="bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-1 flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <feature.icon className="size-4" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <div className="grid gap-1">
            <h2 className="text-lg font-medium tracking-tight">Where it started</h2>
            <p className="text-sm text-muted-foreground">
              Print Stacker is a community tool inspired by an existing stacking workflow.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <CardTitle>MultiStack</CardTitle>
                    <CardDescription>
                      The original browser utility this project builds on.
                    </CardDescription>
                  </div>
                  <Box className="size-5 shrink-0 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <a
                    href="https://github.com/mrj0ne5CTHS/MultiStack"
                    className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    MultiStack
                  </a>{" "}
                  by mrj0ne5CTHS stacks{" "}
                  <a
                    href="https://www.multiboard.io/"
                    className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    MultiBoard
                  </a>{" "}
                  tiles into a Bambu Studio project: one mesh, many instances, and a
                  fixed 0.20 mm gap so copies pull apart after printing.
                </p>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <a
                    href="https://github.com/mrj0ne5CTHS/MultiStack"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View MultiStack
                    <ArrowUpRight data-icon="inline-end" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <CardTitle>What we added</CardTitle>
                    <CardDescription>
                      Same core idea, opened up for any part.
                    </CardDescription>
                  </div>
                  <Sparkles className="size-5 shrink-0 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Print Stacker generalizes the workflow: any STL, configurable gap
                  layers (1–3), Bambu nozzle presets, a live 3D preview, and both
                  Bambu Studio and generic 3MF exports.
                </p>
                <p>
                  MultiBuild (designed by Jonathan Odom) is the modular wall system
                  MultiStack was built for. Print Stacker is not affiliated with or
                  endorsed by MultiStack or MultiBuild.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-2">
              <h2 className="text-lg font-medium tracking-tight">Ready to stack?</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Drop an STL, tune your stack, and download a slicer-ready 3MF in
                seconds. The full walkthrough lives in the guide.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/guide">Open the guide</Link>
            </Button>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
