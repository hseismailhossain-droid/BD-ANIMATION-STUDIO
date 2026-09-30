/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize,
  Layers,
  Move,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  X,
  Compass,
  Hand,
  Check,
} from 'lucide-react';
import { Layer } from '../types';

interface DirectionalMovePadProps {
  // Canvas Viewport Pan
  onPan: (dx: number, dy: number) => void;
  onFitCanvas: () => void;
  isPanToolActive?: boolean;
  onTogglePanTool?: () => void;

  // Layer Content Nudge
  onNudgeLayer: (dx: number, dy: number, moveAllLayers?: boolean) => void;
  activeLayer: Layer;
  layers: Layer[];
  allLayersVisible: boolean;
  onToggleAllLayersVisibility: () => void;
  onReorderLayer: (fromIndex: number, toIndex: number) => void;

  onClose?: () => void;
}

export const DirectionalMovePad: React.FC<DirectionalMovePadProps> = ({
  onPan,
  onFitCanvas,
  isPanToolActive,
  onTogglePanTool,
  onNudgeLayer,
  activeLayer,
  layers,
  allLayersVisible,
  onToggleAllLayersVisibility,
  onReorderLayer,
  onClose,
}) => {
  // Tabs: 'canvas' (move viewport), 'layer' (move graphics), 'reorder' (move layer order in stack)
  const [activeTab, setActiveTab] = useState<'canvas' | 'layer' | 'order'>('canvas');
  // Step size for layer nudge: 1, 10, 50 px
  const [stepSize, setStepSize] = useState<number>(10);
  // Target: single active layer or all layers
  const [moveAllTarget, setMoveAllTarget] = useState<boolean>(false);

  const activeIndex = layers.findIndex((l) => l.id === activeLayer.id);

  // Handle 4-way direction click
  const handleDirection = (dir: 'up' | 'down' | 'left' | 'right') => {
    let dx = 0;
    let dy = 0;

    if (activeTab === 'canvas') {
      const panStep = 60;
      if (dir === 'up') dy = panStep;
      if (dir === 'down') dy = -panStep;
      if (dir === 'left') dx = panStep;
      if (dir === 'right') dx = -panStep;
      onPan(dx, dy);
    } else if (activeTab === 'layer') {
      const step = stepSize;
      if (dir === 'up') dy = -step;
      if (dir === 'down') dy = step;
      if (dir === 'left') dx = -step;
      if (dir === 'right') dx = step;
      onNudgeLayer(dx, dy, moveAllTarget);
    } else if (activeTab === 'order') {
      if (dir === 'up' && activeIndex < layers.length - 1) {
        onReorderLayer(activeIndex, activeIndex + 1);
      } else if (dir === 'down' && activeIndex > 0) {
        onReorderLayer(activeIndex, activeIndex - 1);
      }
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="bg-neutral-900/95 border border-cyan-500/70 shadow-2xl rounded-2xl p-2.5 flex flex-col gap-2 select-none text-white text-xs w-[240px] pointer-events-auto touch-none"
    >
      {/* Header with Title and Mode Switch */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>মুভমেন্ট কন্ট্রোল (D-Pad)</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Quick Hide All / Show All Layers Button */}
          <button
            onClick={onToggleAllLayersVisibility}
            title={allLayersVisible ? 'সব লেয়ার লুকান (Hide All Layers)' : 'সব লেয়ার দেখান (Show All Layers)'}
            className={`p-1 rounded-md transition-colors ${
              allLayersVisible
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                : 'bg-amber-950 border border-amber-500/60 text-amber-300'
            }`}
          >
            {allLayersVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Target Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[11px]">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`py-1 rounded font-medium transition-all ${
            activeTab === 'canvas'
              ? 'bg-cyan-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="ক্যানভাস ভিউ উপরে নিচে ডানে বামে সরান"
        >
          ক্যানভাস
        </button>
        <button
          onClick={() => setActiveTab('layer')}
          className={`py-1 rounded font-medium transition-all ${
            activeTab === 'layer'
              ? 'bg-cyan-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="লেয়ারের অবজেক্ট/ড্রইং ডানে বামে উপরে নিচে সরান"
        >
          লেয়ার মুভ
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`py-1 rounded font-medium transition-all ${
            activeTab === 'order'
              ? 'bg-cyan-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="লেয়ারের স্ট্যাক ক্রম উপরে বা নিচে নিন"
        >
          লেয়ার ক্রম
        </button>
      </div>

      {/* Mode Sub-Settings */}
      {activeTab === 'layer' && (
        <div className="flex flex-col gap-1.5 bg-neutral-950/70 p-1.5 rounded-lg border border-neutral-800 text-[10px]">
          {/* Target: Active Layer vs All Layers */}
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">টার্গেট:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMoveAllTarget(false)}
                className={`px-1.5 py-0.5 rounded transition ${
                  !moveAllTarget
                    ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-500/60 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                সক্রিয় লেয়ার
              </button>
              <button
                onClick={() => setMoveAllTarget(true)}
                className={`px-1.5 py-0.5 rounded transition ${
                  moveAllTarget
                    ? 'bg-amber-900/80 text-amber-200 border border-amber-500/60 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                সব লেয়ার
              </button>
            </div>
          </div>

          {/* Step Size Selector */}
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">ধাপ (Step):</span>
            <div className="flex items-center gap-1">
              {[1, 10, 50].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setStepSize(sz)}
                  className={`px-1.5 py-0.5 rounded transition ${
                    stepSize === sz
                      ? 'bg-neutral-700 text-cyan-300 font-bold border border-cyan-400/50'
                      : 'bg-neutral-850 text-neutral-400 hover:text-white'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'canvas' && onTogglePanTool && (
        <div className="flex items-center justify-between bg-neutral-950/70 px-2 py-1 rounded-lg border border-neutral-800 text-[10px]">
          <span className="text-neutral-400">প্যান ড্র্যাগ মোড:</span>
          <button
            onClick={onTogglePanTool}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition font-semibold ${
              isPanToolActive
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Hand className="w-3 h-3" />
            <span>{isPanToolActive ? 'সক্রিয় (Active)' : 'চালু করুন'}</span>
          </button>
        </div>
      )}

      {activeTab === 'order' && (
        <div className="bg-neutral-950/70 px-2 py-1.5 rounded-lg border border-neutral-800 text-[10px] text-neutral-300 flex items-center justify-between">
          <span className="truncate max-w-[120px] font-medium text-cyan-300">
            {activeLayer.name}
          </span>
          <span className="text-neutral-500">
            ({activeIndex + 1}/{layers.length})
          </span>
        </div>
      )}

      {/* The 4-Way Directional Pad (Up, Down, Left, Right) */}
      <div className="flex flex-col items-center justify-center py-1">
        {/* Up Arrow */}
        <button
          onClick={() => handleDirection('up')}
          title="উপরে সরান (Move Up)"
          className="w-12 h-10 rounded-t-xl bg-neutral-800 hover:bg-cyan-600 active:bg-cyan-700 text-cyan-300 hover:text-white flex items-center justify-center shadow transition-all active:scale-95 border border-neutral-700"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Middle Row: Left, Center (Fit/Action), Right */}
        <div className="flex items-center gap-1">
          {/* Left Arrow */}
          <button
            onClick={() => handleDirection('left')}
            title="বামে সরান (Move Left)"
            className="w-10 h-12 rounded-l-xl bg-neutral-800 hover:bg-cyan-600 active:bg-cyan-700 text-cyan-300 hover:text-white flex items-center justify-center shadow transition-all active:scale-95 border border-neutral-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Center Button */}
          {activeTab === 'canvas' ? (
            <button
              onClick={onFitCanvas}
              title="ক্যানভাস স্ক্রিনে ফিট করুন (Fit Canvas)"
              className="w-12 h-12 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-400 hover:text-white flex flex-col items-center justify-center shadow transition-all active:scale-95 border border-cyan-700/50 text-[9px] font-bold"
            >
              <Maximize className="w-3.5 h-3.5 mb-0.5" />
              <span>ফিট</span>
            </button>
          ) : activeTab === 'layer' ? (
            <button
              onClick={() => onNudgeLayer(0, 0, moveAllTarget)}
              title="রিফ্রেশ"
              className="w-12 h-12 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-cyan-400 hover:text-white flex flex-col items-center justify-center shadow transition-all active:scale-95 border border-cyan-700/50 text-[9px] font-bold"
            >
              <Move className="w-3.5 h-3.5 mb-0.5" />
              <span>মুভ</span>
            </button>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-neutral-850 text-cyan-400 flex flex-col items-center justify-center border border-cyan-700/50 text-[9px] font-bold">
              <Layers className="w-3.5 h-3.5 mb-0.5" />
              <span>ক্রম</span>
            </div>
          )}

          {/* Right Arrow */}
          <button
            onClick={() => handleDirection('right')}
            title="ডানে সরান (Move Right)"
            className="w-10 h-12 rounded-r-xl bg-neutral-800 hover:bg-cyan-600 active:bg-cyan-700 text-cyan-300 hover:text-white flex items-center justify-center shadow transition-all active:scale-95 border border-neutral-700"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Down Arrow */}
        <button
          onClick={() => handleDirection('down')}
          title="নিচে সরান (Move Down)"
          className="w-12 h-10 rounded-b-xl bg-neutral-800 hover:bg-cyan-600 active:bg-cyan-700 text-cyan-300 hover:text-white flex items-center justify-center shadow transition-all active:scale-95 border border-neutral-700"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Quick Action: All Layers Visibility */}
      <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-[11px]">
        <span className="text-neutral-400">লেয়ার উপস্থিতি:</span>
        <button
          onClick={onToggleAllLayersVisibility}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition active:scale-95 ${
            allLayersVisible
              ? 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
              : 'bg-amber-500 text-black font-bold shadow ring-1 ring-amber-300'
          }`}
        >
          {allLayersVisible ? (
            <>
              <EyeOff className="w-3 h-3 text-neutral-400" />
              <span>সব লুকান</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 text-black" />
              <span>সব দেখান</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
