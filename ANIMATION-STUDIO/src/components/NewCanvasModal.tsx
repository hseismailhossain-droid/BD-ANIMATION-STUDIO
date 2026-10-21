import React, { useState } from 'react';
import { CanvasConfig } from '../types';
import { CANVAS_PRESETS } from '../constants';
import { X, Sparkles, Check } from 'lucide-react';

interface NewCanvasModalProps {
  currentConfig: CanvasConfig;
  onCreate: (config: CanvasConfig) => void;
  onClose: () => void;
}

export const NewCanvasModal: React.FC<NewCanvasModalProps> = ({
  currentConfig,
  onCreate,
  onClose,
}) => {
  const [name, setName] = useState(currentConfig.name);
  const [width, setWidth] = useState(currentConfig.width);
  const [height, setHeight] = useState(currentConfig.height);
  const [dpi, setDpi] = useState(currentConfig.dpi);
  const [background, setBackground] = useState<CanvasConfig['background']>(currentConfig.background);
  const [customBgColor, setCustomBgColor] = useState('#1e1e24');

  const selectPreset = (p: typeof CANVAS_PRESETS[0]) => {
    setWidth(p.width);
    setHeight(p.height);
    setDpi(p.dpi);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: name.trim() || 'Untitled Artwork',
      width: Math.min(8192, Math.max(100, width)),
      height: Math.min(8192, Math.max(100, height)),
      dpi,
      background,
      customBgColor,
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none cursor-pointer"
    >
      <div className="bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default">
        {/* Header */}
        <div className="h-11 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-925 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-neutral-100 text-sm">New Canvas Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCreate} className="p-4 flex flex-col gap-4 text-xs text-neutral-300 flex-1 min-h-0 overflow-y-auto">
          {/* Document Name */}
          <div className="flex flex-col gap-1">
            <label className="text-neutral-400 font-medium">Document Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g. Masterpiece 8K Digital Art"
            />
          </div>

          {/* Canvas Size Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 font-medium">Presets (Including 8K & 4K Studio Masters)</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-neutral-950 rounded-lg border border-neutral-800">
              {CANVAS_PRESETS.map((p) => {
                const isMatch = width === p.width && height === p.height;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`text-left p-2 rounded border transition-all flex items-center justify-between ${
                      isMatch
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[11px] text-neutral-200">{p.label}</div>
                      <div className="text-[10px] text-neutral-500">{p.category}</div>
                    </div>
                    {isMatch && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimensions Input */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-neutral-400 font-medium">Width (px)</label>
              <input
                type="number"
                min="100"
                max="8192"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-neutral-400 font-medium">Height (px)</label>
              <input
                type="number"
                min="100"
                max="8192"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-neutral-400 font-medium">Resolution (DPI)</label>
              <select
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="72">72 DPI (Screen)</option>
                <option value="150">150 DPI (High-Res Web)</option>
                <option value="300">300 DPI (Pro Print)</option>
                <option value="600">600 DPI (Ultra Fine)</option>
              </select>
            </div>
          </div>

          {/* Background Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 font-medium">Canvas Background</label>
            <div className="flex items-center gap-2">
              {[
                { id: 'white', label: 'White' },
                { id: 'dark', label: 'Dark (#121214)' },
                { id: 'transparent', label: 'Transparent' },
                { id: 'custom', label: 'Custom' },
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackground(bg.id as any)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    background === bg.id
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  {bg.label}
                </button>
              ))}

              {background === 'custom' && (
                <input
                  type="color"
                  value={customBgColor}
                  onChange={(e) => setCustomBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-700 bg-transparent"
                />
              )}
            </div>
          </div>

          {/* 8K Performance Tip */}
          {width >= 7680 && (
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                8K Ultra HD Canvas active ({width}×{height} = {(width * height / 1000000).toFixed(1)} megapixels). Hardware-accelerated viewport rendering is enabled for ultra-crisp output.
              </span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-950"
            >
              Create Canvas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
