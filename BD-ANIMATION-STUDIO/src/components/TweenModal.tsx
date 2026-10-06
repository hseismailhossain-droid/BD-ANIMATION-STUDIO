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

  // Frame Range (Start and End Frame Numbers)
  const [startFrame, setStartFrame] = useState(Math.max(1, currentFrameIndex + 1));
  const [endFrame, setEndFrame] = useState(Math.max(startFrame + 1, Math.min(startFrame + 11, Math.max(12, frames.length))));

  // Target Layer: 'all' for full scene camera zoom, or specific layer
  const [selectedLayerId, setSelectedLayerId] = useState(activeLayerId || layers[0]?.id || 'all');
  const [cameraScope, setCameraScope] = useState<'all' | 'single'>('all');

  // Scale / Zoom (Zoom In & Zoom Out)
  const [startScale, setStartScale] = useState(100);
  const [endScale, setEndScale] = useState(180);

  // Position offset (Camera Pan / Shift)
  const [moveX, setMoveX] = useState(0);
  const [moveY, setMoveY] = useState(0);

  // Rotation
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

  // Quick Zoom Presets
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
                Camera Zoom & Background Runner Studio
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
            <span>🔍 Camera Zoom In / Out</span>
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
            <span>🏃 Character & Background Runner</span>
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
            <span>✨ Object Motion & Tween</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Universal Frame Range Selector */}
          <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-400" /> Frame Range:
              </span>
              <span className="text-cyan-400 font-mono font-bold text-[11px]">
                Total {frameCount} frames
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-750">
                <span className="text-neutral-400">Start Frame:</span>
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
                <span className="text-neutral-400">End Frame:</span>
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
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> Camera Zoom Scope:
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
                      <Camera className="w-3 h-3" /> Full Scene / All Layers
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Zooms entire viewport including character and backgrounds
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
                      <Layers className="w-3 h-3" /> Single Target Layer
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Zooms only the selected character or object layer
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
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> Zoom In & Zoom Out Presets:
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePresetZoom('zoom-in')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-300 font-semibold border border-neutral-700 hover:border-cyan-500 transition-colors"
                  >
                    🔍 Close-Up Zoom In (100% ➔ 180%)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetZoom('zoom-out')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-amber-300 font-semibold border border-neutral-700 hover:border-amber-500 transition-colors"
                  >
                    🔍 Wide Zoom Out (180% ➔ 100%)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetZoom('subtle-in')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-emerald-300 border border-neutral-700 hover:border-emerald-500 transition-colors"
                  >
                    🎬 Slow Cinematic Zoom (100% ➔ 125%)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetZoom('action-in')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-purple-300 border border-neutral-700 hover:border-purple-500 transition-colors"
                  >
                    ⚡ Fast Action Zoom (100% ➔ 240%)
                  </button>
                </div>

                {/* Custom Zoom Range Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col gap-1.5 bg-neutral-900 p-2.5 rounded-lg border border-neutral-750">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Start Zoom:</span>
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
                      <span className="text-neutral-400">End Zoom:</span>
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

              {/* Optional Camera Pan */}
              <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" /> Camera Pan with Zoom (Pan X/Y):
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
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Zoom Transition Easing:
                </span>
                <select
                  value={easing}
                  onChange={(e) => setEasing(e.target.value as any)}
                  className="bg-neutral-850 text-neutral-200 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="easeInOut">Smooth Cinematic (Ease In-Out)</option>
                  <option value="easeOut">Ease Out</option>
                  <option value="easeIn">Ease In</option>
                  <option value="linear">Linear</option>
                </select>
              </div>

              {/* Summary Description */}
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/50 text-cyan-200 text-xs leading-relaxed shadow-sm">
                🎬 <strong className="text-white">Camera Zoom Summary:</strong> From Frame{' '}
                <strong className="text-white font-mono">#{startFrame}</strong> ({startScale}% scale) to Frame{' '}
                <strong className="text-white font-mono">#{endFrame}</strong> ({endScale}% scale),{' '}
                {cameraScope === 'all' ? (
                  <strong className="text-cyan-300">entire animation scene</strong>
                ) : (
                  <strong className="text-cyan-300">{layers.find((l) => l.id === selectedLayerId)?.name}</strong>
                )}{' '}
                {endScale > startScale ? (
                  <span className="text-emerald-300 font-bold">will smoothly zoom in</span>
                ) : (
                  <span className="text-amber-300 font-bold">will smoothly zoom out</span>
                )}
                . Creates automatic cinematic camera keyframes across{' '}
                <strong className="text-white font-mono">{frameCount} frames</strong>.
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
                    <Layers className="w-3.5 h-3.5 text-emerald-400" /> Select Background Layer:
                  </span>
                  <span className="text-emerald-400 text-[11px] font-mono font-semibold">
                    {layers.find((l) => l.id === bgLayerId)?.name || 'Select Layer'}
                  </span>
                </div>
                <select
                  value={bgLayerId}
                  onChange={(e) => setBgLayerId(e.target.value)}
                  className="bg-neutral-855 text-neutral-200 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {layers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type === 'raster' ? 'Raster Layer' : 'Vector Layer'})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-neutral-400">
                  💡 Character stays stationary or plays run cycles on their layer while this background scrolls behind them.
                </span>
              </div>

              {/* Running Direction */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> Background Scroll Direction:
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
                      <div className="text-emerald-300">Leftward (Right to Left)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Character runs forward (Standard Run)</div>
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
                      <div className="text-emerald-300">Rightward (Left to Right)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Character runs backward or reverses</div>
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
                      <div className="text-emerald-300">Upward (Bottom to Top)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Character falls down / Diving FX</div>
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
                      <div className="text-emerald-300">Downward (Top to Bottom)</div>
                      <div className="text-[10px] text-neutral-400 font-normal">Character flies or climbs upward</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Running Speed & Distance */}
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Scroll Speed & Distance:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-xs">{bgSpeedPixels} px</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePresetRunner('walk')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-300 font-medium border border-neutral-700 transition-colors text-[11px]"
                  >
                    🚶 Walking Pace ({Math.round(canvasWidth * 0.3)}px)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetRunner('run')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-emerald-300 font-medium border border-neutral-700 transition-colors text-[11px]"
                  >
                    🏃 Running Pace ({Math.round(canvasWidth * 0.6)}px)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetRunner('sprint')}
                    className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-amber-300 font-medium border border-neutral-700 transition-colors text-[11px]"
                  >
                    ⚡ Sprint Speed ({canvasWidth}px)
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
                    <span>Slow (50px)</span>
                    <span>Medium (500px)</span>
                    <span>Super Fast ({canvasWidth * 2}px)</span>
                  </div>
                </div>
              </div>

              {/* Seamless Infinite Wrap Loop */}
              <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-neutral-200 block text-xs">
                      Seamless Wrap-Around Loop
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Background edges seamlessly wrap around for endless running animation
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

              {/* Summary Description */}
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-200 text-xs leading-relaxed shadow-sm">
                🏃 <strong className="text-white">Background Runner Summary:</strong> From Frame{' '}
                <strong className="text-white font-mono">#{startFrame}</strong> to Frame{' '}
                <strong className="text-white font-mono">#{endFrame}</strong>, the layer{' '}
                <strong className="text-emerald-300">{layers.find((l) => l.id === bgLayerId)?.name}</strong> will smoothly scroll{' '}
                <strong className="text-white font-bold">{bgDirection === 'left' ? 'Leftward' : bgDirection === 'right' ? 'Rightward' : bgDirection === 'up' ? 'Upward' : 'Downward'}</strong> by{' '}
                <strong className="text-white font-mono">{bgSpeedPixels}px</strong>, creating a seamless parallax background effect.
              </div>
            </div>
          )}

          {/* TAB 3: OBJECT MOTION & TRANSFORM TWEEN */}
          {activeTab === 'layer-tween' && (
            <div className="flex flex-col gap-3.5">
              {/* Target Layer Selector */}
              <div className="flex flex-col gap-1.5 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Target Object / Layer to Animate:
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
                    <Maximize2 className="w-3 h-3 text-purple-400" /> Scale Transform:
                  </span>
                  <span className="font-mono text-purple-300 font-bold">
                    {startScale}% ➔ {endScale}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1 bg-neutral-850 p-2 rounded border border-neutral-700">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Start Scale:</span>
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
                      <span className="text-neutral-400">End Scale:</span>
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
                    <Move className="w-3 h-3 text-cyan-400" /> Position Shift (X / Y):
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
                    <RotateCw className="w-3 h-3 text-indigo-400" /> Rotation:
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
                  <Sliders className="w-3 h-3 text-purple-400" /> Motion Easing:
                </span>
                <select
                  value={easing}
                  onChange={(e) => setEasing(e.target.value as any)}
                  className="bg-neutral-850 text-neutral-200 border border-neutral-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="easeInOut">Smooth (Ease In-Out)</option>
                  <option value="easeOut">Ease Out</option>
                  <option value="easeIn">Ease In</option>
                  <option value="linear">Linear</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            {activeTab === 'camera-zoom' && '🔍 Camera Zoom Mode Active'}
            {activeTab === 'bg-runner' && '🏃 Character & Background Runner Active'}
            {activeTab === 'layer-tween' && '✨ Object Motion Tween Active'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 via-emerald-600 to-indigo-600 hover:from-cyan-500 hover:via-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all hover:scale-102 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>
                {activeTab === 'camera-zoom' && 'Generate Camera Zoom'}
                {activeTab === 'bg-runner' && 'Run Background'}
                {activeTab === 'layer-tween' && 'Generate Motion Tween'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
