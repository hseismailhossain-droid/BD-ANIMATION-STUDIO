import { AnimationFrame, AnimationSettings, CanvasConfig } from '../types';
import { VectorEngine } from './vectorEngine';
import { SimpleGifEncoder } from './gifEncoder';

export class ExportEngine {
  /**
   * Composite all visible layers of a frame into an offscreen canvas
   */
  public static compositeFrame(
    frame: AnimationFrame,
    config: CanvasConfig,
    scale: number = 1,
    transparent: boolean = false
  ): HTMLCanvasElement {
    const outWidth = Math.round(config.width * scale);
    const outHeight = Math.round(config.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d')!;

    // Background fill (only if not transparent)
    if (!transparent) {
      if (config.background === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outWidth, outHeight);
      } else if (config.background === 'dark') {
        ctx.fillStyle = '#121214';
        ctx.fillRect(0, 0, outWidth, outHeight);
      } else if (config.background === 'custom' && config.customBgColor) {
        ctx.fillStyle = config.customBgColor;
        ctx.fillRect(0, 0, outWidth, outHeight);
      }
    }

    // Render layers from bottom to top
    for (const layer of frame.layers) {
      if (!layer.visible || layer.opacity <= 0) continue;
      // Skip background layer when transparent is requested
      if (transparent && (layer.id === 'layer_bg' || layer.name.toLowerCase() === 'background')) {
        continue;
      }

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.clippingMask
        ? 'source-atop'
        : (layer.blendMode || 'source-over');

      if (layer.type === 'raster') {
        ctx.drawImage(layer.canvas, 0, 0, outWidth, outHeight);
      } else if (layer.type === 'vector' && layer.vectors.length > 0) {
        ctx.save();
        ctx.scale(scale, scale);
        VectorEngine.renderShapes(ctx, layer.vectors);
        ctx.restore();
      }

      ctx.restore();
    }

    return canvas;
  }

  /**
   * Export single frame as PNG or JPEG data URL and trigger download
   */
  public static downloadImage(
    frame: AnimationFrame,
    config: CanvasConfig,
    format: 'png' | 'jpeg' = 'png',
    quality: number = 0.95,
    scale: number = 1,
    fileName?: string,
    transparent: boolean = false
  ) {
    const isTrans = transparent && format === 'png';
    const canvas = this.compositeFrame(frame, config, scale, isTrans);
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, quality);

    const name = fileName || `${config.name.toLowerCase().replace(/\s+/g, '_')}_${config.width}x${config.height}.${format}`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    a.click();
  }

  /**
   * Export SVG containing all vector layers
   */
  public static downloadSVG(frame: AnimationFrame, config: CanvasConfig) {
    const allVectors = frame.layers
      .filter((l) => l.visible && l.type === 'vector')
      .flatMap((l) => l.vectors);

    const svgStr = VectorEngine.exportToSVG(allVectors, config.width, config.height);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.toLowerCase().replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export Sprite Sheet of all frames
   */
  public static downloadSpriteSheet(
    frames: AnimationFrame[],
    config: CanvasConfig,
    columns: number = 4,
    scale: number = 0.5,
    transparent: boolean = false
  ) {
    const frameW = Math.round(config.width * scale);
    const frameH = Math.round(config.height * scale);
    const cols = Math.min(frames.length, columns);
    const rows = Math.ceil(frames.length / cols);

    const canvas = document.createElement('canvas');
    canvas.width = frameW * cols;
    canvas.height = frameH * rows;
    const ctx = canvas.getContext('2d')!;

    if (!transparent) {
      if (config.background === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (config.background === 'dark') {
        ctx.fillStyle = '#121214';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    frames.forEach((frame, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const fCanvas = this.compositeFrame(frame, config, scale, transparent);
      ctx.drawImage(fCanvas, c * frameW, r * frameH);
    });

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.toLowerCase().replace(/\s+/g, '_')}_spritesheet.png`;
    a.click();
  }

  /**
   * Export all frames as individual transparent PNG files (PNG Sequence)
   * Perfect for video overlay in CapCut, Premiere, After Effects & DaVinci Resolve
   */
  public static async downloadPNGSequence(
    frames: AnimationFrame[],
    config: CanvasConfig,
    scale: number = 1,
    transparent: boolean = true,
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {
    const total = frames.length;
    for (let i = 0; i < total; i++) {
      onProgress?.(
        Math.round(((i + 1) / total) * 100),
        `স্বচ্ছ ফ্রেম সেইভ হচ্ছে ${i + 1}/${total}...`
      );
      const canvas = this.compositeFrame(frames[i], config, scale, transparent);
      const dataUrl = canvas.toDataURL('image/png');
      const pad = String(i + 1).padStart(4, '0');
      const fileName = `${config.name.toLowerCase().replace(/\s+/g, '_')}_trans_frame_${pad}.png`;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.click();
      if (total > 1) {
        await new Promise((r) => setTimeout(r, 180));
      }
    }
  }

  /**
   * Export animated GIF
   */
  public static async downloadGif(
    frames: AnimationFrame[],
    config: CanvasConfig,
    fps: number,
    scale: number = 0.25,
    transparent: boolean = false
  ) {
    const width = Math.round(config.width * scale);
    const height = Math.round(config.height * scale);
    const delayMs = Math.round(1000 / fps);

    const encoder = new SimpleGifEncoder(width, height, delayMs);

    for (const frame of frames) {
      const fCanvas = this.compositeFrame(frame, config, scale, transparent);
      const ctx = fCanvas.getContext('2d')!;
      encoder.addFrame(ctx);
    }

    const blob = encoder.finish();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.toLowerCase().replace(/\s+/g, '_')}.gif`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export high quality video recording (HD, 2K, 4K, up to 8K)
   */
  public static async downloadVideo(
    frames: AnimationFrame[],
    config: CanvasConfig,
    fps: number,
    targetWidth: number,
    targetHeight: number,
    format: 'webm' | 'mp4' = 'webm',
    loops: number = 2,
    onProgress?: (progress: number, status: string) => void,
    transparent: boolean = false
  ): Promise<void> {
    const width = Math.round(targetWidth);
    const height = Math.round(targetHeight);

    const recordCanvas = document.createElement('canvas');
    recordCanvas.width = width;
    recordCanvas.height = height;
    const ctx = recordCanvas.getContext('2d', { willReadFrequently: true })!;

    // Select the best supported mimeType for the requested format
    let mimeType = 'video/webm;codecs=vp9';
    if (format === 'mp4') {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else {
        // Fallback to high-compatibility WebM
        mimeType = 'video/webm;codecs=vp8';
      }
    } else {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      } else {
        mimeType = 'video/webm';
      }
    }

    // High bitrate for 4K / 8K video clarity
    const is8K = width >= 7680 || height >= 4320;
    const is4K = width >= 3840 || height >= 2160;
    const bitrate = is8K ? 40000000 : is4K ? 20000000 : 8000000;

    const stream = recordCanvas.captureStream(fps);
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      });
    } catch {
      // Fallback without explicit mimeType
      mediaRecorder = new MediaRecorder(stream, {
        videoBitsPerSecond: bitrate,
      });
    }

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const scale = width / config.width;

    // Step 1: Pre-render all composite frames to avoid frame-drop/stutter during recording
    onProgress?.(5, 'Pre-rendering animation frames for ultra-smooth playback...');
    const preRenderedCanvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < frames.length; i++) {
      const fCanvas = this.compositeFrame(frames[i], config, scale, transparent);
      preRenderedCanvases.push(fCanvas);
    }

    const totalSteps = frames.length * Math.max(1, loops);

    return new Promise((resolve, reject) => {
      mediaRecorder.onerror = (event: any) => {
        reject(event.error || new Error('Video recording error'));
      };

      mediaRecorder.onstop = () => {
        const outExt = format === 'mp4' && mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const resLabel = is8K ? '_8K' : is4K ? '_4K' : `_${width}x${height}`;
        a.download = `${config.name.toLowerCase().replace(/\s+/g, '_')}${resLabel}.${outExt}`;
        a.click();
        URL.revokeObjectURL(url);
        onProgress?.(100, 'Export complete!');
        resolve();
      };

      mediaRecorder.start();

      let current = 0;
      const interval = 1000 / fps;

      const timer = setInterval(() => {
        if (current >= totalSteps) {
          clearInterval(timer);
          onProgress?.(95, 'Finalizing video stream...');
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }, 350);
          return;
        }

        const frameIndex = current % frames.length;
        const pct = Math.round((current / totalSteps) * 90);
        onProgress?.(
          pct,
          `Encoding smooth frame ${frameIndex + 1} of ${frames.length} (${width}x${height} ${fps}FPS ${is8K ? '8K UHD' : is4K ? '4K' : 'HD'})...`
        );

        const fCanvas = preRenderedCanvases[frameIndex];
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(fCanvas, 0, 0, width, height);
        current++;
      }, interval);
    });
  }

  /**
   * Export WebM video recording of the animation (backward compatibility)
   */
  public static async downloadWebM(
    frames: AnimationFrame[],
    config: CanvasConfig,
    fps: number,
    scale: number = 0.5
  ): Promise<void> {
    const width = Math.round(config.width * scale);
    const height = Math.round(config.height * scale);
    return this.downloadVideo(frames, config, fps, width, height, 'webm', 2);
  }

  /**
   * Save complete project to JSON file
   */
  public static async saveProject(
    frames: AnimationFrame[],
    config: CanvasConfig,
    animSettings: AnimationSettings
  ) {
    const projectData = {
      version: '1.0',
      config,
      animSettings: {
        fps: animSettings.fps,
        loop: animSettings.loop,
      },
      frames: frames.map((f) => ({
        id: f.id,
        name: f.name,
        layers: f.layers.map((l) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          visible: l.visible,
          locked: l.locked,
          alphaLocked: l.alphaLocked,
          opacity: l.opacity,
          blendMode: l.blendMode,
          rasterData: l.type === 'raster' ? l.canvas.toDataURL('image/png') : null,
          vectors: l.vectors,
        })),
      })),
    };

    const json = JSON.stringify(projectData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.toLowerCase().replace(/\s+/g, '_')}.ps8k`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
