import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  X,
  Upload,
  Eye,
  EyeOff,
  FlipHorizontal,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sliders,
  Trash2,
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Link2,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ReferenceImageConfig } from '../types';
import { VideoFrameExtractor } from '../engine/videoFrameExtractor';

interface ReferenceImagePanelProps {
  config: ReferenceImageConfig;
  onUpdateConfig: (updates: Partial<ReferenceImageConfig>) => void;
  onClose: () => void;
  currentTimelineFrameIndex?: number;
  totalTimelineFrames?: number;
  onImportFramesToTimeline?: (frames: string[]) => void;
}

export const ReferenceImagePanel: React.FC<ReferenceImagePanelProps> = ({
  config,
  onUpdateConfig,
  onClose,
  currentTimelineFrameIndex = 0,
  totalTimelineFrames = 1,
  onImportFramesToTimeline,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 80 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Video Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractedCount, setExtractedCount] = useState(0);
  const [totalExtractFrames, setTotalExtractFrames] = useState(0);
  const [targetFps, setTargetFps] = useState<number>(12);
  const [extractError, setExtractError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reference video playback loop timer
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  // Determine active frame index
  const hasVideoFrames = Boolean(config.videoFrames && config.videoFrames.length > 0);
  const frameCount = config.videoFrames ? config.videoFrames.length : 0;

  const currentDisplayIndex = React.useMemo(() => {
    if (!hasVideoFrames) return 0;
    if (config.syncWithTimeline) {
      return currentTimelineFrameIndex % frameCount;
    }
    return Math.max(0, Math.min(frameCount - 1, config.videoFrameIndex ?? 0));
  }, [hasVideoFrames, config.syncWithTimeline, currentTimelineFrameIndex, frameCount, config.videoFrameIndex]);

  const activeDisplayUrl = React.useMemo(() => {
    if (hasVideoFrames && config.videoFrames && config.videoFrames[currentDisplayIndex]) {
      return config.videoFrames[currentDisplayIndex];
    }
    return config.url;
  }, [hasVideoFrames, config.videoFrames, currentDisplayIndex, config.url]);

  // Handle local video playback loop when not synced to timeline
  useEffect(() => {
    if (!isPlayingRef || !hasVideoFrames || config.syncWithTimeline) {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    const intervalMs = 1000 / (config.videoFps || targetFps || 12);
    playTimerRef.current = window.setInterval(() => {
      onUpdateConfig({
        videoFrameIndex: ((config.videoFrameIndex ?? 0) + 1) % frameCount,
      });
    }, intervalMs);

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlayingRef, hasVideoFrames, config.syncWithTimeline, config.videoFps, targetFps, frameCount, config.videoFrameIndex, onUpdateConfig]);

  const handleFileSelect = async (file: File) => {
    setExtractError(null);

    // Check if imported file is a video
    if (VideoFrameExtractor.isVideoFile(file)) {
      setIsExtracting(true);
      setExtractProgress(0);
      setExtractedCount(0);
      setTotalExtractFrames(0);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await VideoFrameExtractor.extractFrames(file, {
          fps: targetFps,
          maxFrames: 120,
          signal: controller.signal,
          onProgress: (percent, current, total) => {
            setExtractProgress(percent);
            setExtractedCount(current);
            setTotalExtractFrames(total);
          },
        });

        if (result.frames.length > 0) {
          onUpdateConfig({
            url: result.frames[0],
            name: file.name,
            visible: true,
            isVideoReference: true,
            videoFrames: result.frames,
            videoFrameIndex: 0,
            videoFps: result.fps,
            syncWithTimeline: true,
          });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
          setExtractError(err.message || 'Error extracting frames from reference video');
        }
      } finally {
        setIsExtracting(false);
        abortControllerRef.current = null;
      }
      return;
    }

    // Otherwise treat as static image
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdateConfig({
        url: e.target?.result as string,
        name: file.name,
        visible: true,
        isVideoReference: false,
        videoFrames: undefined,
        videoFrameIndex: 0,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExtracting(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (config.mode === 'overlay') return;
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart && config.mode === 'window') {
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragStart.x)),
        y: Math.max(10, Math.min(window.innerHeight - 250, e.clientY - dragStart.y)),
      });
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  const handleStepFrame = (delta: number) => {
    if (!hasVideoFrames) return;
    const next = (currentDisplayIndex + delta + frameCount) % frameCount;
    onUpdateConfig({
      videoFrameIndex: next,
      syncWithTimeline: false, // User manually scrubbed
    });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Mode 1: Overlay directly on canvas */}
      {activeDisplayUrl && config.visible && config.mode === 'overlay' && (
        <div
          className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex items-center justify-center"
          style={{ opacity: config.opacity }}
        >
          <img
            src={activeDisplayUrl}
            alt="Reference Overlay"
            className="max-w-full max-h-full object-contain pointer-events-none transition-transform"
            style={{
              transform: `scale(${config.scale}) ${config.flippedH ? 'scaleX(-1)' : ''}`,
            }}
          />
        </div>
      )}

      {/* Floating Window & Controller */}
      <div
        id="reference-image-panel"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={
          config.mode === 'window'
            ? { left: `${position.x}px`, top: `${position.y}px` }
            : { right: '320px', top: '52px' }
        }
        className={`absolute z-40 bg-neutral-900/95 backdrop-blur-md border border-neutral-750 rounded-xl shadow-2xl flex flex-col text-xs text-neutral-200 select-none overflow-hidden transition-shadow ${
          config.mode === 'window' ? 'w-80 sm:w-96' : 'w-72'
        }`}
      >
        {/* Header */}
        <div
          onMouseDown={handleMouseDownHeader}
          className={`h-9 px-3 border-b border-neutral-800 bg-neutral-925 flex items-center justify-between ${
            config.mode === 'window' ? 'cursor-move' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-neutral-200 text-xs">
            {hasVideoFrames ? (
              <Film className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>
              {hasVideoFrames
                ? `Video Reference (${currentDisplayIndex + 1}/${frameCount})`
                : 'Reference Image'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {activeDisplayUrl && (
              <button
                onClick={() => onUpdateConfig({ visible: !config.visible })}
                title={config.visible ? 'Hide Reference' : 'Show Reference'}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                {config.visible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={() =>
                onUpdateConfig({ mode: config.mode === 'window' ? 'overlay' : 'window' })
              }
              title={config.mode === 'window' ? 'Switch to Canvas Overlay' : 'Switch to Floating Window'}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              {config.mode === 'window' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              title="Close Reference Window"
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Frame Extraction Modal / Progress Banner */}
        {isExtracting && (
          <div className="p-4 bg-purple-950/40 border-b border-purple-800/60 flex flex-col gap-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-purple-200 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                Extracting frames from video...
              </span>
              <span className="font-mono text-purple-300 font-semibold">
                {extractProgress}%
              </span>
            </div>

            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden border border-purple-900/50">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-150 ease-out"
                style={{ width: `${extractProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-300/80">
              <span>
                Frames: {extractedCount} {totalExtractFrames > 0 ? `/ ${totalExtractFrames}` : ''} ({targetFps} FPS)
              </span>
              <button
                onClick={handleCancelExtraction}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-red-900/60 text-neutral-300 hover:text-red-200 border border-neutral-700 text-[10px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {extractError && (
          <div className="px-3 py-2 bg-red-950/60 border-b border-red-800 text-red-200 text-[11px] flex items-center justify-between">
            <span>{extractError}</span>
            <button onClick={() => setExtractError(null)} className="text-red-400 hover:text-red-200">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Body Content */}
        {!activeDisplayUrl && !isExtracting ? (
          /* Empty / Upload State */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 flex flex-col items-center justify-center gap-2.5 border-2 border-dashed m-3 rounded-lg cursor-pointer transition-colors text-center ${
              isDragging
                ? 'border-purple-500 bg-purple-950/40 text-purple-300'
                : 'border-neutral-750 hover:border-purple-500/60 bg-neutral-950/50 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-neutral-800/90 flex items-center justify-center text-purple-400 shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-200 text-xs">Upload Reference Video or Image</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Videos are automatically converted into frame-by-frame animation guides
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Supported formats: MP4, WebM, MOV, PNG, JPG, WebP
              </p>
            </div>

            {/* Target FPS Selector for Video */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400"
            >
              <span>Video Framerate (FPS):</span>
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-750 rounded p-0.5">
                {[8, 12, 24].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => setTargetFps(fps)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      targetFps === fps
                        ? 'bg-purple-600 text-white'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {fps} fps
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Preview & Controls */
          <div className="flex flex-col gap-2.5 p-3">
            {/* Window Image / Frame View */}
            {config.mode === 'window' && activeDisplayUrl && (
              <div className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center relative transparency-grid-dark shadow-inner">
                <img
                  src={activeDisplayUrl}
                  alt={`Reference Frame ${currentDisplayIndex + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{
                    transform: `scale(${config.scale}) ${config.flippedH ? 'scaleX(-1)' : ''}`,
                    opacity: config.opacity,
                  }}
                />

                {/* Badge showing frame number */}
                {hasVideoFrames && (
                  <div className="absolute top-2 left-2 bg-neutral-900/90 backdrop-blur border border-purple-500/40 rounded px-1.5 py-0.5 text-[10px] font-mono text-purple-300 flex items-center gap-1 shadow">
                    <Film className="w-3 h-3 text-purple-400" />
                    <span>Frame {currentDisplayIndex + 1}/{frameCount}</span>
                  </div>
                )}
              </div>
            )}

            {/* VIDEO FRAME CONTROLS (When video frames are extracted) */}
            {hasVideoFrames && (
              <div className="flex flex-col gap-2 bg-neutral-925 p-2 rounded-lg border border-purple-900/40">
                {/* Frame Slider & Timeline Scrubber */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-purple-300 font-semibold w-7 text-right">
                    #{currentDisplayIndex + 1}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={frameCount - 1}
                    value={currentDisplayIndex}
                    onChange={(e) => {
                      onUpdateConfig({
                        videoFrameIndex: Number(e.target.value),
                        syncWithTimeline: false,
                      });
                    }}
                    className="flex-1 accent-purple-400 h-1.5 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-neutral-400 w-7">
                    #{frameCount}
                  </span>
                </div>

                {/* Transport & Sync Toolbar */}
                <div className="flex items-center justify-between text-xs pt-1">
                  {/* Playback Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStepFrame(-1)}
                      title="Previous Frame"
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setIsPlayingRef(!isPlayingRef)}
                      title={isPlayingRef ? 'Pause Video Reference' : 'Play Video Reference Loop'}
                      className={`p-1 px-2 rounded flex items-center gap-1 text-[11px] font-medium transition-colors ${
                        isPlayingRef
                          ? 'bg-purple-600 text-white'
                          : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200'
                      }`}
                    >
                      {isPlayingRef ? (
                        <>
                          <Pause className="w-3 h-3" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" /> Play
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleStepFrame(1)}
                      title="Next Frame"
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sync with Animation Timeline Toggle */}
                  <button
                    onClick={() =>
                      onUpdateConfig({ syncWithTimeline: !config.syncWithTimeline })
                    }
                    title="Sync with Animation Timeline"
                    className={`px-2 py-1 rounded border text-[10px] flex items-center gap-1 transition-colors ${
                      config.syncWithTimeline
                        ? 'bg-purple-950 border-purple-500/60 text-purple-300 shadow-sm'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    {config.syncWithTimeline ? 'Timeline Synced' : 'Sync Timeline'}
                  </button>
                </div>

                {/* Import All Frames into Animation Timeline Button */}
                {onImportFramesToTimeline && (
                  <button
                    onClick={() => {
                      if (config.videoFrames && config.videoFrames.length > 0) {
                        onImportFramesToTimeline(config.videoFrames);
                      }
                    }}
                    className="w-full mt-1 py-1.5 px-3 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Add all frames to Animation Timeline ({frameCount} frames)
                  </button>
                )}
              </div>
            )}

            {/* Quick Adjustment Controls (Opacity & Scale) */}
            <div className="flex flex-col gap-2 pt-1">
              {/* Opacity Slider */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-cyan-400" /> Opacity:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(config.opacity * 100)}
                    onChange={(e) => onUpdateConfig({ opacity: Number(e.target.value) / 100 })}
                    className="w-24 accent-cyan-400 h-1.5"
                  />
                  <span className="font-mono text-cyan-300 w-8 text-right">
                    {Math.round(config.opacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Scale Slider */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-cyan-400" /> Scale:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    value={Math.round(config.scale * 100)}
                    onChange={(e) => onUpdateConfig({ scale: Number(e.target.value) / 100 })}
                    className="w-24 accent-cyan-400 h-1.5"
                  />
                  <span className="font-mono text-cyan-300 w-8 text-right">
                    {Math.round(config.scale * 100)}%
                  </span>
                </div>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateConfig({ flippedH: !config.flippedH })}
                    title="Flip Horizontally"
                    className={`p-1.5 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                      config.flippedH
                        ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <FlipHorizontal className="w-3 h-3" /> Flip
                  </button>

                  <button
                    onClick={() => onUpdateConfig({ scale: 1, flippedH: false, opacity: 0.8 })}
                    title="Reset Scale & Opacity"
                    className="p-1.5 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 text-neutral-300 hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() =>
                      onUpdateConfig({ mode: config.mode === 'window' ? 'overlay' : 'window' })
                    }
                    className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 text-[10px] text-neutral-300"
                  >
                    {config.mode === 'window' ? 'Overlay on Canvas' : 'Window Mode'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Change Video / Image"
                    className="p-1.5 rounded hover:bg-neutral-800 text-purple-400 hover:text-purple-300"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      onUpdateConfig({
                        url: null,
                        name: '',
                        isVideoReference: false,
                        videoFrames: undefined,
                        videoFrameIndex: 0,
                      })
                    }
                    title="Remove Reference"
                    className="p-1.5 rounded hover:bg-red-950 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
