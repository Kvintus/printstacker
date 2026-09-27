import { unzipSync, strFromU8 } from "fflate";

import {
  LAYER_PRESETS,
  printSettingsId,
  STANDARD_LAYER_HEIGHT,
  findPreset,
} from "../lib/presets";
import { layoutStack } from "../lib/stack";
import { parseStl } from "../lib/stl";
import { build3mf, stackDownloadName } from "../lib/threemf";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

type Vec = [number, number, number];

function boxTriangles(min: Vec, max: Vec): Vec[][] {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const corners: Vec[] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  const faces: Array<[number, number, number]> = [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
    [0, 1, 5],
    [0, 5, 4],
    [1, 2, 6],
    [1, 6, 5],
    [2, 3, 7],
    [2, 7, 6],
    [3, 0, 4],
    [3, 4, 7],
  ];
  return faces.map(([a, b, c]) => [corners[a], corners[b], corners[c]]);
}

function writeBinaryStl(triangles: Vec[][]): ArrayBuffer {
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triangles.length, true);
  triangles.forEach((triangle, index) => {
    let offset = 84 + index * 50 + 12;
    for (const [x, y, z] of triangle) {
      view.setFloat32(offset, x, true);
      view.setFloat32(offset + 4, y, true);
      view.setFloat32(offset + 8, z, true);
      offset += 12;
    }
  });
  return buffer;
}

function writeAsciiStl(triangles: Vec[][]): ArrayBuffer {
  const lines = ["solid verify"];
  for (const triangle of triangles) {
    lines.push("  facet normal 0 0 0");
    lines.push("    outer loop");
    for (const [x, y, z] of triangle) {
      lines.push(`      vertex ${x} ${y} ${z}`);
    }
    lines.push("    endloop");
    lines.push("  endfacet");
  }
  lines.push("endsolid verify");
  return new TextEncoder().encode(lines.join("\n")).buffer;
}

const triangles = boxTriangles([0, 0, 0], [10, 20, 8]);
const binary = parseStl(writeBinaryStl(triangles));
const ascii = parseStl(writeAsciiStl(triangles));

assert(binary.indices.length === 36, "binary triangle indices");
assert(ascii.indices.length === 36, "ascii triangle indices");
assert(binary.bounds.min.x === 0 && binary.bounds.max.z === 8, "binary bounds");
assert(ascii.bounds.max.y === 20 && ascii.bounds.min.z === 0, "ascii bounds");

assert(STANDARD_LAYER_HEIGHT[0.2] === 0.08, "0.2 standard");
assert(STANDARD_LAYER_HEIGHT[0.4] === 0.2, "0.4 standard");
assert(STANDARD_LAYER_HEIGHT[0.6] === 0.24, "0.6 standard");
assert(STANDARD_LAYER_HEIGHT[0.8] === 0.24, "0.8 standard");
assert(LAYER_PRESETS[0.2].every((preset) => preset.quality === "Standard"), "0.2 names");
assert(LAYER_PRESETS[0.6].some((preset) => preset.layerHeight === 0.42), "0.42 preset");

const layout = layoutStack(binary.bounds, 4, 0.42, 1);
assert(layout.partHeight === 8, "part height");
assert(layout.gap === 0.42, "gap");
assert(layout.step === 8.42, "step");
assert(Math.abs(layout.totalHeight - 33.26) < 1e-9, "total height");
assert(layout.offsetX === 123, "center x");
assert(layout.offsetY === 118, "center y");
assert(layout.zOffsets[0] === 0 && Math.abs(layout.zOffsets[1] - 8.42) < 1e-9, "z offsets");

const preset = findPreset(0.6, 0.42);
const filename = "tile.stl";
assert(stackDownloadName(filename, 4) === "tile_4high.3mf", "download name");
assert(
  printSettingsId(0.6, preset) === "0.42mm Standard @BBL X1C 0.6 nozzle",
  "preset id",
);

const bambu = unzipSync(
  build3mf({
    mesh: binary,
    filename,
    count: 4,
    gapLayers: 1,
    nozzle: 0.6,
    preset,
    slicer: "bambu",
  }),
);
const settingsText = strFromU8(bambu["Metadata/project_settings.config"]);
const settings = JSON.parse(settingsText) as Record<string, string>;
assert(settings.ironing_type === "top", `ironing_type ${settings.ironing_type}`);
assert(settings.layer_height === "0.42", `layer_height ${settings.layer_height}`);
assert(settings.initial_layer_print_height === "0.30", "initial layer");
assert(!("print_settings_id" in settings), "print_settings_id is not a DynamicPrintConfig key");
assert(
  Object.keys(settings).sort().join(",") ===
    "initial_layer_print_height,ironing_type,layer_height",
  `unexpected project settings keys: ${Object.keys(settings).join(",")}`,
);

const model = strFromU8(bambu["3D/3dmodel.model"]);
const transforms = model.match(/transform="[^"]+"/g) ?? [];
assert(transforms.length === 4, `expected 4 build items, got ${transforms.length}`);
assert(model.includes('transform="1 0 0 0 1 0 0 0 1 123 118 0"'), "first transform");
assert(model.includes("object id=\"1\""), "shared object");
assert((model.match(/<object /g) ?? []).length === 1, "one mesh object");

const generic = unzipSync(
  build3mf({
    mesh: ascii,
    filename,
    count: 2,
    gapLayers: 1,
    nozzle: 0.6,
    preset,
    slicer: "generic",
  }),
);
assert(
  !("Metadata/project_settings.config" in generic),
  "generic package includes project settings",
);
const genericModel = strFromU8(generic["3D/3dmodel.model"]);
assert(!genericModel.includes("ironing"), "generic model mentions ironing");
assert(!genericModel.includes("BambuStudio"), "generic model has Bambu namespace");
const genericJoined = Object.keys(generic).join("\n");
assert(!genericJoined.includes("project_settings"), "generic zip names");

console.log("verify-3mf ok");
