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
}

export const ToolsSidebar: React.FC<ToolsSidebarProps> = ({
  activeTool,
  onSelectTool,
  primaryColor,
  secondaryColor,
  onSwapColors,
  onResetColors,
  onPrimaryColorChange,
  brushPreset,
  onSelectGlowPencil,
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
  ];

  return (
    <aside className="hidden sm:flex w-12 bg-neutral-900 border-r border-neutral-800 flex-col items-center py-2 select-none z-20 justify-between">
      {/* Tool buttons list */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        {tools.map((t) => {
          const isActive = t.isActive !== undefined ? t.isActive : activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.onClick) {
                  t.onClick();
                } else {
                  onSelectTool(t.id as ToolType);
                }
              }}
              title={`${t.label} (${t.shortcut})`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
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
              <div className="absolute left-11 bg-neutral-950 text-neutral-200 border border-neutral-800 text-[11px] px-2 py-1 rounded shadow-xl whitespace-nowrap hidden group-hover:flex items-center gap-1.5 z-50 pointer-events-none">
                <span>{t.label}</span>
                <span className="text-neutral-500 font-mono text-[10px]">[{t.shortcut}]</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Color Swatches & Swap at the bottom */}
      <div className="flex flex-col items-center pb-2 w-full pt-2 border-t border-neutral-800/80">
        <div className="relative w-8 h-8 my-1">
          {/* Secondary Color Chip */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 rounded-sm border border-neutral-700 shadow cursor-pointer"
            style={{ backgroundColor: secondaryColor }}
            title={`Background Color: ${secondaryColor}`}
          />
          {/* Primary Color Chip */}
          <label
            className="absolute top-0 left-0 w-5 h-5 rounded-sm border border-white shadow-md cursor-pointer block overflow-hidden z-10"
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
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={onSwapColors}
            title="Swap Colors (X)"
            className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
          <button
            onClick={onResetColors}
            title="Default Black & White (D)"
            className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
