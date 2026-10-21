import React, { useRef, useEffect } from 'react';
import { BrushSettings, BrushPreset } from '../types';
import { BRUSH_PRESET_CONFIGS } from '../constants';
import { BrushRenderer } from '../engine/brushEngine';
import { X, RotateCcw, Sparkles, Trash2, Zap } from 'lucide-react';

interface BrushSettingsModalProps {
  settings: BrushSettings;
  onUpdate: (updates: Partial<BrushSettings>) => void;
  color: string;
  onClose: () => void;
}

export const BrushSettingsModal: React.FC<BrushSettingsModalProps> = ({
  settings,
  onUpdate,
  color,
  onClose,
}) => {
  const scratchpadRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number; pressure: number; time: number } | null>(null);
  const brushRenderer = useRef(new BrushRenderer());

  const clearPad = () => {
    const canvas = scratchpadRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    clearPad();
  }, [settings.preset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = scratchpadRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.65;

    isDrawing.current = true;
    lastPoint.current = { x, y, pressure, time: Date.now() };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      brushRenderer.current.drawStrokeSegment(
        ctx,
        lastPoint.current,
        lastPoint.current,
        settings,
        color
      );
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = scratchpadRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.65;

    const currentPoint = { x, y, pressure, time: Date.now() };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      brushRenderer.current.drawStrokeSegment(
        ctx,
        lastPoint.current,
        currentPoint,
        settings,
        color
      );
    }
    lastPoint.current = currentPoint;
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none cursor-pointer"
    >
      <div className="bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default">
        {/* Header */}
        <div className="h-11 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-925">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-neutral-100 text-sm">Brush Studio Engine</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-neutral-300 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Presets & Dynamics */}
          <div className="flex flex-col gap-3.5">
            {/* Presets Grid */}
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-neutral-200">Brush Preset Model</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(BRUSH_PRESET_CONFIGS) as BrushPreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => onUpdate({ ...BRUSH_PRESET_CONFIGS[p] })}
                    className={`py-1.5 px-2 rounded-lg border text-left font-medium transition-all ${
                      settings.preset === p
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {p.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-neutral-800">
              {/* Size */}
              <div className="flex items-center justify-between">
                <span>Size</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="300"
                    value={settings.size}
                    onChange={(e) => onUpdate({ size: Number(e.target.value) })}
                    className="w-28 accent-cyan-500"
                  />
                  <span className="font-mono w-10 text-right">{settings.size}px</span>
                </div>
              </div>

              {/* Opacity */}
              <div className="flex items-center justify-between">
                <span>Opacity</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={Math.round(settings.opacity * 100)}
                    onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
                    className="w-28 accent-cyan-500"
                  />
                  <span className="font-mono w-10 text-right">
                    {Math.round(settings.opacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Flow */}
              <div className="flex items-center justify-between">
                <span>Flow</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={Math.round(settings.flow * 100)}
                    onChange={(e) => onUpdate({ flow: Number(e.target.value) / 100 })}
                    className="w-28 accent-cyan-500"
                  />
                  <span className="font-mono w-10 text-right">
                    {Math.round(settings.flow * 100)}%
                  </span>
                </div>
              </div>

              {/* Hardness */}
              <div className="flex items-center justify-between">
                <span>Hardness / Edge Falloff</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(settings.hardness * 100)}
                    onChange={(e) => onUpdate({ hardness: Number(e.target.value) / 100 })}
                    className="w-28 accent-cyan-500"
                  />
                  <span className="font-mono w-10 text-right">
                    {Math.round(settings.hardness * 100)}%
                  </span>
                </div>
              </div>

              {/* Streamline / Stabilizer */}
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Line Stabilizer (Streamline)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={Math.round(settings.smoothing * 100)}
                    onChange={(e) => onUpdate({ smoothing: Number(e.target.value) / 100 })}
                    className="w-28 accent-cyan-400"
                  />
                  <span className="font-mono w-10 text-right text-cyan-300">
                    {Math.round(settings.smoothing * 100)}%
                  </span>
                </div>
              </div>

              {/* Glow Intensity */}
              {settings.preset === 'glow-pencil' && (
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Glow Bloom Intensity
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="8"
                      max="60"
                      value={settings.glowIntensity || 28}
                      onChange={(e) => onUpdate({ glowIntensity: Number(e.target.value) })}
                      className="w-28 accent-amber-400"
                    />
                    <span className="font-mono w-10 text-right text-amber-300 font-bold">
                      {settings.glowIntensity || 28}
                    </span>
                  </div>
                </div>
              )}

              {/* Jitter */}
              <div className="flex items-center justify-between">
                <span>Scatter / Texture Jitter</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(settings.jitterSize * 100)}
                    onChange={(e) => onUpdate({ jitterSize: Number(e.target.value) / 100 })}
                    className="w-28 accent-cyan-500"
                  />
                  <span className="font-mono w-10 text-right">
                    {Math.round(settings.jitterSize * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stylus Pressure Dynamics */}
            <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pressureSize}
                  onChange={(e) => onUpdate({ pressureSize: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500"
                />
                <span>Stylus Pressure Size</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pressureOpacity}
                  onChange={(e) => onUpdate({ pressureOpacity: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500"
                />
                <span>Stylus Pressure Opacity</span>
              </label>
            </div>
          </div>

          {/* Right Column: Live Interactive Stroke Scratchpad */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">Interactive Stroke Scratchpad</span>
              <button
                onClick={clearPad}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
              >
                <Trash2 className="w-3 h-3" /> Clear Pad
              </button>
            </div>

            {/* Pad Canvas */}
            <div className="w-full h-64 rounded-xl border border-neutral-750 bg-neutral-950 overflow-hidden relative shadow-inner cursor-crosshair">
              <canvas
                ref={scratchpadRef}
                width={320}
                height={256}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full h-full"
              />
              <div className="absolute bottom-2 left-2 text-[10px] text-neutral-500 pointer-events-none">
                Draw here with mouse or pen tablet to test brush feel
              </div>
            </div>

            <button
              onClick={() => onUpdate({ ...BRUSH_PRESET_CONFIGS[settings.preset] })}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Preset Defaults
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="h-11 px-4 border-t border-neutral-800 bg-neutral-925 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-sm transition-colors text-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
