"use client";

import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { StackLayout } from "@/lib/stack";
import { PLATE_CENTER_MM, PLATE_SIZE_MM } from "@/lib/stack";
import type { TriangleMesh } from "@/lib/stl";

/** Matches dark theme --primary (oklch 0.84 0.09 240). */
const ACCENT_COLOR = "#9bd4ff";

type StackPreviewProps = {
  mesh: TriangleMesh;
  layout: StackLayout;
  color: string;
};

type OrbitTarget = {
  target: THREE.Vector3;
  update: () => void;
};

function yUpPositions(positions: Float32Array): Float32Array {
  const converted = new Float32Array(positions.length);
  for (let index = 0; index < positions.length; index += 3) {
    converted[index] = positions[index];
    converted[index + 1] = positions[index + 2];
    converted[index + 2] = positions[index + 1];
  }
  return converted;
}

/** STL facets are flat; duplicate vertices per triangle so creases stay sharp. */
function buildPreviewGeometry(mesh: TriangleMesh): THREE.BufferGeometry {
  const { positions, indices } = mesh;
  const expanded = new Float32Array(indices.length * 3);
  for (let tri = 0; tri < indices.length; tri += 3) {
    for (let corner = 0; corner < 3; corner += 1) {
      const src = indices[tri + corner] * 3;
      const dst = tri * 3 + corner * 3;
      expanded[dst] = positions[src];
      expanded[dst + 1] = positions[src + 1];
      expanded[dst + 2] = positions[src + 2];
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(yUpPositions(expanded), 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

function FrameStack({ mesh }: { mesh: TriangleMesh }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitTarget | null;
  const framedMesh = useRef<TriangleMesh | null>(null);

  useLayoutEffect(() => {
    if (!controls || framedMesh.current === mesh) {
      return;
    }
    framedMesh.current = mesh;
    const width = mesh.bounds.max.x - mesh.bounds.min.x;
    const depth = mesh.bounds.max.y - mesh.bounds.min.y;
    const height = mesh.bounds.max.z - mesh.bounds.min.z;
    const distance = Math.max(width, depth, height, 48) * 1.25;
    const targetY = height * 0.3;
    camera.position.set(
      PLATE_CENTER_MM + distance * 0.2,
      targetY + distance * 0.9,
      PLATE_CENTER_MM + distance,
    );
    camera.lookAt(PLATE_CENTER_MM, targetY, PLATE_CENTER_MM);
    controls.target.set(PLATE_CENTER_MM, targetY, PLATE_CENTER_MM);
    controls.update();
  }, [camera, controls, mesh]);

  return null;
}

function GapHighlights({
  mesh,
  layout,
}: {
  mesh: TriangleMesh;
  layout: StackLayout;
}) {
  const slabs = useMemo(() => {
    if (layout.zOffsets.length < 2) {
      return [];
    }
    const width = mesh.bounds.max.x - mesh.bounds.min.x;
    const depth = mesh.bounds.max.y - mesh.bounds.min.y;
    const centerX = layout.offsetX + (mesh.bounds.min.x + mesh.bounds.max.x) / 2;
    const centerZ = layout.offsetY + (mesh.bounds.min.y + mesh.bounds.max.y) / 2;
    const next: Array<{ key: number; y: number }> = [];
    for (let copy = 0; copy < layout.zOffsets.length - 1; copy += 1) {
      const gapBottom = layout.zOffsets[copy] + layout.partHeight;
      const gapTop = layout.zOffsets[copy + 1];
      next.push({ key: copy, y: (gapBottom + gapTop) / 2 });
    }
    return next.map(({ key, y }) => ({ key, y, width, depth, centerX, centerZ }));
  }, [layout, mesh.bounds]);

  if (slabs.length === 0) {
    return null;
  }

  return (
    <>
      {slabs.map(({ key, y, width, depth, centerX, centerZ }) => (
        <mesh key={key} position={[centerX, y, centerZ]}>
          <boxGeometry args={[width, layout.gap, depth]} />
          <meshStandardMaterial
            color={ACCENT_COLOR}
            transparent
            opacity={0.5}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

function StackInstances({ mesh, layout, color }: StackPreviewProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => buildPreviewGeometry(mesh), [mesh]);

  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useLayoutEffect(() => {
    const instances = meshRef.current;
    if (!instances) {
      return;
    }
    const matrix = new THREE.Matrix4();
    for (let copy = 0; copy < layout.zOffsets.length; copy += 1) {
      matrix.makeTranslation(layout.offsetX, layout.zOffsets[copy], layout.offsetY);
      instances.setMatrixAt(copy, matrix);
    }
    instances.instanceMatrix.needsUpdate = true;
  }, [layout]);

  return (
    <instancedMesh
      ref={meshRef}
      key={layout.zOffsets.length}
      args={[undefined, undefined, layout.zOffsets.length]}
      geometry={geometry}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color={color}
        metalness={0}
        roughness={0.88}
        flatShading
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

export function StackPreview({ mesh, layout, color }: StackPreviewProps) {
  return (
    <Canvas
      camera={{ fov: 35, position: [220, 160, 220], near: 0.1, far: 20000 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#09090b"]} />
      <hemisphereLight args={["#f4f7fa", "#3f3f46", 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[160, 280, 80]} intensity={2.1} />
      <directionalLight position={[-140, 140, 160]} intensity={0.85} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[PLATE_CENTER_MM, -0.2, PLATE_CENTER_MM]}
      >
        <planeGeometry args={[PLATE_SIZE_MM, PLATE_SIZE_MM]} />
        <meshStandardMaterial color="#18181b" metalness={0} roughness={1} />
      </mesh>
      <Grid
        args={[PLATE_SIZE_MM, PLATE_SIZE_MM]}
        position={[PLATE_CENTER_MM, 0, PLATE_CENTER_MM]}
        cellSize={8}
        cellThickness={0.7}
        cellColor="#3f3f46"
        sectionSize={32}
        sectionThickness={1.15}
        sectionColor="#71717a"
        fadeDistance={1600}
        fadeStrength={0.4}
        infiniteGrid={false}
        side={THREE.DoubleSide}
      />
      <GapHighlights mesh={mesh} layout={layout} />
      <StackInstances mesh={mesh} layout={layout} color={color} />
      <FrameStack mesh={mesh} />
      <OrbitControls makeDefault enableDamping={false} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
  );
}
