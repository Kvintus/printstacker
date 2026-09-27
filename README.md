# Print Stacker

Stack copies of an STL into a 3MF you can open in a slicer. The file is parsed and packed in the browser; nothing is uploaded.

Each copy sits on the build plate, centered, with a gap of one to three layer heights between copies. The gap keeps every copy on a whole layer, so the top of the lower part can be ironed before the next one starts.

## Use it

1. Drop an STL, or click the file area and browse. Binary and ASCII STL both work.
2. Pick a nozzle and a matching layer height. Changing the nozzle resets the layer height to that nozzle’s standard preset.
3. Choose **Bambu Studio** or **Generic 3MF**.
4. Set how many copies high (2–20) and how many gap layers (1–3).
5. Download the 3MF. The file is named `{part}_{count}high.3mf`.

The status bar shows part height, gap, copy count, and total stack height. Above 250 mm, a badge warns that the stack may exceed a Bambu printer’s Z limit.

Nozzle, layer height, slicer, copy count, gap, and preview color are saved in the browser.

## How the stack is built

Heights are in millimeters.

- **Gap** is layer height times gap layers. One layer at 0.20 mm is a 0.20 mm gap; three layers is 0.60 mm.
- **Step** is part height plus that gap. Copy *n* starts at `n × step`, measured from the part’s lowest Z so the first copy sits on the plate.
- **Total height** is `copies × part height + (copies − 1) × gap`.
- The part is translated so its XY center sits at the middle of a 256 mm plate.

Layer heights are the usual Bambu presets for 0.2, 0.4, 0.6, and 0.8 mm nozzles. The defaults are 0.08, 0.20, 0.24, and 0.24 mm.

## What the 3MF contains

**Bambu Studio** writes a project the slicer can open with the stack already placed:

- one mesh, with one build item per copy
- plate and assemble metadata for each instance
- layer height, an initial layer height of half the nozzle diameter, and top ironing

**Generic 3MF** is the same stacked mesh in the core 3MF model, without Bambu project settings. Open it in any slicer that reads 3MF; you set layer height and ironing there yourself.

## Develop

Requires Node.js and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm build   # production build
pnpm start   # serve the production build
pnpm lint
```

| Path | Role |
| --- | --- |
| `app/page.tsx` | Upload, process controls, and download |
| `components/stack-preview.tsx` | Three.js preview of the stack |
| `lib/stl.ts` | Binary and ASCII STL parser |
| `lib/stack.ts` | Copy spacing and plate placement |
| `lib/presets.ts` | Nozzle and layer-height presets |
| `lib/threemf.ts` | 3MF zip for Bambu Studio and generic slicers |
| `lib/settings.ts` | Settings stored in `localStorage` |
