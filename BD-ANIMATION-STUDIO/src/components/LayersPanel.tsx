/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layer, BlendMode } from '../types';
import { BLEND_MODES } from '../constants';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Plus,
  Trash2,
  Copy,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  Layers as LayersIcon,
  PenTool,
  Paintbrush,
  CornerDownRight,
  Link2,
  Unlink2,
  Combine,
  Minimize2,
  Upload,
  Image as ImageIcon,
  X,
  Pencil,
  Check,
  Settings,
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: (type: 'raster' | 'vector') => void;
  onUploadImageToNewLayer?: () => void;
  onUploadImageToLayer?: (layerId: string) => void;
  onDropImageFile?: (file: File, layerId?: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeDown: (id: string) => void;
  onMergeVisible?: () => void;
  onFlattenImage?: () => void;
  onToggleClippingMask?: (id: string) => void;
  onToggleLinkLayer?: (id: string) => void;
  onReorderLayer: (fromIndex: number, toIndex: number) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onToggleAllLayersVisibility?: () => void;
  onNudgeLayer?: (dx: number, dy: number, moveAll?: boolean) => void;
  onClose?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = React.memo(({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onUploadImageToNewLayer,
  onUploadImageToLayer,
  onDropImageFile,
  onDeleteLayer,
  onDuplicateLayer,
  onMergeDown,
  onMergeVisible,
  onFlattenImage,
  onToggleClippingMask,
  onToggleLinkLayer,
  onReorderLayer,
  onUpdateLayer,
  onToggleAllLayersVisibility,
  onNudgeLayer,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showLayerSettings, setShowLayerSettings] = useState(false);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];
  const activeIndex = layers.findIndex((l) => l.id === activeLayerId);

  const startRenaming = (layer: Layer) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const finishRenaming = () => {
    if (editingId && editName.trim()) {
      onUpdateLayer(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          onDropImageFile?.(file);
        }
      }}
      className="relative flex flex-col h-full min-h-0 w-full bg-neutral-900 border-l border-neutral-800 text-xs text-neutral-200 select-none overflow-hidden"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-emerald-950/85 backdrop-blur-xs border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-4 text-center gap-2 animate-in fade-in">
          <Upload className="w-8 h-8 text-emerald-300 animate-bounce" />
          <span className="font-bold text-emerald-200 text-sm">Drop image to add as new layer</span>
          <span className="text-[11px] text-emerald-300/80">Supports PNG, JPG, WebP, SVG</span>
        </div>
      )}

      {/* Header */}
      <div className="h-9 px-3 border-b border-neutral-800 flex items-center justify-between font-semibold text-neutral-300">
        <div className="flex items-center gap-1.5">
          <LayersIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Layers ({layers.length})</span>
          <button
            onClick={() => {
              if (onToggleAllLayersVisibility) {
                onToggleAllLayersVisibility();
              } else {
                const allVisible = layers.every((l) => l.visible);
                layers.forEach((l) => onUpdateLayer(l.id, { visible: !allVisible }));
              }
            }}
            title={layers.every((l) => l.visible) ? 'Hide All Layers' : 'Show All Layers'}
            className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
              layers.every((l) => l.visible)
                ? 'hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300'
                : 'bg-amber-950 text-amber-300 border border-amber-600/50 font-bold px-1.5'
            }`}
          >
            {layers.every((l) => l.visible) ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Hidden</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddLayer('raster')}
            title="Add Raster Layer"
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 hover:text-cyan-200 flex items-center gap-1 text-[11px] px-1.5"
          >
            <Paintbrush className="w-3 h-3" /> +Raster
          </button>
          <button
            onClick={() => onAddLayer('vector')}
            title="Add Vector Layer"
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-indigo-300 hover:text-indigo-200 flex items-center gap-1 text-[11px] px-1.5"
          >
            <PenTool className="w-3 h-3" /> +Vector
          </button>
          {onUploadImageToNewLayer && (
            <button
              onClick={onUploadImageToNewLayer}
              title="Upload Image as New Layer"
              className="p-1 rounded bg-neutral-800 hover:bg-emerald-600/90 text-emerald-300 hover:text-white flex items-center gap-1 text-[11px] px-1.5 transition-colors font-medium shadow-xs"
            >
              <Upload className="w-3 h-3 text-emerald-400" /> +Image
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Layer Controls (Blend Mode, Opacity, Settings - Compact & Collapsible) */}
      {activeLayer && (
        <div className="p-2 border-b border-neutral-800 bg-neutral-925 flex flex-col gap-1.5 shrink-0">
          {/* Main Compact Row: Active Layer Name + Mode + Opacity + Settings Toggle */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-medium shrink-0">Active:</span>
              <span className="font-bold text-cyan-300 truncate text-xs" title={activeLayer.name}>
                {activeLayer.name}
              </span>
              <button
                onClick={() => startRenaming(activeLayer)}
                title="Rename Layer"
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 transition-colors shrink-0"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Compact Blend Mode Selector */}
            <select
              value={activeLayer.blendMode}
              onChange={(e) =>
                onUpdateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })
              }
              className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-cyan-500 max-w-[90px] truncate"
            >
              {BLEND_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>

            {/* Quick Settings Toggle */}
            <button
              onClick={() => setShowLayerSettings(!showLayerSettings)}
              title="Toggle Advanced Layer Settings (Lock, Clipping, Alpha)"
              className={`p-1 px-1.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                showLayerSettings
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>Options</span>
            </button>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-[10px] font-medium shrink-0">Opacity:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(activeLayer.opacity * 100)}
              onChange={(e) =>
                onUpdateLayer(activeLayer.id, { opacity: Number(e.target.value) / 100 })
              }
              className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="font-mono text-cyan-300 text-[10px] min-w-[28px] text-right">
              {Math.round(activeLayer.opacity * 100)}%
            </span>
          </div>

          {/* Collapsible Advanced Properties (Alpha Lock, Clipping, Insert Image, Lock, Duplicate, Merge, Flatten) */}
          {showLayerSettings && (
            <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-2 text-[10px] animate-in fade-in">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() =>
                    onUpdateLayer(activeLayer.id, { alphaLocked: !activeLayer.alphaLocked })
                  }
                  title="Lock Transparent Pixels (Alpha Lock)"
                  className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                    activeLayer.alphaLocked
                      ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                      : 'bg-neutral-800/70 border-neutral-750 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Shield className="w-3 h-3" /> Alpha Lock
                </button>

                <button
                  disabled={activeIndex <= 0}
                  onClick={() => {
                    if (onToggleClippingMask) onToggleClippingMask(activeLayer.id);
                    else onUpdateLayer(activeLayer.id, { clippingMask: !activeLayer.clippingMask });
                  }}
                  title="Clipping Mask: Clips strictly to layer below"
                  className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors disabled:opacity-30 ${
                    activeLayer.clippingMask
                      ? 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300 font-semibold'
                      : 'bg-neutral-800/70 border-neutral-750 text-neutral-300 hover:text-white'
                  }`}
                >
                  <CornerDownRight className="w-3 h-3" /> ↳ Clip
                </button>

                {onUploadImageToLayer && (
                  <button
                    onClick={() => onUploadImageToLayer(activeLayer.id)}
                    title="Upload / Insert Image into this Layer"
                    className="flex items-center gap-1 px-2 py-1 rounded border border-emerald-700/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/70 hover:text-white transition-colors"
                  >
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>Insert</span>
                  </button>
                )}

                <button
                  onClick={() => onUpdateLayer(activeLayer.id, { locked: !activeLayer.locked })}
                  title="Lock Entire Layer"
                  className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                    activeLayer.locked
                      ? 'bg-red-950/70 border-red-500/50 text-red-300'
                      : 'bg-neutral-800/70 border-neutral-750 text-neutral-300 hover:text-white'
                  }`}
                >
                  {activeLayer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  Lock
                </button>

                <span
                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${
                    activeLayer.type === 'vector'
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                  }`}
                >
                  {activeLayer.type.toUpperCase()}
                </span>
              </div>

              {/* Layer Actions: Duplicate, Merge Down, Merge Visible, Flatten */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-neutral-800/50">
                <button
                  onClick={() => onDuplicateLayer(activeLayerId)}
                  title="Duplicate Active Layer"
                  className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>Duplicate</span>
                </button>

                <button
                  disabled={activeIndex <= 0}
                  onClick={() => onMergeDown(activeLayerId)}
                  title="Merge Down with layer below"
                  className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 disabled:opacity-30 transition-colors"
                >
                  <ArrowDownToLine className="w-3 h-3 text-cyan-400" />
                  <span>Merge Down</span>
                </button>

                {onMergeVisible && (
                  <button
                    onClick={onMergeVisible}
                    title="Merge all visible layers"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    <Combine className="w-3 h-3 text-indigo-400" />
                    <span>Merge Visible</span>
                  </button>
                )}

                {onFlattenImage && (
                  <button
                    onClick={onFlattenImage}
                    title="Flatten image into one single layer"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    <Minimize2 className="w-3 h-3 text-amber-400" />
                    <span>Flatten</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Layer List - rendered top-to-bottom (highest layer rendered first in list, standard Photoshop UX) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y divide-y divide-neutral-800/40 p-1.5 space-y-1 scroll-smooth">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const actualIndex = layers.length - 1 - reverseIndex;
          const isSelected = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse') {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('input') || target.closest('select')) {
                    return;
                  }
                  onSelectLayer(layer.id);
                }
              }}
              onClick={() => onSelectLayer(layer.id)}
              className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border select-none touch-pan-y ${
                isSelected
                  ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/50 border-l-4 border-l-cyan-400'
                  : 'bg-neutral-900/80 border-neutral-800/80 hover:bg-neutral-850 text-neutral-300'
              } ${layer.clippingMask ? 'ml-3 border-l-2 border-l-cyan-400 bg-neutral-850/60' : ''}`}
            >
              {/* Left: Visibility, Thumbnail, Layer Name & Blend Mode (Clicking selects the layer instantly!) */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Visibility Toggle */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className={`p-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0 ${
                    layer.visible ? 'text-cyan-400' : 'text-neutral-600'
                  }`}
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Layer Thumbnail Preview */}
                <div className="w-7 h-7 rounded-lg border border-neutral-750 bg-neutral-950 overflow-hidden flex items-center justify-center shrink-0 pointer-events-none">
                  {layer.type === 'raster' ? (
                    <Paintbrush className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
                  ) : (
                    <PenTool className="w-3.5 h-3.5 text-indigo-400 opacity-80" />
                  )}
                </div>

                {/* Layer Name & Details (Clean, wide, prominent) */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  {editingId === layer.id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editName}
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishRenaming();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="bg-neutral-950 text-white px-1.5 py-0.5 rounded border border-cyan-500 text-xs w-full focus:outline-none"
                      />
                      <button
                        onClick={finishRenaming}
                        className="p-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shrink-0"
                        title="Confirm Rename"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 cursor-pointer shrink-0"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          onDoubleClick={() => startRenaming(layer)}
                          className={`text-xs truncate font-semibold block ${
                            isSelected ? 'text-cyan-200 font-bold' : 'text-neutral-200'
                          }`}
                        >
                          {layer.name}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                        )}
                        {layer.clippingMask && (
                          <span className="text-[10px] text-cyan-400 font-bold shrink-0">↳ Clip</span>
                        )}
                        {layer.locked && (
                          <Lock className="w-2.5 h-2.5 text-red-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono truncate">
                        <span>#{actualIndex + 1}</span>
                        <span>•</span>
                        <span>{layer.blendMode === 'source-over' ? 'Normal' : layer.blendMode}</span>
                        <span>•</span>
                        <span>{Math.round(layer.opacity * 100)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Clean, compact Up, Down, Delete buttons */}
              <div
                className="flex items-center gap-1 shrink-0 ml-1.5"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  disabled={actualIndex === layers.length - 1}
                  onClick={() => onReorderLayer(actualIndex, actualIndex + 1)}
                  title="Move Layer Up"
                  className="p-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-300 disabled:opacity-20 cursor-pointer active:scale-90 transition-all shrink-0"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={actualIndex === 0}
                  onClick={() => onReorderLayer(actualIndex, actualIndex - 1)}
                  title="Move Layer Down"
                  className="p-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-300 disabled:opacity-20 cursor-pointer active:scale-90 transition-all shrink-0"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={layers.length <= 1}
                  onClick={() => onDeleteLayer(layer.id)}
                  title={layers.length <= 1 ? 'Cannot delete only layer' : 'Delete Layer'}
                  className="p-1.5 px-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-90 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
