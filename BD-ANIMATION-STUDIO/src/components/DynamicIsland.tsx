import React, { useState, useRef, useEffect } from 'react';
import {
  ToolType,
  BrushSettings,
  Layer,
  AnimationFrame,
  AnimationSettings,
  AudioTrackItem,
  CloneSettings,
  GridConfig,
} from '../types';
import { AudioEngine, SOUND_PRESETS } from '../engine/audioEngine';
import {
  Paintbrush,
  Eraser,
  PenTool,
  PaintBucket,
  Shapes,
  Move,
  Grid3X3,
  Bone as BoneIcon,
  Type,
  Pipette,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Copy,
  Trash2,
  Layers,
  Undo2,
  Redo2,
  RotateCcw,
  GripHorizontal,
  ChevronUp,
  ChevronDown,
  Volume2,
  Mic,
  Maximize2,
  Download,
  Check,
  Footprints,
  Car,
  Train,
  Plane,
  CloudRain,
  Zap,
  Frown,
  Smile,
  Sliders,
  Sparkles,
  MousePointer,
  Stamp,
  ClipboardPaste,
  CopyPlus,
  Scissors,
  Crosshair,
  Grid as GridIcon,
  Magnet,
} from 'lucide-react';

interface DynamicIslandProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  brushSettings: BrushSettings;
  onUpdateBrushSettings: (settings: Partial<BrushSettings>) => void;
  frames: AnimationFrame[];
  animSettings: AnimationSettings;
  onUpdateAnimSettings: (settings: Partial<AnimationSettings>) => void;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFitZoom: () => void;
  onOpenSoundStudio: () => void;
  onOpenQuickVoice?: () => void;
  onOpenExportModal: () => void;
  audioTracks: AudioTrackItem[];
  onAddAudioTrack: (track: AudioTrackItem) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onDuplicate?: () => void;
  canPaste?: boolean;
  selectedVectorShapeId?: string;
  cloneSettings?: CloneSettings;
  onToggleCloneSampling?: () => void;
  isFullPageMode?: boolean;
  gridConfig?: GridConfig;
  onToggleGrid?: () => void;
  onOpenGridStudio?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = React.memo(({
  activeTool,
  onSelectTool,
  primaryColor,
  onPrimaryColorChange,
  brushSettings,
  onUpdateBrushSettings,
  frames,
  animSettings,
  onUpdateAnimSettings,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFitZoom,
  onOpenSoundStudio,
  onOpenQuickVoice,
  onOpenExportModal,
  audioTracks,
  onAddAudioTrack,
  onCopy,
  onPaste,
  onCut,
  onDuplicate,
  canPaste = false,
  selectedVectorShapeId,
  cloneSettings,
  onToggleCloneSampling,
  isFullPageMode = false,
  gridConfig,
  onToggleGrid,
  onOpenGridStudio,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'audio' | 'anim' | 'color' | 'actions'>('tools');
  const [lastPlayedSfx, setLastPlayedSfx] = useState<string | null>(null);
  const islandRef = useRef<HTMLDivElement | null>(null);

  // Free movement & dragging state (Desktop mouse + Mobile touch + Stylus)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('prostudio_dynamic_island_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    islandStartX: number;
    islandStartY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    islandStartX: 0,
    islandStartY: 0,
    hasMoved: false,
  });

  // Clamp within viewport if resized or moved
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev || !islandRef.current) return prev;
        const width = islandRef.current.offsetWidth || 300;
        const height = islandRef.current.offsetHeight || 60;
        const clamped = {
          x: Math.max(8, Math.min(window.innerWidth - width - 8, prev.x)),
          y: Math.max(8, Math.min(window.innerHeight - height - 8, prev.y)),
        };
        try {
          localStorage.setItem('prostudio_dynamic_island_pos', JSON.stringify(clamped));
        } catch {}
        return clamped;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update position with persistence helper
  const updatePosition = (newPos: { x: number; y: number } | null) => {
    setPosition(newPos);
    try {
      if (newPos) {
        localStorage.setItem('prostudio_dynamic_island_pos', JSON.stringify(newPos));
      } else {
        localStorage.removeItem('prostudio_dynamic_island_pos');
      }
    } catch {}
  };

  // Pointer Drag Handlers (supports Touch & Mouse smoothly with window listeners)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    const target = e.target as HTMLElement;
    // Don't start drag if clicking interactive elements
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a')
    ) {
      return;
    }

    const islandEl = islandRef.current;
    if (!islandEl) return;

    const rect = islandEl.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      islandStartX: rect.left,
      islandStartY: rect.top,
      hasMoved: false,
    };

    setIsDragging(true);
  };

  // Infallible window-level pointer tracking for 60fps smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        dragStartRef.current.hasMoved = true;
      }

      const islandEl = islandRef.current;
      const width = islandEl?.offsetWidth || 280;
      const height = islandEl?.offsetHeight || 44;

      const newX = dragStartRef.current.islandStartX + deltaX;
      const newY = dragStartRef.current.islandStartY + deltaY;

      // Clamp inside window boundaries
      const clampedX = Math.max(8, Math.min(window.innerWidth - width - 8, newX));
      const clampedY = Math.max(8, Math.min(window.innerHeight - height - 8, newY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleWindowPointerUp = () => {
      setIsDragging(false);

      if (dragStartRef.current.hasMoved) {
        // Save final position to localStorage
        setPosition((curr) => {
          if (curr) {
            try {
              localStorage.setItem('prostudio_dynamic_island_pos', JSON.stringify(curr));
            } catch {}
          }
          return curr;
        });
      } else if (!isExpanded) {
        setIsExpanded(true);
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [isDragging, isExpanded]);

  const handleResetPosition = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updatePosition(null);
  };

  const handleDockPosition = (dock: 'top-center' | 'top-left' | 'top-right' | 'bottom-center') => {
    const islandEl = islandRef.current;
    const width = islandEl?.offsetWidth || 300;
    const height = islandEl?.offsetHeight || 44;

    if (dock === 'top-center') {
      updatePosition(null);
      return;
    }

    let x = (window.innerWidth - width) / 2;
    let y = 14;

    if (dock === 'top-left') {
      x = 16;
      y = 14;
    } else if (dock === 'top-right') {
      x = window.innerWidth - width - 16;
      y = 14;
    } else if (dock === 'bottom-center') {
      x = (window.innerWidth - width) / 2;
      y = window.innerHeight - height - 80;
    }

    updatePosition({ x: Math.max(8, x), y: Math.max(8, y) });
  };

  // Close island on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDragging) return;
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isDragging]);

  // Current Tool Icon Helper
  const getToolIcon = (tool: ToolType) => {
    switch (tool) {
      case 'brush':
        return <Paintbrush className="w-3.5 h-3.5 text-cyan-400" />;
      case 'eraser':
        return <Eraser className="w-3.5 h-3.5 text-red-400" />;
      case 'vector-pen':
        return <PenTool className="w-3.5 h-3.5 text-blue-400" />;
      case 'bucket':
        return <PaintBucket className="w-3.5 h-3.5 text-emerald-400" />;
      case 'vector-shape':
        return <Shapes className="w-3.5 h-3.5 text-amber-400" />;
      case 'transform':
        return <Move className="w-3.5 h-3.5 text-purple-400" />;
      case 'mesh':
        return <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'bone':
        return <BoneIcon className="w-3.5 h-3.5 text-teal-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-pink-400" />;
      case 'eyedropper':
        return <Pipette className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <Paintbrush className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // Quick sound trigger from Dynamic Island
  const handleQuickSfx = async (presetId: string) => {
    setLastPlayedSfx(presetId);
    try {
      await AudioEngine.previewSound(presetId);
      // Auto-add to current frame
      const preset = SOUND_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const clip = await AudioEngine.generateSoundClip(presetId);
        const durationFrames = Math.max(1, Math.round(preset.durationSeconds * animSettings.fps));
        onAddAudioTrack({
          id: `island_sfx_${Date.now()}`,
          name: preset.bengaliName,
          category: 'sfx',
          soundType: preset.id,
          audioUrl: clip.url,
          startFrame: animSettings.currentFrameIndex,
          durationFrames,
          durationSeconds: preset.durationSeconds,
          volume: 0.9,
          muted: false,
        });
      }
    } catch {
      // preview error
    } finally {
      setTimeout(() => setLastPlayedSfx(null), 1000);
    }
  };

  const currentFrame = animSettings.currentFrameIndex;
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  return (
    <div
      ref={islandRef}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : undefined
      }
      className={`fixed z-50 select-none ${isExpanded ? 'touch-auto' : 'touch-none'} ${
        position
          ? ''
          : isFullPageMode
          ? 'left-1/2 -translate-x-1/2 top-3'
          : 'left-1/2 -translate-x-1/2 top-20 sm:top-[76px]'
      } ${isExpanded ? 'w-[94vw] max-w-lg' : 'w-auto'}`}
    >
      {/* COLLAPSED STATE: Sleek Apple-style Pill Capsule (Draggable & Clickable) */}
      {!isExpanded ? (
        <div
          onPointerDown={handlePointerDown}
          className={`group px-3 py-1.5 bg-black/95 hover:bg-neutral-950 backdrop-blur-2xl border border-neutral-700/80 rounded-full shadow-2xl flex items-center gap-2 text-xs text-neutral-200 transition-all ring-1 ring-cyan-500/30 touch-none ${
            isDragging
              ? 'cursor-grabbing ring-2 ring-cyan-400 scale-105 shadow-cyan-500/30 shadow-2xl'
              : 'cursor-grab hover:scale-102 hover:border-cyan-500/50'
          }`}
          title="মাউস বা হাত দিয়ে চেপে ধরে যেকোনো জায়গায় ড্র্যাগ করে সরান (Drag anywhere / Tap to open)"
        >
          {/* Visual Grip Handle */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              handlePointerDown(e);
            }}
            className="flex items-center gap-1 text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-700/80 font-bold text-[10px] cursor-grab active:cursor-grabbing touch-none select-none shadow-sm"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
            <span>মুভ</span>
          </div>

          {/* Active Tool Icon */}
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-full bg-neutral-900 border border-neutral-700/80">
              {getToolIcon(activeTool)}
            </div>
            <span className="font-semibold text-[11px] capitalize hidden sm:inline text-neutral-300">
              {activeTool === 'brush' ? 'ব্রাশ' : activeTool === 'bone' ? 'হাড়' : activeTool}
            </span>
          </div>

          <div className="w-px h-3 bg-neutral-800" />

          {/* Color Indicator & Quick Color Picker */}
          <label
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded-full border border-white/60 shadow-sm shrink-0 cursor-pointer block relative overflow-hidden ring-1 ring-black/40 hover:scale-110 transition-transform"
            style={{ backgroundColor: primaryColor }}
            title={`বর্তমান রঙ: ${primaryColor} (ট্যাপ করে রঙ পরিবর্তন করুন)`}
          >
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>

          {/* Quick Glow Pencil 1-Click Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectTool('brush');
              onUpdateBrushSettings({
                preset: 'glow-pencil',
                isGlow: true,
                glowIntensity: 28,
              });
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm transition-all ${
              activeTool === 'brush' && brushSettings.preset === 'glow-pencil'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black ring-1 ring-white font-extrabold'
                : 'bg-neutral-850 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 hover:border-amber-400'
            }`}
            title="✨ গ্লো পেন্সিল (যেকোনো রঙে নিয়ন আলো ড্রইং)"
          >
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>গ্লো পেন্সিল</span>
          </button>

          <div className="w-px h-3 bg-neutral-800" />

          {/* Frame Counter & Playback */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-cyan-400 font-bold">#{currentFrame + 1}</span>
            <span className="text-neutral-500">/{frames.length}</span>
            {animSettings.isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
            )}
          </div>

          <div className="w-px h-3 bg-neutral-800" />

          {/* Sound / Mic Status */}
          <div className="flex items-center gap-1 text-neutral-400">
            {audioTracks.length > 0 ? (
              <span className="flex items-center gap-0.5 text-cyan-400 text-[10px]">
                <Volume2 className="w-3 h-3" />
                <span>{audioTracks.length}</span>
              </span>
            ) : (
              <Mic className="w-3 h-3 text-neutral-500" />
            )}
          </div>

          <div className="w-px h-3 bg-neutral-800" />

          {/* Direct Voice Record 1-Click Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenQuickVoice) {
                onOpenQuickVoice();
              } else {
                setIsExpanded(true);
                setActiveTab('audio');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[10px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            title="সরাসরি ভয়েস রেকর্ড করুন (Direct Voice Record)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>ভয়েস রেকর্ড</span>
          </button>

          {/* Quick Copy / Paste Object Controls in Capsule */}
          {(selectedVectorShapeId || canPaste || activeTool === 'vector-select') && (
            <>
              <div className="w-px h-3 bg-neutral-800" />
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onCopy}
                  className="px-1.5 py-0.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[10px] font-semibold flex items-center gap-0.5 transition-all"
                  title="কপি করুন (Ctrl+C)"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>কপি</span>
                </button>
                {canPaste && (
                  <button
                    onClick={onPaste}
                    className="px-1.5 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold flex items-center gap-0.5 transition-all"
                    title="পেস্ট করুন (Ctrl+V)"
                  >
                    <ClipboardPaste className="w-2.5 h-2.5" />
                    <span>পেস্ট</span>
                  </button>
                )}
                {selectedVectorShapeId && (
                  <button
                    onClick={onDuplicate}
                    className="px-1.5 py-0.5 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-300 text-[10px] font-semibold flex items-center gap-0.5 transition-all"
                    title="ডুপ্লিকেট করুন (Ctrl+D)"
                  >
                    <CopyPlus className="w-2.5 h-2.5" />
                    <span>ডুপ্লিকেট</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Expand Hint */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="w-5 h-5 rounded-full bg-neutral-850 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-neutral-800 transition-colors cursor-pointer"
            title="স্টুডিও খুলুন"
          >
            <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      ) : (
        /* EXPANDED STATE: Full Mobile Island Studio */
        <div className="bg-neutral-950/95 backdrop-blur-2xl border border-neutral-750/90 rounded-3xl p-3 shadow-2xl flex flex-col gap-2.5 text-neutral-200 animate-in zoom-in-95 duration-200 ring-1 ring-cyan-500/40">
          {/* Top Bar: Island Header + Drag Grip Handle + Quick Scrub & Collapse */}
          <div
            onPointerDown={handlePointerDown}
            className={`flex items-center justify-between pb-2 border-b border-neutral-800/80 touch-none select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title="ড্র্যাগ করে যেকোনো জায়গায় সরান (Drag header to move anywhere)"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-bold text-[10px]">
                <GripHorizontal className="w-3.5 h-3.5" />
                <span>ড্র্যাগ মুভ</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">ডাইনামিক আইল্যান্ড</span>
            </div>

            {/* Quick Dock Presets & Controls */}
            <div className="flex items-center gap-1">
              {/* Quick dock buttons */}
              <div className="hidden sm:flex items-center gap-0.5 bg-neutral-900 px-1 py-0.5 rounded-full border border-neutral-800 text-[9px] text-neutral-400">
                <button
                  onClick={() => handleDockPosition('top-left')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="বামে ডক করুন"
                >
                  বামে
                </button>
                <button
                  onClick={() => handleDockPosition('top-center')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="শীর্ষে মাঝে"
                >
                  শীর্ষে
                </button>
                <button
                  onClick={() => handleDockPosition('top-right')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="ডানে ডক করুন"
                >
                  ডানে
                </button>
                <button
                  onClick={() => handleDockPosition('bottom-center')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="নিচে ডক করুন"
                >
                  নিচে
                </button>
              </div>

              {position && (
                <button
                  onClick={handleResetPosition}
                  className="px-2 py-1 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[10px] flex items-center gap-1 transition-colors border border-neutral-750"
                  title="পুনরায় শীর্ষে মাঝখানে আনুন (Reset position to top center)"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>রিসেট</span>
                </button>
              )}

              <button
                onClick={() => onUpdateAnimSettings({ isPlaying: !animSettings.isPlaying })}
                className="px-2.5 py-1 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
              >
                {animSettings.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{animSettings.isPlaying ? 'পজ' : 'প্লে'}</span>
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                title="Collapse Island"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1 bg-neutral-900/90 p-1 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('tools')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'tools' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Paintbrush className="w-3 h-3" />
              <span>টুলস</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'audio' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>শব্দ</span>
            </button>

            <button
              onClick={() => setActiveTab('anim')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'anim' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>অ্যানিমেশন</span>
            </button>

            <button
              onClick={() => setActiveTab('color')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'color' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>লেয়ার</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'actions' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>অ্যাকশন</span>
            </button>
          </div>

          {/* TAB 1: Mobile Tools Picker */}
          {activeTab === 'tools' && (
            <div className="flex flex-col gap-2.5">
              {/* Glow Pencil Dedicated Highlight Card */}
              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  activeTool === 'brush' && brushSettings.preset === 'glow-pencil'
                    ? 'bg-gradient-to-r from-amber-950/70 via-orange-950/60 to-yellow-950/70 border-amber-500 ring-1 ring-amber-400/60 shadow-lg'
                    : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 fill-current" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>✨ নিয়ন গ্লো পেন্সিল (সব কালার)</span>
                        {activeTool === 'brush' && brushSettings.preset === 'glow-pencil' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold text-[9px]">
                            ACTIVE
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        যেকোনো কালারে উজ্জ্বল লাইট ও ব্লুম এফেক্ট ড্রয়িং
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTool('brush');
                      onUpdateBrushSettings({
                        preset: 'glow-pencil',
                        isGlow: true,
                        glowIntensity: brushSettings.glowIntensity || 28,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                      activeTool === 'brush' && brushSettings.preset === 'glow-pencil'
                        ? 'bg-amber-400 text-black shadow-amber-500/30'
                        : 'bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {activeTool === 'brush' && brushSettings.preset === 'glow-pencil'
                      ? 'অন আছে'
                      : 'গ্লো নির্বাচন'}
                  </button>
                </div>

                {/* Glow Intensity Slider (when active) */}
                {activeTool === 'brush' && brushSettings.preset === 'glow-pencil' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-500/20 text-[11px]">
                    <span className="text-amber-300 font-semibold shrink-0">গ্লো পাওয়ার:</span>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={brushSettings.glowIntensity || 28}
                      onChange={(e) => onUpdateBrushSettings({ glowIntensity: Number(e.target.value) })}
                      className="flex-1 accent-amber-400 h-1.5"
                    />
                    <span className="font-mono text-amber-300 font-bold w-6 text-right">
                      {brushSettings.glowIntensity || 28}
                    </span>
                  </div>
                )}
              </div>

              {/* Brush Preset Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {[
                  { preset: 'glow-pencil', label: '✨ গ্লো পেন্সিল' },
                  { preset: 'pen', label: '✒️ ইনকিং পেন' },
                  { preset: 'pencil', label: '✏️ স্কেচ পেন্সিল' },
                  { preset: 'soft-airbrush', label: '💨 এয়ারব্রাশ' },
                  { preset: 'calligraphy', label: '🖋️ ক্যালিগ্রাফি' },
                  { preset: 'watercolor', label: '💧 জলরং' },
                  { preset: 'oil-paint', label: '🎨 তেলরং' },
                ].map((item) => (
                  <button
                    key={item.preset}
                    onClick={() => {
                      onSelectTool('brush');
                      onUpdateBrushSettings({
                        preset: item.preset as any,
                        isGlow: item.preset === 'glow-pencil',
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
                      activeTool === 'brush' && brushSettings.preset === item.preset
                        ? 'bg-cyan-600 border-cyan-400 text-white font-bold shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Grid of Tools (Mobile Full Suite) */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'brush', label: 'ব্রাশ (B)', icon: <Paintbrush className="w-4 h-4" /> },
                  { id: 'eraser', label: 'ইরেজার (E)', icon: <Eraser className="w-4 h-4" /> },
                  { id: 'vector-select', label: 'ডিরেক্ট সিলেক্ট (A)', icon: <MousePointer className="w-4 h-4 text-cyan-400" /> },
                  { id: 'clone', label: 'ক্লোন স্ট্যাম্প (S)', icon: <Stamp className="w-4 h-4 text-amber-400" /> },
                  { id: 'vector-pen', label: 'ভেক্টর পেন (P)', icon: <PenTool className="w-4 h-4" /> },
                  { id: 'bucket', label: 'বালতি (K)', icon: <PaintBucket className="w-4 h-4" /> },
                  { id: 'vector-shape', label: 'শেইপ (U)', icon: <Shapes className="w-4 h-4" /> },
                  { id: 'transform', label: 'মুভ (V)', icon: <Move className="w-4 h-4" /> },
                  { id: 'bone', label: 'হাড় রিগ (R)', icon: <BoneIcon className="w-4 h-4" /> },
                  { id: 'mesh', label: 'মেশ ফর্ম (M)', icon: <Grid3X3 className="w-4 h-4" /> },
                  { id: 'text', label: 'টেক্সট (T)', icon: <Type className="w-4 h-4" /> },
                  { id: 'eyedropper', label: 'ড্রপার (I)', icon: <Pipette className="w-4 h-4" /> },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onSelectTool(tool.id as ToolType);
                      setIsExpanded(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[11px] font-medium transition-all ${
                      activeTool === tool.id
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                    }`}
                  >
                    {tool.icon}
                    <span className="truncate w-full text-center">{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Clone Stamp Active Controls (Mobile Friendly Source Setter) */}
              {activeTool === 'clone' && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/40 border border-amber-500/50 text-[11px]">
                  <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {cloneSettings?.source
                        ? `সোর্স: (${Math.round(cloneSettings.source.x)}, ${Math.round(cloneSettings.source.y)})`
                        : 'সোর্স নির্ধারণ করতে ট্যাপ করুন'}
                    </span>
                  </div>
                  <button
                    onClick={onToggleCloneSampling}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all shadow-sm ${
                      cloneSettings?.isSettingSource
                        ? 'bg-amber-400 text-black animate-pulse'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {cloneSettings?.isSettingSource ? 'ক্যানভাসে ট্যাপ করুন' : '📍 সোর্স পয়েন্ট সেট'}
                  </button>
                </div>
              )}

              {/* Sliders: Size and Opacity */}
              <div className="flex items-center gap-3 bg-neutral-900/80 p-2 rounded-xl border border-neutral-800 text-[11px]">
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-neutral-400">সাইজ:</span>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushSettings.size}
                    onChange={(e) => onUpdateBrushSettings({ size: Number(e.target.value) })}
                    className="flex-1 accent-cyan-400 h-1.5"
                  />
                  <span className="font-mono text-cyan-300 w-6 text-right">{brushSettings.size}</span>
                </div>

                <div className="w-px h-4 bg-neutral-800" />

                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-neutral-400">অপাসিটি:</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={Math.round(brushSettings.opacity * 100)}
                    onChange={(e) => onUpdateBrushSettings({ opacity: Number(e.target.value) / 100 })}
                    className="flex-1 accent-cyan-400 h-1.5"
                  />
                  <span className="font-mono text-cyan-300 w-8 text-right">
                    {Math.round(brushSettings.opacity * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Mobile Voice & Sound FX */}
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-2.5">
              {/* Direct Voice Record Hero Card */}
              <div className="bg-gradient-to-r from-red-950/70 to-rose-950/50 border border-red-500/50 rounded-2xl p-2.5 flex flex-col gap-2 shadow-lg ring-1 ring-red-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>🎙️ সরাসরি ভয়েস রেকর্ড (Direct Voice)</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-black/50 px-2 py-0.5 rounded-full border border-neutral-800">
                    ফ্রেম #{currentFrame + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      if (onOpenQuickVoice) {
                        onOpenQuickVoice();
                      } else {
                        onOpenSoundStudio();
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-950/40 hover:scale-[1.02] active:scale-98 transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>মাইক্রোফোনে কথা বলুন (রেকর্ড শুরু)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      onOpenSoundStudio();
                    }}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-750 text-neutral-300 hover:text-white hover:bg-neutral-800 text-[10px] flex items-center justify-center"
                    title="সম্পূর্ণ সাউন্ড স্টুডিও খুলুন"
                  >
                    স্টুডিও
                  </button>
                </div>
              </div>

              {/* Instant SFX Soundboard (User requested: হাঁটা, গাড়ি, ট্রেন, বিমান, বৃষ্টি, বজ্রপাত, স্যাড, আনন্দ) */}
              <div className="text-[11px] text-neutral-400 font-semibold flex items-center justify-between">
                <span>এক ক্লিকে সাউন্ড যোগ করুন (ফ্রেম #{currentFrame + 1}-এ):</span>
                <span className="text-[10px] text-cyan-400">ট্যাপ করুন</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'walk', label: '🚶‍♂️ হাঁটা', icon: <Footprints className="w-3.5 h-3.5 text-emerald-400" /> },
                  { id: 'car', label: '🚗 গাড়ি', icon: <Car className="w-3.5 h-3.5 text-amber-400" /> },
                  { id: 'train', label: '🚂 ট্রেন', icon: <Train className="w-3.5 h-3.5 text-orange-400" /> },
                  { id: 'plane', label: '✈️ বিমান', icon: <Plane className="w-3.5 h-3.5 text-sky-400" /> },
                  { id: 'rain', label: '🌧️ বৃষ্টি', icon: <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> },
                  { id: 'thunder', label: '⚡ বজ্রপাত', icon: <Zap className="w-3.5 h-3.5 text-yellow-400" /> },
                  { id: 'sad', label: '😢 স্যাড', icon: <Frown className="w-3.5 h-3.5 text-indigo-400" /> },
                  { id: 'joy', label: '🎉 আনন্দ', icon: <Smile className="w-3.5 h-3.5 text-pink-400" /> },
                ].map((sfx) => (
                  <button
                    key={sfx.id}
                    onClick={() => handleQuickSfx(sfx.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-[10px] font-bold transition-all ${
                      lastPlayedSfx === sfx.id
                        ? 'bg-cyan-600 border-cyan-400 text-white scale-105 shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850 hover:border-neutral-700'
                    }`}
                  >
                    {sfx.icon}
                    <span>{sfx.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Animation Controls */}
          {activeTab === 'anim' && (
            <div className="flex flex-col gap-2.5">
              {/* Playback Row */}
              <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <button
                  onClick={() => onSelectFrame(Math.max(0, currentFrame - 1))}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onUpdateAnimSettings({ isPlaying: !animSettings.isPlaying })}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
                >
                  {animSettings.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{animSettings.isPlaying ? 'পজ করুন' : 'প্লে করুন'}</span>
                </button>

                <button
                  onClick={() => onSelectFrame(Math.min(frames.length - 1, currentFrame + 1))}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <div className="font-mono text-xs text-neutral-300 pl-2 border-l border-neutral-800">
                  <span className="text-cyan-400 font-bold">{currentFrame + 1}</span> / {frames.length}
                </div>
              </div>

              {/* Frame Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={onAddFrame}
                  className="py-2 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন ফ্রেম</span>
                </button>

                <button
                  onClick={() => onDuplicateFrame(currentFrame)}
                  className="py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>ডুপ্লিকেট</span>
                </button>

                <button
                  disabled={frames.length <= 1}
                  onClick={() => onDeleteFrame(currentFrame)}
                  className="py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 disabled:opacity-30 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছুন</span>
                </button>
              </div>

              {/* Onion Skin & FPS */}
              <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-xl border border-neutral-800 text-xs">
                <button
                  onClick={() => onUpdateAnimSettings({ onionSkin: !animSettings.onionSkin })}
                  className={`px-3 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                    animSettings.onionSkin
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>অনিয়ন স্কিন: {animSettings.onionSkin ? 'অন' : 'অফ'}</span>
                </button>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-neutral-400">FPS:</span>
                  <select
                    value={animSettings.fps}
                    onChange={(e) => onUpdateAnimSettings({ fps: Number(e.target.value) })}
                    className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-1.5 py-0.5"
                  >
                    <option value="6">6</option>
                    <option value="12">12 (Anime)</option>
                    <option value="24">24 (Film)</option>
                    <option value="30">30</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Color & Layers */}
          {activeTab === 'color' && (
            <div className="flex flex-col gap-2.5">
              {/* Quick Mobile Color Palette with Native Picker */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-300 font-semibold">কালার প্যালেট (সব কালার ড্রইং):</span>
                <label className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-850 border border-neutral-700 text-cyan-300 font-mono text-[10px] cursor-pointer hover:bg-neutral-800">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span>{primaryColor}</span>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => onPrimaryColorChange(e.target.value)}
                    className="opacity-0 w-0 h-0 absolute"
                  />
                </label>
              </div>

              {/* 16 Vibrant Neon & Cartoon Colors for Glow Pencil & Brushes */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  '#ffffff',
                  '#ff0055',
                  '#ef4444',
                  '#f97316',
                  '#facc15',
                  '#22c55e',
                  '#00ffcc',
                  '#06b6d4',
                  '#3b82f6',
                  '#6366f1',
                  '#a855f7',
                  '#ec4899',
                  '#f43f5e',
                  '#fdba74',
                  '#86efac',
                  '#000000',
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => onPrimaryColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full shrink-0 border transition-transform ${
                      primaryColor.toLowerCase() === color.toLowerCase()
                        ? 'scale-125 border-white ring-2 ring-cyan-400 shadow-md'
                        : 'border-neutral-700/80 hover:scale-110'
                    }`}
                    title={color}
                  />
                ))}
              </div>

              {/* Active Layer Picker */}
              <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400 font-semibold">সক্রিয় লেয়ার:</span>
                    {layers.find((l) => l.id === activeLayerId)?.type === 'vector' ? (
                      <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[9px] font-bold">
                        📐 ভেক্টর লেয়ার
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-bold">
                        🎨 ড্রয়িং লেয়ার
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onAddLayer}
                    className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> নতুন লেয়ার
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {layers.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => onSelectLayer(layer.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                        layer.id === activeLayerId
                          ? 'bg-cyan-600 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-400/40'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {layer.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Quick Actions */}
          {activeTab === 'actions' && (
            <div className="flex flex-col gap-2 text-xs font-semibold">
              {/* Copy & Paste & Cut & Duplicate Object Controls */}
              <div className="grid grid-cols-4 gap-1.5 bg-neutral-900/90 p-2 rounded-2xl border border-neutral-800">
                <button
                  onClick={onCopy}
                  className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-cyan-300 flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 border border-cyan-800/40 text-[11px]"
                  title="কপি করুন (Ctrl+C)"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>কপি</span>
                </button>

                <button
                  disabled={!canPaste}
                  onClick={onPaste}
                  className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-emerald-300 disabled:opacity-40 flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 border border-emerald-800/40 text-[11px]"
                  title="পেস্ট করুন (Ctrl+V)"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                  <span>পেস্ট</span>
                </button>

                <button
                  onClick={onCut}
                  className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-amber-300 flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 border border-amber-800/40 text-[11px]"
                  title="কাট করুন (Ctrl+X)"
                >
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>কাট</span>
                </button>

                <button
                  onClick={onDuplicate}
                  className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-purple-300 flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 border border-purple-800/40 text-[11px]"
                  title="ডুপ্লিকেট করুন (Ctrl+D)"
                >
                  <CopyPlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>ডুপ্লিকেট</span>
                </button>
              </div>

              {/* Grid & Guides Quick Access in Island */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${gridConfig?.enabled ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                    <GridIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-white">গ্রিড ও গাইড</div>
                    <div className="text-[9px] text-neutral-400">
                      {gridConfig?.enabled ? `সক্রিয় (${gridConfig.type})` : 'বন্ধ রয়েছে'}
                      {gridConfig?.snapToGrid && gridConfig?.enabled && ' • 🧲 স্ন্যাপ ON'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onToggleGrid && (
                    <button
                      onClick={onToggleGrid}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        gridConfig?.enabled ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {gridConfig?.enabled ? 'ON' : 'OFF'}
                    </button>
                  )}

                  {onOpenGridStudio && (
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenGridStudio();
                      }}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-750 text-cyan-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Sliders className="w-2.5 h-2.5" /> সেটিংস
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={!canUndo}
                  onClick={onUndo}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-850 disabled:opacity-30 flex items-center justify-center gap-1.5"
                >
                  <Undo2 className="w-4 h-4 text-cyan-400" />
                  <span>আনডু (Undo)</span>
                </button>

                <button
                  disabled={!canRedo}
                  onClick={onRedo}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-850 disabled:opacity-30 flex items-center justify-center gap-1.5"
                >
                  <Redo2 className="w-4 h-4 text-cyan-400" />
                  <span>রিডু (Redo)</span>
                </button>

                <button
                  onClick={onFitZoom}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-850 flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                  <span>ক্যানভাস ফিট</span>
                </button>

                <button
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenExportModal();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30"
                >
                  <Download className="w-4 h-4" />
                  <span>এক্সপোর্ট / সেভ</span>
                </button>
              </div>

              {/* Transparent Save Hero Button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onOpenExportModal();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white flex items-center justify-center gap-2 shadow-md shadow-teal-950/40 border border-teal-400/40"
              >
                <div className="w-4 h-4 rounded bg-black/40 border border-white/40 flex items-center justify-center text-[9px] font-mono font-bold">
                  α
                </div>
                <span>স্বচ্ছ ব্যাকগ্রাউন্ডে সেভ (Transparent PNG / Video Export)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
