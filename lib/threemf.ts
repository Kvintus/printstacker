import { strToU8, zipSync } from "fflate";

import {
  initialLayerPrintHeight,
  type LayerPreset,
  type Nozzle,
} from "@/lib/presets";
import { layoutStack } from "@/lib/stack";
import type { TriangleMesh } from "@/lib/stl";

export type Slicer = "bambu" | "generic";

export const SLICER_IDS = ["bambu", "generic"] as const;

export type SlicerId = (typeof SLICER_IDS)[number];

export type ThreeMfInput = {
  mesh: TriangleMesh;
  filename: string;
  count: number;
  gapLayers: number;
  nozzle: Nozzle;
  preset: LayerPreset;
  slicer: Slicer;
};

export function slicerFromId(id: SlicerId): Slicer {
  switch (id) {
    case "bambu":
      return "bambu";
    case "generic":
      return "generic";
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

export function isSlicerId(value: string): value is SlicerId {
  switch (value) {
    case "bambu":
    case "generic":
      return true;
    default:
      return false;
  }
}

export function slicerLabel(slicer: Slicer): string {
  switch (slicer) {
    case "bambu":
      return "Bambu Studio";
    case "generic":
      return "Generic 3MF";
    default: {
      const exhaustive: never = slicer;
      return exhaustive;
    }
  }
}

export function stackDownloadName(filename: string, count: number): string {
  const base = filename.trim().replace(/\.stl$/i, "");
  return `${base}_${count}high.3mf`;
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded);
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function modelXml(input: ThreeMfInput, slicer: Slicer): string {
  const layout = layoutStack(
    input.mesh.bounds,
    input.count,
    input.preset.layerHeight,
    input.gapLayers,
  );
  const { positions, indices } = input.mesh;
  const vertices: string[] = [];
  for (let index = 0; index < positions.length; index += 3) {
    vertices.push(
      `<vertex x="${formatNumber(positions[index])}" y="${formatNumber(positions[index + 1])}" z="${formatNumber(positions[index + 2])}"/>`,
    );
  }

  const triangles: string[] = [];
  for (let index = 0; index < indices.length; index += 3) {
    triangles.push(
      `<triangle v1="${indices[index]}" v2="${indices[index + 1]}" v3="${indices[index + 2]}"/>`,
    );
  }

  const items: string[] = [];
  for (let copy = 0; copy < layout.zOffsets.length; copy += 1) {
    const transform = `1 0 0 0 1 0 0 0 1 ${formatNumber(layout.offsetX)} ${formatNumber(layout.offsetY)} ${formatNumber(layout.zOffsets[copy])}`;
    switch (slicer) {
      case "bambu":
        items.push(`<item objectid="1" transform="${transform}" printable="1"/>`);
        break;
      case "generic":
        items.push(`<item objectid="1" transform="${transform}"/>`);
        break;
      default: {
        const exhaustive: never = slicer;
        throw new Error(`Unknown slicer ${String(exhaustive)}`);
      }
    }
  }

  const bambuNamespace =
    slicer === "bambu"
      ? ` xmlns:BambuStudio="http://schemas.bambulab.com/package/2021"`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"${bambuNamespace}>
 <metadata name="Application">Print Stacker</metadata>
 <metadata name="Title">${xmlEscape(input.filename)}</metadata>
 <resources>
  <object id="1" type="model">
   <mesh>
    <vertices>
     ${vertices.join("\n     ")}
    </vertices>
    <triangles>
     ${triangles.join("\n     ")}
    </triangles>
   </mesh>
  </object>
 </resources>
 <build>
  ${items.join("\n  ")}
 </build>
</model>
`;
}

function projectSettings(input: ThreeMfInput): string {
  // Only DynamicPrintConfig keys. Unknown keys such as print_settings_id
  // make Studio reject the whole file and skip layer height and ironing.
  return JSON.stringify({
    layer_height: input.preset.layerHeight.toFixed(2),
    initial_layer_print_height: initialLayerPrintHeight(input.nozzle),
    ironing_type: "top",
  });
}

function modelSettings(input: ThreeMfInput): string {
  const layout = layoutStack(
    input.mesh.bounds,
    input.count,
    input.preset.layerHeight,
    input.gapLayers,
  );
  const name = xmlEscape(input.filename);
  const instances: string[] = [];
  const assemble: string[] = [];

  for (let copy = 0; copy < layout.zOffsets.length; copy += 1) {
    const transform = `1 0 0 0 1 0 0 0 1 ${formatNumber(layout.offsetX)} ${formatNumber(layout.offsetY)} ${formatNumber(layout.zOffsets[copy])}`;
    instances.push(`  <model_instance>
   <metadata key="object_id" value="1"/>
   <metadata key="instance_id" value="${copy}"/>
   <metadata key="identify_id" value="${copy + 1}"/>
  </model_instance>`);
    assemble.push(
      `  <assemble_item object_id="1" instance_id="${copy}" transform="${transform}" offset="0 0 0"/>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<config>
 <object id="1">
  <metadata key="name" value="${name}"/>
  <metadata key="extruder" value="1"/>
  <metadata face_count="${input.mesh.indices.length / 3}"/>
  <part id="1" subtype="normal_part">
   <metadata key="name" value="${name}"/>
   <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
   <mesh_stat edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
  </part>
 </object>
 <plate>
  <metadata key="plater_id" value="1"/>
  <metadata key="plater_name" value=""/>
  <metadata key="locked" value="false"/>
  <metadata key="filament_map_mode" value="Auto For Flush"/>
${instances.join("\n")}
 </plate>
 <assemble>
${assemble.join("\n")}
 </assemble>
</config>
`;
}

function contentTypes(slicer: Slicer): string {
  const overrides: string[] = [
    `<Override PartName="/3D/3dmodel.model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>`,
  ];
  switch (slicer) {
    case "bambu":
      overrides.push(
        `<Override PartName="/Metadata/model_settings.config" ContentType="text/xml"/>`,
        `<Override PartName="/Metadata/project_settings.config" ContentType="application/json"/>`,
      );
      break;
    case "generic":
      break;
    default: {
      const exhaustive: never = slicer;
      throw new Error(`Unknown slicer ${String(exhaustive)}`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
 ${overrides.join("\n ")}
</Types>
`;
}

function rootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>
`;
}

function modelRels(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/Metadata/model_settings.config" Id="rel-settings" Type="http://schemas.bambulab.com/package/2021/settings"/>
 <Relationship Target="/Metadata/project_settings.config" Id="rel-project" Type="http://schemas.bambulab.com/package/2021/settings"/>
</Relationships>
`;
}

export function build3mf(input: ThreeMfInput): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(contentTypes(input.slicer)),
    "_rels/.rels": strToU8(rootRels()),
    "3D/3dmodel.model": strToU8(modelXml(input, input.slicer)),
  };

  switch (input.slicer) {
    case "bambu":
      files["Metadata/project_settings.config"] = strToU8(projectSettings(input));
      files["Metadata/model_settings.config"] = strToU8(modelSettings(input));
      files["3D/_rels/3dmodel.model.rels"] = strToU8(modelRels());
      break;
    case "generic":
      break;
    default: {
      const exhaustive: never = input.slicer;
      throw new Error(`Unknown slicer ${String(exhaustive)}`);
    }
  }

  return zipSync(files, { level: 6 });
}
