/**
 * High-performance 32-bit scanline flood-fill / Paint Bucket implementation.
 * Capable of filling 4K / 8K canvases in milliseconds with minimal GC overhead.
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  tolerance: number = 32
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const sx = Math.floor(startX);
  const sy = Math.floor(startY);

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const data32 = new Uint32Array(data.buffer);

  const fillRGBA = hexToRgba(fillColorHex);
  // Little-endian RGBA format: (A << 24) | (B << 16) | (G << 8) | R
  const fillColor32 =
    (fillRGBA.a << 24) | (fillRGBA.b << 16) | (fillRGBA.g << 8) | fillRGBA.r;

  const startIndex = sy * width + sx;
  const targetColor32 = data32[startIndex];

  const targetR = targetColor32 & 0xff;
  const targetG = (targetColor32 >> 8) & 0xff;
  const targetB = (targetColor32 >> 16) & 0xff;
  const targetA = (targetColor32 >> 24) & 0xff;

  // Exact match check
  if (
    colorDiff(targetR, targetG, targetB, targetA, fillRGBA.r, fillRGBA.g, fillRGBA.b, fillRGBA.a) <= tolerance &&
    Math.abs(targetA - fillRGBA.a) <= 5
  ) {
    return;
  }

  const matchTolSq = (tolerance * 2.5) * (tolerance * 2.5);

  // Fast color match function
  function matches(c32: number): boolean {
    if (c32 === targetColor32) return true;
    const r = c32 & 0xff;
    const g = (c32 >> 8) & 0xff;
    const b = (c32 >> 16) & 0xff;
    const a = (c32 >> 24) & 0xff;
    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    const da = a - targetA;
    return dr * dr + dg * dg + db * db + da * da <= matchTolSq;
  }

  // Preallocated integer stack for coordinate pairs [x, y]
  const stack = new Int32Array(width * 4);
  let stackPtr = 0;

  stack[stackPtr++] = sx;
  stack[stackPtr++] = sy;

  while (stackPtr > 0) {
    const y = stack[--stackPtr];
    let x = stack[--stackPtr];

    let lineIndex = y * width + x;

    // Scan leftwards
    while (x >= 0 && matches(data32[lineIndex])) {
      x--;
      lineIndex--;
    }
    x++;
    lineIndex++;

    let spanAbove = false;
    let spanBelow = false;

    // Scan rightwards and fill line
    while (x < width && matches(data32[lineIndex])) {
      data32[lineIndex] = fillColor32;

      // Check pixel above
      if (y > 0) {
        const aboveIndex = lineIndex - width;
        if (!spanAbove && matches(data32[aboveIndex])) {
          if (stackPtr + 2 < stack.length) {
            stack[stackPtr++] = x;
            stack[stackPtr++] = y - 1;
          }
          spanAbove = true;
        } else if (spanAbove && !matches(data32[aboveIndex])) {
          spanAbove = false;
        }
      }

      // Check pixel below
      if (y < height - 1) {
        const belowIndex = lineIndex + width;
        if (!spanBelow && matches(data32[belowIndex])) {
          if (stackPtr + 2 < stack.length) {
            stack[stackPtr++] = x;
            stack[stackPtr++] = y + 1;
          }
          spanBelow = true;
        } else if (spanBelow && !matches(data32[belowIndex])) {
          spanBelow = false;
        }
      }

      x++;
      lineIndex++;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function colorDiff(
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number
): number {
  return Math.sqrt(
    (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2 + (a1 - a2) ** 2
  );
}

function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 255,
  };
}
