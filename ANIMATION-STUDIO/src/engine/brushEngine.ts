import { BrushSettings } from '../types';

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  time: number;
}

export class BrushRenderer {
  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;

  constructor() {
    this.tempCanvas = document.createElement('canvas');
    this.tempCanvas.width = 512;
    this.tempCanvas.height = 512;
    this.tempCtx = this.tempCanvas.getContext('2d')!;
  }

  /**
   * Draws a stroke between two points with spacing interpolation and brush dynamics
   */
  public drawStrokeSegment(
    ctx: CanvasRenderingContext2D,
    p1: StrokePoint,
    p2: StrokePoint,
    settings: BrushSettings,
    color: string,
    isEraser: boolean = false
  ) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.hypot(dx, dy);

    // Calculate effective size based on pressure
    const baseSize = settings.size;
    const avgPressure = (p1.pressure + p2.pressure) / 2;
    const effectiveSize = settings.pressureSize ? Math.max(1, baseSize * avgPressure) : baseSize;

    // Adaptive step size based on brush complexity (prevents lag and hanging on mobile & 8K)
    const isHeavyBrush =
      settings.preset === 'glow-pencil' ||
      settings.preset === 'watercolor' ||
      settings.preset === 'oil-paint' ||
      settings.preset === 'charcoal';
    const effectiveSpacing = isHeavyBrush
      ? Math.max(0.28, settings.spacing)
      : Math.max(0.08, settings.spacing);
    const stepSize = Math.max(isHeavyBrush ? 4 : 2, effectiveSize * effectiveSpacing);
    const maxSteps = isHeavyBrush ? 28 : 75;
    const steps = Math.min(maxSteps, Math.max(1, Math.ceil(distance / stepSize)));

    ctx.save();

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = settings.opacity;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      const alpha = settings.pressureOpacity
        ? settings.opacity * avgPressure * settings.flow
        : settings.opacity * settings.flow;
      ctx.globalAlpha = Math.min(1, Math.max(0.01, alpha));
    }

    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;
    const midX = canvasW / 2;
    const midY = canvasH / 2;

    // Interpolate points along the vector
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = p1.x + dx * t;
      const y = p1.y + dy * t;
      const currentPressure = p1.pressure + (p2.pressure - p1.pressure) * t;
      const currentSize = settings.pressureSize
        ? Math.max(1, baseSize * currentPressure)
        : baseSize;

      // Jitter application
      let finalX = x;
      let finalY = y;
      if (settings.jitterSize > 0) {
        const j = (Math.random() - 0.5) * currentSize * settings.jitterSize;
        finalX += j;
        finalY += j;
      }

      // Stamp primary point
      this.stampBrush(ctx, finalX, finalY, currentSize, settings, color, isEraser);

      // Symmetrical stamping
      if (settings.symmetry && settings.symmetry !== 'off') {
        if (settings.symmetry === 'vertical' || settings.symmetry === 'quad' || settings.symmetry === 'mandala') {
          this.stampBrush(ctx, 2 * midX - finalX, finalY, currentSize, settings, color, isEraser);
        }
        if (settings.symmetry === 'horizontal' || settings.symmetry === 'quad' || settings.symmetry === 'mandala') {
          this.stampBrush(ctx, finalX, 2 * midY - finalY, currentSize, settings, color, isEraser);
        }
        if (settings.symmetry === 'quad' || settings.symmetry === 'mandala') {
          this.stampBrush(ctx, 2 * midX - finalX, 2 * midY - finalY, currentSize, settings, color, isEraser);
        }
        if (settings.symmetry === 'mandala') {
          // 4 diagonal 45-degree points
          const relX = finalX - midX;
          const relY = finalY - midY;
          this.stampBrush(ctx, midX + relY, midY + relX, currentSize, settings, color, isEraser);
          this.stampBrush(ctx, midX - relY, midY - relX, currentSize, settings, color, isEraser);
          this.stampBrush(ctx, midX + relY, midY - relX, currentSize, settings, color, isEraser);
          this.stampBrush(ctx, midX - relY, midY + relX, currentSize, settings, color, isEraser);
        }
      }
    }

    ctx.restore();
  }

  /**
   * Stamps a single brush footprint based on preset texture
   */
  private stampBrush(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    settings: BrushSettings,
    color: string,
    isEraser: boolean
  ) {
    const radius = Math.max(0.5, size / 2);

    switch (settings.preset) {
      case 'glow-pencil': {
        // High-performance radiant bloom neon glow pencil (any color)
        ctx.save();
        if (isEraser) {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const glowIntensity = Math.min(25, settings.glowIntensity || 20);

          // Tier 1: Outer luminous aura with shadow blur
          ctx.shadowBlur = glowIntensity;
          ctx.shadowColor = color;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Tier 2: Saturated luminous body core
          ctx.shadowBlur = Math.round(glowIntensity * 0.4);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();

          // Tier 3: Hot white laser neon inner core
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.7, radius * 0.45), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case 'soft-airbrush': {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const col = isEraser ? 'rgba(0,0,0,1)' : color;
        grad.addColorStop(0, col);
        grad.addColorStop(settings.hardness, col);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'calligraphy': {
        // Angled chisel stroke (rotated 45 degrees ellipse/polygon)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = isEraser ? '#000000' : color;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'pencil': {
        // Graphite texture with stipple noise
        ctx.fillStyle = isEraser ? '#000000' : color;
        const count = Math.max(4, Math.floor(radius * 1.5));
        for (let j = 0; j < count; j++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * radius;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.4, radius * 0.15), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'oil-paint': {
        // Bristle oil simulation
        ctx.save();
        ctx.fillStyle = isEraser ? '#000000' : color;
        const bristles = Math.max(6, Math.floor(radius * 0.8));
        for (let b = 0; b < bristles; b++) {
          const ox = (Math.random() - 0.5) * radius * 1.6;
          const oy = (Math.random() - 0.5) * radius * 1.6;
          const bRadius = Math.max(0.6, radius * 0.2 * (0.5 + Math.random() * 0.5));
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, bRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case 'watercolor': {
        // Wet wash layered puddle with soft organic edge
        const grad = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius);
        const col = isEraser ? '#000000' : color;
        grad.addColorStop(0, col);
        grad.addColorStop(0.8, col);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'charcoal': {
        // Heavy rough charcoal grain
        ctx.fillStyle = isEraser ? '#000000' : color;
        const particles = Math.max(8, Math.floor(radius * 2));
        for (let p = 0; p < particles; p++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.pow(Math.random(), 0.7) * radius;
          const dotSize = Math.max(0.5, radius * 0.18 * Math.random());
          ctx.fillRect(
            x + Math.cos(angle) * dist - dotSize / 2,
            y + Math.sin(angle) * dist - dotSize / 2,
            dotSize,
            dotSize
          );
        }
        break;
      }

      case 'screentone': {
        // Comic halftone pattern stamping
        ctx.save();
        ctx.fillStyle = isEraser ? '#000000' : color;
        const dotSpacing = 8;
        const gridX = Math.floor(x / dotSpacing) * dotSpacing;
        const gridY = Math.floor(y / dotSpacing) * dotSpacing;
        ctx.beginPath();
        ctx.arc(gridX, gridY, Math.min(radius * 0.5, dotSpacing * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'spray': {
        // Air spray scatter
        ctx.fillStyle = isEraser ? '#000000' : color;
        const drops = Math.max(10, Math.floor(radius * 2.5));
        for (let s = 0; s < drops; s++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * radius;
          ctx.fillRect(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 1.2, 1.2);
        }
        break;
      }

      case 'pen':
      default: {
        // Crisp smooth inking pen
        ctx.fillStyle = isEraser ? '#000000' : color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }

  /**
   * Smudge tool implementation: drags colors from canvas forward
   */
  public applySmudge(
    ctx: CanvasRenderingContext2D,
    p1: StrokePoint,
    p2: StrokePoint,
    size: number,
    strength: number = 0.5
  ) {
    const radius = Math.max(2, size / 2);
    const sx = Math.floor(p1.x - radius);
    const sy = Math.floor(p1.y - radius);
    const diameter = Math.ceil(radius * 2);

    try {
      const sample = ctx.getImageData(sx, sy, diameter, diameter);
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0.1, strength));
      ctx.putImageData(sample, Math.floor(p2.x - radius), Math.floor(p2.y - radius));
      ctx.restore();
    } catch {
      // In case out of bounds
    }
  }

  /**
   * Blur tool: applies local box blur on stroke path
   */
  public applyBlur(
    ctx: CanvasRenderingContext2D,
    p: StrokePoint,
    size: number
  ) {
    const radius = Math.max(2, Math.floor(size / 2));
    const x = Math.max(0, Math.floor(p.x - radius));
    const y = Math.max(0, Math.floor(p.y - radius));
    const w = Math.min(radius * 2, ctx.canvas.width - x);
    const h = Math.min(radius * 2, ctx.canvas.height - y);

    if (w <= 0 || h <= 0) return;

    try {
      const imgData = ctx.getImageData(x, y, w, h);
      const data = imgData.data;

      // Simple 3x3 fast box blur
      for (let cy = 1; cy < h - 1; cy += 2) {
        for (let cx = 1; cx < w - 1; cx += 2) {
          const idx = (cy * w + cx) * 4;
          let r = 0, g = 0, b = 0, a = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((cy + dy) * w + (cx + dx)) * 4;
              r += data[nIdx];
              g += data[nIdx + 1];
              b += data[nIdx + 2];
              a += data[nIdx + 3];
              count++;
            }
          }
          data[idx] = r / count;
          data[idx + 1] = g / count;
          data[idx + 2] = b / count;
          data[idx + 3] = a / count;
        }
      }
      ctx.putImageData(imgData, x, y);
    } catch {
      // Bounds protection
    }
  }

  /**
   * Clone Stamp tool: samples pixels from source point and paints to target point
   */
  public applyCloneStamp(
    ctx: CanvasRenderingContext2D,
    sourcePt: { x: number; y: number },
    targetPt: StrokePoint,
    size: number,
    opacity: number,
    sourceCanvas?: HTMLCanvasElement | null
  ) {
    const radius = Math.max(2, Math.floor(size / 2));
    const diameter = radius * 2;
    const srcCanvas = sourceCanvas || ctx.canvas;

    const sx = Math.max(0, Math.floor(sourcePt.x - radius));
    const sy = Math.max(0, Math.floor(sourcePt.y - radius));
    const sw = Math.min(diameter, srcCanvas.width - sx);
    const sh = Math.min(diameter, srcCanvas.height - sy);

    if (sw <= 0 || sh <= 0) return;

    try {
      this.tempCanvas.width = sw;
      this.tempCanvas.height = sh;
      this.tempCtx.clearRect(0, 0, sw, sh);

      // Draw circular clipped sample
      this.tempCtx.save();
      this.tempCtx.beginPath();
      this.tempCtx.arc(sw / 2, sh / 2, radius, 0, Math.PI * 2);
      this.tempCtx.clip();
      this.tempCtx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
      this.tempCtx.restore();

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(this.tempCanvas, targetPt.x - radius, targetPt.y - radius);
      ctx.restore();
    } catch {
      // Bounds protection
    }
  }
}
