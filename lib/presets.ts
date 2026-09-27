export const NOZZLES = [0.2, 0.4, 0.6, 0.8] as const;

export type Nozzle = (typeof NOZZLES)[number];

export const NOZZLE_IDS = ["0.2", "0.4", "0.6", "0.8"] as const;

export type NozzleId = (typeof NOZZLE_IDS)[number];

export type LayerPreset = {
  layerHeight: number;
  quality: string;
};

export const LAYER_PRESETS: Record<Nozzle, readonly LayerPreset[]> = {
  0.2: [
    { layerHeight: 0.06, quality: "Standard" },
    { layerHeight: 0.08, quality: "Standard" },
    { layerHeight: 0.12, quality: "Standard" },
    { layerHeight: 0.14, quality: "Standard" },
  ],
  0.4: [
    { layerHeight: 0.08, quality: "Extra Fine" },
    { layerHeight: 0.12, quality: "Fine" },
    { layerHeight: 0.16, quality: "Optimal" },
    { layerHeight: 0.2, quality: "Standard" },
    { layerHeight: 0.24, quality: "Draft" },
    { layerHeight: 0.28, quality: "Extra Draft" },
  ],
  0.6: [
    { layerHeight: 0.18, quality: "Standard" },
    { layerHeight: 0.24, quality: "Standard" },
    { layerHeight: 0.3, quality: "Strength" },
    { layerHeight: 0.36, quality: "Standard" },
    { layerHeight: 0.42, quality: "Standard" },
  ],
  0.8: [
    { layerHeight: 0.24, quality: "Standard" },
    { layerHeight: 0.32, quality: "Standard" },
    { layerHeight: 0.48, quality: "Standard" },
    { layerHeight: 0.56, quality: "Standard" },
  ],
};

export const STANDARD_LAYER_HEIGHT: Record<Nozzle, number> = {
  0.2: 0.08,
  0.4: 0.2,
  0.6: 0.24,
  0.8: 0.24,
};

export const DEFAULT_NOZZLE: Nozzle = 0.4;

export function nozzleFromId(id: NozzleId): Nozzle {
  switch (id) {
    case "0.2":
      return 0.2;
    case "0.4":
      return 0.4;
    case "0.6":
      return 0.6;
    case "0.8":
      return 0.8;
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function isNozzleId(value: string): value is NozzleId {
  switch (value) {
    case "0.2":
    case "0.4":
    case "0.6":
    case "0.8":
      return true;
    default:
      return false;
  }
}

export function nozzleLabel(nozzle: Nozzle): string {
  switch (nozzle) {
    case 0.2:
      return "0.2 mm";
    case 0.4:
      return "0.4 mm";
    case 0.6:
      return "0.6 mm";
    case 0.8:
      return "0.8 mm";
    default: {
      const exhaustive: never = nozzle;
      return exhaustive;
    }
  }
}

export function presetLabel(preset: LayerPreset): string {
  return `${preset.layerHeight.toFixed(2)} mm ${preset.quality}`;
}

export function presetValue(preset: LayerPreset): string {
  return preset.layerHeight.toFixed(2);
}

export function findPreset(nozzle: Nozzle, layerHeight: number): LayerPreset {
  const preset = LAYER_PRESETS[nozzle].find(
    (candidate) => candidate.layerHeight === layerHeight,
  );
  if (!preset) {
    throw new Error(`No ${nozzle} mm preset for layer height ${layerHeight}.`);
  }
  return preset;
}

export function printSettingsId(nozzle: Nozzle, preset: LayerPreset): string {
  return `${preset.layerHeight.toFixed(2)}mm ${preset.quality} @BBL X1C ${nozzle.toFixed(1)} nozzle`;
}

export function initialLayerPrintHeight(nozzle: Nozzle): string {
  return (nozzle / 2).toFixed(2);
}
