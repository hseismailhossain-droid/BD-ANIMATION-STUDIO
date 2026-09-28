import React, { useState } from 'react';
import { CanvasConfig } from '../types';
import { CANVAS_PRESETS } from '../constants';
import { X, Sliders, Check, Maximize2, RefreshCw } from 'lucide-react';

interface ResolutionModalProps {
  currentConfig: CanvasConfig;
  onApply: (newWidth: number, newHeight: number, newDpi: number, mode: 'rescale' | 'crop') => void;
  onClose: () => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  currentConfig,
  onApply,
  onClose,
}) => {
  const [width, setWidth] = useState(currentConfig.width);
  const [height, setHeight] = useState(currentConfig.height);
  const [dpi, setDpi] = useState(currentConfig.dpi);
  const [mode, setMode] = useState<'rescale' | 'crop'>('rescale');

  const selectPreset = (p: typeof CANVAS_PRESETS[0]) => {
    setWidth(p.width);
    setHeight(p.height);
    setDpi(p.dpi);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(
      Math.min(8192, Math.max(100, width)),
      Math.min(8192, Math.max(100, height)),
      dpi,
      mode
    );
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150 cursor-pointer"
    >
      <div className="bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 cursor-default">
        {/* Header */}
        <div className="h-11 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-925">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-neutral-100 text-sm">
              Canvas Resolution & Size Studio (HD to 8K)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 text-xs text-neutral-300">
          {/* Quick Switch Presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-400 font-medium flex items-center justify-between">
              <span>Quick Resolution Presets</span>
              <span className="text-neutral-500 font-normal">
                Current: {currentConfig.width} × {currentConfig.height}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1 bg-neutral-950 rounded-lg border border-neutral-800">
              {CANVAS_PRESETS.map((p) => {
                const isMatch = width === p.width && height === p.height;
                const is8K = p.width >= 7680;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`text-left p-2 rounded border transition-all flex items-center justify-between ${
                      isMatch
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-900/40'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[11px] text-neutral-200 flex items-center gap-1.5">
                        <span>{p.label.split('(')[0]}</span>
                        {is8K && (
                          <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            8K
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {p.width} × {p.height} • {p.dpi} DPI
                      </div>
                    </div>
                    {isMatch && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Dimension Inputs */}
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
              <label className="text-neutral-400 font-medium">Print DPI</label>
              <select
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="72">72 DPI (Standard Web)</option>
                <option value="150">150 DPI (Retina Display)</option>
                <option value="300">300 DPI (Pro Print)</option>
                <option value="600">600 DPI (Ultra Fine)</option>
              </select>
            </div>
          </div>

          {/* Rescale vs Crop Mode (Photoshop Canvas Size vs Image Size) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-neutral-400 font-medium">Content Handling Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('rescale')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  mode === 'rescale'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                    : 'bg-neutral-850 border-neutral-800 text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-200 text-xs">Rescale Existing Art</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                    Smoothly resamples and scales all drawings and vectors to fit the new resolution.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('crop')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  mode === 'crop'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                    : 'bg-neutral-850 border-neutral-800 text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <Maximize2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-200 text-xs">Resize Canvas Bounds</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                    Keeps existing pixels at 1:1 scale and expands or trims the canvas borders.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950"
            >
              <Check className="w-3.5 h-3.5" /> Apply Resolution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
