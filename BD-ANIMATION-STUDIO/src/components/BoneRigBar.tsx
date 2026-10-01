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
  Sparkles,
  HelpCircle,
  Eraser,
  Layers,
  ChevronLeft,
  ChevronRight,
  Film,
} from 'lucide-react';
import { BoneRigState, BonePreset } from '../engine/boneEngine';
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
  const selectedBone = boneState.bones.find((b) => b.id === boneState.selectedBoneId);

  return (
    <div
      id="bone-rig-floating-bar"
      className="absolute top-3 left-1/2 -translate-x-1/2 bg-neutral-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl shadow-2xl p-2 z-40 text-neutral-200 select-none flex items-center gap-2 max-w-[96vw] overflow-x-auto scrollbar-thin"
    >
      {/* Title / Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/70 border border-cyan-500/40 rounded-lg text-cyan-300 font-semibold text-xs whitespace-nowrap">
        <BoneIcon className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span>Bone Rig (হাড় রিগিং):</span>
      </div>

      {/* Target Layer Selector */}
      {layers && layers.length > 0 && onSelectLayerId && (
        <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={activeLayerId || boneState.layerId}
            onChange={(e) => onSelectLayerId(e.target.value)}
            className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[130px] truncate"
            title="Choose which Layer/Object to rig with bones"
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
        <div className="flex items-center gap-1 pl-1 border-l border-neutral-800 bg-neutral-950/40 px-1.5 py-0.5 rounded-lg">
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <button
            onClick={() => onSelectFrame(Math.max(0, currentFrameIndex - 1))}
            disabled={currentFrameIndex === 0}
            className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white"
            title="Previous Frame"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-cyan-300 font-semibold px-1">
            F#{currentFrameIndex + 1}/{totalFrames}
          </span>
          <button
            onClick={() => onSelectFrame(Math.min(totalFrames - 1, currentFrameIndex + 1))}
            disabled={currentFrameIndex >= totalFrames - 1}
            className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 hover:text-white"
            title="Next Frame"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mode Switches: Pose vs Add Bone vs Edit Joints */}
      <div className="flex items-center gap-1 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800">
        <button
          onClick={() => onUpdateBoneState({ mode: 'pose' })}
          title="Pose & Move Mode: Drag joints or bones to bend, rotate, and move the object in any direction"
          className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
            boneState.mode === 'pose'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400/50'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>পোজ ও মুভ (Pose)</span>
        </button>

        <button
          onClick={() => onUpdateBoneState({ mode: 'add' })}
          title="Add Bone: Click & drag on canvas to draw a new connected bone"
          className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
            boneState.mode === 'add'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400/50'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>হাড় আঁকুন (Add Bone)</span>
        </button>

        <button
          onClick={() => onUpdateBoneState({ mode: 'edit' })}
          title="Edit Joints: Move joint positions to align with artwork without bending pixels"
          className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition-all ${
            boneState.mode === 'edit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400/50'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>জয়েন্ট সেট (Edit)</span>
        </button>
      </div>

      {/* Rig Presets Dropdown */}
      <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
        <span className="text-[11px] text-neutral-400 font-medium">প্রিসেট:</span>
        <select
          onChange={(e) => {
            if (e.target.value) {
              onApplyPreset(e.target.value as BonePreset);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="" disabled>
            + তৈরি রিগ প্রিসেট...
          </option>
          <option value="arm">🦾 হাত / পা (3-Joint Arm/Leg)</option>
          <option value="spine">🧍 শরীর ও মাথা (Spine & Head)</option>
          <option value="tail">🐍 কার্ভ লেজ / সাপ (4-Chain Tail)</option>
          <option value="pin">📌 সিঙ্গেল পিভট হাড় (Center Pin)</option>
        </select>
      </div>

      {/* Bone Strength / Influence Slider for Selected Bone */}
      {selectedBone && (
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-neutral-800 bg-neutral-950/50 px-2 py-0.5 rounded-lg">
          <span className="text-[11px] text-cyan-300 font-mono font-medium truncate max-w-[90px]">
            {selectedBone.name}
          </span>
          <span className="text-[10px] text-neutral-400">প্রভাব:</span>
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
            title="Bone Influence Radius: Adjust how far this bone influences nearby pixels"
            className="w-16 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
          <button
            onClick={onDeleteSelectedBone}
            title="Delete this bone"
            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Show Influence Capsule Toggle */}
      <button
        onClick={() => onUpdateBoneState({ showInfluence: !boneState.showInfluence })}
        title="Toggle bone influence radius visualization"
        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
          boneState.showInfluence
            ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
            : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-neutral-200'
        }`}
      >
        {boneState.showInfluence ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline text-[11px]">ইনফ্লুয়েন্স</span>
      </button>

      {/* Reset Pose Button */}
      <button
        onClick={onResetPose}
        title="Reset all bones and layer back to rest pose"
        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-xs font-medium flex items-center gap-1 transition-colors"
      >
        <RotateCcw className="w-3 h-3 text-amber-400" />
        <span>রিসেট পোজ</span>
      </button>

      {/* Clean Stray Vector Spheres Button (fixes accidental spheres) */}
      {hasStrayShapes && onClearStrayShapes && (
        <button
          onClick={onClearStrayShapes}
          title="Remove accidental 3D gradient spheres from canvas"
          className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1"
        >
          <Eraser className="w-3 h-3 text-amber-400" />
          <span>অপ্রয়োজনীয় স্ফিয়ার মুছুন</span>
        </button>
      )}

      {/* Action Buttons: Apply / Close Rig */}
      <div className="flex items-center gap-1.5 pl-1.5 border-l border-neutral-800">
        <button
          onClick={onApplyRig}
          title="Bake and permanently apply this bone pose to the layer (Enter)"
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-xs shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>✓ সেভ পোজ (Enter)</span>
        </button>

        <button
          onClick={onCancelRig}
          title="Close Bone Rig Mode (Esc - হাড় রিগিং বন্ধ করুন)"
          className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white rounded-lg border border-red-800/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-red-300" />
          <span>✕ হাড় বন্ধ করুন (Esc)</span>
        </button>
      </div>
    </div>
  );
};
