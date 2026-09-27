import {
  DEFAULT_NOZZLE,
  isNozzleId,
  LAYER_PRESETS,
  nozzleFromId,
  STANDARD_LAYER_HEIGHT,
  type Nozzle,
} from "@/lib/presets";
import {
  DEFAULT_GAP_LAYERS,
  MAX_GAP_LAYERS,
  MAX_STACK_COUNT,
  MIN_GAP_LAYERS,
  MIN_STACK_COUNT,
} from "@/lib/stack";
import { isSlicerId, slicerFromId, type Slicer } from "@/lib/threemf";

export const SETTINGS_KEY = "printstacker-settings";

export const DEFAULT_PREVIEW_COLOR = "#ffffff";

export type PrintSettings = {
  nozzle: Nozzle;
  layerHeight: number;
  slicer: Slicer;
  count: number;
  gapLayers: number;
  color: string;
};

export function defaultPrintSettings(): PrintSettings {
  return {
    nozzle: DEFAULT_NOZZLE,
    layerHeight: STANDARD_LAYER_HEIGHT[DEFAULT_NOZZLE],
    slicer: "bambu",
    count: MIN_STACK_COUNT,
    gapLayers: DEFAULT_GAP_LAYERS,
    color: DEFAULT_PREVIEW_COLOR,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nozzleFromStored(value: unknown): Nozzle {
  const id = typeof value === "number" ? value.toFixed(1) : value;
  if (typeof id === "string" && isNozzleId(id)) {
    return nozzleFromId(id);
  }
  return DEFAULT_NOZZLE;
}

function layerHeightForNozzle(nozzle: Nozzle, value: unknown): number {
  const standard = STANDARD_LAYER_HEIGHT[nozzle];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return standard;
  }
  const heightKey = value.toFixed(2);
  const match = LAYER_PRESETS[nozzle].find(
    (preset) => preset.layerHeight.toFixed(2) === heightKey,
  );
  return match ? match.layerHeight : standard;
}

function slicerFromStored(value: unknown): Slicer {
  if (typeof value === "string" && isSlicerId(value)) {
    return slicerFromId(value);
  }
  return "bambu";
}

function integerInRange(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max) {
    return value;
  }
  return fallback;
}

function colorFromStored(value: unknown): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  return DEFAULT_PREVIEW_COLOR;
}

export function parsePrintSettings(raw: string | null): PrintSettings {
  const defaults = defaultPrintSettings();
  if (!raw) {
    return defaults;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaults;
  }
  if (!isRecord(parsed)) {
    return defaults;
  }

  const nozzle = nozzleFromStored(parsed.nozzle);
  return {
    nozzle,
    layerHeight: layerHeightForNozzle(nozzle, parsed.layerHeight),
    slicer: slicerFromStored(parsed.slicer),
    count: integerInRange(parsed.count, MIN_STACK_COUNT, MAX_STACK_COUNT, defaults.count),
    gapLayers: integerInRange(
      parsed.gapLayers,
      MIN_GAP_LAYERS,
      MAX_GAP_LAYERS,
      defaults.gapLayers,
    ),
    color: colorFromStored(parsed.color),
  };
}

const serverSnapshot = defaultPrintSettings();
const listeners = new Set<() => void>();
let clientSnapshot = serverSnapshot;
let clientReady = false;

function readClientSnapshot(): PrintSettings {
  if (clientReady) {
    return clientSnapshot;
  }
  clientReady = true;
  try {
    clientSnapshot = parsePrintSettings(localStorage.getItem(SETTINGS_KEY));
  } catch {
    clientSnapshot = serverSnapshot;
  }
  return clientSnapshot;
}

function publish(next: PrintSettings) {
  clientSnapshot = next;
  clientReady = true;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribePrintSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPrintSettingsSnapshot(): PrintSettings {
  return readClientSnapshot();
}

export function getPrintSettingsServerSnapshot(): PrintSettings {
  return serverSnapshot;
}

export function updatePrintSettings(patch: Partial<PrintSettings>) {
  const next = { ...readClientSnapshot(), ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    publish(next);
    return;
  }
  publish(next);
}
