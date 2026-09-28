import React, { useState } from 'react';
import { AnimationFrame, AnimationSettings, CanvasConfig } from '../types';
import { ExportEngine } from '../engine/exportEngine';
import {
  Download,
  X,
  FileImage,
  Video,
  Grid,
  Sparkles,
  Layers,
  Loader2,
} from 'lucide-react';

interface ExportModalProps {
  currentFrame: AnimationFrame;
  allFrames: AnimationFrame[];
  config: CanvasConfig;
  animSettings: AnimationSettings;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  currentFrame,
  allFrames,
  config,
  animSettings,
  onClose,
}) => {
  const [format, setFormat] = useState<
    'png' | 'jpeg' | 'svg' | 'gif' | 'webm' | 'mp4' | 'spritesheet' | 'png-seq'
  >('png');
  const [resolutionMode, setResolutionMode] = useState<'canvas' | 'hd' | 'fhd' | '2k' | '4k' | '8k'>('canvas');
  const [scale, setScale] = useState(1);
  const [videoLoops, setVideoLoops] = useState(2);
  const [exportFps, setExportFps] = useState<number>(animSettings.fps || 24);
  const [quality, setQuality] = useState(0.95);
  const [transparentBg, setTransparentBg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');

  // Calculate output dimensions based on resolution mode
  const getOutputDimensions = () => {
    switch (resolutionMode) {
      case 'hd':
        return { w: 1280, h: 720, label: '720p HD' };
      case 'fhd':
        return { w: 1920, h: 1080, label: '1080p Full HD' };
      case '2k':
        return { w: 2560, h: 1440, label: '2K QHD' };
      case '4k':
        return { w: 3840, h: 2160, label: '4K UHD' };
      case '8k':
        return { w: 7680, h: 4320, label: '8K Ultra HD' };
      case 'canvas':
      default:
        return {
          w: Math.round(config.width * scale),
          h: Math.round(config.height * scale),
          label: `${Math.round(scale * 100)}% Canvas`,
        };
    }
  };

  const { w: targetWidth, h: targetHeight } = getOutputDimensions();

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(5);
    setExportStatusText('Preparing export...');

    try {
      const effScale = targetWidth / config.width;

      if (format === 'png' || format === 'jpeg') {
        ExportEngine.downloadImage(currentFrame, config, format, quality, effScale, undefined, transparentBg);
      } else if (format === 'svg') {
        ExportEngine.downloadSVG(currentFrame, config);
      } else if (format === 'gif') {
        setExportStatusText('Encoding GIF frames...');
        await ExportEngine.downloadGif(allFrames, config, exportFps, effScale, transparentBg);
      } else if (format === 'webm' || format === 'mp4') {
        await ExportEngine.downloadVideo(
          allFrames,
          config,
          exportFps,
          targetWidth,
          targetHeight,
          format,
          videoLoops,
          (progress, status) => {
            setExportProgress(progress);
            setExportStatusText(status);
          },
          transparentBg
        );
      } else if (format === 'spritesheet') {
        ExportEngine.downloadSpriteSheet(allFrames, config, 4, effScale, transparentBg);
      } else if (format === 'png-seq') {
        setExportStatusText('স্বচ্ছ পিএনজি ফ্রেম সিকোয়েন্স তৈরি হচ্ছে...');
        await ExportEngine.downloadPNGSequence(
          allFrames,
          config,
          effScale,
          transparentBg,
          (progress, status) => {
            setExportProgress(progress);
            setExportStatusText(status);
          }
        );
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export failed:', err);
      setExportStatusText('Export failed. Please check device memory.');
    } finally {
      setIsExporting(false);
    }
  };

  const isVideoFormat = format === 'webm' || format === 'mp4';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none cursor-pointer"
    >
      <div className="bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default">
        {/* Header */}
        <div className="h-11 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-925">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-neutral-100 text-sm">Export Artwork & Animation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 text-xs text-neutral-300">
          {/* Format selection */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-neutral-200">Export Format (ফরম্যাট)</span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'mp4'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-[11px]">MP4 Video</span>
                <span className="text-[9px] text-cyan-400/80 font-mono">HD - 8K Video</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('webm')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'webm'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-[11px]">WebM Video</span>
                <span className="text-[9px] text-neutral-500">{animSettings.fps} FPS VP9</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('gif')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'gif'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-[11px]">Animated GIF</span>
                <span className="text-[9px] text-neutral-500">({allFrames.length} Frames)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'png'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <FileImage className="w-4 h-4" />
                <span className="font-bold text-[11px]">PNG Image</span>
                <span className="text-[9px] text-neutral-500">Lossless / Alpha</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'jpeg'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <FileImage className="w-4 h-4" />
                <span className="font-bold text-[11px]">JPEG Image</span>
                <span className="text-[9px] text-neutral-500">Compressed</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('svg')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'svg'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="font-bold text-[11px]">SVG Vector</span>
                <span className="text-[9px] text-neutral-500">Infinite Scale</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('spritesheet')}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'spritesheet'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="font-bold text-[11px]">Sprite Sheet</span>
                <span className="text-[9px] text-neutral-500">Game Strip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormat('png-seq');
                  setTransparentBg(true);
                }}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  format === 'png-seq'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-[11px]">PNG Sequence</span>
                <span className="text-[9px] text-neutral-500">স্বচ্ছ ফ্রেমসমূহ</span>
              </button>
            </div>
          </div>

          {/* Video / Image Resolution Presets (HD up to 8K) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">
                Resolution (রেজোলিউশন: HD থেকে 8K)
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {targetWidth} × {targetHeight} px
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <button
                type="button"
                onClick={() => setResolutionMode('canvas')}
                className={`py-1.5 px-1 rounded-lg border text-center font-medium transition-all ${
                  resolutionMode === 'canvas'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-bold">Canvas</div>
                <div className="text-[9px] text-neutral-500">Original</div>
              </button>

              <button
                type="button"
                onClick={() => setResolutionMode('hd')}
                className={`py-1.5 px-1 rounded-lg border text-center font-medium transition-all ${
                  resolutionMode === 'hd'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-bold text-sky-400">720p HD</div>
                <div className="text-[9px] text-neutral-500">1280x720</div>
              </button>

              <button
                type="button"
                onClick={() => setResolutionMode('fhd')}
                className={`py-1.5 px-1 rounded-lg border text-center font-medium transition-all ${
                  resolutionMode === 'fhd'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-bold text-blue-400">1080p FHD</div>
                <div className="text-[9px] text-neutral-500">1920x1080</div>
              </button>

              <button
                type="button"
                onClick={() => setResolutionMode('2k')}
                className={`py-1.5 px-1 rounded-lg border text-center font-medium transition-all ${
                  resolutionMode === '2k'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-bold text-indigo-400">2K QHD</div>
                <div className="text-[9px] text-neutral-500">2560x1440</div>
              </button>

              <button
                type="button"
                onClick={() => setResolutionMode('4k')}
                className={`py-1.5 px-1 rounded-lg border text-center font-medium transition-all ${
                  resolutionMode === '4k'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-bold text-cyan-400">4K UHD</div>
                <div className="text-[9px] text-neutral-500">3840x2160</div>
              </button>

              <button
                type="button"
                onClick={() => setResolutionMode('8k')}
                className={`py-1.5 px-1 rounded-lg border text-center font-medium transition-all ${
                  resolutionMode === '8k'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] font-extrabold text-amber-400">8K Ultra</div>
                <div className="text-[9px] text-neutral-500">7680x4320</div>
              </button>
            </div>
          </div>

          {/* Scale Resolution Factor (for Canvas mode) */}
          {resolutionMode === 'canvas' && (
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { s: 1, label: '100% Native' },
                  { s: 0.75, label: '75%' },
                  { s: 0.5, label: '50%' },
                  { s: 0.25, label: '25%' },
                ].map((item) => (
                  <button
                    key={item.s}
                    type="button"
                    onClick={() => setScale(item.s)}
                    className={`py-1 px-2 rounded border text-center font-medium transition-all ${
                      scale === item.s
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px]">{Math.round(item.s * 100)}%</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Options: FPS and Loop counts */}
          {isVideoFormat && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">স্মুথ ফ্রেমরেট (Smooth Video FPS):</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { fps: 12, label: '12 FPS (Classic)' },
                    { fps: 24, label: '24 FPS (Cinema)' },
                    { fps: 30, label: '30 FPS' },
                    { fps: 60, label: '60 FPS (Ultra Smooth)' },
                  ].map((item) => (
                    <button
                      key={item.fps}
                      type="button"
                      onClick={() => setExportFps(item.fps)}
                      className={`px-2 py-0.5 rounded text-xs border transition ${
                        exportFps === item.fps
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">এনিমেশন লুপ (Loops):</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 4, 8].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setVideoLoops(l)}
                      className={`px-2 py-0.5 rounded text-xs border ${
                        videoLoops === l
                          ? 'bg-cyan-600 border-cyan-500 text-white font-bold'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {l}x Loop
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transparent Background Toggle (PNG, WebM, GIF, SpriteSheet) */}
          {format !== 'jpeg' && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-850/80 border border-neutral-750 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg border border-neutral-700 bg-neutral-900 flex items-center justify-center text-[10px] font-mono text-cyan-400 font-bold shadow-inner">
                  α
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                    <span>স্বচ্ছ ব্যাকগ্রাউন্ড (Transparent Background)</span>
                    {transparentBg && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[9px] font-bold">
                        ON
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    CapCut, Premiere বা অন্য ভিডিও এডিটরে ওভারলে করার জন্য ব্যাকগ্রাউন্ড স্বচ্ছ রাখুন
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          )}

          {/* Progress Bar during Export */}
          {isExporting && (
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-neutral-950 border border-cyan-500/40 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-300 font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  {exportStatusText || 'Exporting...'}
                </span>
                <span className="font-mono text-cyan-400 font-bold">{exportProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-200"
                  style={{ width: `${Math.max(5, exportProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* JPEG Quality Slider */}
          {format === 'jpeg' && (
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <span className="text-neutral-300 font-medium">JPEG Quality</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(Number(e.target.value) / 100)}
                  className="w-28 accent-cyan-500"
                />
                <span className="font-mono w-8 text-right text-cyan-300">
                  {Math.round(quality * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-cyan-950 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
