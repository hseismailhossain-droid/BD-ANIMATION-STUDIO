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
  RotateCw,
  Hand,
  GripHorizontal,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  ChevronsDown,
  Eye,
  EyeOff,
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
  X,
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
  Palette,
  Lock,
  Unlock,
  Pencil,
  Spline,
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
  onReorderFrame?: (fromIndex: number, toIndex: number) => void;
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
  onReorderLayer?: (fromIndex: number, toIndex: number) => void;
  onUpdateLayer?: (id: string, updates: Partial<Layer>) => void;
  onDeleteLayer?: (id: string) => void;
  onDuplicateLayer?: (id: string) => void;
  onToggleRightPanel?: () => void;
  onClose?: () => void;
  topBarsVisible?: boolean;
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
  onReorderFrame,
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
  onReorderLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleRightPanel,
  onClose,
  topBarsVisible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'layers' | 'color' | 'anim' | 'audio' | 'actions'>('tools');
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

      // Finger taps on mobile naturally move 4-8px; only treat as drag if moving > 10px
      if (Math.hypot(deltaX, deltaY) > 10) {
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

  // When opening/expanding, ensure the island stays within screen bounds
  useEffect(() => {
    if (isExpanded) {
      setPosition((prev) => {
        if (!prev) return null;
        const width = Math.min(window.innerWidth - 16, 500);
        const height = Math.min(window.innerHeight - 32, 560);
        const clampedX = Math.max(8, Math.min(window.innerWidth - width - 8, prev.x));
        const clampedY = Math.max(8, Math.min(window.innerHeight - height - 8, prev.y));
        return { x: clampedX, y: clampedY };
      });
    }
  }, [isExpanded]);

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
    let y = topBarsVisible ? 84 : 14;

    if (dock === 'top-left') {
      x = 16;
      y = topBarsVisible ? 84 : 14;
    } else if (dock === 'top-right') {
      x = window.innerWidth - width - 16;
      y = topBarsVisible ? 84 : 14;
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
      case 'polyline':
        return <Spline className="w-3.5 h-3.5 text-cyan-400" />;
      case 'bezier':
        return <PenTool className="w-3.5 h-3.5 text-emerald-400" />;
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
      case 'hand':
        return <Hand className="w-3.5 h-3.5 text-emerald-400" />;
      case 'rotate':
        return <RotateCw className="w-3.5 h-3.5 text-cyan-400" />;
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
  const activeLayerIndex = Math.max(0, layers.findIndex((l) => l.id === (activeLayer?.id || activeLayerId)));

  return (
    <div
      ref={islandRef}
      style={
        position
          ? isExpanded && typeof window !== 'undefined' && window.innerWidth < 640
            ? {
                left: '8px',
                right: '8px',
                top: Math.max(10, Math.min(position.y, window.innerHeight - 480)),
                maxWidth: 'calc(100vw - 16px)',
              }
            : {
                left: `${position.x}px`,
                top: `${position.y}px`,
              }
          : undefined
      }
      className={`fixed z-50 select-none ${isExpanded ? 'touch-auto' : 'touch-none'} ${
        position
          ? ''
          : isFullPageMode || !topBarsVisible
          ? 'left-1/2 -translate-x-1/2 top-3'
          : 'left-1/2 -translate-x-1/2 top-[82px] sm:top-[86px]'
      } ${isExpanded ? 'w-[96vw] max-w-lg' : 'w-auto max-w-[calc(100vw-16px)]'}`}
    >
      {/* COLLAPSED STATE: Sleek Apple-style Pill Capsule (Draggable & Focused HUD) */}
      {!isExpanded ? (
        <div
          onPointerDown={handlePointerDown}
          className={`group px-3 py-1.5 bg-black/95 hover:bg-neutral-950 backdrop-blur-2xl border border-neutral-700/80 rounded-full shadow-2xl flex items-center gap-2 text-xs text-neutral-200 transition-all ring-1 ring-cyan-500/30 touch-none max-w-[calc(100vw-16px)] overflow-x-auto scrollbar-none ${
            isDragging
              ? 'cursor-grabbing ring-2 ring-cyan-400 scale-105 shadow-cyan-500/30 shadow-2xl'
              : 'cursor-grab hover:border-cyan-500/50'
          }`}
          title="Drag anywhere to reposition HUD"
        >
          {/* Visual Grip Handle */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              handlePointerDown(e);
            }}
            className="flex items-center gap-1 text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-700/80 font-bold text-[10px] cursor-grab active:cursor-grabbing touch-none select-none shadow-sm shrink-0"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
            <span>Move</span>
          </div>

          {/* Active Tool Icon */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="p-1 rounded-full bg-neutral-900 border border-neutral-700/80">
              {getToolIcon(activeTool)}
            </div>
            <span className="font-semibold text-[11px] capitalize hidden sm:inline text-neutral-300">
              {activeTool === 'brush' ? 'Brush' : activeTool === 'bone' ? 'Bone' : activeTool}
            </span>
          </div>

          <div className="w-px h-3 bg-neutral-800 shrink-0" />

          {/* Color Indicator & Quick Color Picker */}
          <label
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded-full border border-white/60 shadow-sm shrink-0 cursor-pointer block relative overflow-hidden ring-1 ring-black/40 hover:scale-110 transition-transform"
            style={{ backgroundColor: primaryColor }}
            title={`Current Color: ${primaryColor} (Tap to change)`}
          >
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>

          <div className="w-px h-3 bg-neutral-800 shrink-0" />

          {/* Quick Layers Launcher (Opens full Layers manager without cluttering the HUD) */}
          {onToggleRightPanel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleRightPanel();
              }}
              className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-750 shrink-0 transition-colors"
              title="Open Color & Layers Panel"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Layers</span>
            </button>
          )}

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
            title="✨ Glow Pencil (Neon glow drawing in any color)"
          >
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Glow Pencil</span>
          </button>

          <div className="w-px h-3 bg-neutral-800" />

          {/* Frame Counter & Playback */}
          <div className="flex items-center gap-1 font-mono text-[11px] shrink-0">
            <span className="text-cyan-400 font-bold">#{currentFrame + 1}</span>
            <span className="text-neutral-500">/{frames.length}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateAnimSettings({ isPlaying: !animSettings.isPlaying });
              }}
              className="p-1 rounded-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 ml-0.5 cursor-pointer active:scale-90 transition-all"
              title={animSettings.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {animSettings.isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
            </button>
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
            title="Direct Voice Record"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Voice Record</span>
          </button>

          {/* Quick Exit Clone Tool in Capsule */}
          {activeTool === 'clone' && (
            <>
              <div className="w-px h-3 bg-neutral-800" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTool('brush');
                }}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold shadow-md transition-all active:scale-95 ring-1 ring-red-400 shrink-0"
                title="Exit Clone Tool"
              >
                <X className="w-3 h-3" />
                <span>Exit Clone</span>
              </button>
            </>
          )}

          {/* Quick Copy / Paste Object Controls in Capsule */}
          {(selectedVectorShapeId || canPaste || activeTool === 'vector-select') && (
            <>
              <div className="w-px h-3 bg-neutral-800" />
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onCopy}
                  className="px-1.5 py-0.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[10px] font-semibold flex items-center gap-0.5 transition-all"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy</span>
                </button>
                {canPaste && (
                  <button
                    onClick={onPaste}
                    className="px-1.5 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold flex items-center gap-0.5 transition-all"
                    title="Paste (Ctrl+V)"
                  >
                    <ClipboardPaste className="w-2.5 h-2.5" />
                    <span>Paste</span>
                  </button>
                )}
                {selectedVectorShapeId && (
                  <button
                    onClick={onDuplicate}
                    className="px-1.5 py-0.5 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-300 text-[10px] font-semibold flex items-center gap-0.5 transition-all"
                    title="Duplicate (Ctrl+D)"
                  >
                    <CopyPlus className="w-2.5 h-2.5" />
                    <span>Duplicate</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Explicit Expand Studio Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="px-2 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
            title="Open Dynamic Island Studio (ট্যাপ করে স্টুডিও খুলুন)"
          >
            <span>Studio</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Close / Dismiss Dynamic Island */}
          {onClose && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-full hover:bg-red-950/80 hover:text-red-400 text-neutral-400 active:scale-90 transition-all cursor-pointer shrink-0 border-l border-neutral-800 pl-1.5 ml-0.5"
              title="Hide / Turn off Dynamic Island (আইল্যান্ড বন্ধ করুন)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* EXPANDED STATE: Full Mobile Island Studio (Smoothly scrollable, always bounded) */
        <div className="bg-neutral-950/98 backdrop-blur-2xl border border-neutral-750/90 rounded-3xl p-3 shadow-2xl flex flex-col gap-2.5 text-neutral-200 max-h-[82vh] overflow-y-auto overscroll-contain touch-pan-y animate-in zoom-in-95 duration-200 ring-1 ring-cyan-500/40">
          {/* Top Bar: Island Header + Drag Grip Handle + Quick Scrub & Collapse */}
          <div
            onPointerDown={handlePointerDown}
            className={`flex items-center justify-between pb-2 border-b border-neutral-800/80 touch-none select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title="Drag header to move anywhere"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-bold text-[10px]">
                <GripHorizontal className="w-3.5 h-3.5" />
                <span>Move HUD</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">Dynamic Island</span>
            </div>

            {/* Quick Dock Presets & Controls */}
            <div className="flex items-center gap-1">
              {/* Quick dock buttons */}
              <div className="hidden sm:flex items-center gap-0.5 bg-neutral-900 px-1 py-0.5 rounded-full border border-neutral-800 text-[9px] text-neutral-400">
                <button
                  onClick={() => handleDockPosition('top-left')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="Dock Left"
                >
                  Left
                </button>
                <button
                  onClick={() => handleDockPosition('top-center')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="Top Center"
                >
                  Top
                </button>
                <button
                  onClick={() => handleDockPosition('top-right')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="Dock Right"
                >
                  Right
                </button>
                <button
                  onClick={() => handleDockPosition('bottom-center')}
                  className="px-1.5 py-0.5 hover:text-white rounded"
                  title="Dock Bottom"
                >
                  Bottom
                </button>
              </div>

              {position && (
                <button
                  onClick={handleResetPosition}
                  className="px-2 py-1 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[10px] flex items-center gap-1 transition-colors border border-neutral-750"
                  title="Reset position to top center"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={() => onUpdateAnimSettings({ isPlaying: !animSettings.isPlaying })}
                className="px-2.5 py-1 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
              >
                {animSettings.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{animSettings.isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                title="Collapse Island"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              {onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-2 py-1 rounded-full bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/80 text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Turn off Dynamic Island HUD (ডাইনামিক আইল্যান্ড বন্ধ করুন)"
                >
                  <X className="w-3 h-3" />
                  <span>Turn Off</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-6 gap-1 bg-neutral-900/90 p-1 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('tools')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'tools' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Paintbrush className="w-3 h-3" />
              <span>Tools</span>
            </button>

            <button
              onClick={() => setActiveTab('layers')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'layers' ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-300" />
              <span className="font-bold text-cyan-100">Layers</span>
            </button>

            <button
              onClick={() => setActiveTab('color')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'color' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Palette className="w-3 h-3" />
              <span>Color</span>
            </button>

            <button
              onClick={() => setActiveTab('anim')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'anim' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Anim</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'audio' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>Audio</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'actions' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Actions</span>
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
                        <span>✨ Neon Glow Pencil (All Colors)</span>
                        {activeTool === 'brush' && brushSettings.preset === 'glow-pencil' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold text-[9px]">
                            ACTIVE
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Vibrant neon light & bloom glow in any color
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
                      ? 'Active'
                      : 'Select Glow'}
                  </button>
                </div>

                {/* Glow Intensity Slider (when active) */}
                {activeTool === 'brush' && brushSettings.preset === 'glow-pencil' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-500/20 text-[11px]">
                    <span className="text-amber-300 font-semibold shrink-0">Glow Power:</span>
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
                  { preset: 'glow-pencil', label: '✨ Glow Pencil' },
                  { preset: 'pen', label: '✒️ Inking Pen' },
                  { preset: 'pencil', label: '✏️ Sketch Pencil' },
                  { preset: 'soft-airbrush', label: '💨 Airbrush' },
                  { preset: 'calligraphy', label: '🖋️ Calligraphy' },
                  { preset: 'watercolor', label: '💧 Watercolor' },
                  { preset: 'oil-paint', label: '🎨 Oil Paint' },
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
                  { id: 'brush', label: 'Brush (B)', icon: <Paintbrush className="w-4 h-4" /> },
                  { id: 'eraser', label: 'Eraser (E)', icon: <Eraser className="w-4 h-4" /> },
                  { id: 'vector-select', label: 'Direct Select (A)', icon: <MousePointer className="w-4 h-4 text-cyan-400" /> },
                  { id: 'clone', label: 'Clone Stamp (S)', icon: <Stamp className="w-4 h-4 text-amber-400" /> },
                  { id: 'vector-pen', label: 'Vector Pen (P)', icon: <PenTool className="w-4 h-4" /> },
                  { id: 'bucket', label: 'Paint Bucket (K)', icon: <PaintBucket className="w-4 h-4" /> },
                  { id: 'vector-shape', label: 'Shapes (U)', icon: <Shapes className="w-4 h-4" /> },
                  { id: 'transform', label: 'Move (V)', icon: <Move className="w-4 h-4" /> },
                  { id: 'bone', label: 'Bone Rig (R)', icon: <BoneIcon className="w-4 h-4" /> },
                  { id: 'mesh', label: 'Mesh Form (M)', icon: <Grid3X3 className="w-4 h-4" /> },
                  { id: 'text', label: 'Text (T)', icon: <Type className="w-4 h-4" /> },
                  { id: 'eyedropper', label: 'Eyedropper (I)', icon: <Pipette className="w-4 h-4" /> },
                  { id: 'hand', label: 'Pan 360° (H)', icon: <Hand className="w-4 h-4 text-emerald-400" /> },
                  { id: 'rotate', label: 'Rotate 360° (R)', icon: <RotateCw className="w-4 h-4 text-cyan-400" /> },
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
                        ? `Source: (${Math.round(cloneSettings.source.x)}, ${Math.round(cloneSettings.source.y)})`
                        : 'Tap canvas to set source'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onToggleCloneSampling}
                      className={`px-2 py-1 rounded-lg font-bold transition-all shadow-sm ${
                        cloneSettings?.isSettingSource
                          ? 'bg-amber-400 text-black animate-pulse'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      {cloneSettings?.isSettingSource ? 'Tap Canvas' : '📍 Source Point'}
                    </button>
                    <button
                      onClick={() => onSelectTool('brush')}
                      className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow-sm transition-all"
                      title="Exit Clone Tool"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              )}

              {/* Sliders: Size and Opacity */}
              <div className="flex items-center gap-3 bg-neutral-900/80 p-2 rounded-xl border border-neutral-800 text-[11px]">
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold text-[10px]">Brush Size:</span>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushSettings.size}
                    onChange={(e) => onUpdateBrushSettings({ size: Number(e.target.value) })}
                    className="flex-1 accent-cyan-400 h-1.5 cursor-pointer"
                  />
                  <div
                    className="w-4 h-4 rounded-full bg-black border border-cyan-500/60 flex items-center justify-center shrink-0 shadow-inner"
                    title={`Brush Size: ${brushSettings.size}px`}
                  >
                    <div
                      className="rounded-full bg-cyan-400 ring-1 ring-black"
                      style={{
                        width: `${Math.min(12, Math.max(3, Math.round(brushSettings.size / 8)))}px`,
                        height: `${Math.min(12, Math.max(3, Math.round(brushSettings.size / 8)))}px`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-cyan-300 font-bold bg-neutral-950 px-1 py-0.5 rounded border border-cyan-500/40 min-w-[32px] text-center text-[10px]">
                    {brushSettings.size}px
                  </span>
                </div>

                <div className="w-px h-4 bg-neutral-800" />

                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-neutral-400">Opacity:</span>
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
                    <span>🎙️ Direct Voice Recording</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-black/50 px-2 py-0.5 rounded-full border border-neutral-800">
                    Frame #{currentFrame + 1}
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
                    <span>Speak into microphone (Start)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      onOpenSoundStudio();
                    }}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-750 text-neutral-300 hover:text-white hover:bg-neutral-800 text-[10px] flex items-center justify-center"
                    title="Open Full Sound Studio"
                  >
                    Studio
                  </button>
                </div>
              </div>

              {/* Instant SFX Soundboard (User requested: Walk, Car, Train, Plane, Rain, Thunder, Sad, Joy) */}
              <div className="text-[11px] text-neutral-400 font-semibold flex items-center justify-between">
                <span>Instant Sound FX (Frame #{currentFrame + 1}):</span>
                <span className="text-[10px] text-cyan-400">Tap to Play</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'walk', label: '🚶‍♂️ Walk', icon: <Footprints className="w-3.5 h-3.5 text-emerald-400" /> },
                  { id: 'car', label: '🚗 Car', icon: <Car className="w-3.5 h-3.5 text-amber-400" /> },
                  { id: 'train', label: '🚂 Train', icon: <Train className="w-3.5 h-3.5 text-orange-400" /> },
                  { id: 'plane', label: '✈️ Plane', icon: <Plane className="w-3.5 h-3.5 text-sky-400" /> },
                  { id: 'rain', label: '🌧️ Rain', icon: <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> },
                  { id: 'thunder', label: '⚡ Thunder', icon: <Zap className="w-3.5 h-3.5 text-yellow-400" /> },
                  { id: 'sad', label: '😢 Sad', icon: <Frown className="w-3.5 h-3.5 text-indigo-400" /> },
                  { id: 'joy', label: '🎉 Joy', icon: <Smile className="w-3.5 h-3.5 text-pink-400" /> },
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
                  <span>{animSettings.isPlaying ? 'Pause' : 'Play'}</span>
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
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={onAddFrame}
                  className="py-2 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New</span>
                </button>

                {/* Move Frame Left / Right */}
                <div className="flex items-center gap-0.5 bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
                  <button
                    disabled={!onReorderFrame || currentFrame <= 0}
                    onClick={() => onReorderFrame?.(currentFrame, currentFrame - 1)}
                    className="flex-1 py-1.5 rounded-lg hover:bg-neutral-800 text-cyan-300 disabled:opacity-20 flex items-center justify-center cursor-pointer active:scale-90"
                    title="Move Frame Left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={!onReorderFrame || currentFrame >= frames.length - 1}
                    onClick={() => onReorderFrame?.(currentFrame, currentFrame + 1)}
                    className="flex-1 py-1.5 rounded-lg hover:bg-neutral-800 text-cyan-300 disabled:opacity-20 flex items-center justify-center cursor-pointer active:scale-90"
                    title="Move Frame Right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onDuplicateFrame(currentFrame)}
                  className="py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <button
                  disabled={frames.length <= 1}
                  onClick={() => onDeleteFrame(currentFrame)}
                  className="py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 disabled:opacity-30 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
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
                  <span>Onion Skin: {animSettings.onionSkin ? 'ON' : 'OFF'}</span>
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

          {/* TAB 2: Mobile Layers & Stack Reordering Studio */}
          {activeTab === 'layers' && (
            <div className="flex flex-col gap-2.5">
              {/* Active Layer Hero Card */}
              <div className="bg-neutral-900/90 p-2.5 rounded-2xl border border-neutral-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-cyan-500/50 flex items-center justify-center shrink-0">
                      {activeLayer?.type === 'vector' ? (
                        <PenTool className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Paintbrush className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate max-w-[130px]">
                          {activeLayer?.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                          {activeLayer?.type === 'vector' ? 'Vector' : 'Drawing'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Position: {activeLayerIndex + 1} of {layers.length} ({activeLayerIndex === layers.length - 1 ? 'Top' : activeLayerIndex === 0 ? 'Bottom' : 'Middle'})
                      </div>
                    </div>
                  </div>

                  {/* Add Layer & Delete Active Layer buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={onAddLayer}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                      title="Add New Layer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                    {onDeleteLayer && (
                      <button
                        disabled={layers.length <= 1}
                        onClick={() => onDeleteLayer(activeLayer?.id || activeLayerId)}
                        className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm disabled:opacity-25"
                        title={layers.length <= 1 ? 'Cannot delete only layer' : 'Delete Active Layer (সক্রিয় লেয়ার ডিলিট করুন)'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete</span>
                      </button>
                    )}
                    {onToggleRightPanel && (
                      <button
                        onClick={onToggleRightPanel}
                        className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-[10px] font-semibold cursor-pointer active:scale-95"
                        title="Open Full Docked Studio"
                      >
                        <span>Full Dock</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Large Touch-Optimized Layer Reorder Buttons (Move Up, Move Down, Top, Bottom) */}
                <div className="bg-neutral-950/80 p-2 rounded-xl border border-neutral-800/80 flex flex-col gap-1.5">
                  <div className="text-[10px] text-neutral-400 font-semibold flex items-center justify-between">
                    <span>Active Layer Reorder (উঠানামা করুন):</span>
                    <span className="text-cyan-400 text-[9px] font-mono">Touch to move layer</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Send to Top */}
                    <button
                      disabled={!onReorderLayer || activeLayerIndex === layers.length - 1}
                      onClick={() => onReorderLayer?.(activeLayerIndex, layers.length - 1)}
                      className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 disabled:opacity-25 border border-neutral-700/80 hover:border-cyan-500/50 text-cyan-300 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:pointer-events-none"
                      title="Move to Top (সবার উপরে তুলুন)"
                    >
                      <ChevronsUp className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-bold">Top ⇈</span>
                    </button>

                    {/* Move Up 1 Step */}
                    <button
                      disabled={!onReorderLayer || activeLayerIndex === layers.length - 1}
                      onClick={() => onReorderLayer?.(activeLayerIndex, activeLayerIndex + 1)}
                      className="py-2 px-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 disabled:opacity-25 border border-cyan-600/60 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:pointer-events-none font-bold ring-1 ring-cyan-500/30"
                      title="Move Up 1 Position (১ ধাপ উপরে)"
                    >
                      <ChevronUp className="w-4 h-4 text-cyan-300" />
                      <span className="text-[10px] font-extrabold text-cyan-200">Up ▲</span>
                    </button>

                    {/* Move Down 1 Step */}
                    <button
                      disabled={!onReorderLayer || activeLayerIndex === 0}
                      onClick={() => onReorderLayer?.(activeLayerIndex, activeLayerIndex - 1)}
                      className="py-2 px-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 disabled:opacity-25 border border-cyan-600/60 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:pointer-events-none font-bold ring-1 ring-cyan-500/30"
                      title="Move Down 1 Position (১ ধাপ নিচে)"
                    >
                      <ChevronDown className="w-4 h-4 text-cyan-300" />
                      <span className="text-[10px] font-extrabold text-cyan-200">Down ▼</span>
                    </button>

                    {/* Send to Bottom */}
                    <button
                      disabled={!onReorderLayer || activeLayerIndex === 0}
                      onClick={() => onReorderLayer?.(activeLayerIndex, 0)}
                      className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 disabled:opacity-25 border border-neutral-700/80 hover:border-cyan-500/50 text-cyan-300 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:pointer-events-none"
                      title="Move to Bottom (সবার নিচে নামান)"
                    >
                      <ChevronsDown className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-bold">Bottom ⇊</span>
                    </button>
                  </div>
                </div>

                {/* Opacity slider for active layer */}
                {onUpdateLayer && activeLayer && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-neutral-400 font-semibold w-12">Opacity:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((activeLayer.opacity || 1) * 100)}
                      onChange={(e) => onUpdateLayer(activeLayer.id, { opacity: Number(e.target.value) / 100 })}
                      className="flex-1 accent-cyan-400 h-1.5 bg-neutral-800 rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-cyan-300 w-8 text-right">
                      {Math.round((activeLayer.opacity || 1) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Complete Layer Stack List */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 font-semibold">
                  <span>Layer Stack (Top to Bottom):</span>
                  <span className="text-[10px] text-cyan-400">{layers.length} Layers Total</span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto overscroll-contain touch-pan-y pr-1 divide-y divide-neutral-800/50">
                  {[...layers].reverse().map((layer, reverseIndex) => {
                    const actualIndex = layers.length - 1 - reverseIndex;
                    const isSelected = layer.id === activeLayerId;

                    return (
                      <div
                        key={layer.id}
                        onPointerDown={(e) => {
                          if (e.pointerType === 'mouse') {
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('input')) return;
                            onSelectLayer(layer.id);
                          }
                        }}
                        onClick={() => onSelectLayer(layer.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border pt-2 touch-pan-y ${
                          isSelected
                            ? 'bg-neutral-800 border-cyan-500/70 shadow-md ring-1 ring-cyan-500/30 border-l-4 border-l-cyan-400'
                            : 'bg-neutral-900/70 border-neutral-800/60 hover:bg-neutral-850'
                        }`}
                      >
                        {/* Left: Grip Handle + Visibility + Thumbnail + Info */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <GripVertical className="w-3.5 h-3.5 text-neutral-500 shrink-0 pointer-events-none" />

                          {onUpdateLayer && (
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateLayer(layer.id, { visible: !layer.visible });
                              }}
                              className={`p-1.5 rounded-lg hover:bg-neutral-700 transition-colors shrink-0 ${
                                layer.visible ? 'text-cyan-400' : 'text-neutral-600'
                              }`}
                              title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                            >
                              {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          )}

                          <div className="w-6 h-6 rounded-md bg-neutral-950 border border-neutral-750 flex items-center justify-center shrink-0 pointer-events-none">
                            {layer.type === 'raster' ? (
                              <Paintbrush className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <PenTool className="w-3 h-3 text-purple-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-xs font-bold truncate text-neutral-100 flex items-center gap-1.5">
                              <span>{layer.name}</span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono truncate">
                              #{actualIndex + 1} • {layer.blendMode === 'source-over' ? 'Normal' : layer.blendMode} • {Math.round(layer.opacity * 100)}%
                            </div>
                          </div>
                        </div>

                        {/* Right: Individual Layer Move Up / Down Buttons */}
                        <div
                          className="flex items-center gap-1 shrink-0 ml-1"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {onReorderLayer && (
                            <div className="flex items-center gap-0.5 bg-neutral-950/90 p-0.5 rounded-lg border border-neutral-750">
                              <button
                                disabled={actualIndex === layers.length - 1}
                                onClick={() => onReorderLayer(actualIndex, actualIndex + 1)}
                                title="Move Layer Up (উপরে তুলুন)"
                                className="p-1 rounded hover:bg-neutral-800 text-cyan-300 hover:text-white disabled:opacity-20 cursor-pointer active:scale-90 transition-all shrink-0"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={actualIndex === 0}
                                onClick={() => onReorderLayer(actualIndex, actualIndex - 1)}
                                title="Move Layer Down (নিচে নামান)"
                                className="p-1 rounded hover:bg-neutral-800 text-cyan-300 hover:text-white disabled:opacity-20 cursor-pointer active:scale-90 transition-all shrink-0"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {onDuplicateLayer && (
                            <button
                              onClick={() => onDuplicateLayer(layer.id)}
                              title="Duplicate Layer"
                              className="p-1 rounded text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800 transition-colors shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteLayer && (
                            <button
                              disabled={layers.length <= 1}
                              onClick={() => onDeleteLayer(layer.id)}
                              title={layers.length <= 1 ? 'Cannot delete only layer' : 'Delete Layer (লেয়ার ডিলিট)'}
                              className="p-1 px-1.5 rounded-lg bg-red-950/70 border border-red-700/60 text-red-400 hover:bg-red-900 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer shrink-0 active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Color Studio */}
          {activeTab === 'color' && (
            <div className="flex flex-col gap-2.5">
              {/* Quick Mobile Color Palette with Native Picker */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-300 font-semibold">Active Color:</span>
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

              {/* Quick Link to Layers Studio */}
              <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-neutral-300 font-medium">Layer: <strong className="text-cyan-300">{activeLayer?.name}</strong></span>
                </div>
                <button
                  onClick={() => setActiveTab('layers')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[11px] font-bold active:scale-95 cursor-pointer"
                >
                  Manage Layers →
                </button>
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
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy</span>
                </button>

                <button
                  disabled={!canPaste}
                  onClick={onPaste}
                  className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-emerald-300 disabled:opacity-40 flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 border border-emerald-800/40 text-[11px]"
                  title="Paste (Ctrl+V)"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Paste</span>
                </button>

                <button
                  onClick={onCut}
                  className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-amber-300 flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 border border-amber-800/40 text-[11px]"
                  title="Cut (Ctrl+X)"
                >
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cut</span>
                </button>

                <button
                  onClick={onDuplicate}
                  className="py-2 px-1 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-purple-300 flex flex-col sm:flex-row items-center justify-center gap-1 transition-all active:scale-95 border border-purple-800/40 text-[11px]"
                  title="Duplicate (Ctrl+D)"
                >
                  <CopyPlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Duplicate</span>
                </button>
              </div>

              {/* Grid & Guides Quick Access in Island */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${gridConfig?.enabled ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                    <GridIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-white">Grid & Guides</div>
                    <div className="text-[9px] text-neutral-400">
                      {gridConfig?.enabled ? `Enabled (${gridConfig.type})` : 'Disabled'}
                      {gridConfig?.snapToGrid && gridConfig?.enabled && ' • 🧲 Snap ON'}
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
                      <Sliders className="w-2.5 h-2.5" /> Settings
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
                  <span>Undo (Ctrl+Z)</span>
                </button>

                <button
                  disabled={!canRedo}
                  onClick={onRedo}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-850 disabled:opacity-30 flex items-center justify-center gap-1.5"
                >
                  <Redo2 className="w-4 h-4 text-cyan-400" />
                  <span>Redo (Ctrl+Y)</span>
                </button>

                <button
                  onClick={onFitZoom}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-850 flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                  <span>Fit Canvas</span>
                </button>

                <button
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenExportModal();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30"
                >
                  <Download className="w-4 h-4" />
                  <span>Export / Save</span>
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
                <span>Transparent PNG / Video Export</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
