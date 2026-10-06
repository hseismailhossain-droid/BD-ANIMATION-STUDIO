import React, { useState, useRef, useEffect } from 'react';
import { COLOR_PALETTES } from '../constants';
import { Palette, Copy, Check, X } from 'lucide-react';

interface ColorPickerPanelProps {
  color: string;
  onChange: (hex: string, commitRecent?: boolean) => void;
  recentColors: string[];
  onClose?: () => void;
}

export const ColorPickerPanel: React.FC<ColorPickerPanelProps> = ({
  color,
  onChange,
  recentColors,
  onClose,
}) => {
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Parse initial color
  const initialHsv = useRef(hexToHsv(color));
  const [hue, setHue] = useState(initialHsv.current.h);
  const [sat, setSat] = useState(initialHsv.current.s);
  const [val, setVal] = useState(initialHsv.current.v);

  const satValRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const isDraggingSatVal = useRef(false);
  const isDraggingHue = useRef(false);
  const rafId = useRef<number | null>(null);

  // Keep latest HSV in ref for callbacks
  const hsvRef = useRef({ h: hue, s: sat, v: val });
  hsvRef.current = { h: hue, s: sat, v: val };

  // Only sync incoming color if NOT actively interacting/dragging
  useEffect(() => {
    if (!isDraggingSatVal.current && !isDraggingHue.current) {
      const hsv = hexToHsv(color);
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
    }
  }, [color]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const updateFromCoords = (clientX: number, clientY: number, commit = false) => {
    let rect = rectRef.current;
    if (!rect && satValRef.current) {
      rect = satValRef.current.getBoundingClientRect();
      rectRef.current = rect;
    }
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const newSat = Math.round((x / rect.width) * 100);
    const newVal = Math.round((1 - y / rect.height) * 100);

    setSat(newSat);
    setVal(newVal);

    const currentHue = hsvRef.current.h;
    const newHex = hsvToHex(currentHue, newSat, newVal);

    if (commit) {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      onChange(newHex, true);
    } else {
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          onChange(newHex, false);
          rafId.current = null;
        });
      }
    }
  };

  const handleSatValPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (satValRef.current) {
      rectRef.current = satValRef.current.getBoundingClientRect();
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isDraggingSatVal.current = true;
    updateFromCoords(e.clientX, e.clientY, false);
  };

  const handleSatValPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSatVal.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateFromCoords(e.clientX, e.clientY, false);
  };

  const handleSatValPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSatVal.current) {
      isDraggingSatVal.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      updateFromCoords(e.clientX, e.clientY, true);
      rectRef.current = null;
    }
  };

  const handleHuePointerDown = () => {
    isDraggingHue.current = true;
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = Number(e.target.value);
    setHue(newHue);
    const newHex = hsvToHex(newHue, hsvRef.current.s, hsvRef.current.v);

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        onChange(newHex, false);
        rafId.current = null;
      });
    }
  };

  const handleHuePointerUp = () => {
    isDraggingHue.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const finalHex = hsvToHex(hsvRef.current.h, hsvRef.current.s, hsvRef.current.v);
    onChange(finalHex, true);
  };

  const copyHex = () => {
    navigator.clipboard.writeText(color.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="bg-neutral-900 border-l border-neutral-800 p-2.5 flex flex-col gap-2.5 text-xs select-none touch-pan-y"
    >
      <div className="flex items-center justify-between font-semibold text-neutral-300">
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Color Studio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={copyHex}
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-mono bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 cursor-pointer active:scale-95"
            title="Copy Hex Color Code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{color.toUpperCase()}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2D Saturation-Brightness Box with Direct Pointer Capture (Zero Hanging) */}
      <div
        ref={satValRef}
        onPointerDown={handleSatValPointerDown}
        onPointerMove={handleSatValPointerMove}
        onPointerUp={handleSatValPointerUp}
        onPointerCancel={handleSatValPointerUp}
        className="w-full h-32 rounded-lg relative cursor-crosshair overflow-hidden shadow-inner border border-neutral-750 select-none touch-none"
        style={{
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
          backgroundImage: `
            linear-gradient(to right, #ffffff, transparent),
            linear-gradient(to top, #000000, transparent)
          `,
          touchAction: 'none',
        }}
      >
        {/* Reticle / Target Picker circle with high-contrast dual ring */}
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-lg absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/70"
          style={{
            left: `${sat}%`,
            top: `${100 - val}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Rainbow Hue Slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>Hue</span>
          <span className="font-mono text-cyan-300 font-bold">{Math.round(hue)}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onPointerDown={handleHuePointerDown}
          onTouchStart={handleHuePointerDown}
          onChange={handleHueChange}
          onPointerUp={handleHuePointerUp}
          onPointerCancel={handleHuePointerUp}
          onTouchEnd={handleHuePointerUp}
          className="w-full h-2.5 rounded-lg appearance-none cursor-pointer touch-none"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Recent Swatches */}
      {recentColors.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-neutral-400 font-medium">Recent Colors</span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none touch-pan-x">
            {recentColors.map((c, i) => (
              <button
                key={`${c}-${i}`}
                onClick={() => onChange(c, true)}
                className="w-5 h-5 rounded-md border border-neutral-700 shrink-0 hover:scale-110 active:scale-95 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Professional Curated Palettes */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-medium">Palette:</span>
          <select
            value={selectedPaletteIndex}
            onChange={(e) => setSelectedPaletteIndex(Number(e.target.value))}
            className="bg-neutral-800 text-neutral-300 border border-neutral-700 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
          >
            {COLOR_PALETTES.map((p, idx) => (
              <option key={p.name} value={idx}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_PALETTES[selectedPaletteIndex].colors.map((hex, i) => (
            <button
              key={`${hex}-${i}`}
              onClick={() => onChange(hex, true)}
              className="h-5 rounded border border-neutral-750 hover:scale-105 active:scale-95 hover:border-white transition-all shadow-sm"
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper color conversions
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { h: 0, s: 100, v: 100 };
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const i = Math.floor((h / 60) % 6);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;
  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
