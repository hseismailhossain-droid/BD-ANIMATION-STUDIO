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
  onClose?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
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
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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
      className="relative flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-xs text-neutral-200 select-none"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-emerald-950/85 backdrop-blur-xs border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-4 text-center gap-2 animate-in fade-in">
          <Upload className="w-8 h-8 text-emerald-300 animate-bounce" />
          <span className="font-bold text-emerald-200 text-sm">নতুন লেয়ার হিসেবে ইমেজ ছেড়ে দিন</span>
          <span className="text-[11px] text-emerald-300/80">Drop image to add as layer</span>
        </div>
      )}

      {/* Header */}
      <div className="h-9 px-3 border-b border-neutral-800 flex items-center justify-between font-semibold text-neutral-300">
        <div className="flex items-center gap-1.5">
          <LayersIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Layers ({layers.length})</span>
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
              title="নতুন লেয়ার হিসেবে ইমেজ আপলোড করুন (Upload Image as Layer)"
              className="p-1 rounded bg-neutral-800 hover:bg-emerald-600/90 text-emerald-300 hover:text-white flex items-center gap-1 text-[11px] px-1.5 transition-colors font-medium shadow-xs"
            >
              <Upload className="w-3 h-3 text-emerald-400" /> +ইমেজ
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="প্যানেল বন্ধ করুন (Close)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Layer Controls (Blend Mode & Opacity) */}
      {activeLayer && (
        <div className="p-2.5 border-b border-neutral-800/80 bg-neutral-925 flex flex-col gap-2">
          {/* Blend Mode Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 font-medium">Mode:</span>
            <select
              value={activeLayer.blendMode}
              onChange={(e) =>
                onUpdateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })
              }
              className="flex-1 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              {BLEND_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 font-medium">Opacity:</span>
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
            <span className="font-mono text-neutral-300 min-w-[32px] text-right">
              {Math.round(activeLayer.opacity * 100)}%
            </span>
          </div>

          {/* Quick Lock, Alpha Lock, Clipping Mask, Image Upload & Link switches */}
          <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50 flex-wrap gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() =>
                  onUpdateLayer(activeLayer.id, { alphaLocked: !activeLayer.alphaLocked })
                }
                title="Lock Transparent Pixels (Alpha Lock)"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                  activeLayer.alphaLocked
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                    : 'bg-neutral-800/60 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Shield className="w-3 h-3" /> Alpha Lock
              </button>

              {/* Clipping Mask Button (নিচের লেয়ারের শেপে আটকে রাখা) */}
              <button
                disabled={activeIndex <= 0}
                onClick={() => {
                  if (onToggleClippingMask) onToggleClippingMask(activeLayer.id);
                  else onUpdateLayer(activeLayer.id, { clippingMask: !activeLayer.clippingMask });
                }}
                title="Clipping Mask: নিচে জোড়া লাগানো (Clips strictly to layer below)"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors disabled:opacity-30 ${
                  activeLayer.clippingMask
                    ? 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300 font-semibold'
                    : 'bg-neutral-800/60 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <CornerDownRight className="w-3 h-3" /> ↳ ক্লিপিং
              </button>

              {/* Upload Image directly into this active layer */}
              {onUploadImageToLayer && (
                <button
                  onClick={() => onUploadImageToLayer(activeLayer.id)}
                  title="এই সক্রিয় লেয়ারে সরাসরি ইমেজ আপলোড করুন (Upload / Insert Image into this Layer)"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-emerald-700/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/70 hover:text-white transition-colors"
                >
                  <Upload className="w-3 h-3 text-emerald-400" />
                  <span>লেয়ারে ইমেজ</span>
                </button>
              )}

              <button
                onClick={() => onUpdateLayer(activeLayer.id, { locked: !activeLayer.locked })}
                title="Lock Entire Layer"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                  activeLayer.locked
                    ? 'bg-red-950/70 border-red-500/50 text-red-300'
                    : 'bg-neutral-800/60 border-neutral-750 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {activeLayer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                Lock
              </button>
            </div>

            {/* Layer Type Badge */}
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                activeLayer.type === 'vector'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
              }`}
            >
              {activeLayer.type.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Layer List - rendered top-to-bottom (highest layer rendered first in list, standard Photoshop UX) */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40 p-1.5 space-y-1">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const actualIndex = layers.length - 1 - reverseIndex;
          const isSelected = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`group flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-neutral-800 border-cyan-500/60 shadow-sm'
                  : 'bg-neutral-900/60 border-transparent hover:bg-neutral-800/50'
              } ${layer.clippingMask ? 'ml-3 border-l-2 border-l-cyan-400 bg-neutral-850/60' : ''}`}
            >
              {/* Left: Visibility, Clipping arrow & Thumbnail */}
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className={`p-1 rounded hover:bg-neutral-700 transition-colors ${
                    layer.visible ? 'text-neutral-300' : 'text-neutral-600'
                  }`}
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Clipping Mask Hook Indicator */}
                {layer.clippingMask && (
                  <span title="Clipped to layer beneath" className="text-cyan-400 font-bold text-xs">
                    ↳
                  </span>
                )}

                {/* Layer Thumbnail Preview */}
                <div className="w-8 h-8 rounded border border-neutral-750 bg-neutral-950 overflow-hidden flex items-center justify-center shrink-0 transparency-grid-dark">
                  {layer.type === 'raster' ? (
                    <Paintbrush className="w-4 h-4 text-cyan-400 opacity-80" />
                  ) : (
                    <PenTool className="w-4 h-4 text-indigo-400 opacity-80" />
                  )}
                </div>

                {/* Layer Name (Double click to rename) */}
                <div className="min-w-0 flex-1">
                  {editingId === layer.id ? (
                    <input
                      type="text"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={finishRenaming}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishRenaming();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="bg-neutral-950 text-white px-1.5 py-0.5 rounded border border-cyan-500 text-xs w-full focus:outline-none"
                    />
                  ) : (
                    <div
                      onDoubleClick={() => startRenaming(layer)}
                      className="font-medium truncate text-neutral-200"
                      title="Double click to rename"
                    >
                      {layer.name}
                    </div>
                  )}
                  <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 font-mono">
                    <span>{layer.blendMode === 'source-over' ? 'Normal' : layer.blendMode}</span>
                    <span>•</span>
                    <span>{Math.round(layer.opacity * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Right: Badges & Actions */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {/* Link Toggle Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleLinkLayer) onToggleLinkLayer(layer.id);
                    else onUpdateLayer(layer.id, { linked: !layer.linked });
                  }}
                  title={layer.linked ? 'Linked with other layers' : 'Click to link layer'}
                  className={`p-1 rounded transition ${
                    layer.linked
                      ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-700/50'
                      : 'text-neutral-500 hover:text-neutral-300 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                </button>

                {layer.alphaLocked && (
                  <span title="Alpha Locked">
                    <Shield className="w-3 h-3 text-amber-400" />
                  </span>
                )}
                {layer.locked && (
                  <span title="Locked">
                    <Lock className="w-3 h-3 text-red-400" />
                  </span>
                )}

                {/* Upload Image to this specific layer */}
                {onUploadImageToLayer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUploadImageToLayer(layer.id);
                    }}
                    title="এই লেয়ারে ইমেজ আপলোড করুন (Upload Image to this Layer)"
                    className="p-1 rounded text-neutral-500 hover:text-emerald-300 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                )}

                {/* Reorder Buttons */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    disabled={actualIndex === layers.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderLayer(actualIndex, actualIndex + 1);
                    }}
                    title="Move Layer Up"
                    className="p-0.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 disabled:opacity-20"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={actualIndex === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderLayer(actualIndex, actualIndex - 1);
                    }}
                    title="Move Layer Down"
                    className="p-0.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 disabled:opacity-20"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions Toolbar: Duplicate, Merge Down, Merge Visible, Flatten Image, Delete */}
      <div className="h-9 px-2 border-t border-neutral-800 bg-neutral-925 flex items-center justify-between text-neutral-400">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onDuplicateLayer(activeLayerId)}
            title="Duplicate Active Layer"
            className="p-1.5 rounded hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Upload Image to Layer */}
          {onUploadImageToNewLayer && (
            <button
              onClick={onUploadImageToNewLayer}
              title="ইমেজ আপলোড করে নতুন লেয়ার তৈরি করুন (Upload Image to Layer)"
              className="p-1.5 rounded hover:bg-neutral-800 hover:text-emerald-400 transition-colors flex items-center gap-1 text-emerald-300"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Merge Down (নিচের লেয়ারের সাথে জোড়া লাগানো) */}
          <button
            disabled={activeIndex <= 0}
            onClick={() => onMergeDown(activeLayerId)}
            title="Merge Down: নিচের লেয়ারের সাথে জোড়া লাগান (Ctrl+E)"
            className="p-1.5 rounded hover:bg-neutral-800 hover:text-cyan-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-[11px]"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>

          {/* Merge Visible (সব দৃশ্যমান লেয়ার একত্রীকরণ / জোড়া লাগানো) */}
          {onMergeVisible && (
            <button
              onClick={onMergeVisible}
              title="Merge Visible: সব দৃশ্যমান লেয়ার একসাথে জোড়া লাগান (Shift+Ctrl+E)"
              className="p-1.5 rounded hover:bg-neutral-800 hover:text-indigo-300 transition-colors"
            >
              <Combine className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Flatten Image (সব লেয়ার একত্র করে একক লেয়ার করা) */}
          {onFlattenImage && (
            <button
              onClick={onFlattenImage}
              title="Flatten Image: সমস্ত লেয়ার একসাথে ফ্ল্যাটেন করুন"
              className="p-1.5 rounded hover:bg-neutral-800 hover:text-amber-300 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          disabled={layers.length <= 1}
          onClick={() => onDeleteLayer(activeLayerId)}
          title="Delete Layer"
          className="p-1.5 rounded hover:bg-red-900/30 hover:text-red-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
