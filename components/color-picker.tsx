"use client";

import { useRef, useState, type PointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Hsv = {
  h: number;
  s: number;
  v: number;
};

type ColorPickerProps = {
  id: string;
  value: string;
  onChange: (color: string) => void;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function channelByte(value: number): number {
  return Math.round(Math.min(255, Math.max(0, value)));
}

function rgbToHex(red: number, green: number, blue: number): string {
  const channel = (value: number) => channelByte(value).toString(16).padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const digits = match[1];
  return [
    Number.parseInt(digits.slice(0, 2), 16),
    Number.parseInt(digits.slice(2, 4), 16),
    Number.parseInt(digits.slice(4, 6), 16),
  ];
}

function rgbToHsv(red: number, green: number, blue: number): Hsv {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToRgb(hsv: Hsv): [number, number, number] {
  const c = hsv.v * hsv.s;
  const hp = (((hsv.h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const sector = Math.floor(hp);
  let red = 0;
  let green = 0;
  let blue = 0;
  if (sector === 0) {
    red = c;
    green = x;
  } else if (sector === 1) {
    red = x;
    green = c;
  } else if (sector === 2) {
    green = c;
    blue = x;
  } else if (sector === 3) {
    green = x;
    blue = c;
  } else if (sector === 4) {
    red = x;
    blue = c;
  } else {
    red = c;
    blue = x;
  }
  const m = hsv.v - c;
  return [(red + m) * 255, (green + m) * 255, (blue + m) * 255];
}

function hsvToHex(hsv: Hsv): string {
  const [red, green, blue] = hsvToRgb(hsv);
  return rgbToHex(red, green, blue);
}

const HUE_GRADIENT =
  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";

export function ColorPicker({ id, value, onChange }: ColorPickerProps) {
  const parsed = rgbToHsv(...(hexToRgb(value) ?? [255, 255, 255]));
  const [hue, setHue] = useState(parsed.h);
  const [trackedColor, setTrackedColor] = useState(value);
  const [hexText, setHexText] = useState(value.toLowerCase());
  if (value !== trackedColor) {
    setTrackedColor(value);
    setHexText(value.toLowerCase());
    if (parsed.s !== 0) {
      setHue(parsed.h);
    }
  }
  const hsv: Hsv = { h: hue, s: parsed.s, v: parsed.v };

  function apply(next: Hsv) {
    setHue(next.h);
    const hex = hsvToHex(next);
    setHexText(hex);
    if (hex !== value.toLowerCase()) {
      onChange(hex);
    }
  }

  function pickSaturation(x: number, y: number) {
    apply({ h: hue, s: clamp01(x), v: clamp01(1 - y) });
  }

  function pickHue(x: number) {
    apply({ h: clamp01(x) * 360, s: parsed.s, v: parsed.v });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="h-8 w-full justify-start gap-2 px-1.5 font-mono font-normal"
        >
          <span
            className="size-5 shrink-0 rounded-sm ring-1 ring-foreground/20"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs uppercase">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-3 bg-popover p-3">
        <SatField hsv={hsv} onPick={pickSaturation} />
        <HueSlider hue={hsv.h} onPick={pickHue} />
        <Input
          aria-label="Hex color"
          value={hexText}
          spellCheck={false}
          className="h-8 font-mono uppercase"
          onChange={(event) => {
            const next = event.target.value;
            setHexText(next);
            const rgb = hexToRgb(next.startsWith("#") ? next : `#${next}`);
            if (rgb) {
              onChange(rgbToHex(...rgb));
            }
          }}
          onBlur={() => {
            const rgb = hexToRgb(hexText.startsWith("#") ? hexText : `#${hexText}`);
            if (!rgb) {
              setHexText(value.toLowerCase());
              return;
            }
            onChange(rgbToHex(...rgb));
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function SatField({ hsv, onPick }: { hsv: Hsv; onPick: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  function pick(event: PointerEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      return;
    }
    onPick((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height);
  }

  return (
    <div
      ref={ref}
      className="relative h-28 cursor-crosshair overflow-hidden rounded-md ring-1 ring-foreground/15"
      style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pick(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          pick(event);
        }
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      <span
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ring-2 ring-ring"
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
      />
    </div>
  );
}

function HueSlider({ hue, onPick }: { hue: number; onPick: (x: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  function pick(event: PointerEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) {
      return;
    }
    onPick((event.clientX - bounds.left) / bounds.width);
  }

  return (
    <div
      ref={ref}
      className="relative h-3 cursor-pointer rounded-full ring-1 ring-foreground/15"
      style={{ backgroundImage: HUE_GRADIENT }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pick(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          pick(event);
        }
      }}
    >
      <span
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ring-2 ring-ring"
        style={{ left: `${(hue / 360) * 100}%` }}
      />
    </div>
  );
}
