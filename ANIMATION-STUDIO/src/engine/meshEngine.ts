import { MeshGridData, MeshNode } from '../types';

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function hexToRgba(hex: string): RGBA {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 59, g: 130, b: 246, a: 1 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 1,
  };
}

function rgbaToString(c: RGBA): string {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${c.a.toFixed(2)})`;
}

function lerpRgba(c1: RGBA, c2: RGBA, t: number): RGBA {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
    a: c1.a + (c2.a - c1.a) * t,
  };
}

export class MeshEngine {
  /**
   * Create an initial gradient mesh form with optional presets
   */
  public static createMeshGrid(
    rows: number = 3,
    cols: number = 3,
    x: number = 200,
    y: number = 200,
    width: number = 400,
    height: number = 400,
    preset: string = 'sphere-3d',
    primaryColor: string = '#06b6d4',
    secondaryColor: string = '#8b5cf6'
  ): MeshGridData {
    const nodes: MeshNode[][] = [];

    // Clamp rows & cols
    const rCount = Math.max(2, Math.min(10, rows));
    const cCount = Math.max(2, Math.min(10, cols));

    const pColor = hexToRgba(primaryColor);
    const sColor = hexToRgba(secondaryColor);

    for (let r = 0; r < rCount; r++) {
      const rowNodes: MeshNode[] = [];
      const v = r / (rCount - 1);

      for (let c = 0; c < cCount; c++) {
        const u = c / (cCount - 1);

        let px = x + u * width;
        let py = y + v * height;
        let nodeColor = rgbaToString(lerpRgba(pColor, sColor, (u + v) / 2));

        if (preset === 'sphere-3d') {
          // Bulge coordinates outward to form a 3D spherical volume
          const nx = u * 2 - 1;
          const ny = v * 2 - 1;
          const dist = Math.sqrt(nx * nx + ny * ny);
          const bulge = Math.cos(Math.min(Math.PI / 2, dist * (Math.PI / 2.2))) * 0.28;
          px += nx * bulge * width;
          py += ny * bulge * height;

          // 3D Sphere Lighting with top-left specular highlight and bottom-right shadow
          const lightDist = Math.hypot(u - 0.28, v - 0.28);
          if (lightDist < 0.22) {
            // Specular Highlight
            nodeColor = '#ffffff';
          } else if (u < 0.5 && v < 0.5) {
            // High midtone
            nodeColor = '#38bdf8';
          } else if (u > 0.7 || v > 0.7) {
            // Ambient Shadow
            nodeColor = '#1e1b4b';
          } else {
            // Core color
            nodeColor = '#4f46e5';
          }
        } else if (preset === 'sunset') {
          // Multitone Sunset Horizon
          if (v < 0.25) nodeColor = '#312e81'; // Deep sky
          else if (v < 0.5) nodeColor = '#ec4899'; // Magenta clouds
          else if (v < 0.75) nodeColor = '#f97316'; // Orange glow
          else nodeColor = '#fef08a'; // Golden ground reflection
        } else if (preset === 'aurora') {
          // Cyberpunk Aurora
          const wave = Math.sin(u * Math.PI * 2) * 25;
          py += wave;
          if (r % 2 === 0) {
            nodeColor = c % 2 === 0 ? '#10b981' : '#06b6d4';
          } else {
            nodeColor = c % 2 === 0 ? '#8b5cf6' : '#ec4899';
          }
        } else if (preset === 'wave') {
          // Fabric Silk Flow
          const waveX = Math.sin(v * Math.PI * 3) * 35;
          const waveY = Math.cos(u * Math.PI * 3) * 35;
          px += waveX;
          py += waveY;
          nodeColor = (r + c) % 2 === 0 ? '#6366f1' : '#c084fc';
        } else if (preset === 'fruit') {
          // Apple / Organic Fruit Form
          const nx = u * 2 - 1;
          const ny = v * 2 - 1;
          if (r === 0 && (c === 1 || c === cCount - 2)) {
            py += height * 0.08; // Stem indentation
          }
          if (u < 0.35 && v < 0.4) nodeColor = '#fef08a'; // Yellow blush
          else if (u > 0.6 && v > 0.6) nodeColor = '#881337'; // Deep shadow
          else nodeColor = '#dc2626'; // Vibrant red
        }

        rowNodes.push({
          x: px,
          y: py,
          color: nodeColor,
        });
      }
      nodes.push(rowNodes);
    }

    return {
      rows: rCount,
      cols: cCount,
      nodes,
    };
  }

  /**
   * Render Gradient Mesh on Canvas with smooth multi-color patch interpolation
   */
  public static renderMesh(
    ctx: CanvasRenderingContext2D,
    mesh: MeshGridData,
    isSelected: boolean = false,
    showWireframe: boolean = true,
    selectedNode?: { row: number; col: number } | null
  ) {
    const { rows, cols, nodes } = mesh;
    if (rows < 2 || cols < 2 || !nodes || nodes.length < rows) return;

    ctx.save();

    // 1. Render all quad patches using bilinear subdivision
    // For each quad (r, c) to (r+1, c+1)
    const SUBDIV = 3; // 3x3 subdivision per patch for smooth gradients

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const p00 = nodes[r][c];
        const p01 = nodes[r][c + 1];
        const p10 = nodes[r + 1][c];
        const p11 = nodes[r + 1][c + 1];

        const c00 = hexToRgba(p00.color);
        const c01 = hexToRgba(p01.color);
        const c10 = hexToRgba(p10.color);
        const c11 = hexToRgba(p11.color);

        // Subdivide the patch into smaller quads
        for (let si = 0; si < SUBDIV; si++) {
          const v0 = si / SUBDIV;
          const v1 = (si + 1) / SUBDIV;

          for (let sj = 0; sj < SUBDIV; sj++) {
            const u0 = sj / SUBDIV;
            const u1 = (sj + 1) / SUBDIV;

            // Compute the 4 corner points
            const pt00 = this.interpolateQuad(p00, p01, p10, p11, u0, v0);
            const pt01 = this.interpolateQuad(p00, p01, p10, p11, u1, v0);
            const pt10 = this.interpolateQuad(p00, p01, p10, p11, u0, v1);
            const pt11 = this.interpolateQuad(p00, p01, p10, p11, u1, v1);

            // Compute center color
            const uc = (u0 + u1) / 2;
            const vc = (v0 + v1) / 2;
            const colTop = lerpRgba(c00, c01, uc);
            const colBottom = lerpRgba(c10, c11, uc);
            const colCenter = lerpRgba(colTop, colBottom, vc);

            // Draw quad
            ctx.beginPath();
            ctx.moveTo(pt00.x, pt00.y);
            ctx.lineTo(pt01.x, pt01.y);
            ctx.lineTo(pt11.x, pt11.y);
            ctx.lineTo(pt10.x, pt10.y);
            ctx.closePath();

            ctx.fillStyle = rgbaToString(colCenter);
            ctx.strokeStyle = rgbaToString(colCenter);
            ctx.lineWidth = 0.8;
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }

    // 2. Render Interactive Wireframe & Mesh Nodes if selected or wireframe is enabled
    if (showWireframe || isSelected) {
      // Mesh Grid Lines
      ctx.save();
      ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.75)' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Horizontal mesh curves
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(nodes[r][0].x, nodes[r][0].y);
        for (let c = 1; c < cols; c++) {
          ctx.lineTo(nodes[r][c].x, nodes[r][c].y);
        }
        ctx.stroke();
      }

      // Vertical mesh curves
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(nodes[0][c].x, nodes[0][c].y);
        for (let r = 1; r < rows; r++) {
          ctx.lineTo(nodes[r][c].x, nodes[r][c].y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Mesh Control Node Points
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const node = nodes[r][c];
          const isNodeActive = selectedNode && selectedNode.row === r && selectedNode.col === c;

          ctx.save();
          if (isNodeActive) {
            // Glow ring for active selected mesh node
            ctx.beginPath();
            ctx.arc(node.x, node.y, 9, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else {
            // Normal node point showing its current assigned color
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Bilinear interpolation for a quad patch
   */
  private static interpolateQuad(
    p00: MeshNode,
    p01: MeshNode,
    p10: MeshNode,
    p11: MeshNode,
    u: number,
    v: number
  ): { x: number; y: number } {
    const x =
      (1 - u) * (1 - v) * p00.x +
      u * (1 - v) * p01.x +
      (1 - u) * v * p10.x +
      u * v * p11.x;
    const y =
      (1 - u) * (1 - v) * p00.y +
      u * (1 - v) * p01.y +
      (1 - u) * v * p10.y +
      u * v * p11.y;
    return { x, y };
  }

  /**
   * Hit test against mesh control points
   */
  public static hitTestMeshNode(
    mesh: MeshGridData,
    px: number,
    py: number,
    threshold: number = 10
  ): { row: number; col: number } | null {
    const { rows, cols, nodes } = mesh;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const node = nodes[r][c];
        const dist = Math.hypot(node.x - px, node.y - py);
        if (dist <= threshold) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  /**
   * Move a specific mesh node (warp/deform the mesh form)
   */
  public static moveMeshNode(
    mesh: MeshGridData,
    row: number,
    col: number,
    dx: number,
    dy: number
  ) {
    if (mesh.nodes[row] && mesh.nodes[row][col]) {
      mesh.nodes[row][col].x += dx;
      mesh.nodes[row][col].y += dy;
    }
  }

  /**
   * Change a specific mesh node's color
   */
  public static setNodeColor(
    mesh: MeshGridData,
    row: number,
    col: number,
    color: string
  ) {
    if (mesh.nodes[row] && mesh.nodes[row][col]) {
      mesh.nodes[row][col].color = color;
    }
  }

  /**
   * Calculate bounding box of the whole mesh
   */
  public static getMeshBounds(mesh: MeshGridData): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const row of mesh.nodes) {
      for (const node of row) {
        if (node.x < minX) minX = node.x;
        if (node.y < minY) minY = node.y;
        if (node.x > maxX) maxX = node.x;
        if (node.y > maxY) maxY = node.y;
      }
    }

    if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX, minY, maxX, maxY };
  }

  /**
   * Translate entire mesh by delta x and delta y
   */
  public static moveMesh(mesh: MeshGridData, dx: number, dy: number) {
    for (const row of mesh.nodes) {
      for (const node of row) {
        node.x += dx;
        node.y += dy;
      }
    }
  }
}
