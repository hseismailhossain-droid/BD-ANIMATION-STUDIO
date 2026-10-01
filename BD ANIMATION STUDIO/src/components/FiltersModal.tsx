import React, { useState, useRef, useEffect } from 'react';
import { Layer } from '../types';
import { FilterOptions, applyFiltersToCanvas } from '../engine/filters';
import { X, Sliders, RotateCcw, Check } from 'lucide-react';

interface FiltersModalProps {
  activeLayer: Layer;
  onApply: (filteredCanvas: HTMLCanvasElement) => void;
  onClose: () => void;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  activeLayer,
  onApply,
  onClose,
}) => {
  const [options, setOptions] = useState<FilterOptions>({
    brightness: 0,
    contrast: 0,
    hue: 0,
    saturation: 0,
    blur: 0,
    invert: false,
    grayscale: false,
    threshold: 0,
  });

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize and update preview
  useEffect(() => {
    if (!resultCanvasRef.current) {
      resultCanvasRef.current = document.createElement('canvas');
    }
    const resCanvas = resultCanvasRef.current;
    applyFiltersToCanvas(resCanvas, activeLayer.canvas, options);

    // Draw downscaled to preview canvas
    const prevCanvas = previewCanvasRef.current;
    if (prevCanvas) {
      const pCtx = prevCanvas.getContext('2d');
      if (pCtx) {
        pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
        // Fit aspect ratio
        const scale = Math.min(
          prevCanvas.width / resCanvas.width,
          prevCanvas.height / resCanvas.height
        );
        const dw = resCanvas.width * scale;
        const dh = resCanvas.height * scale;
        const dx = (prevCanvas.width - dw) / 2;
        const dy = (prevCanvas.height - dh) / 2;
        pCtx.drawImage(resCanvas, dx, dy, dw, dh);
      }
    }
  }, [options, activeLayer.canvas]);

  const handleApply = () => {
    if (resultCanvasRef.current) {
      onApply(resultCanvasRef.current);
    }
    onClose();
  };

  const resetAll = () => {
    setOptions({
      brightness: 0,
      contrast: 0,
      hue: 0,
      saturation: 0,
      blur: 0,
      invert: false,
      grayscale: false,
      threshold: 0,
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none cursor-pointer"
    >
      <div className="bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default">
        {/* Header */}
        <div className="h-11 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-925">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-neutral-100 text-sm">
              Filters & Adjustments ({activeLayer.name})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
          {/* Controls */}
          <div className="flex flex-col gap-3">
            {/* Brightness */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Brightness</span>
                <span className="font-mono text-neutral-400">{options.brightness}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={options.brightness}
                onChange={(e) => setOptions({ ...options, brightness: Number(e.target.value) })}
                className="accent-cyan-500"
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Contrast</span>
                <span className="font-mono text-neutral-400">{options.contrast}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={options.contrast}
                onChange={(e) => setOptions({ ...options, contrast: Number(e.target.value) })}
                className="accent-cyan-500"
              />
            </div>

            {/* Hue */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Hue Rotation</span>
                <span className="font-mono text-neutral-400">{options.hue}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={options.hue}
                onChange={(e) => setOptions({ ...options, hue: Number(e.target.value) })}
                className="accent-cyan-500"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Saturation</span>
                <span className="font-mono text-neutral-400">{options.saturation}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={options.saturation}
                onChange={(e) => setOptions({ ...options, saturation: Number(e.target.value) })}
                className="accent-cyan-500"
              />
            </div>

            {/* Gaussian Blur */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Gaussian Blur</span>
                <span className="font-mono text-neutral-400">{options.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={options.blur || 0}
                onChange={(e) => setOptions({ ...options, blur: Number(e.target.value) })}
                className="accent-cyan-500"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.invert}
                  onChange={(e) => setOptions({ ...options, invert: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500"
                />
                <span>Invert</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.grayscale}
                  onChange={(e) => setOptions({ ...options, grayscale: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-cyan-500"
                />
                <span>Grayscale</span>
              </label>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-neutral-200">Live Preview</span>
            <div className="w-full h-56 rounded-xl border border-neutral-750 bg-neutral-950 overflow-hidden flex items-center justify-center transparency-grid-dark shadow-inner">
              <canvas ref={previewCanvasRef} width={280} height={220} className="max-w-full max-h-full" />
            </div>
            <button
              onClick={resetAll}
              className="flex items-center justify-center gap-1 py-1.5 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="h-11 px-4 border-t border-neutral-800 bg-neutral-925 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 shadow-md shadow-cyan-950"
          >
            <Check className="w-3.5 h-3.5" /> Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};
