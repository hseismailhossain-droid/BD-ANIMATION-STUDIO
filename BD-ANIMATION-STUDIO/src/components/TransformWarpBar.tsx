import React from 'react';
import {
  Move,
  Grid3X3,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Maximize2,
  Sparkles,
  Minus,
  Plus,
  Compass,
  ChevronsUp,
  ChevronsDown,
  Eraser,
} from 'lucide-react';
import { LayerTransformState, TransformMode } from '../engine/warpEngine';
import { Layer } from '../types';

interface TransformWarpBarProps {
  transformState: LayerTransformState;
  layers: Layer[];
  activeLayerId: string;
  onSelectLayerId: (id: string) => void;
  onSetMode: (mode: TransformMode) => void;
  onUpdateState: (updates: Partial<LayerTransformState>) => void;
  onChangeDivisionX: (delta: number) => void;
  onChangeDivisionY: (delta: number) => void;
  onChangeSmoothness: (delta: number) => void;
  onApplyCurvePreset: (preset: 'arc-up' | 'arc-down' | 'arc-left' | 'arc-right' | 'bulge' | 'pinch' | 'wave' | 'flag' | 's-curve') => void;
  onResetMeshGrid: () => void;
  onNudge: (dx: number, dy: number) => void;
  onRotateDegrees: (deg: number) => void;
  onRotateStep: (deltaDeg: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onMoveLayerOrder: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onCenterLayer: () => void;
  onApplyTransform: () => void;
  onCancelTransform: () => void;
  onClearStrayShapes?: () => void;
  hasStrayShapes?: boolean;
}

export const TransformWarpBar: React.FC<TransformWarpBarProps> = ({
  transformState,
  layers,
  activeLayerId,
  onSelectLayerId,
  onSetMode,
  onUpdateState,
  onChangeDivisionX,
  onChangeDivisionY,
  onChangeSmoothness,
  onApplyCurvePreset,
  onResetMeshGrid,
  onNudge,
  onRotateDegrees,
  onRotateStep,
  onFlipH,
  onFlipV,
  onMoveLayerOrder,
  onCenterLayer,
  onApplyTransform,
  onCancelTransform,
  onClearStrayShapes,
  hasStrayShapes,
}) => {
  const { mode, divisionX, divisionY, smoothness, rotation, scale, translation, drawOrder } = transformState;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 text-xs text-neutral-200 select-none max-w-[95vw] overflow-x-auto">
      {/* Top Row: Mode Tabs & Layer Picker & Confirm/Cancel */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-2">
        {/* Transform Mode Tabs (Matching Ibis Paint / Clip Studio style from user's video) */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => onSetMode('translate-scale')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium text-xs transition-all ${
              mode === 'translate-scale'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Translate & Scale (Move, Rotate 360°, Scale, Layer Order)"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Translate Scale</span>
          </button>

          <button
            onClick={() => onSetMode('perspective')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium text-xs transition-all ${
              mode === 'perspective'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Perspective Form (4 Corner 3D Warp)"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Perspective Form</span>
          </button>

          <button
            onClick={() => {
              if (mode === 'mesh') {
                onCancelTransform();
              } else {
                onSetMode('mesh');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium text-xs transition-all ${
              mode === 'mesh'
                ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Mesh Form (Ibis Paint / Illustrator Mesh Warp Grid) - Click to activate or toggle off"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Mesh Form</span>
            {mode === 'mesh' && (
              <span className="text-[10px] bg-cyan-700/80 px-1 rounded text-cyan-200 ml-0.5">ON</span>
            )}
          </button>
        </div>

        {/* Layer Selector */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-neutral-400 text-[11px]">Layer:</span>
          <select
            value={activeLayerId}
            onChange={(e) => onSelectLayerId(e.target.value)}
            className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.id === activeLayerId ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Apply (Checkmark) & Cancel (X) */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
          {hasStrayShapes && onClearStrayShapes && (
            <button
              onClick={onClearStrayShapes}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-300 font-medium transition-all text-xs"
              title="Delete accidental 3D gradient spheres from canvas"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-400" />
              <span>Clear Extra Spheres</span>
            </button>
          )}

          <button
            onClick={onCancelTransform}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white border border-red-700/80 font-bold transition-all shadow-sm cursor-pointer"
            title="Cancel & Close (Esc)"
          >
            <X className="w-4 h-4 text-red-300" />
            <span>✕ Cancel (Esc)</span>
          </button>

          <button
            onClick={onApplyTransform}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            title="Apply Transform / Warp to Layer (Enter)"
          >
            <Check className="w-4 h-4" />
            <span>✓ Apply (Enter)</span>
          </button>
        </div>
      </div>

      {/* Mode-Specific Controls */}
      {mode === 'translate-scale' && (
        <div className="flex items-center gap-4 flex-wrap pt-0.5">
          {/* Layer Order (Front / Back) */}
          <div className="flex items-center gap-1 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
            <span className="text-neutral-400 text-[11px] font-medium mr-1">Layer Order:</span>
            <button
              onClick={() => onMoveLayerOrder('top')}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Bring to Front"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMoveLayerOrder('up')}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Bring Forward"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMoveLayerOrder('down')}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Send Backward"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMoveLayerOrder('bottom')}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Send to Back"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Position Nudge (Up, Down, Left, Right) */}
          <div className="flex items-center gap-1 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
            <span className="text-neutral-400 text-[11px] font-medium mr-1">Move:</span>
            <button
              onClick={() => onNudge(-10, 0)}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Move Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNudge(10, 0)}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Move Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNudge(0, -10)}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNudge(0, 10)}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCenterLayer}
              className="px-1.5 py-0.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded text-[11px]"
              title="Center on Canvas"
            >
              Center
            </button>
          </div>

          {/* 360 Degree Continuous Rotation */}
          <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2.5 py-1 rounded border border-neutral-800">
            <span className="text-neutral-400 text-[11px] font-medium">Rotate 360°:</span>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => onRotateDegrees(Number(e.target.value))}
              className="w-24 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="font-mono text-cyan-400 min-w-[38px] text-right font-semibold">
              {rotation}°
            </span>
            <button
              onClick={() => onRotateStep(-90)}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Rotate 90° CCW"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRotateStep(90)}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Rotate 90° CW"
            >
              <RotateCw className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRotateDegrees(0)}
              className="px-1 py-0.5 text-[10px] bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded"
              title="Reset Rotation to 0°"
            >
              0°
            </button>
          </div>

          {/* Scale & Flip */}
          <div className="flex items-center gap-2 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
            <span className="text-neutral-400 text-[11px] font-medium">Scale:</span>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.05"
              value={scale.x}
              onChange={(e) => {
                const s = Number(e.target.value);
                onUpdateState({ scale: { x: s, y: s } });
              }}
              className="w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="font-mono text-neutral-300 min-w-[34px]">
              {Math.round(scale.x * 100)}%
            </span>

            <button
              onClick={onFlipH}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onFlipV}
              className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title="Flip Vertical"
            >
              <FlipVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Perspective Form */}
      {mode === 'perspective' && (
        <div className="flex items-center gap-4 flex-wrap pt-0.5">
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Perspective Distortion:
          </span>
          <span className="text-neutral-400 text-[11px]">
            Drag the 4 corner handles on the canvas to skew/tilt the layer in 3D perspective.
          </span>
          <button
            onClick={() => onUpdateState({
              perspectiveCorners: [
                { x: transformState.bounds.x, y: transformState.bounds.y },
                { x: transformState.bounds.x + transformState.bounds.width, y: transformState.bounds.y },
                { x: transformState.bounds.x + transformState.bounds.width, y: transformState.bounds.y + transformState.bounds.height },
                { x: transformState.bounds.x, y: transformState.bounds.y + transformState.bounds.height },
              ]
            })}
            className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 text-xs"
          >
            Reset Corners
          </button>
        </div>
      )}

      {/* Mode 3: Mesh Form (Full interactive control for Move, 360 Rotate, Layer Depth, and Multi-directional Curves) */}
      {mode === 'mesh' && (
        <div className="flex flex-col gap-2 pt-1">
          {/* Row 1: Layer Depth, Move, and 360° Rotation */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Layer Depth / Order */}
            <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
              <span className="text-neutral-400 text-[11px]" title="Layer Order (Front / Back))">Order:</span>
              <button
                onClick={() => onMoveLayerOrder('down')}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Send Backward"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="font-mono text-cyan-400 font-semibold min-w-[14px] text-center" title="Current Layer Position">
                {drawOrder}
              </span>
              <button
                onClick={() => onMoveLayerOrder('up')}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Bring Forward"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => onMoveLayerOrder('top')}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-medium"
                title="Bring to Front"
              >
                Front
              </button>
              <button
                onClick={() => onMoveLayerOrder('bottom')}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-medium"
                title="Send to Back"
              >
                Back
              </button>
            </div>

            {/* Move (Up, Down, Left, Right) */}
            <div className="flex items-center gap-1 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Move:</span>
              <button
                onClick={() => onNudge(-10, 0)}
                className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="Move Left"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNudge(10, 0)}
                className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="Move Right"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNudge(0, -10)}
                className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="Move Up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNudge(0, 10)}
                className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="Move Down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                onClick={onCenterLayer}
                className="px-1.5 py-0.5 rounded bg-neutral-850 hover:bg-neutral-800 text-[10px] text-neutral-300 hover:text-white"
                title="Center on Canvas"
              >
                Center
              </button>
            </div>

            {/* 360° Rotation */}
            <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
              <span className="text-neutral-400 text-[11px]" title="360° Continuous Rotation">Rotate:</span>
              <button
                onClick={() => onRotateStep(-15)}
                className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="Rotate -15° CCW"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation || 0}
                onChange={(e) => onRotateDegrees(Number(e.target.value))}
                className="w-16 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                title="360° Rotation Slider (-180° to +180°)"
              />
              <span className="font-mono text-cyan-400 min-w-[28px] text-center text-[11px]">
                {rotation || 0}°
              </span>
              <button
                onClick={() => onRotateStep(15)}
                className="p-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                title="Rotate +15° CW"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => onRotateDegrees(0)}
                className="px-1.5 py-0.5 rounded bg-neutral-850 hover:bg-neutral-800 text-[10px] text-neutral-400 hover:text-white"
                title="Reset Rotation to 0°"
              >
                0°
              </button>
            </div>
          </div>

          {/* Row 2: Grid Division, Smoothness, and Multi-Directional Curve Presets */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Division X (slider with - and + from video) */}
            <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Division X:</span>
              <button
                onClick={() => onChangeDivisionX(-1)}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Decrease Division X"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <input
                type="range"
                min="2"
                max="12"
                value={divisionX}
                onChange={(e) => onChangeDivisionX(Number(e.target.value) - divisionX)}
                className="w-14 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-cyan-400 font-semibold min-w-[16px] text-center">
                {divisionX}
              </span>
              <button
                onClick={() => onChangeDivisionX(1)}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Increase Division X"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Division Y (slider with - and + from video) */}
            <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Division Y:</span>
              <button
                onClick={() => onChangeDivisionY(-1)}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Decrease Division Y"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <input
                type="range"
                min="2"
                max="12"
                value={divisionY}
                onChange={(e) => onChangeDivisionY(Number(e.target.value) - divisionY)}
                className="w-14 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-cyan-400 font-semibold min-w-[16px] text-center">
                {divisionY}
              </span>
              <button
                onClick={() => onChangeDivisionY(1)}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Increase Division Y"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Smoothness (slider with - and + from video) */}
            <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2 py-1 rounded border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Smoothness:</span>
              <button
                onClick={() => onChangeSmoothness(-1)}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Decrease Smoothness"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <input
                type="range"
                min="1"
                max="4"
                value={smoothness}
                onChange={(e) => onChangeSmoothness(Number(e.target.value) - smoothness)}
                className="w-12 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="font-mono text-cyan-400 font-semibold min-w-[14px] text-center">
                {smoothness}
              </span>
              <button
                onClick={() => onChangeSmoothness(1)}
                className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300"
                title="Increase Smoothness"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Curve Presets */}
            <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Curve:</span>
              <button
                onClick={() => onApplyCurvePreset('arc-up')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="Curve Arc Upwards"
              >
                Arc Up
              </button>
              <button
                onClick={() => onApplyCurvePreset('arc-down')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="Curve Arc Downwards"
              >
                Arc Down
              </button>
              <button
                onClick={() => onApplyCurvePreset('arc-left')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="Curve Arc Leftwards"
              >
                Arc Left
              </button>
              <button
                onClick={() => onApplyCurvePreset('arc-right')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="Curve Arc Rightwards"
              >
                Arc Right
              </button>
              <button
                onClick={() => onApplyCurvePreset('bulge')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="Bulge Outward"
              >
                Bulge
              </button>
              <button
                onClick={() => onApplyCurvePreset('pinch')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="Pinch Inward"
              >
                Pinch
              </button>
              <button
                onClick={() => onApplyCurvePreset('wave')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="Wave Curve"
              >
                Wave
              </button>
              <button
                onClick={() => onApplyCurvePreset('s-curve')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-medium"
                title="S-Curve Bend"
              >
                S-Curve
              </button>
              <button
                onClick={onResetMeshGrid}
                className="px-2 py-0.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded text-[11px]"
                title="Reset to Uniform Grid"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
