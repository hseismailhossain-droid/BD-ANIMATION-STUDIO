/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Check,
  X,
  Sliders,
  Maximize2,
  Compass,
  Eye,
  Camera,
  Flame,
  Smartphone,
  Lightbulb,
} from 'lucide-react';
import { LightingEffectConfig, LightingPresetType, LIGHTING_PRESETS } from '../engine/lightingEngine';

export interface LightingGizmoState {
  isActive: boolean;
  layerId: string;
  config: LightingEffectConfig;
  activeDragHandle?: 'center' | 'radius' | 'direction' | null;
}

interface LightingGizmoBarProps {
  state: LightingGizmoState;
  canvasWidth: number;
  canvasHeight: number;
  onUpdateConfig: (updates: Partial<LightingEffectConfig>) => void;
  onApply: () => void;
  onCancel: () => void;
  onOpenFullStudio: () => void;
}

export const LightingGizmoBar: React.FC<LightingGizmoBarProps> = ({
  state,
  canvasWidth,
  canvasHeight,
  onUpdateConfig,
  onApply,
  onCancel,
  onOpenFullStudio,
}) => {
  const { config } = state;

  const isMoon =
    config.preset === 'moon-full' ||
    config.preset === 'moon-crescent' ||
    config.preset === 'moon-blood' ||
    config.preset === 'night-moon';

  const isSun =
    config.preset === 'sun-blaze' ||
    config.preset === 'sun-sunset' ||
    config.preset === 'sun-eclipse' ||
    config.preset === 'day-bright' ||
    config.preset === 'day-golden';

  // Quick snap positions
  const handleSnap = (type: 'top-left' | 'top-center' | 'top-right' | 'horizon' | 'center' | 'bottom-left' | 'bottom-right') => {
    switch (type) {
      case 'top-left':
        onUpdateConfig({ sourceX: Math.round(canvasWidth * 0.15), sourceY: Math.round(canvasHeight * 0.15) });
        break;
      case 'top-center':
        onUpdateConfig({ sourceX: Math.round(canvasWidth * 0.5), sourceY: Math.round(canvasHeight * 0.12) });
        break;
      case 'top-right':
        onUpdateConfig({ sourceX: Math.round(canvasWidth * 0.85), sourceY: Math.round(canvasHeight * 0.15) });
        break;
      case 'horizon':
        onUpdateConfig({ sourceX: Math.round(canvasWidth * 0.5), sourceY: Math.round(canvasHeight * 0.58) });
        break;
      case 'center':
        onUpdateConfig({ sourceX: Math.round(canvasWidth * 0.5), sourceY: Math.round(canvasHeight * 0.5) });
        break;
      case 'bottom-left':
        onUpdateConfig({ sourceX: Math.round(canvasWidth * 0.2), sourceY: Math.round(canvasHeight * 0.85) });
        break;
      case 'bottom-right':
        onUpdateConfig({ sourceX: Math.round(canvasWidth * 0.8), sourceY: Math.round(canvasHeight * 0.85) });
        break;
    }
  };

  const handlePresetChange = (preset: LightingPresetType) => {
    const template = LIGHTING_PRESETS[preset] || {};
    onUpdateConfig({
      ...template,
      preset,
      sourceX: config.sourceX,
      sourceY: config.sourceY,
      radius: template.radius || config.radius,
      discRadius: template.discRadius || config.discRadius,
    });
  };

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 shadow-2xl rounded-2xl px-4 py-2 flex flex-wrap items-center gap-3 text-xs text-neutral-200 animate-in fade-in slide-in-from-top-3 duration-150 max-w-[96vw]">
      {/* Title & Icon */}
      <div className="flex items-center gap-2 pr-2 border-r border-neutral-750">
        <div className={`p-1.5 rounded-lg ${isMoon ? 'bg-sky-500/20 text-sky-300' : isSun ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-300'}`}>
          {isMoon ? <Moon className="w-4 h-4" /> : isSun ? <Sun className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
        <div>
          <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
            {isMoon ? 'চাঁদের ইফেক্ট (Moon)' : isSun ? 'সূর্যের ইফেক্ট (Sun)' : 'লাইটিং ইফেক্ট (Light FX)'}
          </span>
          <span className="text-[10px] text-cyan-400 block font-mono">
            ক্যানভাসে সরাসরি ড্র্যাগ করে সুবিধাজনক জায়গায় বসান
          </span>
        </div>
      </div>

      {/* Quick Snap Positions */}
      <div className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-xl border border-neutral-700/50">
        <span className="text-[10px] text-neutral-400 px-1 font-medium">পজিশন:</span>
        <button
          onClick={() => handleSnap('top-left')}
          title="বাম-উপরে (Top Left)"
          className="px-1.5 py-0.5 rounded hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px]"
        >
          ↖ বাম-উপরে
        </button>
        <button
          onClick={() => handleSnap('top-center')}
          title="মাঝে-উপরে (Top Center)"
          className="px-1.5 py-0.5 rounded hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px]"
        >
          ⬆ মাঝে
        </button>
        <button
          onClick={() => handleSnap('top-right')}
          title="ডান-উপরে (Top Right)"
          className="px-1.5 py-0.5 rounded hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px]"
        >
          ↗ ডান-উপরে
        </button>
        <button
          onClick={() => handleSnap('horizon')}
          title="দিগন্ত রেখা (Horizon)"
          className="px-1.5 py-0.5 rounded hover:bg-neutral-700 text-amber-300 hover:text-amber-200 text-[11px]"
        >
          🌅 দিগন্ত
        </button>
        <button
          onClick={() => handleSnap('center')}
          title="কেন্দ্র (Center)"
          className="px-1.5 py-0.5 rounded hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px]"
        >
          🎯 কেন্দ্র
        </button>
      </div>

      {/* Numeric Coordinates */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-neutral-400">X:</span>
        <input
          type="number"
          value={Math.round(config.sourceX)}
          onChange={(e) => onUpdateConfig({ sourceX: Number(e.target.value) || 0 })}
          className="w-14 bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-center text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <span className="text-neutral-400">Y:</span>
        <input
          type="number"
          value={Math.round(config.sourceY)}
          onChange={(e) => onUpdateConfig({ sourceY: Number(e.target.value) || 0 })}
          className="w-14 bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-center text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
        />
      </div>

      {/* Preset Switcher */}
      <select
        value={config.preset}
        onChange={(e) => handlePresetChange(e.target.value as LightingPresetType)}
        className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-500 font-medium"
      >
        <optgroup label="চাঁদের ইফেক্ট (Moon)">
          <option value="moon-full">🌕 পূর্ণিমার চাঁদ (Full Moon)</option>
          <option value="moon-crescent">🌙 কাস্তে চাঁদ (Crescent Moon)</option>
          <option value="moon-blood">🌑 রক্তিম চাঁদ / গ্রহণ (Blood Moon)</option>
          <option value="night-moon">🌌 চাঁদের আলো ও মেঘ (Moonlight)</option>
        </optgroup>
        <optgroup label="সূর্যের ইফেক্ট (Sun)">
          <option value="sun-blaze">☀️ প্রখর সূর্য ও লেন্স ফ্লেয়ার (Blazing Sun)</option>
          <option value="sun-sunset">🌇 অস্তগামী লাল সূর্য (Sunset Sun)</option>
          <option value="sun-eclipse">💍 সূর্যগ্রহণ ও ডায়মন্ড রিং (Solar Eclipse)</option>
          <option value="day-bright">🌤️ দিনের উজ্জ্বল আলো (Daylight)</option>
          <option value="day-golden">🌅 সোনালী গোধূলি (Golden Hour)</option>
        </optgroup>
        <optgroup label="ডিভাইস ও আলো (Lights)">
          <option value="mobile-screen">📱 মোবাইল স্ক্রিনের আলো (Mobile Screen)</option>
          <option value="computer-monitor">💻 কম্পিউটার মনিটর লাইট (PC Monitor)</option>
          <option value="lamppost">🏮 ল্যাম্পপোস্ট লাইট (Street Lamppost)</option>
          <option value="torch-fire">🔥 মশাল / আগুনের আলো (Torch Fire)</option>
          <option value="studio-spotlight">🔦 স্টুডিও স্পটলাইট (Spotlight)</option>
        </optgroup>
      </select>

      {/* Quick Sliders: Size & Intensity */}
      <div className="flex items-center gap-2 bg-neutral-800/80 px-2 py-1 rounded-xl border border-neutral-700/50">
        <span className="text-[10px] text-neutral-400">উজ্জ্বলতা:</span>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.05"
          value={config.intensity}
          onChange={(e) => onUpdateConfig({ intensity: Number(e.target.value) })}
          className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <span className="font-mono text-[10px] text-amber-300 w-7">
          {Math.round(config.intensity * 100)}%
        </span>

        <span className="text-[10px] text-neutral-400 pl-1 border-l border-neutral-700">আকার:</span>
        <input
          type="range"
          min="200"
          max="2500"
          step="50"
          value={config.radius}
          onChange={(e) => onUpdateConfig({ radius: Number(e.target.value) })}
          className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        {(isMoon || isSun) && (
          <>
            <span className="text-[10px] text-neutral-400 pl-1 border-l border-neutral-700">গোলক:</span>
            <input
              type="range"
              min="30"
              max="250"
              step="5"
              value={config.discRadius || 90}
              onChange={(e) => onUpdateConfig({ discRadius: Number(e.target.value) })}
              className="w-14 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-750">
        <button
          onClick={onOpenFullStudio}
          title="সম্পূর্ণ ইফেক্ট স্টুডিও খুলুন"
          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1 transition"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">স্টুডিও</span>
        </button>

        <button
          onClick={onApply}
          title="লেয়ারে ফিক্স করুন (Done / Bake)"
          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition shadow-lg shadow-emerald-950/40"
        >
          <Check className="w-3.5 h-3.5" />
          <span>ফিক্স করুন</span>
        </button>

        <button
          onClick={onCancel}
          title="বন্ধ / বাতিল করুন (Esc)"
          className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-200 font-medium flex items-center gap-1 transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>বন্ধ করুন</span>
        </button>
      </div>
    </div>
  );
};
