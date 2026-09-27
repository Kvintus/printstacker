import type { Bounds } from "@/lib/stl";

export const PLATE_SIZE_MM = 256;
export const PLATE_CENTER_MM = 128;
export const Z_LIMIT_MM = 250;
export const MIN_STACK_COUNT = 2;
export const MAX_STACK_COUNT = 20;
export const MIN_GAP_LAYERS = 1;
export const MAX_GAP_LAYERS = 3;
export const DEFAULT_GAP_LAYERS = 1;

export type StackLayout = {
  partHeight: number;
  gap: number;
  step: number;
  totalHeight: number;
  offsetX: number;
  offsetY: number;
  zOffsets: number[];
};

export function layoutStack(
  bounds: Bounds,
  count: number,
  layerHeight: number,
  gapLayers: number,
): StackLayout {
  if (!Number.isInteger(count) || count < MIN_STACK_COUNT || count > MAX_STACK_COUNT) {
    throw new Error("Stack count must be an integer from 2 to 20.");
  }
  if (
    !Number.isInteger(gapLayers) ||
    gapLayers < MIN_GAP_LAYERS ||
    gapLayers > MAX_GAP_LAYERS
  ) {
    throw new Error("Gap layers must be an integer from 1 to 3.");
  }
  if (!(layerHeight > 0)) {
    throw new Error("Layer height must be positive.");
  }

  const partHeight = bounds.max.z - bounds.min.z;
  const gap = layerHeight * gapLayers;
  const step = partHeight + gap;
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerY = (bounds.min.y + bounds.max.y) / 2;
  const zOffsets: number[] = [];

  for (let copy = 0; copy < count; copy += 1) {
    zOffsets.push(-bounds.min.z + copy * step);
  }

  return {
    partHeight,
    gap,
    step,
    totalHeight: count * partHeight + (count - 1) * gap,
    offsetX: PLATE_CENTER_MM - centerX,
    offsetY: PLATE_CENTER_MM - centerY,
    zOffsets,
  };
}
