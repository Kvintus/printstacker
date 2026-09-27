export type Bounds = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};

export type TriangleMesh = {
  positions: Float32Array;
  indices: Uint32Array;
  bounds: Bounds;
};

function emptyBounds(): Bounds {
  return {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
}

function includePoint(bounds: Bounds, x: number, y: number, z: number) {
  bounds.min.x = Math.min(bounds.min.x, x);
  bounds.min.y = Math.min(bounds.min.y, y);
  bounds.min.z = Math.min(bounds.min.z, z);
  bounds.max.x = Math.max(bounds.max.x, x);
  bounds.max.y = Math.max(bounds.max.y, y);
  bounds.max.z = Math.max(bounds.max.z, z);
}

function weld(
  positions: number[],
  lookup: Map<string, number>,
  bounds: Bounds,
  x: number,
  y: number,
  z: number,
): number {
  const key = `${x},${y},${z}`;
  const existing = lookup.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const index = positions.length / 3;
  positions.push(x, y, z);
  lookup.set(key, index);
  includePoint(bounds, x, y, z);
  return index;
}

function toMesh(positions: number[], indices: number[], bounds: Bounds): TriangleMesh {
  if (indices.length === 0 || indices.length % 3 !== 0) {
    throw new Error("STL did not contain a complete triangle mesh.");
  }
  if (!Number.isFinite(bounds.min.x)) {
    throw new Error("STL did not contain a complete triangle mesh.");
  }
  return {
    positions: Float32Array.from(positions),
    indices: Uint32Array.from(indices),
    bounds,
  };
}

function parseBinaryStl(buffer: ArrayBuffer, triangleCount: number): TriangleMesh {
  const view = new DataView(buffer);
  const positions: number[] = [];
  const indices: number[] = [];
  const lookup = new Map<string, number>();
  const bounds = emptyBounds();

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = 84 + triangle * 50;
    for (let vertex = 0; vertex < 3; vertex += 1) {
      const vertexOffset = offset + 12 + vertex * 12;
      const x = view.getFloat32(vertexOffset, true);
      const y = view.getFloat32(vertexOffset + 4, true);
      const z = view.getFloat32(vertexOffset + 8, true);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new Error("Binary STL has a non-finite vertex.");
      }
      indices.push(weld(positions, lookup, bounds, x, y, z));
    }
  }

  return toMesh(positions, indices, bounds);
}

function parseAsciiStl(text: string): TriangleMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const lookup = new Map<string, number>();
  const bounds = emptyBounds();
  const pattern =
    /vertex\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;

  let pending = 0;
  for (const match of text.matchAll(pattern)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    const z = Number(match[3]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      throw new Error("ASCII STL has a non-numeric vertex.");
    }
    indices.push(weld(positions, lookup, bounds, x, y, z));
    pending += 1;
    if (pending === 3) {
      pending = 0;
    }
  }

  if (pending !== 0) {
    throw new Error("ASCII STL ended in the middle of a triangle.");
  }

  return toMesh(positions, indices, bounds);
}

export function parseStl(buffer: ArrayBuffer): TriangleMesh {
  if (buffer.byteLength >= 84) {
    const triangleCount = new DataView(buffer).getUint32(80, true);
    if (triangleCount > 0 && 84 + triangleCount * 50 === buffer.byteLength) {
      return parseBinaryStl(buffer, triangleCount);
    }
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (!/vertex\s+/i.test(text)) {
    throw new Error("File is neither a binary nor an ASCII STL.");
  }
  return parseAsciiStl(text);
}
