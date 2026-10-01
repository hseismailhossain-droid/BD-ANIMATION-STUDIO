import React from 'react';
import {
  ToolType,
  BrushSettings,
  VectorSettings,
  BrushPreset,
  VectorShapeType,
  TextSettings,
  GradientSettings,
  CloneSettings,
  VectorShape,
  SymmetryMode,
  MeshSettings,
  ZoomSettings,
  Layer,
} from '../types';
import { BRUSH_PRESET_CONFIGS } from '../constants';
import {
  Square,
  Circle,
  PenTool,
  Minus,
  Star,
  Hexagon,
  Check,
  X,
  SlidersHorizontal,
  Zap,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Crosshair,
  Trash2,
  Copy,
  ClipboardPaste,
  CopyPlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  PaintBucket,
  Scissors,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CircleDot,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Palette,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  Eraser,
  Bone as BoneIcon,
} from 'lucide-react';

interface ToolOptionsBarProps {
  activeTool: ToolType;
  brushSettings: BrushSettings;
  onUpdateBrushSettings: (settings: Partial<BrushSettings>) => void;
  vectorSettings: VectorSettings;
  onUpdateVectorSettings: (settings: Partial<VectorSettings>) => void;
  textSettings: TextSettings;
  onUpdateTextSettings: (settings: Partial<TextSettings>) => void;
  gradientSettings: GradientSettings;
  onUpdateGradientSettings: (settings: Partial<GradientSettings>) => void;
  cloneSettings: CloneSettings;
  onToggleCloneSampling: () => void;
  primaryColor: string;
  hasActivePath: boolean;
  onCloseActivePath: () => void;
  onCancelActivePath: () => void;
  hasSelection: boolean;
  onClearSelection: () => void;
  onFillSelection: () => void;
  onDeleteSelection: () => void;
  onInvertSelection: () => void;
  onStrokeSelection?: () => void;
  bucketTolerance: number;
  onChangeBucketTolerance: (t: number) => void;
  onOpenBrushStudio: () => void;
  selectedVectorShape: VectorShape | null;
  onUpdateSelectedShape?: (updates: Partial<VectorShape>) => void;
  onDeleteSelectedShape?: () => void;
  onDuplicateSelectedShape?: () => void;
  onNudgeLayer?: (dx: number, dy: number) => void;
  onFlipLayerH?: () => void;
  onFlipLayerV?: () => void;
  onRotateLayer90?: () => void;
  onCenterLayer?: () => void;
  meshSettings?: MeshSettings;
  onUpdateMeshSettings?: (settings: Partial<MeshSettings>) => void;
  onCreateMeshForm?: (preset?: string) => void;
  zoomLevel?: number;
  currentZoom?: number;
  zoomSettings?: ZoomSettings;
  onUpdateZoomSettings?: (settings: Partial<ZoomSettings>) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitZoom?: () => void;
  onResetZoom?: () => void;
  onSetZoom?: (zoom: number) => void;
  hasStrayShapes?: boolean;
  onClearStrayShapes?: () => void;
  activeLayer?: Layer;
  onEnsureVectorLayer?: () => void;
  onCopyObject?: () => void;
  onPasteObject?: () => void;
  canPaste?: boolean;
  isTransformActive?: boolean;
  onCancelTransform?: () => void;
  onApplyTransform?: () => void;
  isBoneActive?: boolean;
  onCancelBoneRig?: () => void;
  onApplyBoneRig?: () => void;
  onSelectTool?: (tool: ToolType) => void;
}

export const ToolOptionsBar: React.FC<ToolOptionsBarProps> = React.memo(({
  activeTool,
  brushSettings,
  onUpdateBrushSettings,
  vectorSettings,
  onUpdateVectorSettings,
  textSettings,
  onUpdateTextSettings,
  gradientSettings,
  onUpdateGradientSettings,
  cloneSettings,
  onToggleCloneSampling,
  primaryColor,
  hasActivePath,
  onCloseActivePath,
  onCancelActivePath,
  hasSelection,
  onClearSelection,
  onFillSelection,
  onDeleteSelection,
  onInvertSelection,
  onStrokeSelection,
  bucketTolerance,
  onChangeBucketTolerance,
  onOpenBrushStudio,
  selectedVectorShape,
  onUpdateSelectedShape,
  onDeleteSelectedShape,
  onDuplicateSelectedShape,
  onNudgeLayer,
  onFlipLayerH,
  onFlipLayerV,
  onRotateLayer90,
  onCenterLayer,
  meshSettings = { rows: 3, cols: 3, preset: 'sphere-3d', wireframe: true, selectedNode: null },
  onUpdateMeshSettings,
  onCreateMeshForm,
  zoomLevel = 1,
  currentZoom,
  zoomSettings = { mode: 'in', scrubby: true },
  onUpdateZoomSettings,
  onZoomIn,
  onZoomOut,
  onFitZoom,
  onResetZoom,
  onSetZoom,
  hasStrayShapes,
  onClearStrayShapes,
  activeLayer,
  onEnsureVectorLayer,
  onCopyObject,
  onPasteObject,
  canPaste = false,
  isTransformActive,
  onCancelTransform,
  onApplyTransform,
  isBoneActive,
  onCancelBoneRig,
  onApplyBoneRig,
  onSelectTool,
}) => {
  const isBrushOrEraser =
    activeTool === 'brush' ||
    activeTool === 'eraser' ||
    activeTool === 'smudge' ||
    activeTool === 'blur' ||
    activeTool === 'clone';
  const isVectorTool =
    activeTool === 'vector-pen' ||
    activeTool === 'vector-shape' ||
    activeTool === 'vector-select';

  const barRef = React.useRef<HTMLDivElement | null>(null);
  const dragScrollRef = React.useRef<{ isDown: boolean; startX: number; scrollLeft: number }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });

  const handleBarMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }
    const bar = barRef.current;
    if (!bar) return;
    dragScrollRef.current = {
      isDown: true,
      startX: e.pageX - bar.offsetLeft,
      scrollLeft: bar.scrollLeft,
    };
  };

  const handleBarMouseMove = (e: React.MouseEvent) => {
    if (!dragScrollRef.current.isDown) return;
    const bar = barRef.current;
    if (!bar) return;
    e.preventDefault();
    const x = e.pageX - bar.offsetLeft;
    const walk = (x - dragScrollRef.current.startX) * 1.5;
    bar.scrollLeft = dragScrollRef.current.scrollLeft - walk;
  };

  const handleBarMouseUpOrLeave = () => {
    dragScrollRef.current.isDown = false;
  };

  return (
    <div
      ref={barRef}
      onMouseDown={handleBarMouseDown}
      onMouseMove={handleBarMouseMove}
      onMouseUp={handleBarMouseUpOrLeave}
      onMouseLeave={handleBarMouseUpOrLeave}
      style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      className="h-9 bg-neutral-925 border-b border-neutral-800 flex items-center justify-between px-3 text-xs text-neutral-300 select-none overflow-x-auto whitespace-nowrap scroll-touch cursor-grab active:cursor-grabbing"
    >
      {/* Options tailored to active tool */}
      <div className="flex items-center gap-3">
        {/* Transform / Move Tool (Photoshop V) */}
        {activeTool === 'transform' && (
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              Move & Transform:
            </span>
            {/* Nudge buttons */}
            <div className="flex items-center gap-0.5 bg-neutral-850 p-0.5 rounded border border-neutral-750">
              <button
                onClick={() => onNudgeLayer?.(-10, 0)}
                title="Nudge Left 10px"
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNudgeLayer?.(0, -10)}
                title="Nudge Up 10px"
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNudgeLayer?.(0, 10)}
                title="Nudge Down 10px"
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNudgeLayer?.(10, 0)}
                title="Nudge Right 10px"
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Transform Operations */}
            <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
              <button
                onClick={onFlipLayerH}
                title="Flip Layer Horizontally"
                className="px-2 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-750 flex items-center gap-1"
              >
                <FlipHorizontal className="w-3 h-3 text-cyan-400" /> Flip H
              </button>
              <button
                onClick={onFlipLayerV}
                title="Flip Layer Vertically"
                className="px-2 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-750 flex items-center gap-1"
              >
                <FlipVertical className="w-3 h-3 text-cyan-400" /> Flip V
              </button>
              <button
                onClick={onRotateLayer90}
                title="Rotate 90° Clockwise"
                className="px-2 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-750 flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3 text-amber-400" /> Rotate 90°
              </button>
              <button
                onClick={onCenterLayer}
                title="Center Content on Canvas"
                className="px-2 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-750 flex items-center gap-1"
              >
                <CircleDot className="w-3 h-3 text-indigo-400" /> Center
              </button>
            </div>
          </div>
        )}

        {/* Brush / Eraser / Smudge / Blur / Clone Options */}
        {isBrushOrEraser && (
          <>
            {/* Preset Selector */}
            {activeTool === 'brush' && (
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-medium">Preset:</span>
                <select
                  value={brushSettings.preset}
                  onChange={(e) => {
                    const preset = e.target.value as BrushPreset;
                    const defaultSettings = BRUSH_PRESET_CONFIGS[preset];
                    onUpdateBrushSettings({ ...defaultSettings });
                  }}
                  className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="glow-pencil">✨ Glow Pencil (নিয়ন গ্লো পেন্সিল)</option>
                  <option value="pen">Inking Pen (Solid)</option>
                  <option value="soft-airbrush">Soft Airbrush (Smooth)</option>
                  <option value="calligraphy">Calligraphy (Chisel)</option>
                  <option value="oil-paint">Oil Paint (Bristle)</option>
                  <option value="watercolor">Watercolor Wash</option>
                  <option value="pencil">Sketch Pencil (Graphite)</option>
                  <option value="charcoal">Charcoal Texture</option>
                  <option value="screentone">Comic Screentone</option>
                  <option value="spray">Spray Paint</option>
                </select>
              </div>
            )}

            {/* Glow Pencil Intensity */}
            {activeTool === 'brush' && brushSettings.preset === 'glow-pencil' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
                <span className="text-amber-300 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Glow:
                </span>
                <input
                  type="range"
                  min="8"
                  max="60"
                  value={brushSettings.glowIntensity || 28}
                  onChange={(e) => onUpdateBrushSettings({ glowIntensity: Number(e.target.value) })}
                  className="w-14 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="font-mono text-amber-300 min-w-[20px] text-right">
                  {brushSettings.glowIntensity || 28}
                </span>
              </div>
            )}

            {/* Size Slider */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium">Size:</span>
              <input
                type="range"
                min="1"
                max="300"
                value={brushSettings.size}
                onChange={(e) => onUpdateBrushSettings({ size: Number(e.target.value) })}
                className="w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-neutral-200 min-w-[28px] text-right">
                {brushSettings.size}px
              </span>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium">Opacity:</span>
              <input
                type="range"
                min="1"
                max="100"
                value={Math.round(brushSettings.opacity * 100)}
                onChange={(e) => onUpdateBrushSettings({ opacity: Number(e.target.value) / 100 })}
                className="w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-neutral-200 min-w-[28px] text-right">
                {Math.round(brushSettings.opacity * 100)}%
              </span>
            </div>

            {/* Flow Slider */}
            {activeTool === 'brush' && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-medium">Flow:</span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={Math.round(brushSettings.flow * 100)}
                  onChange={(e) => onUpdateBrushSettings({ flow: Number(e.target.value) / 100 })}
                  className="w-14 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="font-mono text-neutral-200 min-w-[26px] text-right">
                  {Math.round(brushSettings.flow * 100)}%
                </span>
              </div>
            )}

            {/* Stabilizer (Smoothing) */}
            {activeTool === 'brush' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
                <span className="text-cyan-400 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Stabilizer:
                </span>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={Math.round(brushSettings.smoothing * 100)}
                  onChange={(e) => onUpdateBrushSettings({ smoothing: Number(e.target.value) / 100 })}
                  className="w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="font-mono text-cyan-300 min-w-[26px] text-right">
                  {Math.round(brushSettings.smoothing * 100)}%
                </span>
              </div>
            )}

            {/* Symmetry Mode (Photoshop & Procreate staple) */}
            {activeTool === 'brush' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
                <span className="text-amber-400 font-medium">Symmetry:</span>
                <select
                  value={brushSettings.symmetry || 'off'}
                  onChange={(e) =>
                    onUpdateBrushSettings({ symmetry: e.target.value as SymmetryMode })
                  }
                  className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="off">Off</option>
                  <option value="vertical">Vertical Mirror</option>
                  <option value="horizontal">Horizontal Mirror</option>
                  <option value="quad">Quad (4-Way)</option>
                  <option value="mandala">Mandala (8-Fold)</option>
                </select>
              </div>
            )}

            {/* Clone Stamp Source Control */}
            {activeTool === 'clone' && (
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
                <button
                  onClick={onToggleCloneSampling}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 border transition-colors ${
                    cloneSettings.isSettingSource
                      ? 'bg-amber-500 text-black border-amber-400 font-semibold animate-pulse'
                      : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-750'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  {cloneSettings.isSettingSource ? 'Click Canvas to Set Source' : 'Set Source (Alt+Click)'}
                </button>
                {cloneSettings.source && (
                  <span className="font-mono text-[10px] text-amber-300">
                    Source: ({Math.round(cloneSettings.source.x)}, {Math.round(cloneSettings.source.y)})
                  </span>
                )}
                {onSelectTool && (
                  <button
                    onClick={() => onSelectTool('brush')}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold text-[10px] transition-colors cursor-pointer flex items-center gap-1 active:scale-95 shadow"
                    title="ক্লোন টুল বন্ধ করুন (Exit Clone Tool)"
                  >
                    <X className="w-3 h-3" />
                    <span>Exit</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Text Tool (Photoshop T) */}
        {activeTool === 'text' && (
          <div className="flex items-center gap-2.5">
            <span className="text-cyan-400 font-semibold">Type:</span>
            <input
              type="text"
              value={textSettings.text}
              onChange={(e) => onUpdateTextSettings({ text: e.target.value })}
              placeholder="Click canvas or type text here..."
              className="bg-neutral-850 border border-neutral-700 rounded px-2.5 py-0.5 text-white w-48 focus:outline-none focus:border-cyan-500"
            />

            {/* Font Family */}
            <select
              value={textSettings.fontFamily}
              onChange={(e) => onUpdateTextSettings({ fontFamily: e.target.value })}
              className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs"
            >
              <option value="Plus Jakarta Sans, sans-serif">Sans-Serif (Modern)</option>
              <option value="serif">Serif (Editorial)</option>
              <option value="monospace">Monospace (Code)</option>
              <option value="Impact, sans-serif">Impact (Bold Title)</option>
              <option value="Comic Sans MS, cursive">Comic / Manga</option>
              <option value="cursive">Calligraphic Script</option>
            </select>

            {/* Font Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Size:</span>
              <input
                type="range"
                min="12"
                max="240"
                value={textSettings.fontSize}
                onChange={(e) => onUpdateTextSettings({ fontSize: Number(e.target.value) })}
                className="w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-neutral-200 min-w-[28px]">
                {textSettings.fontSize}px
              </span>
            </div>

            {/* Bold / Italic */}
            <div className="flex items-center gap-0.5 bg-neutral-850 p-0.5 rounded border border-neutral-750">
              <button
                onClick={() => onUpdateTextSettings({ bold: !textSettings.bold })}
                className={`p-1 rounded ${textSettings.bold ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateTextSettings({ italic: !textSettings.italic })}
                className={`p-1 rounded ${textSettings.italic ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 bg-neutral-850 p-0.5 rounded border border-neutral-750">
              <button
                onClick={() => onUpdateTextSettings({ align: 'left' })}
                className={`p-1 rounded ${textSettings.align === 'left' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateTextSettings({ align: 'center' })}
                className={`p-1 rounded ${textSettings.align === 'center' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateTextSettings({ align: 'right' })}
                className={`p-1 rounded ${textSettings.align === 'right' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Gradient Tool (Photoshop G) */}
        {activeTool === 'gradient' && (
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-semibold">Gradient:</span>
            <div className="flex items-center gap-1 bg-neutral-850 p-0.5 rounded border border-neutral-750">
              <button
                onClick={() => onUpdateGradientSettings({ type: 'linear' })}
                className={`px-2 py-0.5 rounded ${gradientSettings.type === 'linear' ? 'bg-cyan-600 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
              >
                Linear
              </button>
              <button
                onClick={() => onUpdateGradientSettings({ type: 'radial' })}
                className={`px-2 py-0.5 rounded ${gradientSettings.type === 'radial' ? 'bg-cyan-600 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
              >
                Radial
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Preset:</span>
              <select
                value={gradientSettings.preset}
                onChange={(e) => onUpdateGradientSettings({ preset: e.target.value as any })}
                className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs"
              >
                <option value="fg-to-bg">Foreground to Background</option>
                <option value="fg-to-trans">Foreground to Transparent</option>
                <option value="sunset">Sunset Glow</option>
                <option value="rainbow">Spectral Rainbow</option>
                <option value="ocean">Ocean Breeze</option>
                <option value="fire">Fire Ember</option>
              </select>
            </div>
            <span className="text-neutral-500 text-[11px] italic">
              Click & drag line on canvas to cast gradient
            </span>
          </div>
        )}

        {/* Vector Tools (Illustrator Pen, Shapes & Direct Selection) */}
        {isVectorTool && (
          <>
            {/* Target Layer Indicator & Switcher */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-850 border border-neutral-750">
              <span className="text-[11px] text-neutral-400">Target:</span>
              {activeLayer?.type === 'raster' ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] border border-amber-500/30">
                    🎨 রাস্টার লেয়ার ({activeLayer.name})
                  </span>
                  <span className="text-[10px] text-neutral-400 hidden lg:inline">
                    (সরাসরি লেয়ারে আঁকা হচ্ছে)
                  </span>
                  {onEnsureVectorLayer && (
                    <button
                      onClick={onEnsureVectorLayer}
                      title="নতুন ভেক্টর লেয়ার তৈরি করে আলাদা অবজেক্ট হিসেবে আঁকুন"
                      className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[10px] font-medium transition"
                    >
                      + ভেক্টর লেয়ার
                    </button>
                  )}
                </div>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold text-[10px] border border-cyan-500/30">
                  📐 ভেক্টর লেয়ার ({activeLayer?.name || 'Vector'})
                </span>
              )}
            </div>

            {/* Shape Type Selector */}
            {activeTool === 'vector-shape' && (
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-semibold">Shape:</span>
                <div className="flex items-center gap-1 bg-neutral-850 p-0.5 rounded border border-neutral-800">
                  <button
                    onClick={() => onUpdateVectorSettings({ shapeType: 'rect' })}
                    title="Rectangle (U)"
                    className={`px-2 py-0.5 rounded flex items-center gap-1 ${vectorSettings.shapeType === 'rect' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Rect</span>
                  </button>
                  <button
                    onClick={() => onUpdateVectorSettings({ shapeType: 'circle' })}
                    title="Ellipse / Circle"
                    className={`px-2 py-0.5 rounded flex items-center gap-1 ${vectorSettings.shapeType === 'circle' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <Circle className="w-3.5 h-3.5" />
                    <span>Circle</span>
                  </button>
                  <button
                    onClick={() => onUpdateVectorSettings({ shapeType: 'line' })}
                    title="Straight Line"
                    className={`p-1 rounded ${vectorSettings.shapeType === 'line' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateVectorSettings({ shapeType: 'star' })}
                    title="Star Polygon"
                    className={`p-1 rounded ${vectorSettings.shapeType === 'star' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateVectorSettings({ shapeType: 'polygon' })}
                    title="Hexagon Polygon"
                    className={`p-1 rounded ${vectorSettings.shapeType === 'polygon' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    <Hexagon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Corner Radius for Rectangle */}
                {vectorSettings.shapeType === 'rect' && (
                  <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
                    <span className="text-neutral-500">Radius:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        selectedVectorShape && onUpdateSelectedShape
                          ? selectedVectorShape.cornerRadius || 0
                          : vectorSettings.cornerRadius || 0
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onUpdateVectorSettings({ cornerRadius: val });
                        if (selectedVectorShape && onUpdateSelectedShape) {
                          onUpdateSelectedShape({ cornerRadius: val });
                        }
                      }}
                      className="w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="font-mono text-neutral-300 min-w-[20px]">
                      {selectedVectorShape ? selectedVectorShape.cornerRadius || 0 : vectorSettings.cornerRadius || 0}px
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Direct Selection (Illustrator A) Controls for Selected Shape & Clipboard */}
            {activeTool === 'vector-select' && (
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-semibold">Direct Selection:</span>
                {selectedVectorShape ? (
                  <div className="flex items-center gap-1.5 bg-neutral-850/90 px-2 py-0.5 rounded border border-cyan-500/50">
                    <span className="text-cyan-300 font-mono text-[11px] font-bold">
                      {selectedVectorShape.type.toUpperCase()}
                      {selectedVectorShape.type === 'mesh' && selectedVectorShape.meshData
                        ? ` (${selectedVectorShape.meshData.rows}x${selectedVectorShape.meshData.cols})`
                        : ''}
                    </span>
                    <button
                      onClick={onCopyObject}
                      title="Copy Shape (Ctrl+C)"
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি (Copy)</span>
                    </button>
                    <button
                      onClick={onDuplicateSelectedShape}
                      title="Duplicate Shape (Ctrl+D)"
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-purple-300 flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                      <span>ডুপ্লিকেট</span>
                    </button>
                    <button
                      onClick={onDeleteSelectedShape}
                      title="Delete Shape (Del)"
                      className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-red-950/70 text-red-400 flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-neutral-500 italic text-[11px]">
                    ক্যানভাসে যেকোনো অবজেক্ট বা নোড সিলেক্ট করতে ক্লিক করুন
                  </span>
                )}

                {/* Paste button always accessible */}
                <button
                  disabled={!canPaste}
                  onClick={onPasteObject}
                  title="Paste Object (Ctrl+V)"
                  className="px-2.5 py-0.5 rounded bg-neutral-850 hover:bg-neutral-800 border border-emerald-500/50 text-emerald-300 disabled:opacity-40 flex items-center gap-1 font-semibold text-[11px]"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                  <span>পেস্ট (Paste)</span>
                </button>
              </div>
            )}

            {/* Stroke Width */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-medium">Stroke:</span>
              <input
                type="range"
                min="1"
                max="64"
                value={
                  selectedVectorShape && onUpdateSelectedShape
                    ? selectedVectorShape.strokeWidth
                    : vectorSettings.strokeWidth
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateVectorSettings({ strokeWidth: val });
                  if (selectedVectorShape && onUpdateSelectedShape) {
                    onUpdateSelectedShape({ strokeWidth: val });
                  }
                }}
                className="w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-neutral-200 min-w-[24px]">
                {selectedVectorShape ? selectedVectorShape.strokeWidth : vectorSettings.strokeWidth}px
              </span>
            </div>

            {/* Stroke Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Color:</span>
              <input
                type="color"
                value={
                  selectedVectorShape && onUpdateSelectedShape
                    ? selectedVectorShape.strokeColor
                    : vectorSettings.strokeColor
                }
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateVectorSettings({ strokeColor: val });
                  if (selectedVectorShape && onUpdateSelectedShape) {
                    onUpdateSelectedShape({ strokeColor: val });
                  }
                }}
                className="w-5 h-5 rounded cursor-pointer border border-neutral-700 bg-transparent"
              />
            </div>

            {/* Fill toggle & color */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedVectorShape && onUpdateSelectedShape
                      ? selectedVectorShape.hasFill
                      : vectorSettings.hasFill
                  }
                  onChange={(e) => {
                    const val = e.target.checked;
                    onUpdateVectorSettings({ hasFill: val });
                    if (selectedVectorShape && onUpdateSelectedShape) {
                      onUpdateSelectedShape({ hasFill: val });
                    }
                  }}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-neutral-400">Fill</span>
              </label>
              {(selectedVectorShape ? selectedVectorShape.hasFill : vectorSettings.hasFill) && (
                <input
                  type="color"
                  value={
                    selectedVectorShape && onUpdateSelectedShape
                      ? selectedVectorShape.fillColor
                      : vectorSettings.fillColor
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateVectorSettings({ fillColor: val });
                    if (selectedVectorShape && onUpdateSelectedShape) {
                      onUpdateSelectedShape({ fillColor: val });
                    }
                  }}
                  className="w-5 h-5 rounded cursor-pointer border border-neutral-700 bg-transparent"
                />
              )}
            </div>

            {/* Active Path Control (Bézier Pen) */}
            {hasActivePath && (
              <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
                <button
                  onClick={onCloseActivePath}
                  className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Finish Path
                </button>
                <button
                  onClick={onCancelActivePath}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            )}
          </>
        )}

        {/* Mesh Form Tool (Gradient Mesh & Warp Form - Illustrator Parity) */}
        {activeTool === 'mesh' && (
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <Grid3X3 className="w-3.5 h-3.5" /> Mesh Form:
            </span>

            {/* Preset Selector */}
            <div className="flex items-center gap-1">
              <span className="text-neutral-500">Preset:</span>
              <select
                value={meshSettings.preset || 'sphere-3d'}
                onChange={(e) => onUpdateMeshSettings?.({ preset: e.target.value as any })}
                className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs"
              >
                <option value="sphere-3d">3D Glossy Sphere</option>
                <option value="sunset">Sunset Sky Horizon</option>
                <option value="aurora">Aurora Borealis</option>
                <option value="wave">Silk Organic Wave</option>
                <option value="fruit">Fruit / Organic Volume</option>
                <option value="custom">Custom Grid Grid</option>
              </select>
            </div>

            {/* Grid density (Rows x Cols) */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              <span className="text-neutral-500">Grid:</span>
              <select
                value={`${meshSettings.rows}x${meshSettings.cols}`}
                onChange={(e) => {
                  const [r, c] = e.target.value.split('x').map(Number);
                  onUpdateMeshSettings?.({ rows: r, cols: c });
                }}
                className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs font-mono"
              >
                <option value="2x2">2 x 2 (Simple)</option>
                <option value="3x3">3 x 3 (Standard)</option>
                <option value="4x4">4 x 4 (Detailed)</option>
                <option value="5x5">5 x 5 (Studio)</option>
                <option value="6x6">6 x 6 (Ultra Mesh)</option>
              </select>
            </div>

            {/* Wireframe toggle */}
            <button
              onClick={() => onUpdateMeshSettings?.({ wireframe: !meshSettings.wireframe })}
              className={`px-2 py-0.5 rounded border flex items-center gap-1 text-[11px] ${
                meshSettings.wireframe
                  ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                  : 'bg-neutral-850 border-neutral-750 text-neutral-400'
              }`}
              title="Toggle Mesh Wireframe & Anchor Handles"
            >
              {meshSettings.wireframe ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Wireframe</span>
            </button>

            {/* Insert Mesh Button */}
            <button
              onClick={() => onCreateMeshForm?.(meshSettings.preset)}
              className="px-2.5 py-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-medium shadow-sm flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> + Insert Mesh Form
            </button>

            {/* Close & Apply Actions */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              {onApplyTransform && (
                <button
                  onClick={onApplyTransform}
                  className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Apply Mesh Warp (Enter - রূপান্তর নিশ্চিত করুন)"
                >
                  <Check className="w-3 h-3" />
                  <span>✓ প্রয়োগ করুন (Enter)</span>
                </button>
              )}
              {onCancelTransform && (
                <button
                  onClick={onCancelTransform}
                  className="px-2.5 py-0.5 bg-red-950/90 hover:bg-red-900 border border-red-800 text-red-200 hover:text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Close Mesh (Esc - মেশ বন্ধ করুন)"
                >
                  <X className="w-3 h-3 text-red-300" />
                  <span>✕ বন্ধ করুন (Esc)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bone Rigging Tool */}
        {activeTool === 'bone' && (
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
              <BoneIcon className="w-3.5 h-3.5 animate-pulse" /> Skeletal Bone Rig (হাড় রিগিং):
            </span>
            <span className="text-neutral-400 text-[11px]">
              হাড় ড্র্যাগ করে পোজ দিন বা এডিটিং শেষ হলে সেভ / বন্ধ করুন
            </span>

            {/* Close & Apply Actions */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              {onApplyBoneRig && (
                <button
                  onClick={onApplyBoneRig}
                  className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Apply Bone Rigging (Enter - সেভ পোজ)"
                >
                  <Check className="w-3 h-3" />
                  <span>✓ সেভ পোজ (Enter)</span>
                </button>
              )}
              {onCancelBoneRig && (
                <button
                  onClick={onCancelBoneRig}
                  className="px-2.5 py-0.5 bg-red-950/90 hover:bg-red-900 border border-red-800 text-red-200 hover:text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                  title="Close Bone Rigging (Esc - হাড় রিগিং বন্ধ করুন)"
                >
                  <X className="w-3 h-3 text-red-300" />
                  <span>✕ হাড় বন্ধ করুন (Esc)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Zoom Tool Options (Photoshop Parity) */}
        {activeTool === 'zoom' && (
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> Zoom Engine:
            </span>

            {/* Zoom In / Zoom Out Mode */}
            <div className="flex items-center gap-0.5 bg-neutral-850 p-0.5 rounded border border-neutral-800">
              <button
                onClick={() => onUpdateZoomSettings?.({ mode: 'in' })}
                title="Zoom In Mode (+)"
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  zoomSettings.mode === 'in' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5" /> Zoom In
              </button>
              <button
                onClick={() => onUpdateZoomSettings?.({ mode: 'out' })}
                title="Zoom Out Mode (-)"
                className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                  zoomSettings.mode === 'out' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
              </button>
            </div>

            {/* Zoom percentage display & Quick Presets */}
            <div className="flex items-center gap-1 bg-neutral-850 p-0.5 rounded border border-neutral-800">
              <button
                onClick={() => onSetZoom?.(0.25)}
                className="px-1.5 py-0.5 text-neutral-400 hover:text-white text-[10px] font-mono rounded"
              >
                25%
              </button>
              <button
                onClick={() => onSetZoom?.(0.5)}
                className="px-1.5 py-0.5 text-neutral-400 hover:text-white text-[10px] font-mono rounded"
              >
                50%
              </button>
              <button
                onClick={() => onSetZoom?.(1)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  Math.abs(zoomLevel - 1) < 0.05 ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-300 hover:text-white'
                }`}
                title="Actual Pixels (100%)"
              >
                100%
              </button>
              <button
                onClick={() => onSetZoom?.(2)}
                className="px-1.5 py-0.5 text-neutral-400 hover:text-white text-[10px] font-mono rounded"
              >
                200%
              </button>
              <button
                onClick={() => onSetZoom?.(4)}
                className="px-1.5 py-0.5 text-neutral-400 hover:text-white text-[10px] font-mono rounded"
              >
                400%
              </button>
            </div>

            {/* Fit & Fill Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={onFitZoom}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 text-[11px]"
                title="Fit Canvas to Window (Ctrl+0)"
              >
                <Maximize2 className="w-3 h-3 text-cyan-400" /> Fit Screen
              </button>
              <button
                onClick={() => onSetZoom?.(1)}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 text-[11px]"
                title="100% 1:1 Pixel Scale (Ctrl+1)"
              >
                100% 1:1
              </button>
            </div>

            {/* Current Zoom Readout */}
            <div className="flex items-center gap-1 text-cyan-400 font-mono text-xs pl-2 border-l border-neutral-800">
              <span>Zoom:</span>
              <span className="font-bold">{Math.round(zoomLevel * 100)}%</span>
            </div>

            <span className="text-neutral-500 text-[11px] italic">
              Click canvas to zoom, or drag horizontally for scrubby zoom
            </span>
          </div>
        )}

        {/* Paint Bucket Options (Fast 8K Scanline) */}
        {activeTool === 'bucket' && (
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-medium">8K Paint Bucket:</span>
            <span className="text-neutral-500">Tolerance:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={bucketTolerance}
              onChange={(e) => onChangeBucketTolerance(Number(e.target.value))}
              className="w-24 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="font-mono text-neutral-200 min-w-[28px]">{bucketTolerance}</span>
          </div>
        )}

        {/* Selection Tools & Actions (Photoshop Marquee & Lasso) */}
        {(activeTool === 'marquee' || activeTool === 'lasso') && (
          <div className="flex items-center gap-2">
            <span className="text-neutral-300 font-semibold">
              {activeTool === 'marquee' ? 'Rectangle Marquee Tool:' : 'Freehand Lasso Tool:'}
            </span>
            <span className="text-neutral-500 text-[11px] italic">
              Drag on canvas to define selection marquee
            </span>
            {hasSelection && (
              <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
                <button
                  onClick={onFillSelection}
                  title="Fill Selection with Foreground Color (Alt+Backspace)"
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded border border-neutral-700 flex items-center gap-1"
                >
                  <PaintBucket className="w-3 h-3" /> Fill
                </button>
                {onStrokeSelection && (
                  <button
                    onClick={onStrokeSelection}
                    title="Outline Selection with Stroke"
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded border border-neutral-700 flex items-center gap-1"
                  >
                    Stroke
                  </button>
                )}
                <button
                  onClick={onDeleteSelection}
                  title="Delete Selection Area (Del)"
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-red-300 rounded border border-neutral-700 flex items-center gap-1"
                >
                  <Scissors className="w-3 h-3" /> Clear
                </button>
                <button
                  onClick={onInvertSelection}
                  title="Invert Selection (Ctrl+Shift+I)"
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  Invert
                </button>
                <button
                  onClick={onClearSelection}
                  title="Deselect (Ctrl+D)"
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded border border-neutral-700"
                >
                  Deselect
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {canPaste && onPasteObject && (
          <button
            onClick={onPasteObject}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-[11px] shadow-md animate-pulse cursor-pointer border border-emerald-400/80 active:scale-95"
            title="ক্লিপবোর্ডে কপি করা অবজেক্ট ক্যানভাসে পেস্ট করুন (Ctrl+V)"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>পেস্ট (Paste)</span>
          </button>
        )}

        {hasStrayShapes && onClearStrayShapes && (
          <button
            onClick={onClearStrayShapes}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 font-medium transition-all text-[11px]"
            title="Delete accidental 3D gradient spheres from canvas"
          >
            <Eraser className="w-3.5 h-3.5 text-amber-400" />
            <span>অপ্রয়োজনীয় স্ফিয়ার মুছুন</span>
          </button>
        )}

        {/* Right side shortcut to Brush Studio */}
        <button
          onClick={onOpenBrushStudio}
          className="text-neutral-400 hover:text-cyan-400 flex items-center gap-1 text-[11px] transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Brush Engine Studio</span>
        </button>
      </div>
    </div>
  );
});
