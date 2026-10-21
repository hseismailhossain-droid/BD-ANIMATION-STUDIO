import React from 'react';
import {
  Bone as BoneIcon,
  RotateCcw,
  Check,
  X,
  Plus,
  Move,
  Sliders,
  Eye,
  EyeOff,
  Trash2,
  Eraser,
  Layers,
  ChevronLeft,
  ChevronRight,
  Film,
  GripHorizontal,
  Crosshair,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { BoneRigState, BonePreset, BoneEngine } from '../engine/boneEngine';
import { Layer } from '../types';

interface BoneRigBarProps {
  boneState: BoneRigState;
  onUpdateBoneState: (updates: Partial<BoneRigState>) => void;
  onApplyRig: () => void;
  onCancelRig: () => void;
  onResetPose: () => void;
  onApplyPreset: (preset: BonePreset) => void;
  onDeleteSelectedBone: () => void;
  onClearStrayShapes?: () => void;
  hasStrayShapes?: boolean;
  layers?: Layer[];
  activeLayerId?: string;
  onSelectLayerId?: (id: string) => void;
  currentFrameIndex?: number;
  totalFrames?: number;
  onSelectFrame?: (index: number) => void;
}

export const BoneRigBar: React.FC<BoneRigBarProps> = ({
  boneState,
  onUpdateBoneState,
  onApplyRig,
  onCancelRig,
  onResetPose,
  onApplyPreset,
  onDeleteSelectedBone,
  onClearStrayShapes,
  hasStrayShapes,
  layers,
  activeLayerId,
  onSelectLayerId,
  currentFrameIndex = 0,
  totalFrames = 1,
  onSelectFrame,
}) => {
  // If a bone is selected, use it; otherwise fallback to the first bone so options are always visible
  const selectedBone =
    boneState.bones.find((b) => b.id === boneState.selectedBoneId) ||
    (boneState.bones.length > 0 ? boneState.bones[0] : null);

  // Responsive default position on the left-center so it never collides with Color Studio
  const getDefaultPosition = () => {
    if (typeof window === 'undefined') return { x: 56, y: 52 };
    const isSmall = window.innerWidth < 640;
    return {
      x: isSmall ? 8 : 56,
      y: isSmall ? 44 : 52,
    };
  };

  const [position, setPosition] = React.useState<{ x: number; y: number }>(getDefaultPosition);
  const [isCompact, setIsCompact] = React.useState(false);
  const isDragging = React.useRef(false);
  const dragOffset = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Clamp toolbar within screen bounds on resize
  React.useEffect(() => {
    const clampToScreen = () => {
      const barElem = document.getElementById('bone-rig-floating-bar');
      const w = barElem?.offsetWidth || 560;
      const h = barElem?.offsetHeight || 90;
      setPosition((prev) => {
        const maxX = Math.max(4, window.innerWidth - w - 4);
        const maxY = Math.max(40, window.innerHeight - h - 4);
        return {
          x: Math.min(maxX, Math.max(4, prev.x)),
          y: Math.min(maxY, Math.max(40, prev.y)),
        };
      });
    };

    window.addEventListener('resize', clampToScreen);
    window.addEventListener('orientationchange', clampToScreen);
    return () => {
      window.removeEventListener('resize', clampToScreen);
      window.removeEventListener('orientationchange', clampToScreen);
    };
  }, []);

  const handleStartDrag = (e: React.PointerEvent) => {
    // Only drag from non-interactive handles
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    e.preventDefault();
    isDragging.current = true;
    const bar = document.getElementById('bone-rig-floating-bar');
    if (bar) {
      const rect = bar.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDragging.current) return;
      const barElem = document.getElementById('bone-rig-floating-bar');
      const w = barElem?.offsetWidth || 560;
      const h = barElem?.offsetHeight || 90;
      const newX = Math.max(4, Math.min(window.innerWidth - w - 4, ev.clientX - dragOffset.current.x));
      const newY = Math.max(40, Math.min(window.innerHeight - h - 4, ev.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const onPointerUp = () => {
      isDragging.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleNudge = (dx: number, dy: number) => {
    if (boneState.bones.length === 0 || !boneState.bounds) return;
    const updatedBones = boneState.bones.map((b) => ({ ...b }));
    const updatedBounds = { ...boneState.bounds };
    const updatedGrid = boneState.grid ? JSON.parse(JSON.stringify(boneState.grid)) : null;
    BoneEngine.translateRigAndGrid(updatedBones, updatedGrid, updatedBounds, dx, dy);
    const { gridWeights } = BoneEngine.buildDeformationGrid(updatedBounds, updatedBones);
    onUpdateBoneState({
      bones: updatedBones,
      grid: updatedGrid,
      bounds: updatedBounds,
      gridWeights,
    });
  };

  const snapTo = (loc: 'top-left' | 'top-center' | 'bottom-left') => {
    const barElem = document.getElementById('bone-rig-floating-bar');
    const w = barElem?.offsetWidth || 560;
    const h = barElem?.offsetHeight || 90;

    if (loc === 'top-left') {
      setPosition({ x: 56, y: 52 });
    } else if (loc === 'top-center') {
      setPosition({ x: Math.max(8, (window.innerWidth - w) / 2), y: 52 });
    } else if (loc === 'bottom-left') {
      setPosition({ x: 56, y: Math.max(48, window.innerHeight - h - 20) });
    }
  };

  return (
    <div
      id="bone-rig-floating-bar"
      onPointerDown={handleStartDrag}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="absolute bg-neutral-900/98 backdrop-blur-md border border-cyan-500/70 rounded-2xl shadow-2xl p-2.5 sm:p-3 z-50 text-neutral-200 select-none flex flex-col gap-2 w-auto max-w-[calc(100vw-16px)] text-xs cursor-default ring-1 ring-cyan-500/40"
    >
      {/* ROW 1: Drag handle, 4 Modes, Presets, Center, Reset, Snap, Save, Close */}
      <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
        {/* Left: Move Handle & 4 Modes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Draggable Grip Handle */}
          <div
            className="flex items-center gap-1 text-cyan-400 bg-cyan-950/90 px-2 py-1 rounded-xl border border-cyan-700/80 font-bold text-[11px] cursor-grab active:cursor-grabbing select-none shrink-0 shadow-sm"
            title="Drag anywhere to reposition toolbar (টুলবারটি টেনে যেকোনো স্থানে সরান)"
          >
            <GripHorizontal className="w-3.5 h-3.5 text-cyan-300" />
            <span>Move</span>
          </div>

          {/* 4 Mode Segmented Buttons */}
          <div className="flex items-center bg-neutral-950 p-0.5 rounded-xl border border-neutral-800 shrink-0">
            <button
              onClick={() => onUpdateBoneState({ mode: 'pose' })}
              title="Pose Mode: Drag joints to bend, rotate & pose character (পোজ দিন)"
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer text-xs ${
                boneState.mode === 'pose'
                  ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400/50 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>Pose</span>
            </button>

            <button
              onClick={() => onUpdateBoneState({ mode: 'move-rig' })}
              title="Move Rig: Drag to move the whole skeleton & drawing together (পুরো কঙ্কাল ও ড্রয়িং সরান)"
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer text-xs ${
                boneState.mode === 'move-rig'
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-300 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Move className="w-3.5 h-3.5 text-amber-300" />
              <span>Rig</span>
            </button>

            <button
              onClick={() => onUpdateBoneState({ mode: 'add' })}
              title="Add Bone: Click & drag on canvas to add a new bone (নতুন হাড় যোগ করুন)"
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer text-xs ${
                boneState.mode === 'add'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+Bone</span>
            </button>

            <button
              onClick={() => onUpdateBoneState({ mode: 'edit' })}
              title="Edit Joints: Move joint anchor positions without deforming artwork (জয়েন্ট সরান)"
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer text-xs ${
                boneState.mode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Ready Presets Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0 bg-neutral-950/90 px-2 py-1 rounded-xl border border-neutral-800">
            <span className="text-neutral-400 text-[11px] font-medium">Preset:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onApplyPreset(e.target.value as BonePreset);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg px-2 py-0.5 text-xs cursor-pointer focus:outline-none"
              title="Ready Skeletal Armatures"
            >
              <option value="" disabled>Presets...</option>
              <option value="arm">🦾 2D Arm (Shoulder-Elbow-Hand)</option>
              <option value="spine">🧍 Spine (Body-Torso-Head)</option>
              <option value="tail">🐍 Tail / Tentacle (4-Bone)</option>
              <option value="pin">📌 Pin Point (Single Bone)</option>
            </select>
          </div>

          {/* Center on Art Button */}
          <button
            onClick={() => {
              if (boneState.bones.length > 0 && boneState.bounds) {
                const updatedBones = boneState.bones.map((b) => ({ ...b }));
                const updatedBounds = { ...boneState.bounds };
                const updatedGrid = boneState.grid ? JSON.parse(JSON.stringify(boneState.grid)) : null;
                BoneEngine.centerBonesToBounds(updatedBones, updatedBounds, updatedGrid);
                const { gridWeights } = BoneEngine.buildDeformationGrid(updatedBounds, updatedBones);
                onUpdateBoneState({
                  bones: updatedBones,
                  bounds: updatedBounds,
                  grid: updatedGrid,
                  gridWeights,
                });
              }
            }}
            title="Center Rig over Art (কঙ্কাল ড্রয়িংয়ের মাঝখানে বসান)"
            className="px-2.5 py-1 bg-neutral-800 hover:bg-cyan-700 text-cyan-300 hover:text-white rounded-lg border border-cyan-700/60 transition-all cursor-pointer shrink-0 flex items-center gap-1 text-xs font-medium"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Center</span>
          </button>

          {/* Reset Pose Button */}
          <button
            onClick={onResetPose}
            title="Reset Pose back to rest pose (পোজ রিসেট করুন)"
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-xs flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* Right: Snap, Save, Close, Compact Toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Quick Snap Positions */}
          <div className="flex items-center bg-neutral-950 px-1.5 py-0.5 rounded-lg border border-neutral-800 gap-1 text-[10px] text-neutral-400">
            <span className="text-neutral-500 font-semibold">Snap:</span>
            <button
              onClick={() => snapTo('top-left')}
              className="px-1.5 py-0.5 rounded hover:bg-neutral-800 text-cyan-300 cursor-pointer"
              title="Snap to Top Left"
            >
              Top-L
            </button>
            <button
              onClick={() => snapTo('top-center')}
              className="px-1.5 py-0.5 rounded hover:bg-neutral-800 text-cyan-300 cursor-pointer"
              title="Snap to Center Top"
            >
              Center
            </button>
            <button
              onClick={() => snapTo('bottom-left')}
              className="px-1.5 py-0.5 rounded hover:bg-neutral-800 text-cyan-300 cursor-pointer"
              title="Snap to Bottom Left"
            >
              Bottom
            </button>
          </div>

          {/* Save Pose Button */}
          <button
            onClick={onApplyRig}
            title="Save Pose (Enter)"
            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Close Rig Button */}
          <button
            onClick={onCancelRig}
            title="Close Rig (Esc)"
            className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white rounded-lg border border-red-800/80 transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs"
          >
            <X className="w-3.5 h-3.5 text-red-300" />
            <span>Close</span>
          </button>

          {/* Compact View Toggle */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg shrink-0 cursor-pointer"
            title={isCompact ? 'Expand to show all options' : 'Compact view'}
          >
            {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ROW 2: Bone Selector, Influence Slider, Nudge Controls, Layer Picker, Frame Picker */}
      {!isCompact && (
        <div className="flex items-center gap-2 pt-1.5 border-t border-neutral-800/80 flex-wrap text-xs">
          {/* Bone Selector & Influence Inspector (ALWAYS VISIBLE WHEN SKELETON EXISTS) */}
          {boneState.bones.length > 0 ? (
            <div className="flex items-center gap-2 bg-neutral-950/90 px-2.5 py-1 rounded-xl border border-neutral-800 shrink-0 flex-wrap">
              {/* Bone Chooser Dropdown */}
              <div className="flex items-center gap-1.5">
                <BoneIcon className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={selectedBone?.id || ''}
                  onChange={(e) => {
                    onUpdateBoneState({ selectedBoneId: e.target.value || null });
                  }}
                  className="bg-neutral-800 text-cyan-300 font-semibold border border-neutral-700 rounded-lg px-2 py-0.5 text-xs cursor-pointer focus:outline-none"
                  title="Select bone to adjust"
                >
                  {boneState.bones.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBone && (
                <>
                  <div className="h-3.5 w-px bg-neutral-800 mx-0.5" />

                  {/* Influence Radius Slider */}
                  <div className="flex items-center gap-1.5" title="Influence Radius (হাড়ের প্রভাবের পরিধি)">
                    <span className="text-neutral-400 text-[11px]">Influence:</span>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={selectedBone.strength}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = boneState.bones.map((b) =>
                          b.id === selectedBone.id ? { ...b, strength: val } : b
                        );
                        onUpdateBoneState({ bones: updated });
                      }}
                      className="w-20 sm:w-24 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                    <span className="font-mono text-cyan-300 font-bold text-[11px] min-w-[36px]">
                      {selectedBone.strength}px
                    </span>
                  </div>

                  {/* Show/Hide Influence Capsule */}
                  <button
                    onClick={() => onUpdateBoneState({ showInfluence: !boneState.showInfluence })}
                    className={`p-1 rounded-lg border text-xs flex items-center cursor-pointer ${
                      boneState.showInfluence
                        ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
                    }`}
                    title={boneState.showInfluence ? 'Hide Influence Circles' : 'Show Influence Circles'}
                  >
                    {boneState.showInfluence ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Delete Bone */}
                  <button
                    onClick={onDeleteSelectedBone}
                    title="Delete Selected Bone (হাড় মুছুন)"
                    className="p-1 text-red-400 hover:text-white hover:bg-red-900/60 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs bg-neutral-950/60 px-2.5 py-1 rounded-xl border border-neutral-850 shrink-0">
              <BoneIcon className="w-3.5 h-3.5 text-cyan-500/60" />
              <span>টিপস: হাড় তৈরি করতে ক্যানভাসে ড্র্যাগ করুন অথবা উপরে Preset সিলেক্ট করুন</span>
            </div>
          )}

          {/* 4 Nudge Directional Buttons - ALWAYS VISIBLE */}
          <div
            className="flex items-center bg-neutral-950 px-2 py-0.5 rounded-xl border border-neutral-800 shrink-0 gap-1"
            title="Nudge Rig Position (25px)"
          >
            <span className="text-neutral-400 text-[10px] mr-0.5 font-bold">Nudge:</span>
            <button
              onClick={() => handleNudge(-25, 0)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white cursor-pointer"
              title="Nudge Left"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleNudge(0, -25)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white cursor-pointer"
              title="Nudge Up"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleNudge(0, 25)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white cursor-pointer"
              title="Nudge Down"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleNudge(25, 0)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white cursor-pointer"
              title="Nudge Right"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Target Layer Selector */}
          {layers && layers.length > 0 && onSelectLayerId && (
            <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-xl border border-neutral-800 shrink-0">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={activeLayerId || boneState.layerId}
                onChange={(e) => onSelectLayerId(e.target.value)}
                className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg px-2 py-0.5 text-xs max-w-[120px] truncate cursor-pointer focus:outline-none"
                title="Target Layer for Skeletal Deformation"
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Frame Navigator */}
          {totalFrames > 1 && onSelectFrame && (
            <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-xl border border-neutral-800 shrink-0">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <button
                onClick={() => onSelectFrame(Math.max(0, currentFrameIndex - 1))}
                disabled={currentFrameIndex === 0}
                className="p-0.5 hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                title="Previous Frame"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="font-mono text-cyan-300 font-bold px-1 text-xs">
                F#{currentFrameIndex + 1}/{totalFrames}
              </span>
              <button
                onClick={() => onSelectFrame(Math.min(totalFrames - 1, currentFrameIndex + 1))}
                disabled={currentFrameIndex >= totalFrames - 1}
                className="p-0.5 hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                title="Next Frame"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Clean Stray Vector Spheres Button */}
          {hasStrayShapes && onClearStrayShapes && (
            <button
              onClick={onClearStrayShapes}
              title="Clear Extra Spheres"
              className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-300 rounded-xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Clear Stray</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
