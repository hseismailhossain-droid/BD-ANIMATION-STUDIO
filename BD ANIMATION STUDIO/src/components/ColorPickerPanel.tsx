import React, { useState, useRef, useEffect } from 'react';
import { COLOR_PALETTES } from '../constants';
import { Palette, Copy, Check } from 'lucide-react';

interface ColorPickerPanelProps {
  color: string;
  onChange: (hex: string) => void;
  recentColors: string[];
}

export const ColorPickerPanel: React.FC<ColorPickerPanelProps> = ({
  color,
  onChange,
  recentColors,
}) => {
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(100);
  const [val, setVal] = useState(100);

  const satValRef = useRef<HTMLDivElement>(null);

  // Sync HSV from incoming hex color
  useEffect(() => {
    const hsv = hexToHsv(color);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
  }, [color]);

  const handleSatValPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!satValRef.current) return;
    const rect = satValRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const newSat = Math.round((x / rect.width) * 100);
    const newVal = Math.round((1 - y / rect.height) * 100);

    setSat(newSat);
    setVal(newVal);

    const newHex = hsvToHex(hue, newSat, newVal);
    onChange(newHex);
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = Number(e.target.value);
    setHue(newHue);
    const newHex = hsvToHex(newHue, sat, val);
    onChange(newHex);
  };

  const copyHex = () => {
    navigator.clipboard.writeText(color.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-neutral-900 border-l border-neutral-800 p-2.5 flex flex-col gap-2.5 text-xs select-none">
      <div className="flex items-center justify-between font-semibold text-neutral-300">
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Color Studio</span>
        </div>
        <button
          onClick={copyHex}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-mono bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{color.toUpperCase()}</span>
        </button>
      </div>

      {/* 2D Saturation-Brightness Box */}
      <div
        ref={satValRef}
        onPointerDown={(e) => {
          handleSatValPointer(e);
          const handleMove = (me: PointerEvent) => handleSatValPointer(me as any);
          const handleUp = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
          };
          window.addEventListener('pointermove', handleMove);
          window.addEventListener('pointerup', handleUp);
        }}
        className="w-full h-32 rounded-lg relative cursor-crosshair overflow-hidden shadow-inner border border-neutral-750"
        style={{
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
          backgroundImage: `
            linear-gradient(to right, #ffffff, transparent),
            linear-gradient(to top, #000000, transparent)
          `,
        }}
      >
        {/* Reticle / Target Picker circle */}
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/40"
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
          <span className="font-mono text-neutral-300">{Math.round(hue)}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={handleHueChange}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }}
        />
      </div>

      {/* Recent Swatches */}
      {recentColors.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-neutral-400 font-medium">Recent Colors</span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {recentColors.map((c, i) => (
              <button
                key={`${c}-${i}`}
                onClick={() => onChange(c)}
                className="w-5 h-5 rounded-md border border-neutral-700 shrink-0 hover:scale-110 transition-transform"
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
              onClick={() => onChange(hex)}
              className="h-5 rounded border border-neutral-750 hover:scale-105 hover:border-white transition-all shadow-sm"
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
