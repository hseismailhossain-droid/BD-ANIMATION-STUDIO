export interface Point {
  x: number;
  y: number;
}

export interface MeshWarpNode {
  x: number;
  y: number;
  // Original source coordinates in layer canvas
  origX: number;
  origY: number;
}

export interface MeshWarpGrid {
  rows: number; // divY + 1
  cols: number; // divX + 1
  nodes: MeshWarpNode[][];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type TransformMode = 'translate-scale' | 'perspective' | 'mesh';

export interface LayerTransformState {
  isActive: boolean;
  layerId: string;
  mode: TransformMode;
  // Mode 1: Translate & Scale & 360 Rotate
  translation: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number; // Degrees -180 to 180 or 0 to 360
  uniformScale: boolean;
  // Mode 2: Perspective (4 corner handles)
  perspectiveCorners: [Point, Point, Point, Point]; // TL, TR, BR, BL
  // Mode 3: Mesh Form
  divisionX: number; // 2 to 12
  divisionY: number; // 2 to 12
  smoothness: number; // 1 to 5
  drawOrder: number;
  meshGrid: MeshWarpGrid | null;
  selectedMeshNode: { row: number; col: number } | null;
  // Snapshot of layer canvas when transform started
  sourceSnapshot: HTMLCanvasElement | null;
  bounds: { x: number; y: number; width: number; height: number };
}

export class WarpEngine {
  /**
   * Scan canvas to get the bounding box of non-transparent pixels
   */
  public static getContentBounds(
    canvas: HTMLCanvasElement,
    padding: number = 24
  ): { x: number; y: number; width: number; height: number; hasContent: boolean } {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        x: canvas.width * 0.2,
        y: canvas.height * 0.2,
        width: canvas.width * 0.6,
        height: canvas.height * 0.6,
        hasContent: false,
      };
    }

    const w = canvas.width;
    const h = canvas.height;

    // Sample step to be lightning-fast on 4K/8K canvases
    const step = Math.max(1, Math.floor(Math.max(w, h) / 1000));
    let imgData: ImageData;
    try {
      imgData = ctx.getImageData(0, 0, w, h);
    } catch {
      return {
        x: w * 0.15,
        y: h * 0.15,
        width: w * 0.7,
        height: h * 0.7,
        hasContent: false,
      };
    }

    const data = imgData.data;
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    for (let y = 0; y < h; y += step) {
      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x += step) {
        const alpha = data[rowOffset + x * 4 + 3];
        if (alpha > 5) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) {
      // Return comfortable default central area
      return {
        x: Math.round(w * 0.2),
        y: Math.round(h * 0.2),
        width: Math.round(w * 0.6),
        height: Math.round(h * 0.6),
        hasContent: false,
      };
    }

    const x = Math.max(0, minX - padding);
    const y = Math.max(0, minY - padding);
    const width = Math.min(w - x, maxX - minX + padding * 2);
    const height = Math.min(h - y, maxY - minY + padding * 2);

    return {
      x,
      y,
      width: Math.max(40, width),
      height: Math.max(40, height),
      hasContent: true,
    };
  }

  /**
   * Create an initial uniform Mesh Form grid over the content bounding box
   */
  public static createMeshGrid(
    bounds: { x: number; y: number; width: number; height: number },
    divX: number,
    divY: number
  ): MeshWarpGrid {
    const cols = Math.max(2, Math.min(16, divX + 1));
    const rows = Math.max(2, Math.min(16, divY + 1));
    const nodes: MeshWarpNode[][] = [];

    for (let r = 0; r < rows; r++) {
      const rowNodes: MeshWarpNode[] = [];
      const v = r / (rows - 1);
      const py = bounds.y + v * bounds.height;

      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const px = bounds.x + u * bounds.width;

        rowNodes.push({
          x: px,
          y: py,
          origX: px,
          origY: py,
        });
      }
      nodes.push(rowNodes);
    }

    return {
      rows,
      cols,
      nodes,
      bounds: { ...bounds },
    };
  }

  /**
   * Re-generate or resample grid when division count changes, preserving existing deformation
   */
  public static resampleMeshGrid(
    existingGrid: MeshWarpGrid | null,
    bounds: { x: number; y: number; width: number; height: number },
    newDivX: number,
    newDivY: number
  ): MeshWarpGrid {
    const newGrid = this.createMeshGrid(bounds, newDivX, newDivY);
    if (!existingGrid) return newGrid;

    // Transfer deformation offsets from old grid to new grid using bilinear interpolation
    const oldRows = existingGrid.rows;
    const oldCols = existingGrid.cols;

    for (let r = 0; r < newGrid.rows; r++) {
      const v = r / (newGrid.rows - 1);
      const oldR = v * (oldRows - 1);
      const r0 = Math.floor(oldR);
      const r1 = Math.min(oldRows - 1, r0 + 1);
      const fv = oldR - r0;

      for (let c = 0; c < newGrid.cols; c++) {
        const u = c / (newGrid.cols - 1);
        const oldC = u * (oldCols - 1);
        const c0 = Math.floor(oldC);
        const c1 = Math.min(oldCols - 1, c0 + 1);
        const fu = oldC - c0;

        const n00 = existingGrid.nodes[r0][c0];
        const n01 = existingGrid.nodes[r0][c1];
        const n10 = existingGrid.nodes[r1][c0];
        const n11 = existingGrid.nodes[r1][c1];

        // Bilinear interpolation of destination coordinates
        const ix0 = n00.x + (n01.x - n00.x) * fu;
        const ix1 = n10.x + (n11.x - n10.x) * fu;
        const interpX = ix0 + (ix1 - ix0) * fv;

        const iy0 = n00.y + (n01.y - n00.y) * fu;
        const iy1 = n10.y + (n11.y - n10.y) * fu;
        const interpY = iy0 + (iy1 - iy0) * fv;

        newGrid.nodes[r][c].x = interpX;
        newGrid.nodes[r][c].y = interpY;
      }
    }

    return newGrid;
  }

  /**
   * Reset mesh grid nodes back to their original rectangular positions
   */
  public static resetMeshGrid(grid: MeshWarpGrid) {
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        grid.nodes[r][c].x = grid.nodes[r][c].origX;
        grid.nodes[r][c].y = grid.nodes[r][c].origY;
      }
    }
  }

  /**
   * Rotate entire mesh grid around its center by angleDeltaDeg
   */
  public static rotateMeshGrid(grid: MeshWarpGrid, angleDeltaDeg: number) {
    if (!grid || !grid.nodes || grid.nodes.length === 0) return;
    const rad = (angleDeltaDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const row of grid.nodes) {
      for (const node of row) {
        if (node.x < minX) minX = node.x;
        if (node.x > maxX) maxX = node.x;
        if (node.y < minY) minY = node.y;
        if (node.y > maxY) maxY = node.y;
      }
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    for (const row of grid.nodes) {
      for (const node of row) {
        const dx = node.x - cx;
        const dy = node.y - cy;
        node.x = cx + dx * cos - dy * sin;
        node.y = cy + dx * sin + dy * cos;
      }
    }
  }

  /**
   * Get the top 360-degree rotation knob position for mesh grid
   */
  public static getMeshRotationKnob(grid: MeshWarpGrid, zoom: number = 1): { x: number; y: number; anchorX: number; anchorY: number } | null {
    if (!grid || !grid.nodes || grid.nodes.length === 0) return null;
    const topRow = grid.nodes[0];
    if (!topRow || topRow.length === 0) return null;

    // Anchor is center of top edge
    const midIdx = Math.floor(topRow.length / 2);
    const anchorX = topRow.length % 2 === 1
      ? topRow[midIdx].x
      : (topRow[midIdx - 1].x + topRow[midIdx].x) / 2;
    const anchorY = topRow.length % 2 === 1
      ? topRow[midIdx].y
      : (topRow[midIdx - 1].y + topRow[midIdx].y) / 2;

    const stemLength = Math.max(30, 36 / Math.max(0.1, zoom));
    return {
      anchorX,
      anchorY,
      x: anchorX,
      y: anchorY - stemLength,
    };
  }

  /**
   * Hit test the rotation handle knob
   */
  public static hitTestMeshRotationKnob(grid: MeshWarpGrid, px: number, py: number, zoom: number = 1): boolean {
    const knob = this.getMeshRotationKnob(grid, zoom);
    if (!knob) return false;
    const hitRadius = Math.max(20, 24 / Math.max(0.1, zoom));
    return Math.hypot(knob.x - px, knob.y - py) <= hitRadius;
  }

  /**
   * Apply curve presets to mesh grid (Arc, Bulge, Wave, S-Curve, etc.)
   */
  public static applyCurvePreset(
    grid: MeshWarpGrid,
    preset: 'arc-up' | 'arc-down' | 'arc-left' | 'arc-right' | 'bulge' | 'pinch' | 'wave' | 'flag' | 's-curve',
    strength: number = 0.35
  ) {
    const { rows, cols, nodes, bounds } = grid;
    const w = bounds.width;
    const h = bounds.height;

    for (let r = 0; r < rows; r++) {
      const v = r / (rows - 1);
      const ny = v * 2 - 1; // -1 to 1

      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const nx = u * 2 - 1; // -1 to 1

        let dx = 0;
        let dy = 0;

        if (preset === 'arc-up') {
          // Parabolic curve bending upwards
          const arc = (1 - nx * nx) * h * strength;
          dy = -arc;
        } else if (preset === 'arc-down') {
          // Parabolic curve bending downwards
          const arc = (1 - nx * nx) * h * strength;
          dy = arc;
        } else if (preset === 'arc-left') {
          // Parabolic curve bending to the left
          const arc = (1 - ny * ny) * w * strength;
          dx = -arc;
        } else if (preset === 'arc-right') {
          // Parabolic curve bending to the right
          const arc = (1 - ny * ny) * w * strength;
          dx = arc;
        } else if (preset === 'bulge') {
          // Spherical bulge outward from center
          const dist = Math.sqrt(nx * nx + ny * ny);
          const factor = Math.cos(Math.min(Math.PI / 2, dist * (Math.PI / 2))) * strength;
          dx = nx * factor * (w * 0.4);
          dy = ny * factor * (h * 0.4);
        } else if (preset === 'pinch') {
          // Pinch inward towards center
          const dist = Math.sqrt(nx * nx + ny * ny);
          const factor = (1 - Math.min(1, dist)) * strength;
          dx = -nx * factor * (w * 0.35);
          dy = -ny * factor * (h * 0.35);
        } else if (preset === 'wave') {
          // Sine wave horizontal deformation
          dy = Math.sin(u * Math.PI * 2) * (h * strength * 0.5);
        } else if (preset === 'flag') {
          // Flag ripple wave
          dy = Math.sin(u * Math.PI * 2.5) * (h * strength * 0.4) * u;
        } else if (preset === 's-curve') {
          // S-curve bend
          dx = Math.sin(v * Math.PI * 2) * (w * strength * 0.3);
        }

        nodes[r][c].x = nodes[r][c].origX + dx;
        nodes[r][c].y = nodes[r][c].origY + dy;
      }
    }
  }

  /**
   * Hit test a control node in Mesh Form grid
   */
  public static hitTestMeshNode(
    grid: MeshWarpGrid,
    px: number,
    py: number,
    radius: number = 14
  ): { row: number; col: number } | null {
    let closestDist = radius;
    let hit: { row: number; col: number } | null = null;

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const node = grid.nodes[r][c];
        const dist = Math.hypot(node.x - px, node.y - py);
        if (dist <= closestDist) {
          closestDist = dist;
          hit = { row: r, col: c };
        }
      }
    }

    return hit;
  }

  /**
   * Render mesh-warped layer content onto destination context
   */
  public static renderMeshWarp(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    grid: MeshWarpGrid,
    smoothness: number = 2
  ) {
    const { rows, cols, nodes } = grid;
    if (rows < 2 || cols < 2) return;

    const subdiv = Math.max(1, Math.min(4, Math.round(smoothness)));

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Loop through each quad patch
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const p00 = nodes[r][c];
        const p01 = nodes[r][c + 1];
        const p10 = nodes[r + 1][c];
        const p11 = nodes[r + 1][c + 1];

        // Subdivide the quad patch for butter-smooth organic curvature
        for (let si = 0; si < subdiv; si++) {
          const v0 = si / subdiv;
          const v1 = (si + 1) / subdiv;

          for (let sj = 0; sj < subdiv; sj++) {
            const u0 = sj / subdiv;
            const u1 = (sj + 1) / subdiv;

            // Compute destination points
            const d00 = this.quadLerp(p00, p01, p10, p11, u0, v0);
            const d01 = this.quadLerp(p00, p01, p10, p11, u1, v0);
            const d10 = this.quadLerp(p00, p01, p10, p11, u0, v1);
            const d11 = this.quadLerp(p00, p01, p10, p11, u1, v1);

            // Compute source points (original UV coordinates)
            const s00 = this.quadOrigLerp(p00, p01, p10, p11, u0, v0);
            const s01 = this.quadOrigLerp(p00, p01, p10, p11, u1, v0);
            const s10 = this.quadOrigLerp(p00, p01, p10, p11, u0, v1);
            const s11 = this.quadOrigLerp(p00, p01, p10, p11, u1, v1);

            // Triangle 1: (d00, d01, d10) from (s00, s01, s10)
            this.drawAffineTriangle(
              ctx,
              sourceCanvas,
              d00.x,
              d00.y,
              s00.x,
              s00.y,
              d01.x,
              d01.y,
              s01.x,
              s01.y,
              d10.x,
              d10.y,
              s10.x,
              s10.y
            );

            // Triangle 2: (d01, d11, d10) from (s01, s11, s10)
            this.drawAffineTriangle(
              ctx,
              sourceCanvas,
              d01.x,
              d01.y,
              s01.x,
              s01.y,
              d11.x,
              d11.y,
              s11.x,
              s11.y,
              d10.x,
              d10.y,
              s10.x,
              s10.y
            );
          }
        }
      }
    }

    ctx.restore();
  }

  /**
   * Render 4-corner perspective warp
   */
  public static renderPerspectiveWarp(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    bounds: { x: number; y: number; width: number; height: number },
    corners: [Point, Point, Point, Point], // TL, TR, BR, BL
    subdiv: number = 4
  ) {
    const [cTL, cTR, cBR, cBL] = corners;
    const sTL: Point = { x: bounds.x, y: bounds.y };
    const sTR: Point = { x: bounds.x + bounds.width, y: bounds.y };
    const sBR: Point = { x: bounds.x + bounds.width, y: bounds.y + bounds.height };
    const sBL: Point = { x: bounds.x, y: bounds.y + bounds.height };

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    for (let si = 0; si < subdiv; si++) {
      const v0 = si / subdiv;
      const v1 = (si + 1) / subdiv;

      for (let sj = 0; sj < subdiv; sj++) {
        const u0 = sj / subdiv;
        const u1 = (sj + 1) / subdiv;

        const d00 = this.cornerLerp(cTL, cTR, cBL, cBR, u0, v0);
        const d01 = this.cornerLerp(cTL, cTR, cBL, cBR, u1, v0);
        const d10 = this.cornerLerp(cTL, cTR, cBL, cBR, u0, v1);
        const d11 = this.cornerLerp(cTL, cTR, cBL, cBR, u1, v1);

        const s00 = this.cornerLerp(sTL, sTR, sBL, sBR, u0, v0);
        const s01 = this.cornerLerp(sTL, sTR, sBL, sBR, u1, v0);
        const s10 = this.cornerLerp(sTL, sTR, sBL, sBR, u0, v1);
        const s11 = this.cornerLerp(sTL, sTR, sBL, sBR, u1, v1);

        this.drawAffineTriangle(
          ctx,
          sourceCanvas,
          d00.x,
          d00.y,
          s00.x,
          s00.y,
          d01.x,
          d01.y,
          s01.x,
          s01.y,
          d10.x,
          d10.y,
          s10.x,
          s10.y
        );

        this.drawAffineTriangle(
          ctx,
          sourceCanvas,
          d01.x,
          d01.y,
          s01.x,
          s01.y,
          d11.x,
          d11.y,
          s11.x,
          s11.y,
          d10.x,
          d10.y,
          s10.x,
          s10.y
        );
      }
    }

    ctx.restore();
  }

  /**
   * Resamples canvas with multi-step half-stride downsampling to prevent pixel skipping
   * and line degradation when scaling down (ছোট করলে লাইন বা ড্রইং যেন নষ্ট না হয়)
   */
  public static getHighQualityScaledCanvas(
    sourceCanvas: HTMLCanvasElement,
    scaleX: number,
    scaleY: number
  ): HTMLCanvasElement {
    if (scaleX >= 0.5 && scaleY >= 0.5) {
      return sourceCanvas;
    }

    let curCanvas = sourceCanvas;
    let curScaleX = 1;
    let curScaleY = 1;

    // Halve the resolution progressively until within 2x of target scale
    while (curScaleX * 0.5 >= scaleX * 0.75 && curScaleY * 0.5 >= scaleY * 0.75) {
      const nextW = Math.max(1, Math.round(curCanvas.width * 0.5));
      const nextH = Math.max(1, Math.round(curCanvas.height * 0.5));
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = nextW;
      nextCanvas.height = nextH;
      const nCtx = nextCanvas.getContext('2d');
      if (nCtx) {
        nCtx.imageSmoothingEnabled = true;
        nCtx.imageSmoothingQuality = 'high';
        nCtx.drawImage(curCanvas, 0, 0, nextW, nextH);
      }
      curCanvas = nextCanvas;
      curScaleX *= 0.5;
      curScaleY *= 0.5;
    }

    return curCanvas;
  }

  /**
   * Render Translate / Scale / 360 Rotation with ultra-high fidelity preservation
   */
  public static renderTranslateScaleRotate(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    bounds: { x: number; y: number; width: number; height: number },
    translation: Point,
    scale: Point,
    rotationDeg: number
  ) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const rawCenterX = bounds.x + bounds.width / 2 + translation.x;
    const rawCenterY = bounds.y + bounds.height / 2 + translation.y;
    const rad = (rotationDeg * Math.PI) / 180;

    const isPureTranslation = Math.abs(rotationDeg % 360) < 0.01 && Math.abs(scale.x - 1) < 0.001 && Math.abs(scale.y - 1) < 0.001;
    const centerX = isPureTranslation ? Math.round(rawCenterX) : rawCenterX;
    const centerY = isPureTranslation ? Math.round(rawCenterY) : rawCenterY;

    ctx.translate(centerX, centerY);
    if (!isPureTranslation) {
      ctx.rotate(rad);
    }

    // When scaling down (< 0.5), use progressive mipmap downsampling to protect delicate drawing lines
    if (scale.x < 0.5 || scale.y < 0.5) {
      const downsampledCanvas = this.getHighQualityScaledCanvas(
        sourceCanvas,
        Math.max(0.01, scale.x),
        Math.max(0.01, scale.y)
      );

      const ratioX = downsampledCanvas.width / sourceCanvas.width;
      const ratioY = downsampledCanvas.height / sourceCanvas.height;

      ctx.scale(scale.x / ratioX, scale.y / ratioY);
      ctx.drawImage(
        downsampledCanvas,
        -(bounds.x + bounds.width / 2) * ratioX,
        -(bounds.y + bounds.height / 2) * ratioY
      );
    } else {
      if (!isPureTranslation) {
        ctx.scale(scale.x, scale.y);
      }
      ctx.drawImage(sourceCanvas, -(bounds.x + bounds.width / 2), -(bounds.y + bounds.height / 2));
    }

    ctx.restore();
  }

  /**
   * Render UI overlay wireframe & control nodes for Mesh Form
   */
  public static drawMeshGridOverlay(
    ctx: CanvasRenderingContext2D,
    grid: MeshWarpGrid,
    selectedNode: { row: number; col: number } | null,
    zoom: number = 1
  ) {
    const { rows, cols, nodes } = grid;

    ctx.save();

    const z = Math.max(0.1, zoom);
    const lineWidth = Math.max(1.5, 2 / z);
    const nodeRadius = Math.max(5, 7 / z);
    const haloRadius = Math.max(9, 13 / z);

    // 1. Draw smooth mesh curve lines (blue vibrant style like Ibis Paint)
    ctx.strokeStyle = '#0284c7'; // Cyan/Sky blue
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([]);

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(nodes[r][0].x, nodes[r][0].y);
      for (let c = 1; c < cols; c++) {
        ctx.lineTo(nodes[r][c].x, nodes[r][c].y);
      }
      ctx.stroke();
    }

    // Vertical lines
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(nodes[0][c].x, nodes[0][c].y);
      for (let r = 1; r < rows; r++) {
        ctx.lineTo(nodes[r][c].x, nodes[r][c].y);
      }
      ctx.stroke();
    }

    // 2. Draw 360-degree rotation stem & handle knob at top
    const knob = this.getMeshRotationKnob(grid, zoom);
    if (knob) {
      // Dashed stem line
      ctx.beginPath();
      ctx.setLineDash([4 / z, 4 / z]);
      ctx.moveTo(knob.anchorX, knob.anchorY);
      ctx.lineTo(knob.x, knob.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotation knob circle
      const knobRadius = Math.max(6, 9 / z);
      ctx.beginPath();
      ctx.arc(knob.x, knob.y, knobRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, 2.5 / z);
      ctx.stroke();

      // Little rotation symbol or center dot inside knob
      ctx.beginPath();
      ctx.arc(knob.x, knob.y, knobRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // 3. Draw circular control nodes
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const node = nodes[r][c];
        const isSelected = selectedNode && selectedNode.row === r && selectedNode.col === c;

        ctx.beginPath();
        if (isSelected) {
          // Pulsing halo
          ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius * 1.15, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = Math.max(2.5, 3.5 / z);
          ctx.stroke();
        } else {
          ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#0284c7';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.8, 2.2 / z);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Render UI overlay wireframe for Perspective Form
   */
  public static drawPerspectiveOverlay(
    ctx: CanvasRenderingContext2D,
    corners: [Point, Point, Point, Point],
    activeCornerIndex: number | null
  ) {
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
    ctx.stroke();

    // Corner handle circles
    corners.forEach((corner, idx) => {
      const isSelected = activeCornerIndex === idx;
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    ctx.restore();
  }

  /**
   * Bilinear quad interpolation helper
   */
  private static quadLerp(
    p00: MeshWarpNode,
    p01: MeshWarpNode,
    p10: MeshWarpNode,
    p11: MeshWarpNode,
    u: number,
    v: number
  ): Point {
    return {
      x:
        (1 - u) * (1 - v) * p00.x +
        u * (1 - v) * p01.x +
        (1 - u) * v * p10.x +
        u * v * p11.x,
      y:
        (1 - u) * (1 - v) * p00.y +
        u * (1 - v) * p01.y +
        (1 - u) * v * p10.y +
        u * v * p11.y,
    };
  }

  private static quadOrigLerp(
    p00: MeshWarpNode,
    p01: MeshWarpNode,
    p10: MeshWarpNode,
    p11: MeshWarpNode,
    u: number,
    v: number
  ): Point {
    return {
      x:
        (1 - u) * (1 - v) * p00.origX +
        u * (1 - v) * p01.origX +
        (1 - u) * v * p10.origX +
        u * v * p11.origX,
      y:
        (1 - u) * (1 - v) * p00.origY +
        u * (1 - v) * p01.origY +
        (1 - u) * v * p10.origY +
        u * v * p11.origY,
    };
  }

  private static cornerLerp(
    cTL: Point,
    cTR: Point,
    cBL: Point,
    cBR: Point,
    u: number,
    v: number
  ): Point {
    return {
      x:
        (1 - u) * (1 - v) * cTL.x +
        u * (1 - v) * cTR.x +
        (1 - u) * v * cBL.x +
        u * v * cBR.x,
      y:
        (1 - u) * (1 - v) * cTL.y +
        u * (1 - v) * cTR.y +
        (1 - u) * v * cBL.y +
        u * v * cBR.y,
    };
  }

  /**
   * Fast affine triangle texture mapper
   */
  private static drawAffineTriangle(
    ctx: CanvasRenderingContext2D,
    image: HTMLCanvasElement,
    x0: number,
    y0: number,
    u0: number,
    v0: number,
    x1: number,
    y1: number,
    u1: number,
    v1: number,
    x2: number,
    y2: number,
    u2: number,
    v2: number
  ) {
    ctx.save();

    // Triangle centroid
    const cx = (x0 + x1 + x2) / 3;
    const cy = (y0 + y1 + y2) / 3;

    // Slight dilation (0.35px) to eliminate seams between adjacent triangles
    const px0 = x0 + (x0 - cx) * 0.015;
    const py0 = y0 + (y0 - cy) * 0.015;
    const px1 = x1 + (x1 - cx) * 0.015;
    const py1 = y1 + (y1 - cy) * 0.015;
    const px2 = x2 + (x2 - cx) * 0.015;
    const py2 = y2 + (y2 - cy) * 0.015;

    ctx.beginPath();
    ctx.moveTo(px0, py0);
    ctx.lineTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.closePath();
    ctx.clip();

    const delta = u0 * (v1 - v2) - v0 * (u1 - u2) + (u1 * v2 - u2 * v1);
    if (Math.abs(delta) > 1e-6) {
      const a = (x0 * (v1 - v2) - v0 * (x1 - x2) + (x1 * v2 - x2 * v1)) / delta;
      const b = (y0 * (v1 - v2) - v0 * (y1 - y2) + (y1 * v2 - y2 * v1)) / delta;
      const c = (u0 * (x1 - x2) - x0 * (u1 - u2) + (u1 * x2 - u2 * x1)) / delta;
      const d = (u0 * (y1 - y2) - y0 * (u1 - u2) + (u1 * y2 - u2 * y1)) / delta;
      const e = (u0 * (v1 * x2 - v2 * x1) - v0 * (u1 * x2 - u2 * x1) + x0 * (u1 * v2 - u2 * v1)) / delta;
      const f = (u0 * (v1 * y2 - v2 * y1) - v0 * (u1 * y2 - u2 * y1) + y0 * (u1 * v2 - u2 * v1)) / delta;

      ctx.transform(a, b, c, d, e, f);
      ctx.drawImage(image, 0, 0);
    }

    ctx.restore();
  }
}
