import React, { useState } from 'react';
import {
  FileText,
  Save,
  Download,
  Upload,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sliders,
  Sparkles,
  Layers as LayersIcon,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Plus,
  Grid,
  ChevronDown,
  Scissors,
  PaintBucket,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Image as ImageIcon,
  Bone,
  Film,
  Sun,
  Mic,
  Smartphone,
  Minimize2,
  Palette,
} from 'lucide-react';
import { CanvasConfig, ViewportTransform } from '../types';

interface TopMenuBarProps {
  config: CanvasConfig;
  transform: ViewportTransform;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFlipH: () => void;
  onFlipV?: () => void;
  onRotate90?: () => void;
  onRotate270?: () => void;
  onNewCanvas: () => void;
  onOpenResolutionModal: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onImportImage: () => void;
  onImportReferenceVideo?: () => void;
  onExport: () => void;
  onOpenFilters: () => void;
  onOpenBrushSettings: () => void;
  timelineVisible: boolean;
  onToggleTimeline: () => void;
  gridEnabled: boolean;
  onToggleGrid: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onInvertSelection?: () => void;
  onFillSelection?: () => void;
  onClearSelection?: () => void;
  onOpenTransform?: (mode: 'translate-scale' | 'perspective' | 'mesh') => void;
  onToggleReference?: () => void;
  isReferenceOpen?: boolean;
  onOpenTween?: () => void;
  onOpenBoneRig?: () => void;
  onOpenLighting?: () => void;
  onOpenSoundStudio?: () => void;
  onOpenQuickVoice?: () => void;
  audioTrackCount?: number;
  dynamicIslandEnabled?: boolean;
  onToggleDynamicIsland?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onDuplicate?: () => void;
  canPaste?: boolean;
  isFullPageMode?: boolean;
  onToggleFullPageMode?: () => void;
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  config,
  transform,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFlipH,
  onFlipV,
  onRotate90,
  onRotate270,
  onNewCanvas,
  onOpenResolutionModal,
  onSaveProject,
  onOpenProject,
  onImportImage,
  onImportReferenceVideo,
  onExport,
  onOpenFilters,
  onOpenBrushSettings,
  timelineVisible,
  onToggleTimeline,
  gridEnabled,
  onToggleGrid,
  onSelectAll,
  onDeselect,
  onInvertSelection,
  onFillSelection,
  onClearSelection,
  onOpenTransform,
  onToggleReference,
  isReferenceOpen,
  onOpenTween,
  onOpenBoneRig,
  onOpenLighting,
  onOpenSoundStudio,
  onOpenQuickVoice,
  audioTrackCount = 0,
  dynamicIslandEnabled = true,
  onToggleDynamicIsland,
  onCopy,
  onPaste,
  onCut,
  onDuplicate,
  canPaste = false,
  isFullPageMode = false,
  onToggleFullPageMode,
  rightPanelOpen = true,
  onToggleRightPanel,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (name: string) => {
    setActiveMenu(activeMenu === name ? null : name);
  };

  const closeMenu = () => setActiveMenu(null);

  const is8K = config.width >= 7680 || config.height >= 4320;
  const is4K = config.width >= 3840 && !is8K;

  return (
    <header className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 text-xs select-none z-30 relative overflow-x-auto whitespace-nowrap no-scrollbar gap-4">
      {/* Left branding & menus */}
      <div className="flex items-center gap-1">
        {/* App Logo & Title */}
        <div className="flex items-center gap-2 mr-3 font-semibold text-neutral-100 tracking-wide">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            BD Animation <span className="text-cyan-400 font-extrabold">Studio</span>
          </span>
        </div>

        {/* File Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('file')}
            className={`px-2 py-1 rounded transition-colors ${
              activeMenu === 'file'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div
              className="absolute left-0 top-8 w-52 bg-neutral-900 border border-neutral-750 rounded-lg shadow-2xl py-1 text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() => { onNewCanvas(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-cyan-400" /> New Document...</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+N</span>
              </button>
              <button
                onClick={() => { onOpenResolutionModal(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Sliders className="w-3.5 h-3.5 text-cyan-400" /> Canvas Resolution (HD-8K)...</span>
              </button>
              <button
                onClick={() => { onOpenProject(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-neutral-400" /> Open Project (.ps8k)</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+O</span>
              </button>
              <button
                onClick={() => { onImportImage(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" /> লেয়ারে ইমেজ আপলোড (Upload Image to Layer)
              </button>
              {onImportReferenceVideo && (
                <button
                  onClick={() => { onImportReferenceVideo(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2"
                >
                  <Film className="w-3.5 h-3.5 text-purple-400" /> রেফারেন্স ভিডিও ইম্পোর্ট (Frame by Frame)
                </button>
              )}
              <div className="my-1 border-t border-neutral-800" />
              <button
                onClick={() => { onSaveProject(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5 text-neutral-400" /> Save Project File</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+S</span>
              </button>
              <button
                onClick={() => { onExport(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5 text-amber-400" /> Export Artwork...</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+E</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('edit')}
            className={`px-2 py-1 rounded transition-colors ${
              activeMenu === 'edit'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div
              className="absolute left-0 top-8 w-44 bg-neutral-900 border border-neutral-750 rounded-lg shadow-2xl py-1 text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={closeMenu}
            >
              <button
                disabled={!canUndo}
                onClick={() => { onUndo(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Undo2 className="w-3.5 h-3.5" /> Undo</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+Z</span>
              </button>
              <button
                disabled={!canRedo}
                onClick={() => { onRedo(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Redo2 className="w-3.5 h-3.5" /> Redo</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+Y</span>
              </button>
              <div className="my-1 border-t border-neutral-800" />
              {/* Copy, Paste, Cut, Duplicate Actions */}
              <button
                onClick={() => { onCopy?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Copy className="w-3.5 h-3.5 text-cyan-400" /> কপি (Copy)</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+C</span>
              </button>
              <button
                disabled={!canPaste}
                onClick={() => { onPaste?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" /> পেস্ট (Paste)</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+V</span>
              </button>
              <button
                onClick={() => { onCut?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5 text-amber-400" /> কাট (Cut)</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+X</span>
              </button>
              <button
                onClick={() => { onDuplicate?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><CopyPlus className="w-3.5 h-3.5 text-purple-400" /> ডুপ্লিকেট (Duplicate)</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+D</span>
              </button>
              <div className="my-1 border-t border-neutral-800" />
              <button
                onClick={() => { onFillSelection?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><PaintBucket className="w-3.5 h-3.5" /> Fill (Selection/Layer)</span>
                <span className="text-neutral-500 text-[10px]">Alt+Bksp</span>
              </button>
              <button
                onClick={() => { onClearSelection?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5" /> Clear Content</span>
                <span className="text-neutral-500 text-[10px]">Del</span>
              </button>
              <div className="my-1 border-t border-neutral-800" />
              <button
                onClick={() => { onOpenTransform?.('translate-scale'); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><RotateCw className="w-3.5 h-3.5" /> Free Transform & 360°</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+T</span>
              </button>
              <button
                onClick={() => { onOpenTransform?.('mesh'); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Grid className="w-3.5 h-3.5" /> Mesh Form (মেস ফর্ম)</span>
                <span className="text-cyan-400 text-[10px] font-bold">Warp</span>
              </button>
              <button
                onClick={() => { onOpenTransform?.('perspective'); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Maximize className="w-3.5 h-3.5" /> Perspective Form</span>
                <span className="text-neutral-500 text-[10px]">Skew</span>
              </button>
              <div className="my-1 border-t border-neutral-800" />
              <button
                onClick={() => { onOpenBoneRig?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Bone className="w-3.5 h-3.5 text-amber-400" /> 2D হাড় রিগিং (Bone Rig)</span>
                <span className="text-amber-400 text-[10px]">Armature</span>
              </button>
              <button
                onClick={() => { onOpenTween?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Film className="w-3.5 h-3.5 text-cyan-400" /> স্কেল এনিমেশন (Scale Tween)</span>
                <span className="text-cyan-400 text-[10px]">Keyframe</span>
              </button>
              <button
                onClick={() => { onToggleReference?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-blue-400" /> রেফারেন্স ইমেজ (Reference)</span>
                <span className="text-neutral-500 text-[10px]">Guide</span>
              </button>
            </div>
          )}
        </div>

        {/* Image / Canvas Menu (Photoshop Parity) */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('image')}
            className={`px-2 py-1 rounded transition-colors ${
              activeMenu === 'image'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
          >
            Image
          </button>
          {activeMenu === 'image' && (
            <div
              className="absolute left-0 top-8 w-56 bg-neutral-900 border border-neutral-750 rounded-lg shadow-2xl py-1 text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() => { onOpenResolutionModal(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Resolution & Canvas Size (8K)...
              </button>
              <div className="my-1 border-t border-neutral-800" />
              <button
                onClick={() => { onFlipH(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2"
              >
                <FlipHorizontal className="w-3.5 h-3.5" /> Flip Canvas Horizontally
              </button>
              <button
                onClick={() => { onFlipV?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2"
              >
                <FlipVertical className="w-3.5 h-3.5" /> Flip Canvas Vertically
              </button>
              <button
                onClick={() => { onRotate90?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate 90° Clockwise
              </button>
              <button
                onClick={() => { onRotate270?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Rotate 90° Counter-Clockwise
              </button>
            </div>
          )}
        </div>

        {/* Select Menu (Photoshop Parity) */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('select')}
            className={`px-2 py-1 rounded transition-colors ${
              activeMenu === 'select'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
          >
            Select
          </button>
          {activeMenu === 'select' && (
            <div
              className="absolute left-0 top-8 w-48 bg-neutral-900 border border-neutral-750 rounded-lg shadow-2xl py-1 text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={closeMenu}
            >
              <button
                onClick={() => { onSelectAll?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span>Select All</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+A</span>
              </button>
              <button
                onClick={() => { onDeselect?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span>Deselect</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+D</span>
              </button>
              <button
                onClick={() => { onInvertSelection?.(); closeMenu(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center justify-between"
              >
                <span>Invert Selection</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+Shift+I</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters Menu */}
        <button
          onClick={onOpenFilters}
          className="px-2 py-1 rounded text-neutral-300 hover:bg-neutral-800/70 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Filters
        </button>

        {/* Brush Engine Settings */}
        <button
          onClick={onOpenBrushSettings}
          className="px-2 py-1 rounded text-neutral-300 hover:bg-neutral-800/70 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Brushes
        </button>

        {/* Reference Image Option */}
        <button
          onClick={onToggleReference}
          title="রেফারেন্স ইমেজ অপশন (Reference Image Panel)"
          className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
            isReferenceOpen
              ? 'bg-blue-950 text-blue-300 border border-blue-500/40 font-medium'
              : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Reference
        </button>

        {/* Keyframe Tweening Modal */}
        <button
          onClick={onOpenTween}
          title="এনিমেশন স্কেল ও ট্রান্সফর্ম টুইন (Object Keyframe Scale Animation)"
          className="px-2 py-1 rounded text-neutral-300 hover:bg-neutral-800/70 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
        >
          <Film className="w-3.5 h-3.5 text-cyan-400" /> Tweening
        </button>

        {/* Cinematic Lighting & VFX Studio */}
        <button
          onClick={onOpenLighting}
          title="সিনেম্যাটিক লাইটিং ও এনভায়রনমেন্ট ইফেক্ট (Daylight, Moonlight, Mobile, Computer, Lamppost Light)"
          className="px-2 py-1 rounded text-neutral-300 hover:bg-neutral-800/70 hover:text-amber-300 transition-colors flex items-center gap-1.5"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" /> Lighting FX
        </button>

        {/* View Animation Timeline Toggle */}
        <button
          onClick={onToggleTimeline}
          className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
            timelineVisible
              ? 'bg-neutral-800 text-cyan-400 font-medium'
              : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
          }`}
        >
          <LayersIcon className="w-3.5 h-3.5" /> Timeline
        </button>

        {/* Sound Studio & Voice Recorder */}
        {onOpenSoundStudio && (
          <button
            onClick={onOpenSoundStudio}
            title="সাউন্ড স্টুডিও ও ভয়েস রেকর্ডার (Voice Record, SFX: Walk, Car, Train, Plane, Rain, Thunder, Moods)"
            className="px-2.5 py-1 rounded bg-gradient-to-r from-red-600/90 to-purple-600/90 hover:from-red-500 hover:to-purple-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Mic className="w-3.5 h-3.5 text-red-200" />
            <span>Sound & Voice</span>
            {audioTrackCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-cyan-300 font-mono font-bold">
                {audioTrackCount}
              </span>
            )}
          </button>
        )}

        {/* Direct Voice Recorder One-Click Button */}
        {onOpenQuickVoice && (
          <button
            onClick={onOpenQuickVoice}
            title="সরাসরি ভয়েস রেকর্ড করুন (Direct Voice Recording for Animation)"
            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-red-900/40 hover:scale-102 active:scale-95"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>ভয়েস রেকর্ড</span>
          </button>
        )}

        {/* Dynamic Island Toggle (Mobile Studio) */}
        {onToggleDynamicIsland && (
          <button
            onClick={onToggleDynamicIsland}
            title="ডাইনামিক আইল্যান্ড মোবাইল টুলস (Dynamic Island Mobile HUD)"
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
              dynamicIslandEnabled
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-semibold'
                : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dynamic Island</span>
          </button>
        )}
      </div>

      {/* Center Canvas Stats & Quick Resolution Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenResolutionModal}
          title="Click to Switch Resolution (HD, 2K, 4K, 8K, Custom)"
          className="flex items-center gap-1.5 px-3 py-0.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-cyan-500/60 rounded-full font-mono text-[11px] text-neutral-300 transition-colors group cursor-pointer shadow-sm"
        >
          <span className="text-cyan-400 font-semibold group-hover:text-cyan-300">
            {config.name}
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-200">
            {config.width} × {config.height}
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-400 text-[10px]">{config.dpi} DPI</span>

          {is8K ? (
            <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 rounded text-[10px] font-bold border border-amber-500/30">
              8K UHD
            </span>
          ) : is4K ? (
            <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 rounded text-[10px] font-bold border border-cyan-500/30">
              4K UHD
            </span>
          ) : null}

          <ChevronDown className="w-3 h-3 text-neutral-500 group-hover:text-cyan-400" />
        </button>

        {/* Alignment Grid Toggle */}
        <button
          onClick={onToggleGrid}
          title={gridEnabled ? 'Hide Alignment Grid' : 'Show Alignment Grid (Ctrl+\')'}
          className={`p-1.5 rounded transition-colors ${
            gridEnabled
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right controls: Undo/Redo, Zoom & Viewport */}
      <div className="flex items-center gap-1">
        <button
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* Quick Paste Button in Top Bar */}
        <button
          disabled={!canPaste}
          onClick={onPaste}
          title="পেস্ট করুন (Ctrl+V)"
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
            canPaste
              ? 'bg-emerald-900/90 text-emerald-200 hover:bg-emerald-700 border border-emerald-500/70 shadow-sm animate-pulse'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
          <span>পেস্ট (Paste)</span>
        </button>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* Zoom Controls */}
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetZoom}
          title="Reset to 100%"
          className="px-2 py-0.5 rounded font-mono text-[11px] text-neutral-300 hover:bg-neutral-800 min-w-[50px] text-center"
        >
          {Math.round(transform.zoom * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onFlipH}
          title="Flip Canvas Horizontal (Reflect View)"
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetZoom}
          title="Fit Canvas to Screen"
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* Full Page Zen Drawing Mode Button */}
        {onToggleFullPageMode && (
          <button
            onClick={onToggleFullPageMode}
            title={isFullPageMode ? 'ফুল স্ক্রিন বন্ধ করুন (Exit Full Screen)' : 'ফুল পেইজ ড্রইং মোড (Full Page Zen Drawing)'}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              isFullPageMode
                ? 'bg-amber-500 text-black shadow-md ring-1 ring-amber-300 animate-pulse'
                : 'bg-neutral-800 hover:bg-amber-950/80 text-amber-300 hover:text-amber-200 border border-amber-500/40'
            }`}
          >
            {isFullPageMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullPageMode ? 'নরমাল ভিউ' : 'ফুল পেইজ'}</span>
          </button>
        )}

        {/* Toggle Right Dock (Color Studio & Layers) */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            title="লেয়ার ও কালার প্যানেল খুলুন/বন্ধ করুন (Toggle Layers & Color Dock)"
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
              rightPanelOpen
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700'
            }`}
          >
            <LayersIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">লেয়ার/কালার</span>
          </button>
        )}

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* Primary Export Button */}
        <button
          onClick={onExport}
          className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium rounded shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>
    </header>
  );
};
