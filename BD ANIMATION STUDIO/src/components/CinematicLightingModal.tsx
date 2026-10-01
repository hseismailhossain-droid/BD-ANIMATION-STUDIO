/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Flame,
  Lightbulb,
  CloudRain,
  Snowflake,
  Sparkles,
  Zap,
  Check,
  X,
  Layers,
  Sliders,
  Eye,
  Crosshair,
  Maximize2,
  Compass,
} from 'lucide-react';
import {
  LightingEngine,
  LightingEffectConfig,
  LightingPresetType,
  LIGHTING_PRESETS,
} from '../engine/lightingEngine';
import { CanvasConfig, Layer, AnimationFrame } from '../types';

interface CinematicLightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CanvasConfig;
  currentFrame: AnimationFrame;
  activeLayer: Layer;
  onApplyLighting: (lightingConfig: LightingEffectConfig, startInteractive?: boolean) => void;
}

type TabType = 'all' | 'moon' | 'sun' | 'lights' | 'weather';

export const CinematicLightingModal: React.FC<CinematicLightingModalProps> = ({
  isOpen,
  onClose,
  config,
  currentFrame,
  activeLayer,
  onApplyLighting,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<LightingPresetType>('moon-full');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [effectConfig, setEffectConfig] = useState<LightingEffectConfig>(() => {
    const base = LIGHTING_PRESETS['moon-full'];
    return {
      preset: 'moon-full',
      name: base.name || 'পূর্ণিমার চাঁদ (Full Moon & Halo)',
      sourceX: Math.round(config.width * 0.5),
      sourceY: Math.round(config.height * 0.2),
      radius: base.radius || 1200,
      discRadius: base.discRadius || 90,
      coneAngle: base.coneAngle || 360,
      beamAngle: base.beamAngle || 75,
      intensity: base.intensity || 0.9,
      color: base.color || '#f8fafc',
      secondaryColor: base.secondaryColor || '#38bdf8',
      blendMode: base.blendMode || 'screen',
      volumetricDust: base.volumetricDust ?? false,
      dustDensity: base.dustDensity ?? 0,
      vignette: base.vignette ?? true,
      vignetteStrength: base.vignetteStrength ?? 0.55,
      showStars: base.showStars ?? true,
      moonPhase: base.moonPhase ?? 'full',
      sunType: base.sunType ?? 'blaze',
      lensFlare: base.lensFlare ?? false,
      applyScope: 'new-layer',
    };
  });

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingPreview = useRef(false);

  // When preset button clicked
  const handleSelectPreset = (presetKey: LightingPresetType) => {
    setSelectedPreset(presetKey);
    const template = LIGHTING_PRESETS[presetKey] || {};
    setEffectConfig((prev) => ({
      ...prev,
      ...template,
      preset: presetKey,
      sourceX: prev.sourceX,
      sourceY: prev.sourceY,
      radius: template.radius || prev.radius,
      discRadius: template.discRadius || prev.discRadius,
    }));
  };

  // Quick snap positions
  const handleSnap = (type: 'top-left' | 'top-center' | 'top-right' | 'horizon' | 'center' | 'bottom-left' | 'bottom-right') => {
    switch (type) {
      case 'top-left':
        setEffectConfig((prev) => ({ ...prev, sourceX: Math.round(config.width * 0.18), sourceY: Math.round(config.height * 0.18) }));
        break;
      case 'top-center':
        setEffectConfig((prev) => ({ ...prev, sourceX: Math.round(config.width * 0.5), sourceY: Math.round(config.height * 0.15) }));
        break;
      case 'top-right':
        setEffectConfig((prev) => ({ ...prev, sourceX: Math.round(config.width * 0.82), sourceY: Math.round(config.height * 0.18) }));
        break;
      case 'horizon':
        setEffectConfig((prev) => ({ ...prev, sourceX: Math.round(config.width * 0.5), sourceY: Math.round(config.height * 0.58) }));
        break;
      case 'center':
        setEffectConfig((prev) => ({ ...prev, sourceX: Math.round(config.width * 0.5), sourceY: Math.round(config.height * 0.5) }));
        break;
      case 'bottom-left':
        setEffectConfig((prev) => ({ ...prev, sourceX: Math.round(config.width * 0.2), sourceY: Math.round(config.height * 0.8) }));
        break;
      case 'bottom-right':
        setEffectConfig((prev) => ({ ...prev, sourceX: Math.round(config.width * 0.8), sourceY: Math.round(config.height * 0.8) }));
        break;
    }
  };

  // Draw real-time Preview Canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pw = canvas.width;
    const ph = canvas.height;

    ctx.clearRect(0, 0, pw, ph);

    // 1. Draw base composite artwork background
    const scaleX = pw / config.width;
    const scaleY = ph / config.height;
    const avgScale = (scaleX + scaleY) / 2;

    ctx.save();
    if (config.background === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pw, ph);
    } else if (config.background === 'dark') {
      ctx.fillStyle = '#121214';
      ctx.fillRect(0, 0, pw, ph);
    } else {
      ctx.fillStyle = config.customBgColor || '#18181b';
      ctx.fillRect(0, 0, pw, ph);
    }

    // Draw active layer content in preview
    if (activeLayer.type === 'raster') {
      ctx.drawImage(activeLayer.canvas, 0, 0, pw, ph);
    }
    ctx.restore();

    // 2. Render Scaled Lighting Effect on top
    const scaledConfig: LightingEffectConfig = {
      ...effectConfig,
      sourceX: effectConfig.sourceX * scaleX,
      sourceY: effectConfig.sourceY * scaleY,
      radius: effectConfig.radius * avgScale,
      discRadius: (effectConfig.discRadius || 90) * avgScale,
    };

    LightingEngine.renderEffect(ctx, pw, ph, scaledConfig);

    // 3. Draw crosshair target at light source center
    ctx.save();
    const sx = scaledConfig.sourceX;
    const sy = scaledConfig.sourceY;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [effectConfig, activeLayer, config.width, config.height, config.background, config.customBgColor]);

  if (!isOpen) return null;

  const presetsList: { id: LightingPresetType; category: TabType; label: string; sub: string; icon: any; color: string }[] = [
    // Moon
    { id: 'moon-full', category: 'moon', label: 'পূর্ণিমার চাঁদ (Full Moon)', sub: 'Moon Craters & Atmospheric Halo', icon: Moon, color: 'text-sky-300' },
    { id: 'moon-crescent', category: 'moon', label: 'কাস্তে চাঁদ / অর্ধচন্দ্র (Crescent)', sub: 'Curved Arc & Ghost Earthshine', icon: Moon, color: 'text-cyan-300' },
    { id: 'moon-blood', category: 'moon', label: 'রক্তিম চাঁদ / গ্রহণ (Blood Moon)', sub: 'Crimson Eclipse & Fiery Rim', icon: Moon, color: 'text-red-400' },
    { id: 'night-moon', category: 'moon', label: 'রাতের চাঁদের আলো (Moonlight)', sub: 'Cinematic Blue Night Glow', icon: Moon, color: 'text-indigo-300' },

    // Sun
    { id: 'sun-blaze', category: 'sun', label: 'প্রখর সূর্য ও লেন্স ফ্লেয়ার', sub: 'Solar Corona & Anamorphic Flare', icon: Sun, color: 'text-amber-400' },
    { id: 'sun-sunset', category: 'sun', label: 'অস্তগামী লাল সূর্য (Sunset)', sub: 'Horizon Sun Disc & Twilight Rays', icon: Sun, color: 'text-orange-500' },
    { id: 'sun-eclipse', category: 'sun', label: 'সূর্যগ্রহণ ও ডায়মন্ড রিং (Eclipse)', sub: 'Diamond Ring Sparkle & Dark Disc', icon: Sun, color: 'text-yellow-300' },
    { id: 'day-bright', category: 'sun', label: 'দিনের আলো (Bright Sunlight)', sub: 'Crepuscular Daylight God Rays', icon: Sun, color: 'text-amber-300' },
    { id: 'day-golden', category: 'sun', label: 'সোনালী গোধূলি (Golden Hour)', sub: 'Warm Golden Horizon Cast', icon: Sun, color: 'text-amber-500' },

    // Lights
    { id: 'mobile-screen', category: 'lights', label: 'মোবাইলের স্ক্রিন লাইট', sub: 'Smartphone Face Illumination', icon: Smartphone, color: 'text-cyan-400' },
    { id: 'computer-monitor', category: 'lights', label: 'কম্পিউটার মনিটর লাইট', sub: 'Desktop / Laptop Display Cast', icon: Monitor, color: 'text-blue-400' },
    { id: 'lamppost', category: 'lights', label: 'ল্যাম্পপোস্ট লাইট (Street Lamp)', sub: 'Volumetric Downward Cone', icon: Lightbulb, color: 'text-yellow-400' },
    { id: 'torch-fire', category: 'lights', label: 'মশাল / আগুনের আলো (Fire)', sub: 'Flickering Flame & Floating Embers', icon: Flame, color: 'text-red-500' },
    { id: 'studio-spotlight', category: 'lights', label: 'স্টুডিও স্পটলাইট (Spotlight)', sub: 'Theatrical Stage Light Beam', icon: Zap, color: 'text-emerald-400' },

    // Weather / Night
    { id: 'night-midnight', category: 'weather', label: 'গভীর রাত ও তারা (Stars)', sub: 'Starry Sky & Stardust Ambient', icon: Sparkles, color: 'text-indigo-400' },
    { id: 'rain-ambient', category: 'weather', label: 'বৃষ্টির আবহ (Rain Mist)', sub: 'Moody Rain Streaks & Wet Cast', icon: CloudRain, color: 'text-blue-300' },
    { id: 'snow-ambient', category: 'weather', label: 'তুষারপাত (Snow Fall)', sub: 'Winter Atmosphere & Soft Flakes', icon: Snowflake, color: 'text-teal-200' },
  ];

  const filteredPresets =
    activeTab === 'all'
      ? presetsList
      : presetsList.filter((p) => p.category === activeTab);

  const handleUpdatePositionFromPreview = (clientX: number, clientY: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(canvas.width, clientX - rect.left));
    const clickY = Math.max(0, Math.min(canvas.height, clientY - rect.top));

    const scaleX = config.width / canvas.width;
    const scaleY = config.height / canvas.height;

    setEffectConfig((prev) => ({
      ...prev,
      sourceX: Math.round(clickX * scaleX),
      sourceY: Math.round(clickY * scaleY),
    }));
  };

  const isMoon =
    effectConfig.preset === 'moon-full' ||
    effectConfig.preset === 'moon-crescent' ||
    effectConfig.preset === 'moon-blood' ||
    effectConfig.preset === 'night-moon';

  const isSun =
    effectConfig.preset === 'sun-blaze' ||
    effectConfig.preset === 'sun-sunset' ||
    effectConfig.preset === 'sun-eclipse' ||
    effectConfig.preset === 'day-bright' ||
    effectConfig.preset === 'day-golden';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none cursor-pointer"
    >
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                সিনেম্যাটিক লাইটিং ও এনভায়রনমেন্ট স্টুডিও (Lighting & VFX Studio)
              </h2>
              <p className="text-xs text-neutral-400">
                চাঁদের আলো, সূর্যের আলো ও লেন্স ফ্লেয়ার, মোবাইল ও মনিটর লাইট, ল্যাম্পপোস্ট এবং আবহাওয়া ইফেক্ট
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {/* Left Column: Preset Categories & Selection */}
          <div className="md:col-span-5 p-3 flex flex-col gap-2 overflow-y-auto max-h-[72vh]">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-neutral-800">
              {[
                { id: 'all', label: 'সব ইফেক্ট' },
                { id: 'moon', label: '🌙 চাঁদ' },
                { id: 'sun', label: '☀️ সূর্য' },
                { id: 'lights', label: '💡 বাতি' },
                { id: 'weather', label: '🌧️ পরিবেশ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-black font-semibold'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-neutral-950 border border-neutral-800 shrink-0 ${preset.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-neutral-200 truncate">
                          {preset.label}
                        </span>
                        {isSelected && <span className="text-[10px] text-amber-400 font-mono">সক্রিয়</span>}
                      </div>
                      <span className="text-[11px] text-neutral-400 line-clamp-1 block">
                        {preset.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Placement & Parameter Controls */}
          <div className="md:col-span-7 p-4 flex flex-col gap-3 overflow-y-auto max-h-[72vh]">
            {/* Live Interactive Preview Canvas */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  ইন্টারেক্টিভ ক্যানভাস প্রিভিউ (ক্লিক বা ড্র্যাগ করে আলো বসান)
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  X: {Math.round(effectConfig.sourceX)}, Y: {Math.round(effectConfig.sourceY)}
                </span>
              </div>

              {/* Quick Snap Positions */}
              <div className="flex items-center gap-1 flex-wrap bg-neutral-950/70 p-1.5 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 px-1 font-medium">সুবিধাজনক অবস্থান:</span>
                <button
                  type="button"
                  onClick={() => handleSnap('top-left')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-850 hover:bg-neutral-700 text-neutral-300 text-[11px]"
                >
                  ↖ বাম-উপরে
                </button>
                <button
                  type="button"
                  onClick={() => handleSnap('top-center')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-850 hover:bg-neutral-700 text-neutral-300 text-[11px]"
                >
                  ⬆ মাঝে-উপরে
                </button>
                <button
                  type="button"
                  onClick={() => handleSnap('top-right')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-850 hover:bg-neutral-700 text-neutral-300 text-[11px]"
                >
                  ↗ ডান-উপরে
                </button>
                <button
                  type="button"
                  onClick={() => handleSnap('horizon')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-850 hover:bg-neutral-700 text-amber-300 text-[11px]"
                >
                  🌅 দিগন্ত রেখা
                </button>
                <button
                  type="button"
                  onClick={() => handleSnap('center')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-850 hover:bg-neutral-700 text-neutral-300 text-[11px]"
                >
                  🎯 কেন্দ্রে
                </button>
              </div>

              {/* Canvas viewport */}
              <div className="relative bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center aspect-video cursor-crosshair">
                <canvas
                  ref={previewCanvasRef}
                  width={420}
                  height={236}
                  onMouseDown={(e) => {
                    isDraggingPreview.current = true;
                    handleUpdatePositionFromPreview(e.clientX, e.clientY);
                  }}
                  onMouseMove={(e) => {
                    if (isDraggingPreview.current) {
                      handleUpdatePositionFromPreview(e.clientX, e.clientY);
                    }
                  }}
                  onMouseUp={() => {
                    isDraggingPreview.current = false;
                  }}
                  onMouseLeave={() => {
                    isDraggingPreview.current = false;
                  }}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 pointer-events-none bg-neutral-900/80 px-2 py-0.5 rounded text-[10px] text-cyan-300 backdrop-blur-sm">
                  🖱️ ক্লিক বা ড্র্যাগ করে আলো/চাঁদ/সূর্য যেকোনো সুবিধাজনক জায়গায় বসান
                </div>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 flex flex-col gap-3">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                আলো ও বস্তুর প্যারামিটার (Light & Celestial Controls)
              </span>

              {/* Light Reach & Intensity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>আলোর ব্যাপ্তি (Reach / Radius)</span>
                    <span className="font-mono text-neutral-300">{effectConfig.radius}px</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="2500"
                    step="50"
                    value={effectConfig.radius}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, radius: parseInt(e.target.value) }))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>আলোর তীব্রতা (Intensity)</span>
                    <span className="font-mono text-neutral-300">{Math.round(effectConfig.intensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={effectConfig.intensity}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, intensity: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Celestial Specific Controls (Moon & Sun) */}
              {(isMoon || isSun) && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-800/60">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>{isMoon ? 'চাঁদের গোলকের আকার' : 'সূর্যের গোলকের আকার'}</span>
                      <span className="font-mono text-neutral-300">{effectConfig.discRadius || 90}px</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="250"
                      step="5"
                      value={effectConfig.discRadius || 90}
                      onChange={(e) => setEffectConfig((prev) => ({ ...prev, discRadius: parseInt(e.target.value) }))}
                      className="w-full accent-indigo-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {isMoon && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">চাঁদের রূপ (Phase)</span>
                      <select
                        value={effectConfig.moonPhase || 'full'}
                        onChange={(e) => setEffectConfig((prev) => ({ ...prev, moonPhase: e.target.value as any }))}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-200"
                      >
                        <option value="full">🌕 পূর্ণিমার চাঁদ (Full Moon & Craters)</option>
                        <option value="crescent">🌙 কাস্তে চাঁদ / বাঁকা চাঁদ (Crescent)</option>
                        <option value="blood">🌑 রক্তিম চাঁদ / গ্রহণ (Blood Moon)</option>
                      </select>
                    </div>
                  )}

                  {isSun && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400">সূর্যের ধরণ (Type)</span>
                      <select
                        value={effectConfig.sunType || 'blaze'}
                        onChange={(e) => setEffectConfig((prev) => ({ ...prev, sunType: e.target.value as any }))}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-200"
                      >
                        <option value="blaze">☀️ প্রখর সূর্য ও রোদ (Blaze)</option>
                        <option value="sunset">🌇 দিগন্তের লাল সূর্য (Sunset)</option>
                        <option value="eclipse">💍 সূর্যগ্রহণ ও ডায়মন্ড রিং (Eclipse)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Direction & Cone Angle */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>আলোর দিক / কোণ (Direction)</span>
                    <span className="font-mono text-neutral-300">{effectConfig.beamAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={effectConfig.beamAngle}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, beamAngle: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>ছড়ানোর ব্যাপ্তি (Cone Angle)</span>
                    <span className="font-mono text-neutral-300">{effectConfig.coneAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="360"
                    step="5"
                    value={effectConfig.coneAngle}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, coneAngle: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Color & Secondary Glow Color */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-400">মূল আলোর রঙ (Primary Color)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={effectConfig.color}
                      onChange={(e) => setEffectConfig((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={effectConfig.color}
                      onChange={(e) => setEffectConfig((prev) => ({ ...prev, color: e.target.value }))}
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-mono text-neutral-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-400">আভা / সেকেন্ডারি রঙ (Secondary Halo)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={effectConfig.secondaryColor || effectConfig.color}
                      onChange={(e) => setEffectConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={effectConfig.secondaryColor || effectConfig.color}
                      onChange={(e) => setEffectConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-mono text-neutral-200"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles: Stars, Lens Flare, Volumetric Dust, Vignette */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={effectConfig.showStars ?? false}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, showStars: e.target.checked }))}
                    className="rounded accent-sky-400"
                  />
                  <span>আকাশের তারা (Starry Sky)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={effectConfig.lensFlare ?? false}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, lensFlare: e.target.checked }))}
                    className="rounded accent-amber-400"
                  />
                  <span>সিনেমাটিক লেন্স ফ্লেয়ার (Lens Flare)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={effectConfig.volumetricDust}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, volumetricDust: e.target.checked }))}
                    className="rounded accent-amber-500"
                  />
                  <span>ধূলিকণা ও আলোর কণা (Motes)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={effectConfig.vignette}
                    onChange={(e) => setEffectConfig((prev) => ({ ...prev, vignette: e.target.checked }))}
                    className="rounded accent-amber-500"
                  />
                  <span>গাঢ় আবহাওয়া (Dark Vignette)</span>
                </label>
              </div>
            </div>

            {/* Scope Selection: New Layer / Current Layer / All Animation Frames */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                কোথায় প্রয়োগ করবেন? (Application Target)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEffectConfig((prev) => ({ ...prev, applyScope: 'new-layer' }))}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs text-center transition ${
                    effectConfig.applyScope === 'new-layer'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-medium'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white'
                  }`}
                >
                  নতুন লাইটিং লেয়ার
                </button>
                <button
                  type="button"
                  onClick={() => setEffectConfig((prev) => ({ ...prev, applyScope: 'current-layer' }))}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs text-center transition ${
                    effectConfig.applyScope === 'current-layer'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-medium'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white'
                  }`}
                >
                  বর্তমান লেয়ারে
                </button>
                <button
                  type="button"
                  onClick={() => setEffectConfig((prev) => ({ ...prev, applyScope: 'all-frames' }))}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs text-center transition ${
                    effectConfig.applyScope === 'all-frames'
                      ? 'bg-amber-600/30 border-amber-500 text-white font-medium'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white'
                  }`}
                >
                  সবগুলো ফ্রেমে (Scene FX)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800 bg-neutral-950/80">
          <div className="text-xs text-neutral-400">
            নির্বাচিত ইফেক্ট: <span className="text-amber-400 font-semibold">{effectConfig.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition"
            >
              বাতিল
            </button>
            <button
              onClick={() => {
                onApplyLighting(effectConfig, true);
                onClose();
              }}
              title="ক্যানভাসে সরাসরি ড্র্যাগ করে সুবিধাজনক জায়গায় বসান"
              className="px-4 py-1.5 text-xs font-bold text-cyan-200 bg-cyan-900/60 hover:bg-cyan-800/80 border border-cyan-500/50 rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              ক্যানভাসে লাইভ বসান (Live Move)
            </button>
            <button
              onClick={() => {
                onApplyLighting(effectConfig, false);
                onClose();
              }}
              className="px-5 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              প্রয়োগ করুন (Apply)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
