/**
 * Video Frame Extractor Engine
 * Extracts frame-by-frame images from imported reference video files.
 */

export interface VideoExtractionOptions {
  fps?: number; // Target extraction FPS (e.g., 6, 8, 12, 24)
  maxFrames?: number; // Safety limit to avoid exhausting browser memory
  maxWidth?: number; // Target max resolution
  maxHeight?: number;
  startTime?: number; // Start extraction in seconds
  endTime?: number; // End extraction in seconds
  onProgress?: (progressPercent: number, currentFrame: number, totalFrames: number) => void;
  signal?: AbortSignal;
}

export interface ExtractedVideoData {
  frames: string[]; // Base64 data URLs
  duration: number; // Video duration in seconds
  fps: number; // Extracted fps
  totalFrames: number;
  width: number;
  height: number;
  fileName: string;
}

export class VideoFrameExtractor {
  /**
   * Checks if a file is a video
   */
  static isVideoFile(file: File): boolean {
    return file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v|mkv|avi)$/i.test(file.name);
  }

  /**
   * Extracts frame-by-frame images from a video file using HTML5 Video + Offscreen Canvas
   */
  static async extractFrames(
    file: File,
    options: VideoExtractionOptions = {}
  ): Promise<ExtractedVideoData> {
    const {
      fps = 12,
      maxFrames = 120,
      maxWidth = 1280,
      maxHeight = 720,
      startTime = 0,
      signal,
      onProgress,
    } = options;

    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new Error('Extraction aborted by user'));
      }

      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const cleanup = () => {
        URL.revokeObjectURL(videoUrl);
        video.src = '';
        video.load();
      };

      if (signal) {
        signal.addEventListener('abort', () => {
          cleanup();
          reject(new Error('Extraction aborted by user'));
        });
      }

      video.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video file. Please check video format.'));
      };

      video.onloadedmetadata = async () => {
        try {
          const duration = video.duration || 1;
          const end = Math.min(options.endTime ?? duration, duration);
          const start = Math.max(0, startTime);
          const extractDuration = Math.max(0.1, end - start);

          // Calculate total frames to sample
          let frameCount = Math.floor(extractDuration * fps);
          if (frameCount <= 0) frameCount = 1;
          if (frameCount > maxFrames) {
            frameCount = maxFrames;
          }

          const actualFps = frameCount > 1 ? frameCount / extractDuration : fps;
          const timeStep = extractDuration / frameCount;

          // Determine canvas dimensions
          let w = video.videoWidth || 640;
          let h = video.videoHeight || 360;
          const scale = Math.min(maxWidth / w, maxHeight / h, 1);
          w = Math.round(w * scale);
          h = Math.round(h * scale);

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            cleanup();
            return reject(new Error('Could not create canvas context for video frames'));
          }

          const extractedFrames: string[] = [];

          // Helper to seek video to specific timestamp and wait for frame render
          const seekTo = (time: number): Promise<void> => {
            return new Promise((res) => {
              if (signal?.aborted) {
                return res();
              }

              let timer: number | null = null;
              const handleSeeked = () => {
                if (timer) clearTimeout(timer);
                video.removeEventListener('seeked', handleSeeked);
                res();
              };

              // Fallback timeout in case seeked doesn't fire
              timer = window.setTimeout(() => {
                video.removeEventListener('seeked', handleSeeked);
                res();
              }, 400);

              video.addEventListener('seeked', handleSeeked);
              video.currentTime = Math.min(time, duration - 0.01);
            });
          };

          // Step frame by frame
          for (let i = 0; i < frameCount; i++) {
            if (signal?.aborted) {
              cleanup();
              return reject(new Error('Extraction aborted by user'));
            }

            const targetTime = start + i * timeStep;
            await seekTo(targetTime);

            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(video, 0, 0, w, h);

            // Export frame as JPEG data URL for optimal speed and memory footprint
            const frameDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            extractedFrames.push(frameDataUrl);

            if (onProgress) {
              const percent = Math.round(((i + 1) / frameCount) * 100);
              onProgress(percent, i + 1, frameCount);
            }

            // Yield thread periodically to keep UI responsive
            if (i % 3 === 0) {
              await new Promise((r) => setTimeout(r, 0));
            }
          }

          cleanup();
          resolve({
            frames: extractedFrames,
            duration,
            fps: Math.round(actualFps),
            totalFrames: extractedFrames.length,
            width: w,
            height: h,
            fileName: file.name,
          });
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      video.src = videoUrl;
    });
  }

  /**
   * Converts a frame data URL into a canvas matching document config dimensions
   */
  static async renderFrameToCanvas(
    dataUrl: string,
    targetWidth: number,
    targetHeight: number
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.min(targetWidth / img.width, targetHeight / img.height, 1);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = (targetWidth - dw) / 2;
          const dy = (targetHeight - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        }
        resolve(canvas);
      };
      img.onerror = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        resolve(canvas);
      };
      img.src = dataUrl;
    });
  }
}
