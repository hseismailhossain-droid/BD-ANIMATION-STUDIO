import React, { useState, useEffect, useRef } from 'react';
import { AnimationFrame, AnimationSettings, AudioTrackItem } from '../types';
import { AudioEngine } from '../engine/audioEngine';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Plus,
  Copy,
  Trash2,
  Layers,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Move,
  Volume2,
  Mic,
  Music,
  Film,
} from 'lucide-react';

interface AnimationTimelineProps {
  frames: AnimationFrame[];
  settings: AnimationSettings;
  onUpdateSettings: (settings: Partial<AnimationSettings>) => void;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  onReorderFrame?: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
  audioTracks?: AudioTrackItem[];
  onOpenSoundStudio?: () => void;
  onOpenQuickVoice?: () => void;
  onImportReferenceVideo?: () => void;
}

export const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  frames,
  settings,
  onUpdateSettings,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onReorderFrame,
  onClose,
  audioTracks = [],
  onOpenSoundStudio,
  onOpenQuickVoice,
  onImportReferenceVideo,
}) => {
  const [showOnionSettings, setShowOnionSettings] = useState(false);
  const controlsBarRef = useRef<HTMLDivElement | null>(null);
  const scrubberTrackRef = useRef<HTMLDivElement | null>(null);

  // Keep a stable ref to avoid restarting the playback timer on every tick
  const currFrameRef = useRef(settings.currentFrameIndex);
  currFrameRef.current = settings.currentFrameIndex;

  // Auto-scroll scrubber track to keep current frame visible
  useEffect(() => {
    const track = scrubberTrackRef.current;
    if (!track) return;
    const selectedEl = track.children[settings.currentFrameIndex] as HTMLElement | undefined;
    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [settings.currentFrameIndex]);

  // Unified Horizontal Drag-to-Scroll for Controls Bar
  const dragControlsRef = useRef<{ isDown: boolean; startX: number; scrollLeft: number }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });

  const handleControlsPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;
    const bar = controlsBarRef.current;
    if (!bar) return;
    dragControlsRef.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: bar.scrollLeft,
    };
  };

  const handleControlsPointerMove = (e: React.PointerEvent) => {
    if (!dragControlsRef.current.isDown) return;
    const bar = controlsBarRef.current;
    if (!bar) return;
    const deltaX = e.clientX - dragControlsRef.current.startX;
    bar.scrollLeft = dragControlsRef.current.scrollLeft - deltaX;
  };

  const handleControlsPointerUp = () => {
    dragControlsRef.current.isDown = false;
  };

  // Unified Horizontal Drag-to-Scroll for Scrubber Track
  const dragScrubberRef = useRef<{ isDown: boolean; startX: number; scrollLeft: number }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });

  const handleScrubberPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    const track = scrubberTrackRef.current;
    if (!track) return;
    dragScrubberRef.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: track.scrollLeft,
    };
  };

  const handleScrubberPointerMove = (e: React.PointerEvent) => {
    if (!dragScrubberRef.current.isDown) return;
    const track = scrubberTrackRef.current;
    if (!track) return;
    const deltaX = e.clientX - dragScrubberRef.current.startX;
    track.scrollLeft = dragScrubberRef.current.scrollLeft - deltaX;
  };

  const handleScrubberPointerUp = () => {
    dragScrubberRef.current.isDown = false;
  };

  // High-performance RAF playback engine
  useEffect(() => {
    if (!settings.isPlaying || frames.length <= 1) return;

    let lastTime = performance.now();
    let animId: number;
    const targetFps = Math.max(1, Math.min(60, settings.fps || 12));
    const interval = 1000 / targetFps;

    const step = (now: number) => {
      const delta = now - lastTime;
      if (delta >= interval) {
        lastTime = now - (delta % interval);
        const nextIdx = (currFrameRef.current + 1) % frames.length;
        onSelectFrame(nextIdx);

        // Trigger audio playback for tracks starting at nextIdx
        if (audioTracks && audioTracks.length > 0) {
          for (const track of audioTracks) {
            if (track.startFrame === nextIdx && !track.muted) {
              AudioEngine.playTrack(track);
            }
          }
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [settings.isPlaying, settings.fps, frames.length, onSelectFrame, audioTracks]);

  const togglePlay = () => {
    const willPlay = !settings.isPlaying;
    onUpdateSettings({ isPlaying: willPlay });

    if (willPlay && audioTracks && audioTracks.length > 0) {
      for (const track of audioTracks) {
        if (track.startFrame === settings.currentFrameIndex && !track.muted) {
          AudioEngine.playTrack(track);
        }
      }
    } else if (!willPlay) {
      AudioEngine.stopAllSounds();
    }
  };

  const handlePrevFrame = () => {
    const next = settings.currentFrameIndex > 0 ? settings.currentFrameIndex - 1 : frames.length - 1;
    onSelectFrame(next);
  };

  const handleNextFrame = () => {
    const next = settings.currentFrameIndex < frames.length - 1 ? settings.currentFrameIndex + 1 : 0;
    onSelectFrame(next);
  };

  return (
    <div className="h-28 bg-neutral-900 border-t border-neutral-800 flex flex-col text-xs text-neutral-200 select-none z-30">
      {/* Timeline Controls Bar */}
      <div
        ref={controlsBarRef}
        onPointerDown={handleControlsPointerDown}
        onPointerMove={handleControlsPointerMove}
        onPointerUp={handleControlsPointerUp}
        onPointerCancel={handleControlsPointerUp}
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
        className="h-8 px-2 sm:px-3 border-b border-neutral-800 bg-neutral-925 flex items-center justify-start gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none whitespace-nowrap scroll-touch cursor-grab active:cursor-grabbing"
      >
        {/* Left: Quick Hide Button + Playback Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              title="Hide Timeline (টাইমলাইন হাইড / লুকান)"
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1 text-[11px] font-bold border border-neutral-700 cursor-pointer active:scale-95 transition-all mr-0.5 shadow-sm"
            >
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hide</span>
            </button>
          )}

          <button
            onClick={togglePlay}
            title={settings.isPlaying ? 'Pause Animation (Space)' : 'Play Animation (Space)'}
            className="w-6 h-6 rounded flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors"
          >
            {settings.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={handlePrevFrame}
            title="Previous Frame (,)"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleNextFrame}
            title="Next Frame (.)"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-neutral-800 mx-1" />

          {/* Current Frame Counter */}
          <div className="font-mono text-[11px] text-neutral-400 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">{settings.currentFrameIndex + 1}</span>
            <span>/</span>
            <span>{frames.length}</span>
            <span className="text-neutral-600 text-[10px]">frames</span>
          </div>

          <div className="h-3.5 w-px bg-neutral-800 mx-1" />

          {/* FPS Selector */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[11px]">FPS:</span>
            <select
              value={settings.fps}
              onChange={(e) => onUpdateSettings({ fps: Number(e.target.value) })}
              className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
            >
              <option value="6">6 fps</option>
              <option value="12">12 fps (Anime / Traditional 2s)</option>
              <option value="24">24 fps (Cinema)</option>
              <option value="30">30 fps (Video)</option>
              <option value="60">60 fps (Smooth)</option>
            </select>
          </div>

          {/* Loop toggle */}
          <button
            onClick={() => onUpdateSettings({ loop: !settings.loop })}
            title={settings.loop ? 'Loop: ON' : 'Loop: OFF'}
            className={`p-1 rounded transition-colors ${
              settings.loop ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Onion Skinning */}
        <div className="flex items-center gap-2 relative shrink-0">
          <button
            onClick={() => onUpdateSettings({ onionSkin: !settings.onionSkin })}
            title="Toggle Onion Skinning"
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              settings.onionSkin
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-sm'
                : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3 h-3 text-amber-400" />
            <span>Onion Skin {settings.onionSkin ? 'ON' : 'OFF'}</span>
          </button>

          {/* Onion Skin Settings toggle */}
          <button
            onClick={() => setShowOnionSettings(!showOnionSettings)}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            title="Onion Skinning Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Onion Skin Popover */}
          {showOnionSettings && (
            <div className="absolute right-0 bottom-8 w-56 bg-neutral-900 border border-neutral-750 rounded-lg p-2.5 shadow-2xl z-50 flex flex-col gap-2">
              <span className="font-semibold text-neutral-200 text-[11px]">Onion Skinning Setup</span>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-red-400">Past Frames (Red):</span>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={settings.onionFramesBefore}
                  onChange={(e) => onUpdateSettings({ onionFramesBefore: Number(e.target.value) })}
                  className="w-12 bg-neutral-800 border border-neutral-700 rounded px-1 text-center"
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-400">Future Frames (Green):</span>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={settings.onionFramesAfter}
                  onChange={(e) => onUpdateSettings({ onionFramesAfter: Number(e.target.value) })}
                  className="w-12 bg-neutral-800 border border-neutral-700 rounded px-1 text-center"
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Ghost Opacity:</span>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={Math.round(settings.onionOpacity * 100)}
                  onChange={(e) => onUpdateSettings({ onionOpacity: Number(e.target.value) / 100 })}
                  className="w-20 accent-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Sound Studio Button & Frame Manipulation Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenQuickVoice && (
            <button
              onClick={onOpenQuickVoice}
              title="Direct Voice Recording"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-[11px] shadow-sm transition-all hover:scale-102 active:scale-95 animate-pulse"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>🎙️ Record Voice</span>
            </button>
          )}

          {onOpenSoundStudio && (
            <button
              onClick={onOpenSoundStudio}
              title="Open Sound Effects & Voice Recording Studio"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-neutral-800 to-neutral-750 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:text-white font-medium text-[11px] shadow-sm transition-all"
            >
              <Mic className="w-3 h-3 text-red-400" />
              <span>Audio & Voice ({audioTracks.length})</span>
            </button>
          )}

          {onImportReferenceVideo && (
            <button
              onClick={onImportReferenceVideo}
              title="Import Reference Video (Frame by frame animation guide)"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-neutral-800 hover:bg-purple-950/60 text-purple-300 hover:text-purple-200 border border-purple-800/60 font-medium text-[11px] shadow-sm transition-all"
            >
              <Film className="w-3 h-3 text-purple-400" />
              <span>Reference Video</span>
            </button>
          )}

          <div className="h-3.5 w-px bg-neutral-800 mx-0.5" />

          <button
            onClick={onAddFrame}
            title="Add Blank Frame"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900 transition-colors text-[11px]"
          >
            <Plus className="w-3 h-3" /> Add Frame
          </button>

          {/* Move Frame Left / Right Buttons */}
          <div className="flex items-center gap-0.5 bg-neutral-850 p-0.5 rounded border border-neutral-750">
            <button
              disabled={!onReorderFrame || settings.currentFrameIndex <= 0}
              onClick={() => onReorderFrame?.(settings.currentFrameIndex, settings.currentFrameIndex - 1)}
              title="Move Current Frame Left / Earlier (ফ্রেম বামে/আগে সরান)"
              className="p-1 rounded hover:bg-neutral-750 text-cyan-300 disabled:opacity-20 cursor-pointer active:scale-90 transition-all flex items-center gap-0.5 text-[10px] font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Move</span>
            </button>
            <button
              disabled={!onReorderFrame || settings.currentFrameIndex >= frames.length - 1}
              onClick={() => onReorderFrame?.(settings.currentFrameIndex, settings.currentFrameIndex + 1)}
              title="Move Current Frame Right / Later (ফ্রেম ডানে/পরে সরান)"
              className="p-1 rounded hover:bg-neutral-750 text-cyan-300 disabled:opacity-20 cursor-pointer active:scale-90 transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onDuplicateFrame(settings.currentFrameIndex)}
            title="Duplicate Current Frame"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={frames.length <= 1}
            onClick={() => onDeleteFrame(settings.currentFrameIndex)}
            title="Delete Current Frame"
            className="p-1 rounded hover:bg-red-950/50 hover:text-red-300 text-neutral-400 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close Timeline"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 ml-1"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frames Scrubber Track with Smooth 2-Way Touch Pan & Drag */}
      <div
        ref={scrubberTrackRef}
        onPointerDown={handleScrubberPointerDown}
        onPointerMove={handleScrubberPointerMove}
        onPointerUp={handleScrubberPointerUp}
        onPointerCancel={handleScrubberPointerUp}
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
        className="flex-1 p-2 overflow-x-auto flex items-center gap-2 bg-neutral-950 scroll-touch cursor-grab active:cursor-grabbing select-none"
      >
        {frames.map((frame, index) => {
          const isSelected = index === settings.currentFrameIndex;
          const frameAudioTracks = audioTracks.filter((t) => t.startFrame === index);
          return (
            <div
              key={frame.id}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(index));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                if (!isNaN(fromIdx) && fromIdx !== index) {
                  onReorderFrame?.(fromIdx, index);
                }
              }}
              onClick={() => onSelectFrame(index)}
              title={`Frame #${index + 1} (Tap to select)`}
              className={`group relative flex flex-col items-center justify-between w-16 h-16 rounded-lg p-1 border cursor-pointer shrink-0 transition-all touch-pan-x ${
                isSelected
                  ? 'bg-neutral-850 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Quick Move Arrows on Active Frame */}
              {isSelected && frames.length > 1 && (
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center bg-cyan-950 border border-cyan-500 rounded-full shadow-lg z-10 px-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={index === 0}
                    onClick={() => onReorderFrame?.(index, index - 1)}
                    className="p-0.5 text-cyan-300 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Move Frame Left"
                  >
                    <ChevronLeft className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-[7px] font-mono text-cyan-300 font-bold px-0.5">Move</span>
                  <button
                    disabled={index === frames.length - 1}
                    onClick={() => onReorderFrame?.(index, index + 1)}
                    className="p-0.5 text-cyan-300 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Move Frame Right"
                  >
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
              {/* Top row: Frame Index Pill + Audio indicator if any */}
              <div className="w-full flex items-center justify-between px-0.5">
                <span className={`text-[10px] font-mono ${isSelected ? 'text-cyan-400 font-bold' : 'text-neutral-500'}`}>
                  #{index + 1}
                </span>
                {frameAudioTracks.length > 0 && (
                  <span
                    className="flex items-center gap-0.5 text-[8px] px-1 py-0.2 rounded bg-purple-950 border border-purple-600/80 text-purple-300 font-bold"
                    title={frameAudioTracks.map((t) => t.name).join(', ')}
                  >
                    <Music className="w-2.5 h-2.5 text-purple-300" />
                    <span>{frameAudioTracks.length}</span>
                  </span>
                )}
              </div>

              {/* Mini Frame Representation */}
              <div className="w-12 h-7 rounded border border-neutral-750 bg-neutral-950 overflow-hidden flex items-center justify-center transparency-grid-dark">
                <span className="text-[9px] text-neutral-500 font-mono">
                  {frame.layers.filter((l) => l.visible).length}L
                </span>
              </div>

              {/* Active Indicator Bar */}
              <div className={`w-8 h-1 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-transparent'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
