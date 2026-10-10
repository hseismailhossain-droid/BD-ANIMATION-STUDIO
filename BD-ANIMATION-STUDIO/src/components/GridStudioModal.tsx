import React, { useState } from 'react';
import {
  Grid,
  Box,
  Compass,
  CircleDot,
  LayoutGrid,
  Magnet,
  Maximize2,
  X,
  Sparkles,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Move,
  RotateCcw,
  Triangle,
  Disc,
  Plus,
  Trash2,
  Ruler,
  Layers,
  Zap,
} from 'lucide-react';
import { GridConfig, GridType } from '../types';

interface GridStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridConfig: GridConfig;
  onUpdateGridConfig: (updates: Partial<GridConfig>) => void;
  onResetGridConfig?: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

const GRID_TYPES: {
  id: GridType;
  title: string;
  banglaTitle: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'square',
    title: 'Square Grid',
    banglaTitle: 'Standard Square',
    desc: 'Uniform square grid with major subdivision lines',
    icon: LayoutGrid,
  },
  {
    id: 'isometric',
    title: 'Isometric 3D',
    banglaTitle: 'Isometric 3D',
    desc: '30° angle 3D game art & architecture grid',
    icon: Box,
  },
  {
    id: 'triangular',
    title: 'Triangular / Hex',
    banglaTitle: 'Triangular / Hex',
    desc: '60° triangle and hexagon tilemap grid',
    icon: Triangle,
  },
  {
    id: 'dots',
    title: 'Dot Matrix',
    banglaTitle: 'Dot Grid',
    desc: 'Modern sketching and bullet journal dot matrix pattern',
    icon: CircleDot,
  },
  {
    id: 'rule-of-thirds',
    title: 'Rule of Thirds',
    banglaTitle: 'Rule of Thirds',
    desc: 'Cinematic composition and 3×3 focal point guides',
    icon: Compass,
  },
  {
    id: 'golden-ratio',
    title: 'Golden Ratio (Phi)',
    banglaTitle: 'Golden Ratio',
    desc: 'Natural aesthetic 1.618 ratio & spiral sections',
    icon: Sparkles,
  },
  {
    id: 'perspective',
    title: 'Perspective (1 & 2 Pt)',
    banglaTitle: 'Perspective Guide',
    desc: 'Vanishing points and horizon converging lines',
    icon: Move,
  },
  {
    id: 'polar',
    title: 'Polar / Radial',
    banglaTitle: 'Polar / Radial Hub',
    desc: 'Concentric circles and radial angle spokes (Mandala)',
    icon: Disc,
  },
];

const PRESETS: {
  id: string;
  title: string;
  banglaTitle: string;
  desc: string;
  config: Partial<GridConfig>;
}[] = [
  {
    id: 'pixel-art',
    title: 'Pixel Art',
    banglaTitle: '👾 Pixel Art',
    desc: '16px cells, snap enabled, pixel grid active',
    config: {
      type: 'square',
      size: 16,
      subdivisions: 4,
      snapToGrid: true,
      snapTolerance: 10,
      showPixelGrid: true,
      color: '#06b6d4',
      opacity: 0.35,
    },
  },
  {
    id: 'illustration',
    title: 'Illustration',
    banglaTitle: '🎨 Drawing & Sketch',
    desc: '64px uniform subdivision grid',
    config: {
      type: 'square',
      size: 64,
      subdivisions: 4,
      snapToGrid: false,
      color: '#06b6d4',
      opacity: 0.22,
    },
  },
  {
    id: 'ui-design',
    title: 'UI & Icons',
    banglaTitle: '📐 UI & Vector Icons',
    desc: '24px cells, snap enabled, precise alignment',
    config: {
      type: 'square',
      size: 24,
      subdivisions: 4,
      snapToGrid: true,
      snapTolerance: 12,
      color: '#10b981',
      opacity: 0.3,
    },
  },
  {
    id: 'isometric-3d',
    title: '3D Isometric',
    banglaTitle: '🏛️ 3D Isometric',
    desc: '48px diamond grid, isometric rooms & game assets',
    config: {
      type: 'isometric',
      size: 48,
      snapToGrid: true,
      snapTolerance: 14,
      color: '#3b82f6',
      opacity: 0.3,
    },
  },
  {
    id: 'cinematic',
    title: 'Cinematic Thirds',
    banglaTitle: '🎬 Cinematic 3×3',
    desc: 'Golden focal points and cinematic composition',
    config: {
      type: 'rule-of-thirds',
      color: '#f59e0b',
      opacity: 0.45,
      lineWidth: 1.5,
    },
  },
  {
    id: 'mandala',
    title: 'Mandala / Radial',
    banglaTitle: '☸️ Mandala & Radial',
    desc: '12-spoke radial polar guidelines',
    config: {
      type: 'polar',
      size: 48,
      polarDivisions: 12,
      color: '#ec4899',
      opacity: 0.35,
      lineWidth: 1.5,
    },
  },
];

const COLOR_SWATCHES = [
  { color: '#06b6d4', name: 'Cyan Neon' },
  { color: '#ffffff', name: 'Pure White' },
  { color: '#f59e0b', name: 'Amber Gold' },
  { color: '#10b981', name: 'Emerald' },
  { color: '#ec4899', name: 'Hot Pink' },
  { color: '#3b82f6', name: 'Electric Blue' },
  { color: '#a855f7', name: 'Purple' },
  { color: '#737373', name: 'Neutral Gray' },
];

const SIZE_PRESETS = [8, 16, 24, 32, 48, 64, 96, 128, 200];

export const GridStudioModal: React.FC<GridStudioModalProps> = ({
  isOpen,
  onClose,
  gridConfig,
  onUpdateGridConfig,
  onResetGridConfig,
  canvasWidth,
  canvasHeight,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'snapping' | 'guides' | 'presets'>('style');
  const [newGuidePos, setNewGuidePos] = useState<number>(100);
  const [newGuideOrient, setNewGuideOrient] = useState<'horizontal' | 'vertical'>('horizontal');

  if (!isOpen) return null;

  const handleAddGuide = () => {
    const guides = gridConfig.guides || [];
    const newGuide = {
      id: `guide-${Date.now()}`,
      orientation: newGuideOrient,
      position: Math.round(newGuidePos),
      color: gridConfig.color || '#06b6d4',
    };
    onUpdateGridConfig({
      enabled: true,
      guides: [...guides, newGuide],
    });
  };

  const handleRemoveGuide = (id: string) => {
    const guides = (gridConfig.guides || []).filter((g) => g.id !== id);
    onUpdateGridConfig({ guides });
  };

  const handleClearGuides = () => {
    onUpdateGridConfig({ guides: [] });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Grid & Guides Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  Advanced Pro Grid
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Precision sketching, animation layout, magnetic snapping, and custom guidelines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onResetGridConfig && (
              <button
                onClick={onResetGridConfig}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Reset to default settings"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Quick Bar: 1-Tap Toggle & Snap */}
        <div className="px-4 sm:px-5 py-2.5 bg-neutral-925 border-b border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => onUpdateGridConfig({ enabled: !gridConfig.enabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                gridConfig.enabled
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {gridConfig.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{gridConfig.enabled ? 'Grid ON' : 'Grid OFF'}</span>
            </button>

            <button
              onClick={() => onUpdateGridConfig({ snapToGrid: !gridConfig.snapToGrid })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                gridConfig.snapToGrid
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Magnet className="w-4 h-4" />
              <span>{gridConfig.snapToGrid ? '🧲 Snap ON' : 'Snap OFF'}</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-neutral-850 p-1 rounded-xl border border-neutral-800 text-xs gap-1">
            <button
              onClick={() => setActiveTab('style')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'style'
                  ? 'bg-neutral-750 text-white font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Style
            </button>
            <button
              onClick={() => setActiveTab('snapping')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'snapping'
                  ? 'bg-neutral-750 text-white font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Snapping
            </button>
            <button
              onClick={() => setActiveTab('guides')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'guides'
                  ? 'bg-neutral-750 text-white font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Guides
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'presets'
                  ? 'bg-neutral-750 text-white font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Presets
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-neutral-300 touch-pan-y">
          {/* TAB 1: STYLE & APPEARANCE */}
          {activeTab === 'style' && (
            <>
              {/* Grid Type Selector (8 Pro Styles) */}
              <div>
                <div className="font-bold text-neutral-200 mb-2.5 flex items-center justify-between">
                  <span>Select Grid Type</span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {GRID_TYPES.find((t) => t.id === gridConfig.type)?.title}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRID_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = gridConfig.type === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => onUpdateGridConfig({ type: type.id, enabled: true })}
                        className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-500 text-white ring-1 ring-cyan-400/50 shadow-md'
                            : 'bg-neutral-850/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>

                        <div>
                          <div className="font-bold text-[11px] leading-tight">{type.banglaTitle}</div>
                          <div className="text-[9px] text-neutral-400 line-clamp-1">{type.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid Cell Dimensions */}
              {(gridConfig.type === 'square' ||
                gridConfig.type === 'isometric' ||
                gridConfig.type === 'triangular' ||
                gridConfig.type === 'dots' ||
                gridConfig.type === 'polar') && (
                <div className="bg-neutral-850/60 p-3.5 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">
                      Grid Cell Size (Cell Spacing)
                    </span>
                    <span className="font-mono text-cyan-400 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-750">
                      {gridConfig.size} px
                    </span>
                  </div>

                  {/* Quick Size Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SIZE_PRESETS.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => onUpdateGridConfig({ size: sz })}
                        className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all ${
                          gridConfig.size === sz
                            ? 'bg-cyan-500 text-black font-bold shadow'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
                        }`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="6"
                    max="256"
                    step="2"
                    value={gridConfig.size}
                    onChange={(e) => onUpdateGridConfig({ size: parseInt(e.target.value) || 32 })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  {/* Subdivisions for Square */}
                  {gridConfig.type === 'square' && (
                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-neutral-200 text-xs">Subdivisions (Major Lines)</div>
                        <div className="text-[10px] text-neutral-400">Interval for thick prominent major grid lines</div>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 4, 8, 16].map((sub) => (
                          <button
                            key={sub}
                            onClick={() => onUpdateGridConfig({ subdivisions: sub })}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                              gridConfig.subdivisions === sub
                                ? 'bg-cyan-600 text-white font-bold'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {sub === 1 ? 'None' : `${sub}x`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Polar Spokes for Radial */}
                  {gridConfig.type === 'polar' && (
                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-neutral-200 text-xs">Radial Spokes (Spoke Rays)</div>
                        <div className="text-[10px] text-neutral-400">Number of angular spokes radiating from the center</div>
                      </div>

                      <div className="flex items-center gap-1">
                        {[6, 8, 12, 16, 24].map((div) => (
                          <button
                            key={div}
                            onClick={() => onUpdateGridConfig({ polarDivisions: div })}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                              (gridConfig.polarDivisions || 12) === div
                                ? 'bg-pink-600 text-white font-bold'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {div}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pixel Art Auto Grid */}
              <div className="p-3 bg-neutral-850/60 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                    <span>Pixel Grid (Pixel Art Mode)</span>
                    <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-700/50">
                      Auto 400%+ Zoom
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Displays fine grid borders around individual pixels when zoomed in over 4x
                  </div>
                </div>

                <button
                  onClick={() =>
                    onUpdateGridConfig({
                      showPixelGrid: !(gridConfig.showPixelGrid ?? true),
                    })
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    gridConfig.showPixelGrid ?? true ? 'bg-purple-600 justify-end' : 'bg-neutral-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>

              {/* Color & Opacity Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Color Swatches */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-200 block text-xs">Grid Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.color}
                        onClick={() => onUpdateGridConfig({ color: swatch.color })}
                        style={{ backgroundColor: swatch.color }}
                        className={`w-7 h-7 rounded-lg border transition-transform active:scale-90 flex items-center justify-center ${
                          gridConfig.color.toLowerCase() === swatch.color.toLowerCase()
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110 border-white'
                            : 'border-white/20 hover:scale-105'
                        }`}
                        title={swatch.name}
                      >
                        {gridConfig.color.toLowerCase() === swatch.color.toLowerCase() && (
                          <Check
                            className={`w-4 h-4 ${
                              swatch.color === '#ffffff' ? 'text-black' : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity & Width Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-neutral-200 text-xs">Opacity & Visibility</label>
                    <span className="font-mono text-cyan-400 font-bold">
                      {Math.round(gridConfig.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={gridConfig.opacity}
                    onChange={(e) => onUpdateGridConfig({ opacity: parseFloat(e.target.value) || 0.25 })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  {/* Line Width */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-neutral-400 text-[11px]">Line Width</span>
                    <div className="flex items-center gap-1">
                      {[1, 1.5, 2, 2.5].map((w) => (
                        <button
                          key={w}
                          onClick={() => onUpdateGridConfig({ lineWidth: w })}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                            gridConfig.lineWidth === w
                              ? 'bg-cyan-600 text-white font-bold'
                              : 'bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {w}px
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MAGNETIC SNAPPING */}
          {activeTab === 'snapping' && (
            <div className="space-y-4">
              <div
                onClick={() => onUpdateGridConfig({ snapToGrid: !gridConfig.snapToGrid })}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  gridConfig.snapToGrid
                    ? 'bg-amber-950/60 border-amber-500/60 text-white shadow-lg shadow-amber-950/40'
                    : 'bg-neutral-850/80 border-neutral-750 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      gridConfig.snapToGrid ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Magnet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Magnetic Smart Grid Snapping</div>
                    <div className="text-[11px] text-neutral-400">
                      Brush strokes, shapes, handles, and vectors automatically snap to nearest grid intersections
                    </div>
                  </div>
                </div>

                <div
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    gridConfig.snapToGrid ? 'bg-amber-500 justify-end' : 'bg-neutral-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </div>
              </div>

              {/* Snap Radius Slider */}
              <div className="bg-neutral-850/60 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <span>Snap Radius Tolerance</span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-750">
                    {gridConfig.snapTolerance} px
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="40"
                  value={gridConfig.snapTolerance}
                  onChange={(e) =>
                    onUpdateGridConfig({ snapTolerance: parseInt(e.target.value) || 12 })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>4px (Gentle)</span>
                  <span>12px (Standard)</span>
                  <span>40px (Strong Magnet)</span>
                </div>
              </div>

              {/* Snapping Tips */}
              <div className="p-3 bg-amber-950/20 border border-amber-600/30 rounded-xl text-amber-200/90 text-[11px] leading-relaxed">
                💡 <span className="font-bold">Pro Tip:</span> When magnetic snapping is active, drawing lines or transforming shapes automatically locks to nearby grid vertices. Essential for pixel-perfect sprites, geometric art, and architectural layouts.
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM GUIDELINES */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-cyan-400" />
                    <span>Custom Guidelines</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Place custom horizontal or vertical reference guide lines on the canvas
                  </div>
                </div>

                {(gridConfig.guides?.length || 0) > 0 && (
                  <button
                    onClick={handleClearGuides}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 px-2 py-1 rounded bg-red-950/40 border border-red-800/50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                )}
              </div>

              {/* Add Guide Controls */}
              <div className="p-3 bg-neutral-850/60 rounded-xl border border-neutral-800 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-750 text-xs">
                  <button
                    onClick={() => setNewGuideOrient('horizontal')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      newGuideOrient === 'horizontal' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Horizontal (Y)
                  </button>
                  <button
                    onClick={() => setNewGuideOrient('vertical')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      newGuideOrient === 'vertical' ? 'bg-cyan-600 text-white font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Vertical (X)
                  </button>
                </div>

                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    min="0"
                    max={newGuideOrient === 'horizontal' ? canvasHeight : canvasWidth}
                    value={newGuidePos}
                    onChange={(e) => setNewGuidePos(parseInt(e.target.value) || 0)}
                    className="w-24 bg-neutral-900 border border-neutral-750 px-2 py-1 rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="Pixel..."
                  />
                  <span className="text-neutral-400 text-xs font-mono">px</span>
                </div>

                <button
                  onClick={handleAddGuide}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Guide
                </button>
              </div>

              {/* Existing Guides List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(gridConfig.guides || []).length === 0 ? (
                  <div className="p-6 text-center text-neutral-500 bg-neutral-900/40 rounded-xl border border-dashed border-neutral-800">
                    No custom guidelines added yet. Enter a coordinate above to add one.
                  </div>
                ) : (
                  (gridConfig.guides || []).map((guide) => (
                    <div
                      key={guide.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-850 border border-neutral-750 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            guide.orientation === 'horizontal' ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                        />
                        <span className="font-semibold text-white">
                          {guide.orientation === 'horizontal' ? 'Horizontal Guide (Y)' : 'Vertical Guide (X)'}
                        </span>
                        <span className="font-mono text-cyan-300 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-750">
                          {guide.position} px
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveGuide(guide.id)}
                        className="p-1 text-neutral-400 hover:text-red-400 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-400">
                Instantly apply calibrated grid setups tuned for your workflow:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onUpdateGridConfig({
                        ...preset.config,
                        enabled: true,
                      });
                      setActiveTab('style');
                    }}
                    className="p-3 rounded-xl bg-neutral-850/80 border border-neutral-800 hover:border-cyan-500/60 hover:bg-neutral-800 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white group-hover:text-cyan-300">
                        {preset.banglaTitle}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {preset.config.size ? `${preset.config.size}px` : preset.config.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-1">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">
              Ctrl + '
            </kbd>
            <span>Toggle grid on/off canvas at any time</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
