import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Maximize2,
  Move,
  RotateCw,
  Sliders,
  Layers,
  Check,
  Film,
  Camera,
  Compass,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Repeat,
  Zap,
} from 'lucide-react';
import { Layer, AnimationFrame, TweenConfig, TweenMode } from '../types';

interface TweenModalProps {
  layers: Layer[];
  activeLayerId: string;
  frames: AnimationFrame[];
  currentFrameIndex: number;
  canvasWidth?: number;
  canvasHeight?: number;
  onApplyTween: (config: TweenConfig) => void;
  onClose: () => void;
}

export const TweenModal: React.FC<TweenModalProps> = ({
  layers,
  activeLayerId,
  frames,
  currentFrameIndex,
  canvasWidth = 1920,
  canvasHeight = 1080,
  onApplyTween,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TweenMode>('camera-zoom');

  // Frame Range (কতো থেকে কতো নাম্বার ফ্রেমে যাবে)
  const [startFrame, setStartFrame] = useState(Math.max(1, currentFrameIndex + 1));
  const [endFrame, setEndFrame] = useState(Math.max(startFrame + 1, Math.min(startFrame + 11, Math.max(12, frames.length))));

  // Target Layer: 'all' for full scene camera zoom, or specific layer
  const [selectedLayerId, setSelectedLayerId] = useState(activeLayerId || layers[0]?.id || 'all');
  const [cameraScope, setCameraScope] = useState<'all' | 'single'>('all');

  // Scale / Zoom (জুম ইন ও জুম আউট)
  const [startScale, setStartScale] = useState(100);
  const [endScale, setEndScale] = useState(180);

  // Position offset (ক্যামেরা প্যান / পজিশন শিফট)
  const [moveX, setMoveX] = useState(0);
  const [moveY, setMoveY] = useState(0);

  // Rotation (ঘূর্ণন)
  const [rotateDeg, setRotateDeg] = useState(0);

  // Easing curve
  const [easing, setEasing] = useState<'linear' | 'easeIn' | 'easeOut' | 'easeInOut'>('easeInOut');

  // Background Runner State
  // Auto-detect a background layer if one exists with 'bg' or 'background' in name, or default to bottom layer
  const defaultBgLayer = layers.find((l) => /bg|back|scene|road|sky|floor/i.test(l.name)) || layers[0];
  const [bgLayerId, setBgLayerId] = useState<string>(defaultBgLayer?.id || layers[0]?.id || '');
  const [bgDirection, setBgDirection] = useState<'left' | 'right' | 'up' | 'down'>('left');
  const [bgSpeedPixels, setBgSpeedPixels] = useState<number>(Math.round(canvasWidth * 0.6));
  const [bgSeamlessLoop, setBgSeamlessLoop] = useState<boolean>(true);

  const frameCount = Math.max(1, endFrame - startFrame + 1);

  // Quick Zoom Presets (জুম ইন ও জুম আউট প্রিসেট)
  const handlePresetZoom = (preset: 'zoom-in' | 'zoom-out' | 'subtle-in' | 'action-in' | 'wide-out') => {
    switch (preset) {
      case 'zoom-in':
        setStartScale(100);
        setEndScale(180);
        break;
      case 'zoom-out':
        setStartScale(180);
        setEndScale(100);
        break;
      case 'subtle-in':
        setStartScale(100);
        setEndScale(125);
        break;
      case 'action-in':
        setStartScale(100);
        setEndScale(240);
        break;
      case 'wide-out':
        setStartScale(150);
        setEndScale(75);
        break;
    }
  };

  // Background Runner Presets
  const handlePresetRunner = (type: 'walk' | 'run' | 'sprint' | 'full-screen') => {
    switch (type) {
      case 'walk':
        setBgSpeedPixels(Math.round(canvasWidth * 0.3));
        break;
      case 'run':
        setBgSpeedPixels(Math.round(canvasWidth * 0.6));
        break;
      case 'sprint':
        setBgSpeedPixels(Math.round(canvasWidth * 1.0));
        break;
      case 'full-screen':
        setBgSpeedPixels(canvasWidth);
        break;
    }
  };

  const handleGenerate = () => {
    if (activeTab === 'camera-zoom') {
      onApplyTween({
        mode: 'camera-zoom',
        layerId: cameraScope === 'all' ? 'all' : selectedLayerId,
        startFrameIndex: startFrame - 1,
        endFrameIndex: endFrame - 1,
        startScale: startScale / 100,
        endScale: endScale / 100,
        startPosX: 0,
        endPosX: moveX,
        startPosY: 0,
        endPosY: moveY,
        startRotation: 0,
        endRotation: rotateDeg,
        easing,
        createNewFramesIfNeeded: true,
      });
    } else if (activeTab === 'bg-runner') {
      onApplyTween({
        mode: 'bg-runner',
        layerId: bgLayerId || selectedLayerId,
        startFrameIndex: startFrame - 1,
        endFrameIndex: endFrame - 1,
        startScale: 1,
        endScale: 1,
        bgDirection,
        bgSpeedPixels,
        bgSeamlessLoop,
        easing: 'linear', // Background runner works best with smooth linear scroll
        createNewFramesIfNeeded: true,
      });
    } else {
      // Layer transform
      onApplyTween({
        mode: 'layer-tween',
        layerId: selectedLayerId,
        startFrameIndex: startFrame - 1,
        endFrameIndex: endFrame - 1,
        startScale: startScale / 100,
        endScale: endScale / 100,
        startPosX: 0,
        endPosX: moveX,
        startPosY: 0,
        endPosY: moveY,
        startRotation: 0,
        endRotation: rotateDeg,
        easing,
        createNewFramesIfNeeded: true,
      });
    }
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none cursor-pointer"
    >
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-neutral-200 text-xs cursor-default max-h-[92vh]">
        {/* Header */}
        <div className="h-12 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
              <Camera className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-100 text-sm flex items-center gap-1.5">
                ক্যামেরা জুম ও ব্যাকগ্রাউন্ড রানার স্টুডিও
              </h2>
              <p className="text-[10px] text-neutral-400">
                Camera Motion, Zoom In/Out & Character Background Runner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-925 px-2 pt-1.5 gap-1">
          <button
            onClick={() => setActiveTab('camera-zoom')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium text-xs transition-colors border-t-2 ${
              activeTab === 'camera-zoom'
                ? 'bg-neutral-900 text-cyan-300 border-cyan-500 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent hover:bg-neutral-850/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>🔍 ক্যামেরা জুম ইন / আউট</span>
          </button>

          <button
            onClick={() => setActiveTab('bg-runner')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium text-xs transition-colors border-t-2 ${
              activeTab === 'bg-runner'
                ? 'bg-neutral-900 text-emerald-300 border-emerald-500 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent hover:bg-neutral-850/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>🏃 ক্যারেক্টার ও ব্যাকগ্রাউন্ড রানার</span>
          </button>

          <button
            onClick={() => setActiveTab('layer-tween')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg font-medium text-xs transition-colors border-t-2 ${
              activeTab === 'layer-tween'
                ? 'bg-neutral-900 text-purple-300 border-purple-500 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 border-transparent hover:bg-neutral-850/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>✨ অবজেক্ট মোশন ও টুইন</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Universal Frame Range Selector (কতো থেকে কতো নাম্বার ফ্রেমে যাবে) */}
          <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-400" /> ফ্রেম রেঞ্জ (কতো থেকে কতো নাম্বার ফ্রেমে অ্যানিমেশন হবে):
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                মোট {frameCount} টি ফ্রেমে রান হবে
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-750">
                <span className="text-neutral-400">শুরু ফ্রেম (Start):</span>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500 font-mono">#</span>
                  <input
                    type="number"
                    min="1"
                    max={endFrame}
                    value={startFrame}
                    onChange={(e) => setStartFrame(Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-neutral-800 border border-neutral-600 rounded-md px-2 py-1 text-center text-cyan-300 font-bold font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-750">
                <span className="text-neutral-400">শেষ ফ্রেম (End):</span>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500 font-mono">#</span>
                  <input
                    type="number"
                    min={startFrame}
                    max="300"
                    value={endFrame}
                    onChange={(e) => setEndFrame(Math.max(startFrame, Number(e.target.value)))}
                    className="w-16 bg-neutral-800 border border-neutral-600 rounded-md px-2 py-1 text-center text-cyan-300 font-bold font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: CAMERA ZOOM IN / ZOOM OUT */}
          {activeTab === 'camera-zoom' && (
            <div className="flex flex-col gap-3.5">
              {/* Camera Scope Selector */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> ক্যামেরা জুমের পরিধি (Camera Scope):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraScope('all')}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                      cameraScope === 'all'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white font-semibold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-cyan-300 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> পুরো সিন / অল লেয়ার (Full Scene)
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      ক্যারেক্টার ও ব্যাকগ্রাউন্ডসহ গোটা স্ক্রিন একসাথে জুম হবে
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCameraScope('single')}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                      cameraScope === 'single'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white font-semibold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-cyan-300 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> নির্দিষ্ট একটি লেয়ার (Single Layer)
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      শুধু নির্বাচিত ক্যারেক্টার বা অবজেক্টটি জুম ইন/আউট হবে
                    </span>
                  </button>
                </div>

                {cameraScope === 'single' && (
                  <div className="pt-1">
                    <select
                      value={selectedLayerId}
                      onChange={(e) => setSelectedLayerId(e.target.value)}
                      className="w-full bg-neutral-850 text-neutral-200 border border-neutral-700 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      {layers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Quick Zoom Presets */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> জুম ইন ও জুম আউট প্রিসেট:
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePresetZoom('zoom-in')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-300 font-semibold border border-neutral-700 hover:border-cyan-500 transition-colors"
                  >
                    🔍 ক্লোজ-আপ জুম ইন (100% ➔ 180%)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetZoom('zoom-out')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-amber-300 font-semibold border border-neutral-700 hover:border-amber-500 transition-colors"
                  >
                    🔍 ওয়াইড জুম আউট (180% ➔ 100%)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetZoom('subtle-in')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-emerald-300 border border-neutral-700 hover:border-emerald-500 transition-colors"
                  >
                    🎬 স্লো মুভি জুম (100% ➔ 125%)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetZoom('action-in')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-purple-300 border border-neutral-700 hover:border-purple-500 transition-colors"
                  >
                    ⚡ অ্যাকশন ফাস্ট জুম (100% ➔ 240%)
                  </button>
                </div>

                {/* Custom Zoom Range Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col gap-1.5 bg-neutral-900 p-2.5 rounded-lg border border-neutral-750">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">শুরুর জুম (Start Zoom):</span>
                      <span className="font-mono text-cyan-400 font-bold text-xs">{startScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="400"
                      step="5"
                      value={startScale}
                      onChange={(e) => setStartScale(Number(e.target.value))}
                      className="accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 bg-neutral-900 p-2.5 rounded-lg border border-neutral-750">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">শেষের জুম (End Zoom):</span>
                      <span className="font-mono text-emerald-400 font-bold text-xs">{endScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="400"
                      step="5"
                      value={endScale}
                      onChange={(e) => setEndScale(Number(e.target.value))}
                      className="accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Camera Pan (ক্যামেরা প্যান - ডানে বামে বা উপরে নিচে সরানো) */}
              <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" /> জুম করার সময় ক্যামেরা প্যান (Pan X/Y):
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-neutral-500">X:</span>
                    <input
                      type="number"
                      value={moveX}
                      onChange={(e) => setMoveX(Number(e.target.value))}
                      className="w-14 bg-neutral-850 border border-neutral-700 rounded px-1.5 py-0.5 text-center font-mono"
                    />
                    <span className="text-neutral-500">px</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-neutral-500">Y:</span>
                    <input
                      type="number"
                      value={moveY}
                      onChange={(e) => setMoveY(Number(e.target.value))}
                      className="w-14 bg-neutral-850 border border-neutral-700 rounded px-1.5 py-0.5 text-center font-mono"
                    />
                    <span className="text-neutral-500">px</span>
                  </div>
                </div>
              </div>

              {/* Easing Motion */}
              <div className="flex items-center justify-between bg-neutral-950 px-3 py-2.5 rounded-xl border border-neutral-800">
                <span className="text-neutral-300 flex items-center gap-1.5 font-medium">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> জুমের ট্রানজিশন গতি (Easing):
                </span>
                <select
                  value={easing}
                  onChange={(e) => setEasing(e.target.value as any)}
                  className="bg-neutral-850 text-neutral-200 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="easeInOut">স্মুথ সিনেমাটিক গতি (Ease In-Out)</option>
                  <option value="easeOut">ধীরে সমাপ্তি (Ease Out)</option>
                  <option value="easeIn">ধীরে শুরু (Ease In)</option>
                  <option value="linear">সমান গতি (Linear)</option>
                </select>
              </div>

              {/* Live Bangla Summary Description */}
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/50 text-cyan-200 text-xs leading-relaxed shadow-sm">
                🎬 <strong className="text-white">ক্যামেরা জুম সামারি:</strong> ফ্রেম{' '}
                <strong className="text-white font-mono">#{startFrame}</strong> ({startScale}% সাইজ) থেকে ফ্রেম{' '}
                <strong className="text-white font-mono">#{endFrame}</strong> ({endScale}% সাইজ)-এ{' '}
                {cameraScope === 'all' ? (
                  <strong className="text-cyan-300">সম্পূর্ণ অ্যানিমেশন সিন</strong>
                ) : (
                  <strong className="text-cyan-300">{layers.find((l) => l.id === selectedLayerId)?.name}</strong>
                )}{' '}
                {endScale > startScale ? (
                  <span className="text-emerald-300 font-bold">ধীরে ধীরে জুম ইন (Zoom In) হবে</span>
                ) : (
                  <span className="text-amber-300 font-bold">ধীরে ধীরে জুম আউট (Zoom Out) হবে</span>
                )}
                । মোট <strong className="text-white font-mono">{frameCount} টি ফ্রেমে</strong> অটোমেটিক সিনেমাটিক
                ক্যামেরা মুভমেন্ট তৈরি হবে।
              </div>
            </div>
          )}

          {/* TAB 2: BACKGROUND RUNNER / PARALLAX SCROLL */}
          {activeTab === 'bg-runner' && (
            <div className="flex flex-col gap-3.5">
              {/* Background Layer Selection */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" /> ব্যাকগ্রাউন্ড লেয়ার সিলেক্ট করুন (Background Layer):
                  </span>
                  <span className="text-emerald-400 text-[11px] font-mono font-semibold">
                    {layers.find((l) => l.id === bgLayerId)?.name || 'Select Layer'}
                  </span>
                </div>
                <select
                  value={bgLayerId}
                  onChange={(e) => setBgLayerId(e.target.value)}
                  className="bg-neutral-850 text-neutral-200 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type === 'raster' ? 'Raster Layer' : 'Vector Layer'})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-neutral-400">
                  💡 ক্যারেক্টার তার নিজের লেয়ারে স্থির বা রান সাইকেলে থাকবে, আর নির্বাচিত এই ব্যাকগ্রাউন্ড লেয়ারটি পিছনে রান করবে।
                </span>
              </div>

              {/* Running Direction (রান করার দিক) */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> ব্যাকগ্রাউন্ড রান করার দিক (Run Direction):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBgDirection('left')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      bgDirection === 'left'
                        ? 'bg-emerald-950/70 border-emerald-500 text-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-emerald-300">ডান থেকে বামে (Leftward)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">ক্যারেক্টার সামনের দিকে দৌড়াচ্ছে (Standard Run)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgDirection('right')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      bgDirection === 'right'
                        ? 'bg-emerald-950/70 border-emerald-500 text-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-emerald-300">বাম থেকে ডানে (Rightward)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">ক্যারেক্টার উল্টো বা পিছন দিকে ছুটছে</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgDirection('up')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      bgDirection === 'up'
                        ? 'bg-emerald-950/70 border-emerald-500 text-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-emerald-300">নিচে থেকে উপরে (Upward)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">ক্যারেক্টার নিচের দিকে নামছে / ফলিং এফেক্ট</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgDirection('down')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      bgDirection === 'down'
                        ? 'bg-emerald-950/70 border-emerald-500 text-white font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-emerald-300">উপরে থেকে নিচে (Downward)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">ক্যারেক্টার উপরে উঠছে / ক্লাইম্বিং এফেক্ট</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Running Speed & Distance */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> রান করার গতি ও দূরত্ব (Scroll Speed & Distance):
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-xs">{bgSpeedPixels} px</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePresetRunner('walk')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-300 font-medium border border-neutral-700 transition-colors text-[11px]"
                  >
                    🚶 হাঁটার গতি (Walk: {Math.round(canvasWidth * 0.3)}px)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetRunner('run')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-emerald-300 font-medium border border-neutral-700 transition-colors text-[11px]"
                  >
                    🏃 দৌড়ের গতি (Run: {Math.round(canvasWidth * 0.6)}px)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetRunner('sprint')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-amber-300 font-medium border border-neutral-700 transition-colors text-[11px]"
                  >
                    ⚡ দ্রুত দৌড় (Sprint: {canvasWidth}px)
                  </button>
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="50"
                    max={canvasWidth * 2}
                    step="20"
                    value={bgSpeedPixels}
                    onChange={(e) => setBgSpeedPixels(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 pt-1 font-mono">
                    <span>ধীর গতি (50px)</span>
                    <span>মাঝারি (500px)</span>
                    <span>সুপার ফাস্ট ({canvasWidth * 2}px)</span>
                  </div>
                </div>
              </div>

              {/* Seamless Infinite Wrap Loop */}
              <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-neutral-200 block text-xs">
                      নিরবচ্ছিন্ন ব্যাকগ্রাউন্ড লুপ (Seamless Wrap-Around)
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      ব্যাকগ্রাউন্ড একপাশ দিয়ে বেরিয়ে গেলে অপর প্রান্ত দিয়ে অনন্তকাল মসৃণভাবে কন্টিনিউ হবে
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bgSeamlessLoop}
                    onChange={(e) => setBgSeamlessLoop(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Bangla Description */}
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-200 text-xs leading-relaxed shadow-sm">
                🏃 <strong className="text-white">ব্যাকগ্রাউন্ড রানার সামারি:</strong> ফ্রেম{' '}
                <strong className="text-white font-mono">#{startFrame}</strong> থেকে ফ্রেম{' '}
                <strong className="text-white font-mono">#{endFrame}</strong> পর্যন্ত{' '}
                <strong className="text-emerald-300">{layers.find((l) => l.id === bgLayerId)?.name}</strong> ব্যাকগ্রাউন্ডটি{' '}
                <strong className="text-white font-bold">{bgDirection === 'left' ? 'ডান থেকে বামে' : bgDirection === 'right' ? 'বাম থেকে ডানে' : bgDirection === 'up' ? 'নিচ থেকে উপরে' : 'উপর থেকে নিচে'}</strong>{' '}
                মোট <strong className="text-white font-mono">{bgSpeedPixels}px</strong> দূরত্বে স্মুথলি রান করবে। ফলে সামনের ক্যারেক্টারের সাথে চলমান প্যারালাক্স ব্যাকগ্রাউন্ড তৈরি হবে।
              </div>
            </div>
          )}

          {/* TAB 3: OBJECT MOTION & TRANSFORM TWEEN */}
          {activeTab === 'layer-tween' && (
            <div className="flex flex-col gap-3.5">
              {/* Target Layer Selector */}
              <div className="flex flex-col gap-1.5 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> কোন অব্জেক্ট / লেয়ারটি এনিমেশন হবে:
                </span>
                <select
                  value={selectedLayerId}
                  onChange={(e) => setSelectedLayerId(e.target.value)}
                  className="bg-neutral-850 text-neutral-200 border border-neutral-700 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                >
                  {layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type === 'raster' ? 'Raster Image' : 'Vector Shape'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scale Control */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-purple-400" /> সাইজ পরিবর্তন (Scale):
                  </span>
                  <span className="font-mono text-purple-300 font-bold">
                    {startScale}% ➔ {endScale}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1 bg-neutral-850 p-2 rounded border border-neutral-700">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">শুরুর সাইজ:</span>
                      <span className="font-mono text-cyan-400 font-bold">{startScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="400"
                      step="5"
                      value={startScale}
                      onChange={(e) => setStartScale(Number(e.target.value))}
                      className="accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1 bg-neutral-850 p-2 rounded border border-neutral-700">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">শেষের সাইজ:</span>
                      <span className="font-mono text-purple-400 font-bold">{endScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="400"
                      step="5"
                      value={endScale}
                      onChange={(e) => setEndScale(Number(e.target.value))}
                      className="accent-purple-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Move & Rotate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                    <Move className="w-3 h-3 text-cyan-400" /> পজিশন শিফট (X / Y):
                  </span>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-neutral-500">X:</span>
                      <input
                        type="number"
                        value={moveX}
                        onChange={(e) => setMoveX(Number(e.target.value))}
                        className="w-12 bg-neutral-800 border border-neutral-700 rounded px-1 text-center font-mono"
                      />
                      <span className="text-neutral-500">px</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-neutral-500">Y:</span>
                      <input
                        type="number"
                        value={moveY}
                        onChange={(e) => setMoveY(Number(e.target.value))}
                        className="w-12 bg-neutral-800 border border-neutral-700 rounded px-1 text-center font-mono"
                      />
                      <span className="text-neutral-500">px</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-indigo-400" /> ঘূর্ণন (Rotate):
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="range"
                      min="-360"
                      max="360"
                      step="15"
                      value={rotateDeg}
                      onChange={(e) => setRotateDeg(Number(e.target.value))}
                      className="w-24 accent-indigo-400"
                    />
                    <span className="font-mono text-indigo-300 text-[11px]">{rotateDeg}°</span>
                  </div>
                </div>
              </div>

              {/* Easing Motion */}
              <div className="flex items-center justify-between bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800">
                <span className="text-neutral-300 text-[11px] flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-purple-400" /> গতির মোশন (Easing Curve):
                </span>
                <select
                  value={easing}
                  onChange={(e) => setEasing(e.target.value as any)}
                  className="bg-neutral-850 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="easeInOut">স্মুথ গতি (Ease In-Out)</option>
                  <option value="easeOut">ধীরে সমাপ্তি (Ease Out)</option>
                  <option value="easeIn">ধীরে শুরু (Ease In)</option>
                  <option value="linear">সমান গতি (Linear)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            {activeTab === 'camera-zoom' && '🔍 ক্যামেরা জুম মোড সক্রিয়'}
            {activeTab === 'bg-runner' && '🏃 ক্যারেক্টার ও ব্যাকগ্রাউন্ড রানার সক্রিয়'}
            {activeTab === 'layer-tween' && '✨ অবজেক্ট মোশন টুইন সক্রিয়'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              বাতিল (Cancel)
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 via-emerald-600 to-indigo-600 hover:from-cyan-500 hover:via-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all hover:scale-102 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>
                {activeTab === 'camera-zoom' && 'ক্যামেরা জুম তৈরি করুন (Generate Zoom)'}
                {activeTab === 'bg-runner' && 'ব্যাকগ্রাউন্ড রানার তৈরি করুন (Run Background)'}
                {activeTab === 'layer-tween' && 'মোশন এনিমেশন তৈরি করুন (Generate)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
