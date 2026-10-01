import React from 'react';
import { ToolType } from '../types';
import {
  Paintbrush,
  Eraser,
  Pipette,
  PaintBucket,
  Move,
  PenTool,
  Square,
  Hand,
  Search,
  MousePointer,
  Droplet,
  Sparkle,
  Sparkles,
  SquareDashed,
  Spline,
  ArrowLeftRight,
  RotateCcw,
  Type,
  Blend,
  Stamp,
  Grid3X3,
  Bone,
  ChevronLeft,
} from 'lucide-react';

interface ToolsSidebarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  primaryColor: string;
  secondaryColor: string;
  onSwapColors: () => void;
  onResetColors: () => void;
  onPrimaryColorChange: (color: string) => void;
  brushPreset?: string;
  onSelectGlowPencil?: () => void;
  gridEnabled?: boolean;
  onToggleGrid?: () => void;
  onOpenGridStudio?: () => void;
  onHideTools?: () => void;
}

export const ToolsSidebar: React.FC<ToolsSidebarProps> = React.memo(({
  activeTool,
  onSelectTool,
  primaryColor,
  secondaryColor,
  onSwapColors,
  onResetColors,
  onPrimaryColorChange,
  brushPreset,
  onSelectGlowPencil,
  gridEnabled,
  onToggleGrid,
  onOpenGridStudio,
  onHideTools,
}) => {
  const isGlowPencilActive = activeTool === 'brush' && brushPreset === 'glow-pencil';

  const tools: {
    id: ToolType | 'glow-pencil';
    label: string;
    shortcut: string;
    icon: React.ReactNode;
    separator?: boolean;
    isActive?: boolean;
    onClick?: () => void;
  }[] = [
    // Move & Select & Rigging
    { id: 'transform', label: 'Move & Transform (Photoshop V)', shortcut: 'V', icon: <Move className="w-4 h-4" /> },
    { id: 'bone', label: 'Bone Rigging (হাড় রিগিং - Blender & Moho Rig)', shortcut: 'R', icon: <Bone className="w-4 h-4" /> },
    { id: 'mesh', label: 'Mesh Warp & Deform (মেশ ওয়ার্প)', shortcut: 'Shift+M', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'marquee', label: 'Rectangular Marquee Selection', shortcut: 'M', icon: <SquareDashed className="w-4 h-4" /> },
    { id: 'lasso', label: 'Lasso Selection', shortcut: 'L', icon: <Spline className="w-4 h-4" /> },
    // Drawing & Painting
    {
      id: 'glow-pencil',
      label: '✨ Glow Pencil (নিয়ন গ্লো পেন্সিল - সব কালার)',
      shortcut: 'Shift+B',
      icon: <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />,
      isActive: isGlowPencilActive,
      onClick: onSelectGlowPencil,
    },
    {
      id: 'brush',
      label: 'Brush Engine (Photoshop B)',
      shortcut: 'B',
      icon: <Paintbrush className="w-4 h-4" />,
      isActive: activeTool === 'brush' && !isGlowPencilActive,
    },
    { id: 'eraser', label: 'Eraser Tool', shortcut: 'E', icon: <Eraser className="w-4 h-4" /> },
    { id: 'gradient', label: 'Gradient Tool (Photoshop G)', shortcut: 'G', icon: <Blend className="w-4 h-4" /> },
    { id: 'bucket', label: 'Paint Bucket Fill (Fast 8K)', shortcut: 'K', icon: <PaintBucket className="w-4 h-4" /> },
    { id: 'clone', label: 'Clone Stamp Tool (Photoshop S)', shortcut: 'C', icon: <Stamp className="w-4 h-4" /> },
    { id: 'smudge', label: 'Smudge Tool', shortcut: 'S', icon: <Droplet className="w-4 h-4" /> },
    { id: 'blur', label: 'Blur Tool', shortcut: 'R', icon: <Sparkle className="w-4 h-4" /> },
    // Typography & Vector
    { id: 'text', label: 'Type Tool (Photoshop T)', shortcut: 'T', icon: <Type className="w-4 h-4" /> },
    { id: 'vector-pen', label: 'Vector Bézier Pen (Illustrator P)', shortcut: 'P', icon: <PenTool className="w-4 h-4" /> },
    { id: 'vector-shape', label: 'Rectangle & Vector Shapes (Illustrator U)', shortcut: 'U', icon: <Square className="w-4 h-4" /> },
    { id: 'vector-select', label: 'Direct Selection (Illustrator A)', shortcut: 'A', icon: <MousePointer className="w-4 h-4" /> },
    // Utilities
    { id: 'eyedropper', label: 'Eyedropper (I)', shortcut: 'I', icon: <Pipette className="w-4 h-4" /> },
    { id: 'hand', label: 'Hand Tool (Pan Canvas)', shortcut: 'H / Space', icon: <Hand className="w-4 h-4" /> },
    { id: 'zoom', label: 'Zoom Tool (Click / Alt-Click / Scrubby)', shortcut: 'Z', icon: <Search className="w-4 h-4" /> },
    {
      id: 'grid' as any,
      label: gridEnabled ? 'গ্রিড ও গাইড (চালু আছে - Ctrl+\')' : 'গ্রিড ও গাইড সিস্টেম (Ctrl+\')',
      shortcut: "Ctrl+'",
      icon: <Grid3X3 className={`w-4 h-4 ${gridEnabled ? 'text-cyan-300' : ''}`} />,
      isActive: gridEnabled,
      onClick: () => {
        if (onToggleGrid) onToggleGrid();
      },
    },
  ];

  return (
    <aside className="flex w-10 sm:w-12 h-full bg-neutral-900 border-r border-neutral-800 flex-col items-center py-1 select-none z-20 justify-between shrink-0">
      {onHideTools && (
        <button
          onClick={onHideTools}
          title="টুলবার লুকান (Hide Tools Sidebar)"
          className="w-7 h-6 mb-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer border border-neutral-750"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}
      {/* Tool buttons list with smooth touch scrolling */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 scrollbar-none touch-pan-y">
        {tools.map((t) => {
          const isActive = t.isActive !== undefined ? t.isActive : activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.onClick) {
                  t.onClick();
                } else if (t.id === 'clone' && activeTool === 'clone') {
                  onSelectTool('brush');
                } else {
                  onSelectTool(t.id as ToolType);
                }
              }}
              title={`${t.label} (${t.shortcut})`}
              className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg flex items-center justify-center transition-all relative group cursor-pointer ${
                t.id === 'glow-pencil' && isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-900/50 ring-1 ring-amber-300'
                  : isActive
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400/50'
                  : t.id === 'glow-pencil'
                  ? 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80'
              }`}
            >
              {t.icon}

              {/* Tooltip on hover */}
              <div className="absolute left-10 sm:left-11 bg-neutral-950 text-neutral-200 border border-neutral-800 text-[11px] px-2 py-1 rounded shadow-xl whitespace-nowrap hidden group-hover:flex items-center gap-1.5 z-50 pointer-events-none">
                <span>{t.label}</span>
                <span className="text-neutral-500 font-mono text-[10px]">[{t.shortcut}]</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Color Swatches & Swap at the bottom */}
      <div className="shrink-0 flex flex-col items-center pb-1 w-full pt-1 border-t border-neutral-800/80 bg-neutral-900 z-10">
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 my-0.5 sm:my-1">
          {/* Secondary Color Chip */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-sm border border-neutral-700 shadow cursor-pointer"
            style={{ backgroundColor: secondaryColor }}
            title={`Background Color: ${secondaryColor}`}
          />
          {/* Primary Color Chip */}
          <label
            className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 rounded-sm border border-white shadow-md cursor-pointer block overflow-hidden z-10"
            style={{ backgroundColor: primaryColor }}
            title={`Foreground Color: ${primaryColor} (Click to change)`}
          >
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>

        {/* Color Switchers */}
        <div className="flex items-center gap-0.5 mt-0.5">
          <button
            onClick={onSwapColors}
            title="Swap Colors (X)"
            className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={onResetColors}
            title="Default Black & White (D)"
            className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
});
