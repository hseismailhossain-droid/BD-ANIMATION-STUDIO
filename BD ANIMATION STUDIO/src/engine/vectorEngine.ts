import { VectorNode, VectorShape } from '../types';
import { MeshEngine } from './meshEngine';

export class VectorEngine {
  /**
   * Render vector shapes onto a 2D Canvas context
   */
  public static renderShapes(
    ctx: CanvasRenderingContext2D,
    shapes: VectorShape[],
    selectedShapeId?: string,
    isInteractive: boolean = false
  ) {
    for (const shape of shapes) {
      if (shape.type === 'mesh' && shape.meshData) {
        MeshEngine.renderMesh(
          ctx,
          shape.meshData,
          shape.id === selectedShapeId,
          isInteractive || shape.id === selectedShapeId
        );
        continue;
      }

      ctx.save();

      ctx.lineWidth = shape.strokeWidth;
      ctx.strokeStyle = shape.strokeColor;
      ctx.fillStyle = shape.fillColor;
      ctx.lineCap = shape.lineCap || 'round';
      ctx.lineJoin = shape.lineJoin || 'round';

      if (shape.dash && shape.dash.length > 0) {
        ctx.setLineDash(shape.dash);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();

      switch (shape.type) {
        case 'rect': {
          const x = shape.x || 0;
          const y = shape.y || 0;
          const w = shape.width || 0;
          const h = shape.height || 0;
          if (shape.cornerRadius && shape.cornerRadius > 0 && typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, Math.min(Math.abs(w) / 2, Math.abs(h) / 2, shape.cornerRadius));
          } else {
            ctx.rect(x, y, w, h);
          }
          break;
        }

        case 'circle': {
          const x = (shape.x || 0) + (shape.width || 0) / 2;
          const y = (shape.y || 0) + (shape.height || 0) / 2;
          const rx = Math.abs((shape.width || 0) / 2);
          const ry = Math.abs((shape.height || 0) / 2);
          ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
          break;
        }

        case 'line': {
          const x1 = shape.x || 0;
          const y1 = shape.y || 0;
          const x2 = x1 + (shape.width || 0);
          const y2 = y1 + (shape.height || 0);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          break;
        }

        case 'polygon':
        case 'star': {
          const cx = (shape.x || 0) + (shape.width || 0) / 2;
          const cy = (shape.y || 0) + (shape.height || 0) / 2;
          const r = Math.max(0.1, Math.min(Math.abs(shape.width || 0), Math.abs(shape.height || 0)) / 2);
          const points = shape.type === 'star' ? 5 : shape.sides || 6;

          if (shape.type === 'star') {
            const innerR = r * 0.4;
            for (let i = 0; i < points * 2; i++) {
              const radius = i % 2 === 0 ? r : innerR;
              const angle = (i * Math.PI) / points - Math.PI / 2;
              const px = cx + Math.cos(angle) * radius;
              const py = cy + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
          } else {
            for (let i = 0; i < points; i++) {
              const angle = (i * 2 * Math.PI) / points - Math.PI / 2;
              const px = cx + Math.cos(angle) * r;
              const py = cy + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
          }
          ctx.closePath();
          break;
        }

        case 'path': {
          if (shape.points && shape.points.length > 0) {
            const pts = shape.points;
            ctx.moveTo(pts[0].x, pts[0].y);

            for (let i = 0; i < pts.length - 1; i++) {
              const curr = pts[i];
              const next = pts[i + 1];

              const cp1 = curr.handleOut || { x: curr.x, y: curr.y };
              const cp2 = next.handleIn || { x: next.x, y: next.y };

              ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, next.x, next.y);
            }

            if (shape.closed) {
              const last = pts[pts.length - 1];
              const first = pts[0];
              const cp1 = last.handleOut || { x: last.x, y: last.y };
              const cp2 = first.handleIn || { x: first.x, y: first.y };
              ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, first.x, first.y);
              ctx.closePath();
            }
          }
          break;
        }
      }

      if (shape.hasFill && shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      if (shape.hasStroke && shape.strokeWidth > 0 && shape.strokeColor !== 'transparent') {
        ctx.stroke();
      }

      // Draw bounding box / anchor points if selected
      if (isInteractive && shape.id === selectedShapeId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        if (shape.type === 'path' && shape.points) {
          // Draw anchors & handles
          for (const node of shape.points) {
            // Anchor point
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.rect(node.x - 4, node.y - 4, 8, 8);
            ctx.fill();
            ctx.stroke();

            // Handle In
            if (node.handleIn) {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(node.handleIn.x, node.handleIn.y);
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(node.handleIn.x, node.handleIn.y, 3, 0, Math.PI * 2);
              ctx.fillStyle = '#60a5fa';
              ctx.fill();
            }

            // Handle Out
            if (node.handleOut) {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(node.handleOut.x, node.handleOut.y);
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(node.handleOut.x, node.handleOut.y, 3, 0, Math.PI * 2);
              ctx.fillStyle = '#60a5fa';
              ctx.fill();
            }
          }
        } else if (shape.x !== undefined && shape.y !== undefined && shape.width !== undefined && shape.height !== undefined) {
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
      }

      ctx.restore();
    }
  }

  /**
   * Export vector shapes to clean SVG format
   */
  public static exportToSVG(shapes: VectorShape[], width: number, height: number): string {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;

    for (const shape of shapes) {
      const stroke = shape.hasStroke ? shape.strokeColor : 'none';
      const fill = shape.hasFill ? shape.fillColor : 'none';
      const strokeW = shape.strokeWidth;
      const cap = shape.lineCap || 'round';
      const join = shape.lineJoin || 'round';

      switch (shape.type) {
        case 'rect': {
          svgContent += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linecap="${cap}" stroke-linejoin="${join}" />\n`;
          break;
        }

        case 'circle': {
          const cx = (shape.x || 0) + (shape.width || 0) / 2;
          const cy = (shape.y || 0) + (shape.height || 0) / 2;
          const rx = Math.abs((shape.width || 0) / 2);
          const ry = Math.abs((shape.height || 0) / 2);
          svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />\n`;
          break;
        }

        case 'line': {
          const x1 = shape.x || 0;
          const y1 = shape.y || 0;
          const x2 = x1 + (shape.width || 0);
          const y2 = y1 + (shape.height || 0);
          svgContent += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linecap="${cap}" />\n`;
          break;
        }

        case 'path': {
          if (shape.points && shape.points.length > 0) {
            let d = `M ${shape.points[0].x} ${shape.points[0].y} `;
            for (let i = 0; i < shape.points.length - 1; i++) {
              const curr = shape.points[i];
              const next = shape.points[i + 1];
              const cp1 = curr.handleOut || { x: curr.x, y: curr.y };
              const cp2 = next.handleIn || { x: next.x, y: next.y };
              d += `C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y} `;
            }
            if (shape.closed) {
              const last = shape.points[shape.points.length - 1];
              const first = shape.points[0];
              const cp1 = last.handleOut || { x: last.x, y: last.y };
              const cp2 = first.handleIn || { x: first.x, y: first.y };
              d += `C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${first.x} ${first.y} Z`;
            }
            svgContent += `  <path d="${d.trim()}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linecap="${cap}" stroke-linejoin="${join}" />\n`;
          }
          break;
        }
      }
    }

    svgContent += '</svg>';
    return svgContent;
  }

  /**
   * Hit test a coordinate against vector shapes (returns top-most shape)
   */
  public static hitTestShape(shapes: VectorShape[], px: number, py: number): VectorShape | null {
    if (!shapes || shapes.length === 0) return null;
    // Traverse in reverse (top to bottom)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      const bounds = this.getShapeBounds(shape);
      // Generous hit tolerance for effortless mouse click and mobile touch
      const tol = Math.max(30, (shape.strokeWidth || 4) / 2 + 18);

      if (
        px >= bounds.minX - tol &&
        px <= bounds.maxX + tol &&
        py >= bounds.minY - tol &&
        py <= bounds.maxY + tol
      ) {
        return shape;
      }
    }
    return null;
  }

  /**
   * Hit test an individual anchor point / node in a path shape
   */
  public static hitTestAnchorNode(
    shape: VectorShape,
    px: number,
    py: number,
    radius: number = 28
  ): { index: number; node: VectorNode } | null {
    if (shape.type !== 'path' || !shape.points) return null;
    for (let i = 0; i < shape.points.length; i++) {
      const pt = shape.points[i];
      if (Math.hypot(pt.x - px, pt.y - py) <= radius) {
        return { index: i, node: pt };
      }
    }
    return null;
  }

  /**
   * Translate vector shape by delta x and delta y
   */
  public static moveShape(shape: VectorShape, dx: number, dy: number) {
    if (shape.type === 'mesh' && shape.meshData) {
      MeshEngine.moveMesh(shape.meshData, dx, dy);
      return;
    }

    if (shape.x !== undefined) shape.x += dx;
    if (shape.y !== undefined) shape.y += dy;

    if (shape.points) {
      for (const pt of shape.points) {
        pt.x += dx;
        pt.y += dy;
        if (pt.handleIn) {
          pt.handleIn.x += dx;
          pt.handleIn.y += dy;
        }
        if (pt.handleOut) {
          pt.handleOut.x += dx;
          pt.handleOut.y += dy;
        }
      }
    }
  }

  /**
   * Get bounding box of any vector shape
   */
  public static getShapeBounds(shape: VectorShape): { minX: number; minY: number; maxX: number; maxY: number } {
    if (shape.type === 'mesh' && shape.meshData) {
      return MeshEngine.getMeshBounds(shape.meshData);
    }

    if (shape.type === 'path' && shape.points && shape.points.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const pt of shape.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
      return { minX, minY, maxX, maxY };
    }

    const x = shape.x || 0;
    const y = shape.y || 0;
    const w = shape.width || 0;
    const h = shape.height || 0;
    return {
      minX: Math.min(x, x + w),
      minY: Math.min(y, y + h),
      maxX: Math.max(x, x + w),
      maxY: Math.max(y, y + h),
    };
  }
}
