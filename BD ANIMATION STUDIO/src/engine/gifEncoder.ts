/**
 * Lightweight pure JavaScript GIF89a animation encoder
 */
export class SimpleGifEncoder {
  private width: number;
  private height: number;
  private delay: number; // in 1/100s
  private frames: Uint8Array[] = [];

  constructor(width: number, height: number, delayMs: number) {
    this.width = width;
    this.height = height;
    this.delay = Math.round(delayMs / 10);
  }

  public addFrame(ctx: CanvasRenderingContext2D) {
    const imgData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const pixels = new Uint8Array(this.width * this.height);

    // Simple 3-3-2 color quantization (256 colors)
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i] >> 5;
      const g = data[i + 1] >> 5;
      const b = data[i + 2] >> 6;
      pixels[p] = (r << 5) | (g << 2) | b;
    }
    this.frames.push(pixels);
  }

  public finish(): Blob {
    const buffer: number[] = [];

    // Header: GIF89a
    const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
    buffer.push(...header);

    // Logical Screen Descriptor
    buffer.push(this.width & 0xff, (this.width >> 8) & 0xff);
    buffer.push(this.height & 0xff, (this.height >> 8) & 0xff);
    buffer.push(0xf7); // Global Color Table Flag, 8 bits/pixel
    buffer.push(0x00); // Background Color Index
    buffer.push(0x00); // Pixel Aspect Ratio

    // Global Color Table (256 entries from 3-3-2 palette)
    for (let i = 0; i < 256; i++) {
      const r = ((i >> 5) & 0x07) * 36;
      const g = ((i >> 2) & 0x07) * 36;
      const b = (i & 0x03) * 85;
      buffer.push(r, g, b);
    }

    // Netscape Application Extension for Looping
    buffer.push(0x21, 0xff, 0x0b);
    const appStr = 'NETSCAPE2.0';
    for (let i = 0; i < appStr.length; i++) buffer.push(appStr.charCodeAt(i));
    buffer.push(0x03, 0x01, 0x00, 0x00, 0x00);

    // Encode Frames
    for (const frame of this.frames) {
      // Graphics Control Extension
      buffer.push(0x21, 0xf9, 0x04);
      buffer.push(0x04); // Disposal method: restore background
      buffer.push(this.delay & 0xff, (this.delay >> 8) & 0xff);
      buffer.push(0x00); // Transparent color index
      buffer.push(0x00);

      // Image Descriptor
      buffer.push(0x2c);
      buffer.push(0x00, 0x00, 0x00, 0x00); // x, y = 0
      buffer.push(this.width & 0xff, (this.width >> 8) & 0xff);
      buffer.push(this.height & 0xff, (this.height >> 8) & 0xff);
      buffer.push(0x00); // No Local Color Table

      // LZW Minimum Code Size
      const lzwMinCodeSize = 8;
      buffer.push(lzwMinCodeSize);

      // Simple uncompressed sub-blocks with Clear / End codes
      const clearCode = 1 << lzwMinCodeSize;
      const endCode = clearCode + 1;

      // Pack pixels in 254-byte blocks
      let cur = 0;
      while (cur < frame.length) {
        const chunkSize = Math.min(254, frame.length - cur);
        buffer.push(chunkSize + 1);
        buffer.push(clearCode & 0xff);
        for (let k = 0; k < chunkSize; k++) {
          buffer.push(frame[cur + k]);
        }
        cur += chunkSize;
      }
      buffer.push(1, endCode & 0xff);
      buffer.push(0x00); // Block terminator
    }

    // GIF Trailer
    buffer.push(0x3b);

    return new Blob([new Uint8Array(buffer)], { type: 'image/gif' });
  }
}
