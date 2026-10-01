/**
 * Image processing filters & color adjustments
 */

export interface FilterOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  hue: number; // -180 to 180
  saturation: number; // -100 to 100
  invert?: boolean;
  grayscale?: boolean;
  threshold?: number; // 0 to 255 (if active)
  blur?: number; // 0 to 20 px
}

export function applyFiltersToCanvas(
  targetCanvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  options: FilterOptions
) {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  targetCanvas.width = sourceCanvas.width;
  targetCanvas.height = sourceCanvas.height;

  // Use hardware-accelerated CSS filter on context if supported for super fast real-time preview
  const filterStrings: string[] = [];

  if (options.brightness !== 0) {
    const b = 100 + options.brightness;
    filterStrings.push(`brightness(${b}%)`);
  }
  if (options.contrast !== 0) {
    const c = 100 + options.contrast;
    filterStrings.push(`contrast(${c}%)`);
  }
  if (options.hue !== 0) {
    filterStrings.push(`hue-rotate(${options.hue}deg)`);
  }
  if (options.saturation !== 0) {
    const s = 100 + options.saturation;
    filterStrings.push(`saturate(${s}%)`);
  }
  if (options.invert) {
    filterStrings.push('invert(100%)');
  }
  if (options.grayscale) {
    filterStrings.push('grayscale(100%)');
  }
  if (options.blur && options.blur > 0) {
    filterStrings.push(`blur(${options.blur}px)`);
  }

  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.save();
  if (filterStrings.length > 0) {
    ctx.filter = filterStrings.join(' ');
  }
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.restore();

  // If threshold is requested, apply pixel-level threshold pass
  if (options.threshold !== undefined && options.threshold > 0) {
    const imgData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    const d = imgData.data;
    const thresh = options.threshold;

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const val = gray >= thresh ? 255 : 0;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  }
}
