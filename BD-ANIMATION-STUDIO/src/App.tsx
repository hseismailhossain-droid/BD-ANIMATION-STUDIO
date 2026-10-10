/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Layer,
  AnimationFrame,
  CanvasConfig,
  ViewportTransform,
  ToolType,
  BrushSettings,
  VectorSettings,
  VectorShape,
  VectorShapeType,
  VectorNode,
  SelectionArea,
  AnimationSettings,
  HistoryEntry,
  TextSettings,
  GradientSettings,
  CloneSettings,
  MeshSettings,
  ZoomSettings,
  ReferenceImageConfig,
  TweenConfig,
  AudioTrackItem,
  GridConfig,
} from './types';
import {
  DEFAULT_CANVAS_CONFIG,
  BRUSH_PRESET_CONFIGS,
} from './constants';
import { TopMenuBar } from './components/TopMenuBar';
import { ToolOptionsBar } from './components/ToolOptionsBar';
import { ToolsSidebar } from './components/ToolsSidebar';
import { LayersPanel } from './components/LayersPanel';
import { ColorPickerPanel } from './components/ColorPickerPanel';
import { AnimationTimeline } from './components/AnimationTimeline';
import { CanvasViewport } from './components/CanvasViewport';
import { NewCanvasModal } from './components/NewCanvasModal';
import { ResolutionModal } from './components/ResolutionModal';
import { ExportModal } from './components/ExportModal';
import { FiltersModal } from './components/FiltersModal';
import { BrushSettingsModal } from './components/BrushSettingsModal';
import { ReferenceImagePanel } from './components/ReferenceImagePanel';
import { TweenModal } from './components/TweenModal';
import { CinematicLightingModal } from './components/CinematicLightingModal';
import { SoundStudioModal } from './components/SoundStudioModal';
import { QuickVoiceRecorder } from './components/QuickVoiceRecorder';
import { DynamicIsland } from './components/DynamicIsland';
import { GridStudioModal } from './components/GridStudioModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { LightingEngine, LightingEffectConfig } from './engine/lightingEngine';
import { ExportEngine } from './engine/exportEngine';
import { LayerTransformState, WarpEngine, MeshWarpGrid, TransformMode } from './engine/warpEngine';
import { TransformWarpBar } from './components/TransformWarpBar';
import { BoneRigState, BoneEngine } from './engine/boneEngine';
import { BoneRigBar } from './components/BoneRigBar';
import { VectorEngine } from './engine/vectorEngine';
import { LightingGizmoBar, LightingGizmoState } from './components/LightingGizmoBar';
import { VideoFrameExtractor } from './engine/videoFrameExtractor';
import { ProjectStorage } from './engine/projectStorage';
import { ProjectsModal } from './components/ProjectsModal';
import { MovableStudioPanel } from './components/MovableStudioPanel';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Layers as LayersIcon,
  Film,
  Smartphone,
} from 'lucide-react';

export default function App() {
  // Document Canvas Config (supports HD, Full HD, 2K, 4K, 8K UHD)
  const [config, setConfig] = useState<CanvasConfig>(DEFAULT_CANVAS_CONFIG);

  // Viewport Transform (Zoom, Pan, Rotation)
  const [transform, setTransform] = useState<ViewportTransform>({
    zoom: 0.35,
    panX: 0,
    panY: 0,
    rotation: 0,
  });

  // Tools & Colors State
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [primaryColor, setPrimaryColor] = useState<string>('#0f172a');
  const [secondaryColor, setSecondaryColor] = useState<string>('#ffffff');
  const [recentColors, setRecentColors] = useState<string[]>([
    '#0f172a',
    '#ffffff',
    '#ef4444',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
  ]);

  // Brush and Vector Settings
  const [brushSettings, setBrushSettings] = useState<BrushSettings>(
    BRUSH_PRESET_CONFIGS.pen
  );
  const [vectorSettings, setVectorSettings] = useState<VectorSettings>({
    shapeType: 'path',
    strokeColor: '#0f172a',
    strokeWidth: 4,
    fillColor: '#3b82f6',
    hasFill: false,
    hasStroke: true,
    lineCap: 'round',
    lineJoin: 'round',
  });

  // Text Tool Settings (Photoshop T)
  const [textSettings, setTextSettings] = useState<TextSettings>({
    text: 'BD Animation Studio',
    fontSize: 72,
    fontFamily: 'Inter, sans-serif',
    bold: false,
    italic: false,
    align: 'left',
    color: '#0f172a',
  });

  // Gradient Tool Settings (Photoshop G)
  const [gradientSettings, setGradientSettings] = useState<GradientSettings>({
    type: 'linear',
    preset: 'fg-to-bg',
  });

  // Clone Stamp Settings (Photoshop S)
  const [cloneSettings, setCloneSettings] = useState<CloneSettings>({
    source: null,
    isSettingSource: false,
  });

  // Mesh Form Settings (Illustrator Gradient Mesh)
  const [meshSettings, setMeshSettings] = useState<MeshSettings>({
    rows: 4,
    cols: 4,
    preset: 'sphere-3d',
    wireframe: true,
    showMeshLines: true,
    showMeshPoints: true,
    selectedNode: null,
  });

  // Zoom Tool Settings (Photoshop Scrubby & Click Zoom)
  const [zoomSettings, setZoomSettings] = useState<ZoomSettings>({
    mode: 'in',
    scrubby: true,
  });

  // Advanced Pro Grid & Snapping System
  const [gridConfig, setGridConfig] = useState<GridConfig>(() => {
    try {
      const saved = localStorage.getItem('bd_anim_grid_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: false,
      type: 'square',
      size: 64,
      subdivisions: 4,
      color: '#06b6d4',
      opacity: 0.25,
      lineWidth: 1,
      snapToGrid: false,
      snapTolerance: 12,
    };
  });
  const [showGridModal, setShowGridModal] = useState<boolean>(false);

  const handleUpdateGridConfig = useCallback((updates: Partial<GridConfig>) => {
    setGridConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('bd_anim_grid_config', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleResetGridConfig = useCallback(() => {
    const defaults: GridConfig = {
      enabled: true,
      type: 'square',
      size: 64,
      subdivisions: 4,
      color: '#06b6d4',
      opacity: 0.25,
      lineWidth: 1,
      snapToGrid: false,
      snapTolerance: 12,
    };
    setGridConfig(defaults);
    try {
      localStorage.setItem('bd_anim_grid_config', JSON.stringify(defaults));
    } catch {}
  }, []);

  const handleToggleGrid = useCallback(() => {
    handleUpdateGridConfig({ enabled: !gridConfig.enabled });
  }, [gridConfig.enabled, handleUpdateGridConfig]);

  // Full Page Zen Drawing Mode (Pure canvas, hide distractions)
  const [isFullPageMode, setIsFullPageMode] = useState<boolean>(false);

  // Collapsible toolbars states (requested: hide top, bottom, left with edge pull tabs just like right dock!)
  const [topBarsVisible, setTopBarsVisible] = useState<boolean>(true);
  const [leftToolsVisible, setLeftToolsVisible] = useState<boolean>(true);
  const [bottomBarVisible, setBottomBarVisible] = useState<boolean>(true);

  // Right Dock (Color Studio + Layers Panel) visibility
  // On mobile & small screens, defaults to closed so the canvas gets maximum width!
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 && window.innerHeight >= 550;
    }
    return true;
  });
  const [rightPanelTab, setRightPanelTab] = useState<'both' | 'color' | 'layers'>('layers');

  const handleToggleRightPanel = useCallback((tab?: 'both' | 'color' | 'layers') => {
    setRightPanelOpen((prev) => {
      if (!prev) {
        setRightPanelTab(tab || 'layers');
        return true;
      }
      return false;
    });
  }, []);

  // Selected Vector Shape for Illustrator Direct Select Tool
  const [selectedVectorShapeId, setSelectedVectorShapeId] = useState<string | undefined>(undefined);

  // Active Vector Pen Path
  const [activeVectorPath, setActiveVectorPath] = useState<VectorNode[] | null>(null);

  // Selection state (Photoshop Marquee / Lasso)
  const [selection, setSelection] = useState<SelectionArea>({
    type: null,
    active: false,
  });

  // Paint bucket tolerance
  const [bucketTolerance, setBucketTolerance] = useState<number>(32);

  // Layer Transform & Mesh Form State (Translate, 360° Rotate, Front/Back, Up/Down/Left/Right, Mesh Warp)
  const [transformState, setTransformState] = useState<LayerTransformState>({
    isActive: false,
    layerId: 'layer_1',
    mode: 'mesh',
    translation: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    uniformScale: true,
    perspectiveCorners: [
      { x: 100, y: 100 },
      { x: 500, y: 100 },
      { x: 500, y: 500 },
      { x: 100, y: 500 },
    ],
    divisionX: 3,
    divisionY: 3,
    smoothness: 2,
    drawOrder: 1,
    meshGrid: null,
    selectedMeshNode: null,
    sourceSnapshot: null,
    bounds: { x: 100, y: 100, width: 400, height: 400 },
  });

  // 2D Skeletal Bone Rigging State (Blender / Moho Parity)
  const [boneRigState, setBoneRigState] = useState<BoneRigState>({
    isActive: false,
    layerId: '',
    bones: [],
    selectedBoneId: null,
    mode: 'pose',
    showInfluence: true,
    grid: null,
    gridWeights: [],
    sourceSnapshot: null,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Animation Settings
  const [animSettings, setAnimSettings] = useState<AnimationSettings>({
    fps: 12,
    isPlaying: false,
    currentFrameIndex: 0,
    loop: true,
    onionSkin: true,
    onionFramesBefore: 2,
    onionFramesAfter: 1,
    onionOpacity: 0.35,
  });

  // Modals state
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showNewCanvasModal, setShowNewCanvasModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showBrushStudioModal, setShowBrushStudioModal] = useState(false);
  const [showTweenModal, setShowTweenModal] = useState(false);
  const [showLightingModal, setShowLightingModal] = useState(false);
  const [showSoundStudio, setShowSoundStudio] = useState(false);
  const [showQuickVoiceRecorder, setShowQuickVoiceRecorder] = useState(false);
  const [dynamicIslandEnabled, setDynamicIslandEnabled] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(true);

  // Audio Tracks State (Sync with Animation Timeline & Sound Studio)
  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>([]);

  const handleAddAudioTrack = useCallback((track: AudioTrackItem) => {
    setAudioTracks((prev) => [...prev, track]);
  }, []);

  const handleDeleteAudioTrack = useCallback((id: string) => {
    setAudioTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUpdateAudioTrack = useCallback((id: string, updates: Partial<AudioTrackItem>) => {
    setAudioTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  // Floating Interactive Lighting Gizmo State
  const [lightingGizmoState, setLightingGizmoState] = useState<LightingGizmoState>({
    isActive: false,
    layerId: '',
    config: {
      preset: 'sun-blaze',
      name: 'Blazing Sun',
      sourceX: 400,
      sourceY: 350,
      radius: 900,
      coneAngle: 360,
      beamAngle: 45,
      intensity: 0.9,
      color: '#fef08a',
      secondaryColor: '#f97316',
      blendMode: 'screen',
      volumetricDust: false,
      dustDensity: 0,
      vignette: false,
      vignetteStrength: 0,
      applyScope: 'new-layer',
      discRadius: 90,
    },
  });

  // Reference Image Configuration
  const [referenceConfig, setReferenceConfig] = useState<ReferenceImageConfig>({
    url: null,
    name: '',
    opacity: 0.8,
    scale: 1,
    x: 20,
    y: 60,
    flippedH: false,
    visible: true,
    mode: 'window',
    open: false,
  });

  // Per-layer & per-frame bone armature registry (Moho / Blender armature scoping)
  const boneArmaturesRef = useRef<Record<string, any[]>>({});

  // Frame & Layers Data
  const [frames, setFrames] = useState<AnimationFrame[]>(() => {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = DEFAULT_CANVAS_CONFIG.width;
    bgCanvas.height = DEFAULT_CANVAS_CONFIG.height;

    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = DEFAULT_CANVAS_CONFIG.width;
    layerCanvas.height = DEFAULT_CANVAS_CONFIG.height;

    const bgLayer: Layer = {
      id: 'layer_bg',
      name: 'Background',
      type: 'raster',
      visible: true,
      locked: false,
      alphaLocked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: bgCanvas,
      vectors: [],
    };

    const drawLayer: Layer = {
      id: 'layer_1',
      name: 'Line Art 1',
      type: 'raster',
      visible: true,
      locked: false,
      alphaLocked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: layerCanvas,
      vectors: [],
    };

    return [
      {
        id: 'frame_1',
        name: 'Frame 1',
        layers: [bgLayer, drawLayer],
      },
    ];
  });

  const [activeLayerId, setActiveLayerId] = useState<string>('layer_1');

  // History stack for Undo/Redo
  const historyStack = useRef<HistoryEntry[]>([]);
  const historyIndex = useRef<number>(-1);
  const [, setHistoryTick] = useState(0);

  const currentFrame = frames[animSettings.currentFrameIndex] || frames[0];
  const activeLayer = currentFrame.layers.find((l) => l.id === activeLayerId) || currentFrame.layers[0];

  // Currently selected vector shape object
  const selectedVectorShape = useMemo(() => {
    if (!selectedVectorShapeId) return null;
    if (activeLayer?.type === 'vector') {
      const found = activeLayer.vectors.find((s) => s.id === selectedVectorShapeId);
      if (found) return found;
    }
    for (const l of currentFrame.layers) {
      if (l.type === 'vector') {
        const found = l.vectors.find((s) => s.id === selectedVectorShapeId);
        if (found) return found;
      }
    }
    return null;
  }, [selectedVectorShapeId, activeLayer, currentFrame]);

  // Persistent Auto-Save & Project Recovery State (IndexedDB)
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | null>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [autosaveToast, setAutosaveToast] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const autosaveTimerRef = useRef<any>(null);

  // 1. Auto-restore project from IndexedDB on initial mount
  useEffect(() => {
    let active = true;
    async function restoreSavedProject() {
      try {
        const saved = await ProjectStorage.loadAutosave();
        if (saved && active && saved.frames && saved.frames.length > 0) {
          if (saved.config) setConfig(saved.config);
          setFrames(saved.frames);
          if (saved.animSettings) {
            setAnimSettings((prev) => ({
              ...prev,
              fps: saved.animSettings.fps ?? prev.fps,
              loop: saved.animSettings.loop ?? prev.loop,
              currentFrameIndex: 0,
            }));
          }
          if (saved.audioTracks && saved.audioTracks.length > 0) {
            setAudioTracks(saved.audioTracks);
          }
          const firstFrame = saved.frames[0];
          if (firstFrame && firstFrame.layers.length > 0) {
            const topLayer = firstFrame.layers[firstFrame.layers.length - 1];
            setActiveLayerId(topLayer.id);
          }
          setAutosaveStatus('saved');
          setLastSavedTime(saved.timestamp);
          setAutosaveToast('✓ পূর্ববর্তী প্রজেক্ট লোড করা হয়েছে (Project Auto-Restored)');
          setTimeout(() => setAutosaveToast(null), 3500);
        }
      } catch (err) {
        console.warn('Autosave restoration note:', err);
      } finally {
        setTimeout(() => {
          isInitialMount.current = false;
        }, 1200);
      }
    }
    restoreSavedProject();
    return () => {
      active = false;
    };
  }, []);

  // 2. Debounced auto-save whenever frames, config, or animSettings change
  useEffect(() => {
    if (isInitialMount.current) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    setAutosaveStatus('saving');
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const success = await ProjectStorage.saveAutosave(frames, config, animSettings, audioTracks);
        if (success) {
          setAutosaveStatus('saved');
          setLastSavedTime(Date.now());
        }
      } catch (e) {
        console.warn('Autosave failed:', e);
      }
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [frames, config, animSettings.fps, animSettings.loop, audioTracks]);

  // 3. Manual Save handler (File menu -> Save, Ctrl+S)
  const handleSaveProject = useCallback(async () => {
    setAutosaveStatus('saving');
    try {
      const ok = await ProjectStorage.saveAutosave(frames, config, animSettings, audioTracks);
      if (ok) {
        setAutosaveStatus('saved');
        setLastSavedTime(Date.now());
        setAutosaveToast('✓ প্রজেক্ট সুরক্ষিতভাবে ডিভাইসে সেভ হয়েছে (Project Saved)');
        setTimeout(() => setAutosaveToast(null), 3000);
      }
    } catch (err) {
      console.warn('Manual save error:', err);
    }
  }, [frames, config, animSettings, audioTracks]);

  // 4. Download project as physical .ps8k file to computer/phone
  const handleDownloadProjectFile = useCallback(async () => {
    try {
      const payload = {
        version: '1.0',
        timestamp: Date.now(),
        config,
        animSettings: {
          fps: animSettings.fps,
          loop: animSettings.loop,
        },
        audioTracks,
        frames: frames.map((f) => ({
          id: f.id,
          name: f.name,
          layers: f.layers.map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            visible: l.visible,
            locked: l.locked,
            alphaLocked: l.alphaLocked,
            opacity: l.opacity,
            blendMode: l.blendMode,
            clippingMask: l.clippingMask,
            rasterData: l.type === 'raster' && l.canvas ? l.canvas.toDataURL('image/png') : null,
            vectors: l.vectors || [],
            mesh: l.mesh,
          })),
        })),
      };

      const jsonStr = JSON.stringify(payload);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (config.name || 'animation_project').replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, '_');
      a.download = `${safeName}.ps8k`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setAutosaveToast('✓ প্রজেক্ট ফাইল (.ps8k) ডাউনলোড হয়েছে!');
      setTimeout(() => setAutosaveToast(null), 3000);
    } catch (err) {
      console.warn('Failed to download project file:', err);
    }
  }, [config, animSettings, audioTracks, frames]);

  // 5. Restore autosave from IndexedDB on demand
  const handleRestoreAutosave = useCallback(async () => {
    try {
      const saved = await ProjectStorage.loadAutosave();
      if (saved && saved.frames && saved.frames.length > 0) {
        if (saved.config) setConfig(saved.config);
        setFrames(saved.frames);
        if (saved.animSettings) {
          setAnimSettings((prev) => ({
            ...prev,
            fps: saved.animSettings.fps ?? prev.fps,
            loop: saved.animSettings.loop ?? prev.loop,
            currentFrameIndex: 0,
          }));
        }
        if (saved.audioTracks && saved.audioTracks.length > 0) {
          setAudioTracks(saved.audioTracks);
        }
        const firstFrame = saved.frames[0];
        if (firstFrame && firstFrame.layers.length > 0) {
          const topLayer = firstFrame.layers[firstFrame.layers.length - 1];
          setActiveLayerId(topLayer.id);
        }
        setAutosaveStatus('saved');
        setLastSavedTime(saved.timestamp);
        setAutosaveToast('✓ পূর্ববর্তী অটোসেভ প্রজেক্ট সফলভাবে পুনরুদ্ধার হয়েছে!');
        setTimeout(() => setAutosaveToast(null), 3500);
      } else {
        setAutosaveToast('কোনো পূর্ববর্তী অটোসেভ প্রজেক্ট পাওয়া যায়নি');
        setTimeout(() => setAutosaveToast(null), 3000);
      }
    } catch (err) {
      console.warn('Autosave restoration error:', err);
      setAutosaveToast('প্রজেক্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে');
      setTimeout(() => setAutosaveToast(null), 3000);
    }
  }, []);

  // 6. Load a project retrieved from ProjectStorage library
  const handleLoadProjectFromStorage = useCallback(
    (project: {
      frames: AnimationFrame[];
      config: CanvasConfig;
      animSettings: { fps: number; loop: boolean };
      audioTracks?: AudioTrackItem[];
    }) => {
      if (project.config) setConfig(project.config);
      setFrames(project.frames);
      if (project.animSettings) {
        setAnimSettings((prev) => ({
          ...prev,
          fps: project.animSettings.fps ?? prev.fps,
          loop: project.animSettings.loop ?? prev.loop,
          currentFrameIndex: 0,
        }));
      }
      if (project.audioTracks && project.audioTracks.length > 0) {
        setAudioTracks(project.audioTracks);
      }
      const firstFrame = project.frames[0];
      if (firstFrame && firstFrame.layers.length > 0) {
        const topLayer = firstFrame.layers[firstFrame.layers.length - 1];
        setActiveLayerId(topLayer.id);
      }
      setAutosaveStatus('saved');
      setAutosaveToast('✓ প্রজেক্ট সফলভাবে ক্যানভাসে লোড করা হয়েছে!');
      setTimeout(() => setAutosaveToast(null), 3500);
    },
    []
  );

  /**
   * Helper to free canvas GPU/RAM memory buffer immediately
   */
  const freeSnapshotEntry = (entry?: HistoryEntry) => {
    if (entry?.snapshotCanvas) {
      entry.snapshotCanvas.width = 1;
      entry.snapshotCanvas.height = 1;
    }
  };

  /**
   * Safe transform updates (protects against NaN / Infinity from touch calculations)
   */
  const handleUpdateTransform = useCallback((updates: Partial<ViewportTransform>) => {
    setTransform((prev) => {
      const nextZoom =
        typeof updates.zoom === 'number' && Number.isFinite(updates.zoom) && updates.zoom > 0
          ? Math.max(0.05, Math.min(32, updates.zoom))
          : prev.zoom;
      const nextPanX =
        typeof updates.deltaPanX === 'number' && Number.isFinite(updates.deltaPanX)
          ? prev.panX + updates.deltaPanX
          : typeof updates.panX === 'number' && Number.isFinite(updates.panX)
          ? updates.panX
          : prev.panX;
      const nextPanY =
        typeof updates.deltaPanY === 'number' && Number.isFinite(updates.deltaPanY)
          ? prev.panY + updates.deltaPanY
          : typeof updates.panY === 'number' && Number.isFinite(updates.panY)
          ? updates.panY
          : prev.panY;
      const nextRot =
        typeof updates.rotation === 'number' && Number.isFinite(updates.rotation)
          ? updates.rotation
          : prev.rotation;
      return {
        zoom: nextZoom,
        panX: nextPanX,
        panY: nextPanY,
        rotation: nextRot,
      };
    });
  }, []);

  /**
   * Auto fit canvas zoom on start or dimension change (responsive for mobile and desktop)
   */
  const handleFitZoom = useCallback(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 800;
    const reservedWidth = isMobile ? 30 : isFullPageMode ? 80 : (rightPanelOpen ? 380 : 100);
    const reservedHeight = isMobile ? 100 : isFullPageMode ? 70 : 140;
    const screenW = Math.max(200, window.innerWidth - reservedWidth);
    const screenH = Math.max(200, window.innerHeight - reservedHeight);
    const fitZoom = Math.min(screenW / config.width, screenH / config.height) * (isMobile ? 0.92 : 0.88);
    setTransform({
      zoom: Math.max(0.05, Math.min(4, fitZoom)),
      panX: 0,
      panY: 0,
      rotation: 0,
    });
  }, [config.width, config.height, isFullPageMode, rightPanelOpen]);

  useEffect(() => {
    handleFitZoom();
  }, [handleFitZoom]);

  /**
   * Save snapshot for Undo (Memory-capped for 8K safety and smooth mobile performance)
   */
  const saveSnapshot = useCallback(
    (description: string) => {
      if (!activeLayer) return;

      let snapshotCanvas: HTMLCanvasElement | undefined;
      if (activeLayer.type === 'raster') {
        snapshotCanvas = document.createElement('canvas');
        snapshotCanvas.width = activeLayer.canvas.width;
        snapshotCanvas.height = activeLayer.canvas.height;
        const sCtx = snapshotCanvas.getContext('2d');
        if (sCtx) sCtx.drawImage(activeLayer.canvas, 0, 0);
      }

      const entry: HistoryEntry = {
        description,
        timestamp: Date.now(),
        frameIndex: animSettings.currentFrameIndex,
        layerId: activeLayer.id,
        snapshotCanvas,
        vectors: activeLayer.type === 'vector' ? JSON.parse(JSON.stringify(activeLayer.vectors)) : undefined,
      };

      // Cap memory for mobile & 8K canvases (7680x4320 = 132MB per snapshot)
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth <= 800 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

      const maxHistory = isMobile
        ? config.width >= 3840
          ? 3
          : 6
        : config.width >= 7680
        ? 6
        : config.width >= 3840
        ? 10
        : 20;

      // Free discarded future entries to prevent memory leaks
      const discarded = historyStack.current.slice(historyIndex.current + 1);
      discarded.forEach(freeSnapshotEntry);

      historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
      historyStack.current.push(entry);
      if (historyStack.current.length > maxHistory) {
        const removed = historyStack.current.shift();
        freeSnapshotEntry(removed);
      } else {
        historyIndex.current++;
      }
      setHistoryTick((t) => t + 1);
    },
    [activeLayer, animSettings.currentFrameIndex, config.width]
  );

  /**
   * Undo Action
   */
  const handleUndo = useCallback(() => {
    if (historyIndex.current < 0) return;
    const entry = historyStack.current[historyIndex.current];
    if (!entry) return;

    const frame = frames[entry.frameIndex];
    if (frame) {
      const layer = frame.layers.find((l) => l.id === entry.layerId);
      if (layer) {
        if (layer.type === 'raster' && entry.snapshotCanvas) {
          const lCtx = layer.canvas.getContext('2d');
          if (lCtx) {
            lCtx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
            lCtx.drawImage(entry.snapshotCanvas, 0, 0);
          }
        } else if (layer.type === 'vector' && entry.vectors) {
          layer.vectors = JSON.parse(JSON.stringify(entry.vectors));
        }
      }
    }
    historyIndex.current--;
    setHistoryTick((t) => t + 1);
    setFrames([...frames]);
  }, [frames]);

  /**
   * Redo Action
   */
  const handleRedo = useCallback(() => {
    if (historyIndex.current >= historyStack.current.length - 1) return;
    historyIndex.current++;
    const entry = historyStack.current[historyIndex.current];
    if (!entry) return;

    const frame = frames[entry.frameIndex];
    if (frame) {
      const layer = frame.layers.find((l) => l.id === entry.layerId);
      if (layer && layer.type === 'raster' && entry.snapshotCanvas) {
        const lCtx = layer.canvas.getContext('2d');
        if (lCtx) {
          lCtx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
          lCtx.drawImage(entry.snapshotCanvas, 0, 0);
        }
      } else if (layer && layer.type === 'vector' && entry.vectors) {
        layer.vectors = JSON.parse(JSON.stringify(entry.vectors));
      }
    }
    setHistoryTick((t) => t + 1);
    setFrames([...frames]);
  }, [frames]);

  /**
   * Animation Playback Loop (Fallback when Timeline is hidden; otherwise AnimationTimeline manages synced RAF)
   */
  useEffect(() => {
    if (!animSettings.isPlaying || frames.length <= 1 || timelineVisible) return;

    const interval = 1000 / animSettings.fps;
    const timer = setInterval(() => {
      setAnimSettings((prev) => {
        let next = prev.currentFrameIndex + 1;
        if (next >= frames.length) {
          next = prev.loop ? 0 : prev.currentFrameIndex;
        }
        return { ...prev, currentFrameIndex: next };
      });
    }, interval);

    return () => clearInterval(timer);
  }, [animSettings.isPlaying, animSettings.fps, animSettings.loop, frames.length, timelineVisible]);

  /**
   * Color Handlers
   */
  const handlePrimaryColorChange = (hex: string, commitRecent = false) => {
    setPrimaryColor(hex);
    setVectorSettings((prev: VectorSettings) => ({ ...prev, strokeColor: hex }));
    setTextSettings((prev) => ({ ...prev, color: hex }));
    if (commitRecent) {
      setRecentColors((prev) => {
        if (prev[0] === hex) return prev;
        return [hex, ...prev.filter((c) => c !== hex).slice(0, 9)];
      });
    }
  };

  const handleSwapColors = () => {
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  };

  const handleResetColors = () => {
    setPrimaryColor('#0f172a');
    setSecondaryColor('#ffffff');
  };

  /**
   * Apply Resolution & Canvas Rescale (HD to 8K Engine)
   */
  const handleApplyResolution = (
    newWidth: number,
    newHeight: number,
    newDpi: number,
    mode: 'rescale' | 'crop'
  ) => {
    const oldWidth = config.width;
    const oldHeight = config.height;

    setFrames((prevFrames) =>
      prevFrames.map((frame) => ({
        ...frame,
        layers: frame.layers.map((layer) => {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = newWidth;
          newCanvas.height = newHeight;
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            if (mode === 'rescale') {
              ctx.drawImage(
                layer.canvas,
                0,
                0,
                oldWidth,
                oldHeight,
                0,
                0,
                newWidth,
                newHeight
              );
            } else {
              const dx = (newWidth - oldWidth) / 2;
              const dy = (newHeight - oldHeight) / 2;
              ctx.drawImage(layer.canvas, dx, dy);
            }
          }

          // Scale or offset vector shapes
          const scaleX = newWidth / oldWidth;
          const scaleY = newHeight / oldHeight;
          const dx = (newWidth - oldWidth) / 2;
          const dy = (newHeight - oldHeight) / 2;

          const updatedVectors = layer.vectors.map((vec) => {
            const v = JSON.parse(JSON.stringify(vec)) as VectorShape;
            if (mode === 'rescale') {
              if (v.x !== undefined) v.x *= scaleX;
              if (v.y !== undefined) v.y *= scaleY;
              if (v.width !== undefined) v.width *= scaleX;
              if (v.height !== undefined) v.height *= scaleY;
              if (v.strokeWidth !== undefined)
                v.strokeWidth = Math.max(1, v.strokeWidth * ((scaleX + scaleY) / 2));
              if (v.points) {
                for (const pt of v.points) {
                  pt.x *= scaleX;
                  pt.y *= scaleY;
                }
              }
            } else {
              if (v.x !== undefined) v.x += dx;
              if (v.y !== undefined) v.y += dy;
              if (v.points) {
                for (const pt of v.points) {
                  pt.x += dx;
                  pt.y += dy;
                }
              }
            }
            return v;
          });

          return {
            ...layer,
            canvas: newCanvas,
            vectors: updatedVectors,
          };
        }),
      }))
    );

    setConfig((prev) => ({
      ...prev,
      width: newWidth,
      height: newHeight,
      dpi: newDpi,
      name:
        newWidth >= 7680
          ? '8K UHD Canvas'
          : newWidth >= 3840
          ? '4K Canvas'
          : newWidth >= 2560
          ? '2K QHD Canvas'
          : 'HD Canvas',
    }));

    historyStack.current = [];
    historyIndex.current = -1;
  };

  /**
   * Canvas Flips & Rotations (Photoshop Parity)
   */
  const handleFlipCanvasH = () => {
    saveSnapshot('Flip Canvas Horizontal');
    for (const frame of frames) {
      for (const layer of frame.layers) {
        if (layer.type === 'raster') {
          const temp = document.createElement('canvas');
          temp.width = config.width;
          temp.height = config.height;
          const tCtx = temp.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(layer.canvas, 0, 0);
            const lCtx = layer.canvas.getContext('2d');
            if (lCtx) {
              lCtx.clearRect(0, 0, config.width, config.height);
              lCtx.save();
              lCtx.translate(config.width, 0);
              lCtx.scale(-1, 1);
              lCtx.drawImage(temp, 0, 0);
              lCtx.restore();
            }
          }
        } else if (layer.type === 'vector') {
          for (const s of layer.vectors) {
            if (s.x !== undefined && s.width !== undefined) {
              s.x = config.width - (s.x + s.width);
            }
            if (s.points) {
              for (const pt of s.points) {
                pt.x = config.width - pt.x;
              }
            }
          }
        }
      }
    }
    setFrames([...frames]);
  };

  const handleFlipCanvasV = () => {
    saveSnapshot('Flip Canvas Vertical');
    for (const frame of frames) {
      for (const layer of frame.layers) {
        if (layer.type === 'raster') {
          const temp = document.createElement('canvas');
          temp.width = config.width;
          temp.height = config.height;
          const tCtx = temp.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(layer.canvas, 0, 0);
            const lCtx = layer.canvas.getContext('2d');
            if (lCtx) {
              lCtx.clearRect(0, 0, config.width, config.height);
              lCtx.save();
              lCtx.translate(0, config.height);
              lCtx.scale(1, -1);
              lCtx.drawImage(temp, 0, 0);
              lCtx.restore();
            }
          }
        } else if (layer.type === 'vector') {
          for (const s of layer.vectors) {
            if (s.y !== undefined && s.height !== undefined) {
              s.y = config.height - (s.y + s.height);
            }
            if (s.points) {
              for (const pt of s.points) {
                pt.y = config.height - pt.y;
              }
            }
          }
        }
      }
    }
    setFrames([...frames]);
  };

  const handleRotateCanvas90 = () => {
    saveSnapshot('Rotate Canvas 90°');
    const newWidth = config.height;
    const newHeight = config.width;

    setFrames((prev) =>
      prev.map((frame) => ({
        ...frame,
        layers: frame.layers.map((layer) => {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = newWidth;
          newCanvas.height = newHeight;
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.translate(newWidth, 0);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(layer.canvas, 0, 0);
            ctx.restore();
          }
          return { ...layer, canvas: newCanvas };
        }),
      }))
    );

    setConfig((prev) => ({
      ...prev,
      width: newWidth,
      height: newHeight,
    }));
  };

  const handleRotateCanvas270 = () => {
    saveSnapshot('Rotate Canvas 270°');
    const newWidth = config.height;
    const newHeight = config.width;

    setFrames((prev) =>
      prev.map((frame) => ({
        ...frame,
        layers: frame.layers.map((layer) => {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = newWidth;
          newCanvas.height = newHeight;
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.translate(0, newHeight);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(layer.canvas, 0, 0);
            ctx.restore();
          }
          return { ...layer, canvas: newCanvas };
        }),
      }))
    );

    setConfig((prev) => ({
      ...prev,
      width: newWidth,
      height: newHeight,
    }));
  };

  /**
   * Layer Transform & Nudge (Photoshop V / Transform tool)
   */
  const handleNudgeLayer = (dx: number, dy: number, moveAllLayers?: boolean) => {
    if (dx === 0 && dy === 0) {
      setFrames([...frames]);
      return;
    }
    saveSnapshot(moveAllLayers ? 'Nudge All Layers' : 'Nudge Layer');
    const layersToMove = moveAllLayers
      ? currentFrame.layers
      : activeLayer.linked
      ? currentFrame.layers.filter((l) => l.linked || l.id === activeLayer.id)
      : [activeLayer];

    const intDx = Math.round(dx);
    const intDy = Math.round(dy);

    for (const lyr of layersToMove) {
      if (lyr.locked) continue;
      if (lyr.type === 'raster') {
        const temp = document.createElement('canvas');
        temp.width = config.width;
        temp.height = config.height;
        const tCtx = temp.getContext('2d');
        if (tCtx) {
          tCtx.imageSmoothingEnabled = true;
          tCtx.imageSmoothingQuality = 'high';
          tCtx.drawImage(lyr.canvas, 0, 0);
          const lCtx = lyr.canvas.getContext('2d');
          if (lCtx) {
            lCtx.imageSmoothingEnabled = true;
            lCtx.imageSmoothingQuality = 'high';
            lCtx.clearRect(0, 0, config.width, config.height);
            lCtx.drawImage(temp, intDx, intDy);
          }
        }
        // Thermal / GC memory release on mobile
        temp.width = 1;
        temp.height = 1;
      } else if (lyr.type === 'vector') {
        for (const s of lyr.vectors) {
          if (s.x !== undefined) s.x += intDx;
          if (s.y !== undefined) s.y += intDy;
          if (s.points) {
            for (const pt of s.points) {
              pt.x += intDx;
              pt.y += intDy;
              if (pt.handleIn) {
                pt.handleIn.x += intDx;
                pt.handleIn.y += intDy;
              }
              if (pt.handleOut) {
                pt.handleOut.x += intDx;
                pt.handleOut.y += intDy;
              }
            }
          }
        }
      }
    }
    setFrames([...frames]);
  };

  /**
   * One-Tap Master Toggle: Hide All Layers or Show All Layers (Atomic update)
   */
  const handleToggleAllLayersVisibility = useCallback((forcedState?: boolean) => {
    const allVisible = currentFrame.layers.every((l) => l.visible);
    const nextVisible = forcedState !== undefined ? forcedState : !allVisible;
    saveSnapshot(nextVisible ? 'Show All Layers' : 'Hide All Layers');
    currentFrame.layers = currentFrame.layers.map((l) => ({ ...l, visible: nextVisible }));
    setFrames([...frames]);
  }, [currentFrame, frames, saveSnapshot]);

  const handleFlipLayerH = () => {
    saveSnapshot('Flip Layer Horizontal');
    if (activeLayer.type === 'raster') {
      const temp = document.createElement('canvas');
      temp.width = config.width;
      temp.height = config.height;
      const tCtx = temp.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(activeLayer.canvas, 0, 0);
        const lCtx = activeLayer.canvas.getContext('2d');
        if (lCtx) {
          lCtx.clearRect(0, 0, config.width, config.height);
          lCtx.save();
          lCtx.translate(config.width, 0);
          lCtx.scale(-1, 1);
          lCtx.drawImage(temp, 0, 0);
          lCtx.restore();
        }
      }
    }
    setFrames([...frames]);
  };

  const handleFlipLayerV = () => {
    saveSnapshot('Flip Layer Vertical');
    if (activeLayer.type === 'raster') {
      const temp = document.createElement('canvas');
      temp.width = config.width;
      temp.height = config.height;
      const tCtx = temp.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(activeLayer.canvas, 0, 0);
        const lCtx = activeLayer.canvas.getContext('2d');
        if (lCtx) {
          lCtx.clearRect(0, 0, config.width, config.height);
          lCtx.save();
          lCtx.translate(0, config.height);
          lCtx.scale(1, -1);
          lCtx.drawImage(temp, 0, 0);
          lCtx.restore();
        }
      }
    }
    setFrames([...frames]);
  };

  const handleRotateLayer90 = () => {
    saveSnapshot('Rotate Layer 90°');
    if (activeLayer.type === 'raster') {
      const temp = document.createElement('canvas');
      temp.width = config.width;
      temp.height = config.height;
      const tCtx = temp.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(activeLayer.canvas, 0, 0);
        const lCtx = activeLayer.canvas.getContext('2d');
        if (lCtx) {
          lCtx.clearRect(0, 0, config.width, config.height);
          lCtx.save();
          lCtx.translate(config.width / 2, config.height / 2);
          lCtx.rotate(Math.PI / 2);
          lCtx.drawImage(temp, -config.width / 2, -config.height / 2);
          lCtx.restore();
        }
      }
    }
    setFrames([...frames]);
  };

  const handleCenterLayer = () => {
    handleNudgeLayer(0, 0);
  };

  /**
   * Initialize Layer Transformation / Mesh Form
   */
  const initLayerTransform = useCallback(
    (targetLayerId?: string, targetMode?: TransformMode) => {
      const lId = targetLayerId || activeLayerId;
      const targetLayer = currentFrame.layers.find((l) => l.id === lId) || activeLayer;
      if (!targetLayer) return;

      const snapshot = document.createElement('canvas');
      snapshot.width = config.width;
      snapshot.height = config.height;
      const sCtx = snapshot.getContext('2d');
      if (sCtx) {
        if (targetLayer.type === 'raster') {
          sCtx.drawImage(targetLayer.canvas, 0, 0);
        } else if (targetLayer.type === 'vector') {
          VectorEngine.renderShapes(sCtx, targetLayer.vectors, undefined, false);
        }
      }
      const bounds = WarpEngine.getContentBounds(snapshot);

      const divX = transformState.divisionX || 3;
      const divY = transformState.divisionY || 3;
      const grid = WarpEngine.createMeshGrid(bounds, divX, divY);

      setTransformState((prev) => ({
        ...prev,
        isActive: true,
        layerId: targetLayer.id,
        mode: targetMode || (activeTool === 'mesh' ? 'mesh' : prev.mode || 'translate-scale'),
        bounds,
        translation: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        sourceSnapshot: snapshot,
        meshGrid: grid,
        selectedMeshNode: null,
        perspectiveCorners: [
          { x: bounds.x, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          { x: bounds.x, y: bounds.y + bounds.height },
        ],
      }));
    },
    [activeLayerId, currentFrame.layers, activeLayer, config.width, config.height, transformState.divisionX, transformState.divisionY, activeTool]
  );

  const handleApplyTransform = useCallback(() => {
    if (!transformState.isActive) return;
    if (transformState.sourceSnapshot) {
      const layer = currentFrame.layers.find((l) => l.id === transformState.layerId) || activeLayer;
      if (layer) {
        saveSnapshot('Apply Layer Transform & Mesh Warp');
        layer.canvas.width = config.width;
        layer.canvas.height = config.height;
        const ctx = layer.canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, config.width, config.height);
          if (transformState.mode === 'mesh' && transformState.meshGrid) {
            WarpEngine.renderMeshWarp(
              ctx,
              transformState.sourceSnapshot,
              transformState.meshGrid,
              transformState.smoothness
            );
          } else if (transformState.mode === 'perspective') {
            WarpEngine.renderPerspectiveWarp(
              ctx,
              transformState.sourceSnapshot,
              transformState.bounds,
              transformState.perspectiveCorners
            );
          } else {
            WarpEngine.renderTranslateScaleRotate(
              ctx,
              transformState.sourceSnapshot,
              transformState.bounds,
              transformState.translation,
              transformState.scale,
              transformState.rotation
            );
          }
        }
        layer.type = 'raster';
        layer.vectors = [];
      }
    }

    setTransformState((prev) => ({ ...prev, isActive: false, sourceSnapshot: null, meshGrid: null }));
    setActiveTool((prevTool) => (prevTool === 'transform' || prevTool === 'mesh' ? 'brush' : prevTool));
    setFrames([...frames]);
  }, [transformState, currentFrame.layers, activeLayer, saveSnapshot, config.width, config.height, frames]);

  const handleCancelTransform = useCallback(() => {
    if (transformState.sourceSnapshot) {
      const layer = currentFrame.layers.find((l) => l.id === transformState.layerId) || activeLayer;
      if (layer && layer.type === 'raster') {
        const ctx = layer.canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, config.width, config.height);
          ctx.drawImage(transformState.sourceSnapshot, 0, 0);
        }
      }
    }
    setTransformState((prev) => ({ ...prev, isActive: false, sourceSnapshot: null, meshGrid: null }));
    setActiveTool((prevTool) => (prevTool === 'transform' || prevTool === 'mesh' ? 'brush' : prevTool));
    setFrames([...frames]);
  }, [transformState, currentFrame.layers, activeLayer, config.width, config.height, frames]);

  const handleMoveLayerOrder = useCallback(
    (direction: 'up' | 'down' | 'top' | 'bottom') => {
      const lId = transformState.layerId || activeLayerId;
      const curIndex = currentFrame.layers.findIndex((l) => l.id === lId);
      if (curIndex < 0) return;

      saveSnapshot(`Move Layer Order (${direction})`);
      const newLayers = [...currentFrame.layers];
      const [targetLayer] = newLayers.splice(curIndex, 1);

      if (direction === 'top') {
        newLayers.push(targetLayer);
      } else if (direction === 'bottom') {
        newLayers.unshift(targetLayer);
      } else if (direction === 'up') {
        const newIdx = Math.min(newLayers.length, curIndex + 1);
        newLayers.splice(newIdx, 0, targetLayer);
      } else if (direction === 'down') {
        const newIdx = Math.max(0, curIndex - 1);
        newLayers.splice(newIdx, 0, targetLayer);
      }

      setFrames((prev) =>
        prev.map((f, i) => (i === animSettings.currentFrameIndex ? { ...f, layers: newLayers } : f))
      );
    },
    [transformState.layerId, activeLayerId, currentFrame.layers, saveSnapshot, animSettings.currentFrameIndex]
  );

  const handleChangeDivisionX = useCallback((delta: number) => {
    setTransformState((prev) => {
      const newDivX = Math.max(2, Math.min(12, prev.divisionX + delta));
      if (newDivX === prev.divisionX) return prev;
      const newGrid = WarpEngine.resampleMeshGrid(
        prev.meshGrid,
        prev.bounds,
        newDivX,
        prev.divisionY
      );
      return {
        ...prev,
        divisionX: newDivX,
        meshGrid: newGrid,
        selectedMeshNode: null,
      };
    });
  }, []);

  const handleChangeDivisionY = useCallback((delta: number) => {
    setTransformState((prev) => {
      const newDivY = Math.max(2, Math.min(12, prev.divisionY + delta));
      if (newDivY === prev.divisionY) return prev;
      const newGrid = WarpEngine.resampleMeshGrid(
        prev.meshGrid,
        prev.bounds,
        prev.divisionX,
        newDivY
      );
      return {
        ...prev,
        divisionY: newDivY,
        meshGrid: newGrid,
        selectedMeshNode: null,
      };
    });
  }, []);

  const handleApplyCurvePreset = useCallback(
    (preset: 'arc-up' | 'arc-down' | 'arc-left' | 'arc-right' | 'bulge' | 'pinch' | 'wave' | 'flag' | 's-curve') => {
      setTransformState((prev) => {
        if (!prev.meshGrid) return prev;
        const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
        WarpEngine.applyCurvePreset(gridCopy, preset, 0.35);
        return {
          ...prev,
          meshGrid: gridCopy,
        };
      });
    },
    []
  );

  const handleResetMeshGrid = useCallback(() => {
    setTransformState((prev) => {
      if (!prev.meshGrid) return prev;
      const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
      WarpEngine.resetMeshGrid(gridCopy);
      return {
        ...prev,
        rotation: 0,
        meshGrid: gridCopy,
      };
    });
  }, []);

  const handleNudge = useCallback((dx: number, dy: number) => {
    setTransformState((prev) => {
      if (prev.mode === 'mesh' && prev.meshGrid) {
        const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
        for (const row of gridCopy.nodes) {
          for (const node of row) {
            node.x += dx;
            node.y += dy;
          }
        }
        return { ...prev, meshGrid: gridCopy };
      }
      return {
        ...prev,
        translation: { x: prev.translation.x + dx, y: prev.translation.y + dy },
      };
    });
  }, []);

  const handleRotateDegrees = useCallback((deg: number) => {
    setTransformState((prev) => {
      if (prev.mode === 'mesh' && prev.meshGrid) {
        const delta = deg - prev.rotation;
        const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
        WarpEngine.rotateMeshGrid(gridCopy, delta);
        return { ...prev, rotation: deg, meshGrid: gridCopy };
      }
      return { ...prev, rotation: deg };
    });
  }, []);

  const handleRotateStep = useCallback((deltaDeg: number) => {
    setTransformState((prev) => {
      let r = prev.rotation + deltaDeg;
      if (r > 180) r -= 360;
      if (r < -180) r += 360;
      if (prev.mode === 'mesh' && prev.meshGrid) {
        const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
        WarpEngine.rotateMeshGrid(gridCopy, deltaDeg);
        return { ...prev, rotation: r, meshGrid: gridCopy };
      }
      return { ...prev, rotation: r };
    });
  }, []);

  const handleFlipH = useCallback(() => {
    setTransformState((prev) => {
      if (prev.mode === 'mesh' && prev.meshGrid) {
        const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
        const cx = prev.bounds.x + prev.bounds.width / 2;
        for (const row of gridCopy.nodes) {
          for (const node of row) {
            node.x = cx - (node.x - cx);
          }
        }
        return { ...prev, meshGrid: gridCopy };
      }
      return {
        ...prev,
        scale: { ...prev.scale, x: prev.scale.x * -1 },
      };
    });
  }, []);

  const handleFlipV = useCallback(() => {
    setTransformState((prev) => {
      if (prev.mode === 'mesh' && prev.meshGrid) {
        const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
        const cy = prev.bounds.y + prev.bounds.height / 2;
        for (const row of gridCopy.nodes) {
          for (const node of row) {
            node.y = cy - (node.y - cy);
          }
        }
        return { ...prev, meshGrid: gridCopy };
      }
      return {
        ...prev,
        scale: { ...prev.scale, y: prev.scale.y * -1 },
      };
    });
  }, []);

  const handleCenterTransformLayer = useCallback(() => {
    setTransformState((prev) => {
      const targetCenterX = config.width / 2;
      const targetCenterY = config.height / 2;
      if (prev.mode === 'mesh' && prev.meshGrid) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const row of prev.meshGrid.nodes) {
          for (const node of row) {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.y > maxY) maxY = node.y;
          }
        }
        const currentCenterX = (minX + maxX) / 2;
        const currentCenterY = (minY + maxY) / 2;
        const dx = targetCenterX - currentCenterX;
        const dy = targetCenterY - currentCenterY;
        const gridCopy = JSON.parse(JSON.stringify(prev.meshGrid)) as MeshWarpGrid;
        for (const row of gridCopy.nodes) {
          for (const node of row) {
            node.x += dx;
            node.y += dy;
          }
        }
        return { ...prev, meshGrid: gridCopy };
      }
      const currentCenterX = prev.bounds.x + prev.bounds.width / 2;
      const currentCenterY = prev.bounds.y + prev.bounds.height / 2;
      return {
        ...prev,
        translation: {
          x: targetCenterX - currentCenterX,
          y: targetCenterY - currentCenterY,
        },
      };
    });
  }, [config.width, config.height]);

  // Check if any stray 3D gradient spheres exist from accidental clicks
  const hasStrayShapes = currentFrame.layers.some(
    (l) => l.vectors && l.vectors.some((v) => v.type === 'mesh')
  );

  const handleClearStrayShapes = useCallback(() => {
    saveSnapshot('Clear Accidental 3D Spheres');
    setFrames((prev) =>
      prev.map((f) => ({
        ...f,
        layers: f.layers.map((l) => {
          if (!l.vectors) return l;
          return {
            ...l,
            vectors: l.vectors.filter((v) => v.type !== 'mesh'),
          };
        }),
      }))
    );
  }, [saveSnapshot]);

  // Start 2D Skeletal Armature Rigging (Moho / Blender Parity - Scoped per Layer & Frame)
  const handleStartBoneRig = useCallback(
    (targetLayerId?: string, frameIdx?: number) => {
      const fIndex = frameIdx !== undefined ? frameIdx : animSettings.currentFrameIndex;
      const targetFrame = frames[fIndex] || currentFrame;
      const lId = targetLayerId || activeLayerId;
      const targetLayer = targetFrame.layers.find((l) => l.id === lId) || activeLayer;
      if (!targetLayer) return;

      // Close layer transform if active
      if (transformState.isActive) {
        setTransformState((prev) => ({ ...prev, isActive: false, sourceSnapshot: null }));
      }

      // Snapshot layer visuals
      const snapshot = document.createElement('canvas');
      snapshot.width = config.width;
      snapshot.height = config.height;
      const sCtx = snapshot.getContext('2d');
      if (sCtx) {
        if (targetLayer.type === 'raster') {
          sCtx.drawImage(targetLayer.canvas, 0, 0);
        } else if (targetLayer.type === 'vector') {
          VectorEngine.renderShapes(sCtx, targetLayer.vectors, undefined, false);
        }
      }

      const bounds = WarpEngine.getContentBounds(snapshot);
      const armatureKey = `${fIndex}_${targetLayer.id}`;
      const cachedBones = boneArmaturesRef.current[armatureKey];
      const bones = cachedBones && cachedBones.length > 0
        ? JSON.parse(JSON.stringify(cachedBones))
        : BoneEngine.createRigPreset('arm', bounds);

      boneArmaturesRef.current[armatureKey] = bones;
      const { grid, gridWeights } = BoneEngine.buildDeformationGrid(bounds, bones, 5, 5);

      setBoneRigState({
        isActive: true,
        layerId: targetLayer.id,
        bones,
        selectedBoneId: bones[0]?.id || null,
        mode: 'pose',
        showInfluence: true,
        grid,
        gridWeights,
        sourceSnapshot: snapshot,
        bounds,
      });

      setActiveTool('bone');
    },
    [activeLayerId, currentFrame, frames, activeLayer, config.width, config.height, transformState.isActive, animSettings.currentFrameIndex]
  );

  const handleSelectBoneLayer = useCallback((targetLayerId: string) => {
    // 1. Cache current bones for the active layer
    const currentKey = `${animSettings.currentFrameIndex}_${boneRigState.layerId || activeLayerId}`;
    if (boneRigState.bones && boneRigState.bones.length > 0) {
      boneArmaturesRef.current[currentKey] = boneRigState.bones;
    }

    setActiveLayerId(targetLayerId);
    handleStartBoneRig(targetLayerId, animSettings.currentFrameIndex);
  }, [animSettings.currentFrameIndex, boneRigState.layerId, boneRigState.bones, activeLayerId, handleStartBoneRig]);

  const handleSelectBoneFrame = useCallback((frameIdx: number) => {
    // 1. Cache current bones for the current frame
    const currentKey = `${animSettings.currentFrameIndex}_${boneRigState.layerId || activeLayerId}`;
    if (boneRigState.bones && boneRigState.bones.length > 0) {
      boneArmaturesRef.current[currentKey] = boneRigState.bones;
    }

    setAnimSettings((prev) => ({ ...prev, currentFrameIndex: frameIdx }));
    handleStartBoneRig(boneRigState.layerId || activeLayerId, frameIdx);
  }, [animSettings.currentFrameIndex, boneRigState.layerId, boneRigState.bones, activeLayerId, handleStartBoneRig]);

  const handleApplyBoneRig = useCallback(() => {
    if (!boneRigState.isActive) {
      setBoneRigState((prev) => ({ ...prev, isActive: false, sourceSnapshot: null, bones: [], grid: null }));
      setActiveTool((prevTool) => (prevTool === 'bone' ? 'brush' : prevTool));
      return;
    }

    if (boneRigState.sourceSnapshot && boneRigState.grid) {
      const layer = currentFrame.layers.find((l) => l.id === boneRigState.layerId) || activeLayer;
      if (layer) {
        saveSnapshot('Apply Bone Rigging & Deformation');

        layer.canvas.width = config.width;
        layer.canvas.height = config.height;
        const ctx = layer.canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, config.width, config.height);
          WarpEngine.renderMeshWarp(ctx, boneRigState.sourceSnapshot, boneRigState.grid, 2);
        }

        layer.type = 'raster';
        layer.vectors = [];

        // Keep bones saved in cache so user can continue posing in other frames!
        const armatureKey = `${animSettings.currentFrameIndex}_${layer.id}`;
        boneArmaturesRef.current[armatureKey] = boneRigState.bones;
      }
    }

    setBoneRigState((prev) => ({ ...prev, isActive: false, sourceSnapshot: null, bones: [], grid: null }));
    setActiveTool((prevTool) => (prevTool === 'bone' ? 'brush' : prevTool));
    setFrames([...frames]);
  }, [boneRigState, currentFrame.layers, activeLayer, saveSnapshot, config.width, config.height, frames, animSettings.currentFrameIndex]);

  const handleCancelBoneRig = useCallback(() => {
    setBoneRigState((prev) => ({ ...prev, isActive: false, sourceSnapshot: null, bones: [], grid: null }));
    setActiveTool((prevTool) => (prevTool === 'bone' ? 'brush' : prevTool));
  }, []);

  const handleResetBonePose = useCallback(() => {
    if (!boneRigState.isActive) return;
    const resetBones = boneRigState.bones.map((b) => ({ ...b }));
    BoneEngine.resetToRestPose(resetBones);
    const { gridWeights } = BoneEngine.buildDeformationGrid(boneRigState.bounds, resetBones);
    const uniformGrid = WarpEngine.createMeshGrid(boneRigState.bounds, 5, 5);
    setBoneRigState((prev) => ({
      ...prev,
      bones: resetBones,
      grid: uniformGrid,
      gridWeights,
    }));
  }, [boneRigState.isActive, boneRigState.bones, boneRigState.bounds]);

  const handleApplyBonePreset = useCallback(
    (preset: 'arm' | 'spine' | 'tail' | 'pin') => {
      if (!boneRigState.isActive) return;
      const newBones = BoneEngine.createRigPreset(preset, boneRigState.bounds);
      const { grid, gridWeights } = BoneEngine.buildDeformationGrid(
        boneRigState.bounds,
        newBones,
        5,
        5
      );
      setBoneRigState((prev) => ({
        ...prev,
        bones: newBones,
        selectedBoneId: newBones[0]?.id || null,
        grid,
        gridWeights,
      }));
    },
    [boneRigState.isActive, boneRigState.bounds]
  );

  const handleDeleteSelectedBone = useCallback(() => {
    if (!boneRigState.isActive || !boneRigState.selectedBoneId) return;
    const remaining = boneRigState.bones.filter((b) => b.id !== boneRigState.selectedBoneId);
    const { gridWeights } = BoneEngine.buildDeformationGrid(boneRigState.bounds, remaining);
    setBoneRigState((prev) => ({
      ...prev,
      bones: remaining,
      selectedBoneId: remaining[0]?.id || null,
      gridWeights,
    }));
  }, [boneRigState.isActive, boneRigState.selectedBoneId, boneRigState.bones, boneRigState.bounds]);

  // Object Keyframe Scale & Transform Animation, Camera Zoom In/Out & Background Runner Engine
  const handleApplyTween = useCallback((tweenConfig: TweenConfig) => {
    const {
      mode = 'layer-tween',
      layerId,
      startFrameIndex,
      endFrameIndex,
      startScale,
      endScale,
      startPosX,
      endPosX,
      startPosY,
      endPosY,
      startRotation,
      endRotation,
      easing,
      bgDirection = 'left',
      bgSpeedPixels,
      bgSeamlessLoop = true,
    } = tweenConfig;

    if (startFrameIndex >= endFrameIndex) return;

    const actionTitle =
      mode === 'camera-zoom'
        ? `Camera Zoom (${Math.round(startScale * 100)}% to ${Math.round(endScale * 100)}%, Frames ${startFrameIndex + 1}-${endFrameIndex + 1})`
        : mode === 'bg-runner'
        ? `Background Runner (${bgDirection}, Frames ${startFrameIndex + 1}-${endFrameIndex + 1})`
        : `Scale & Transform Tween (Frames ${startFrameIndex + 1}-${endFrameIndex + 1})`;

    saveSnapshot(actionTitle);

    // Ensure frames exist up to endFrameIndex
    let updatedFrames = [...frames];
    while (updatedFrames.length <= endFrameIndex) {
      const lastFrame = updatedFrames[updatedFrames.length - 1];
      const newLayers: Layer[] = lastFrame.layers.map((l, i) => {
        const c = document.createElement('canvas');
        c.width = config.width;
        c.height = config.height;
        const ctx = c.getContext('2d');
        if (ctx && l.type === 'raster') {
          ctx.drawImage(l.canvas, 0, 0);
        }
        return {
          ...l,
          id: `layer_${Date.now()}_${i}_${updatedFrames.length}`,
          canvas: c,
          vectors: JSON.parse(JSON.stringify(l.vectors || [])),
        };
      });
      updatedFrames.push({
        id: `frame_${Date.now()}_${updatedFrames.length}`,
        name: `Frame ${updatedFrames.length + 1}`,
        layers: newLayers,
      });
    }

    const startFrame = updatedFrames[startFrameIndex];
    const totalSteps = endFrameIndex - startFrameIndex;

    const ease = (t: number) => {
      if (easing === 'easeIn') return t * t;
      if (easing === 'easeOut') return t * (2 - t);
      if (easing === 'easeInOut') return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      return t;
    };

    // 1. FULL SCENE CAMERA ZOOM IN / ZOOM OUT (All Layers)
    if (mode === 'camera-zoom' && layerId === 'all') {
      const layerSnapshots = new Map<string, HTMLCanvasElement>();
      for (const lyr of startFrame.layers) {
        const snap = document.createElement('canvas');
        snap.width = config.width;
        snap.height = config.height;
        const sCtx = snap.getContext('2d');
        if (sCtx) {
          if (lyr.type === 'raster') {
            sCtx.drawImage(lyr.canvas, 0, 0);
          } else if (lyr.type === 'vector') {
            VectorEngine.renderShapes(sCtx, lyr.vectors, undefined, false);
          }
        }
        layerSnapshots.set(lyr.id, snap);
      }

      const centerX = config.width / 2;
      const centerY = config.height / 2;
      const startX = startPosX ?? 0;
      const endX = endPosX ?? 0;
      const startY = startPosY ?? 0;
      const endY = endPosY ?? 0;
      const startRot = startRotation ?? 0;
      const endRot = endRotation ?? 0;

      for (let f = startFrameIndex; f <= endFrameIndex; f++) {
        const rawProgress = (f - startFrameIndex) / totalSteps;
        const progress = ease(rawProgress);

        const currentScale = startScale + (endScale - startScale) * progress;
        const currentDx = startX + (endX - startX) * progress;
        const currentDy = startY + (endY - startY) * progress;
        const currentRotRad = ((startRot + (endRot - startRot) * progress) * Math.PI) / 180;

        const frame = updatedFrames[f];
        for (let i = 0; i < frame.layers.length; i++) {
          const targetLyr = frame.layers[i];
          const sourceIndex = startFrame.layers.findIndex((l) => l.id === targetLyr.id);
          const origLyr = sourceIndex >= 0 ? startFrame.layers[sourceIndex] : startFrame.layers[i];
          const snap = origLyr ? layerSnapshots.get(origLyr.id) : null;
          if (!snap) continue;

          const ctx = targetLyr.canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, config.width, config.height);
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.translate(centerX + currentDx, centerY + currentDy);
            ctx.rotate(currentRotRad);
            ctx.scale(currentScale, currentScale);
            ctx.translate(-centerX, -centerY);
            ctx.drawImage(snap, 0, 0);
            ctx.restore();
          }
          targetLyr.type = 'raster';
          targetLyr.vectors = [];
        }
      }
    }
    // 2. BACKGROUND RUNNER & PARALLAX SCROLL (Continuous running background behind character)
    else if (mode === 'bg-runner') {
      const sourceLayer = startFrame.layers.find((l) => l.id === layerId) || startFrame.layers[0];
      if (!sourceLayer) return;

      const sourceSnapshot = document.createElement('canvas');
      sourceSnapshot.width = config.width;
      sourceSnapshot.height = config.height;
      const sCtx = sourceSnapshot.getContext('2d');
      if (sCtx) {
        if (sourceLayer.type === 'raster') {
          sCtx.drawImage(sourceLayer.canvas, 0, 0);
        } else if (sourceLayer.type === 'vector') {
          VectorEngine.renderShapes(sCtx, sourceLayer.vectors, undefined, false);
        }
      }

      const totalDist = bgSpeedPixels || Math.round(config.width * 0.6);

      for (let f = startFrameIndex; f <= endFrameIndex; f++) {
        const progress = (f - startFrameIndex) / totalSteps;
        const shift = Math.round(totalDist * progress);

        let dx = 0;
        let dy = 0;
        if (bgDirection === 'left') dx = -shift;
        else if (bgDirection === 'right') dx = shift;
        else if (bgDirection === 'up') dy = -shift;
        else if (bgDirection === 'down') dy = shift;

        const frame = updatedFrames[f];
        let targetLayer = frame.layers.find((l) => l.id === layerId);
        if (!targetLayer) {
          const sourceIndex = startFrame.layers.findIndex((l) => l.id === layerId);
          targetLayer = frame.layers[sourceIndex] || frame.layers[0];
        }
        if (!targetLayer) continue;

        const ctx = targetLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, config.width, config.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          if (bgSeamlessLoop) {
            const W = config.width;
            const H = config.height;
            if (bgDirection === 'left' || bgDirection === 'right') {
              const modX = ((dx % W) + W) % W;
              ctx.drawImage(sourceSnapshot, modX - W, 0);
              ctx.drawImage(sourceSnapshot, modX, 0);
              ctx.drawImage(sourceSnapshot, modX + W, 0);
            } else {
              const modY = ((dy % H) + H) % H;
              ctx.drawImage(sourceSnapshot, 0, modY - H);
              ctx.drawImage(sourceSnapshot, 0, modY);
              ctx.drawImage(sourceSnapshot, 0, modY + H);
            }
          } else {
            ctx.drawImage(sourceSnapshot, dx, dy);
          }
        }
        targetLayer.type = 'raster';
        targetLayer.vectors = [];
      }
    }
    // 3. SINGLE OBJECT / CHARACTER TWEEN
    else {
      const sourceLayer = startFrame.layers.find((l) => l.id === layerId) || startFrame.layers[0];
      if (!sourceLayer) return;

      const sourceSnapshot = document.createElement('canvas');
      sourceSnapshot.width = config.width;
      sourceSnapshot.height = config.height;
      const sCtx = sourceSnapshot.getContext('2d');
      if (sCtx) {
        if (sourceLayer.type === 'raster') {
          sCtx.drawImage(sourceLayer.canvas, 0, 0);
        } else if (sourceLayer.type === 'vector') {
          VectorEngine.renderShapes(sCtx, sourceLayer.vectors, undefined, false);
        }
      }
      const bounds = WarpEngine.getContentBounds(sourceSnapshot);
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      const startX = startPosX ?? 0;
      const endX = endPosX ?? 0;
      const startY = startPosY ?? 0;
      const endY = endPosY ?? 0;
      const startRot = startRotation ?? 0;
      const endRot = endRotation ?? 0;

      for (let f = startFrameIndex; f <= endFrameIndex; f++) {
        const rawProgress = (f - startFrameIndex) / totalSteps;
        const progress = ease(rawProgress);

        const currentScale = startScale + (endScale - startScale) * progress;
        const currentDx = startX + (endX - startX) * progress;
        const currentDy = startY + (endY - startY) * progress;
        const currentRotDeg = startRot + (endRot - startRot) * progress;
        const currentRotRad = (currentRotDeg * Math.PI) / 180;

        const frame = updatedFrames[f];
        let targetLayer = frame.layers.find((l) => l.id === layerId);
        if (!targetLayer) {
          const sourceIndex = startFrame.layers.findIndex((l) => l.id === layerId);
          targetLayer = frame.layers[sourceIndex] || frame.layers[0];
        }
        if (!targetLayer) continue;

        const ctx = targetLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, config.width, config.height);
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.translate(centerX + currentDx, centerY + currentDy);
          ctx.rotate(currentRotRad);
          ctx.scale(currentScale, currentScale);
          ctx.translate(-centerX, -centerY);
          ctx.drawImage(sourceSnapshot, 0, 0);
          ctx.restore();
        }
        targetLayer.type = 'raster';
        targetLayer.vectors = [];
      }
    }

    setFrames(updatedFrames);
    setAnimSettings((prev) => ({ ...prev, currentFrameIndex: startFrameIndex }));
  }, [frames, config.width, config.height, saveSnapshot]);

  /**
   * Cinematic Lighting & Environmental VFX Applicator
   */
  const handleApplyLighting = useCallback((fxConfig: LightingEffectConfig, liveMove?: boolean) => {
    if (liveMove) {
      let targetId = activeLayerId;
      if (fxConfig.applyScope === 'new-layer') {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = config.width;
        newCanvas.height = config.height;
        const newLayer: Layer = {
          id: `layer_light_${Date.now()}`,
          name: `💡 ${fxConfig.name}`,
          type: 'raster',
          visible: true,
          locked: false,
          alphaLocked: false,
          opacity: 1,
          blendMode: (fxConfig.blendMode as any) || 'screen',
          canvas: newCanvas,
          vectors: [],
        };
        targetId = newLayer.id;
        setFrames((prev) =>
          prev.map((f, i) =>
            i === animSettings.currentFrameIndex
              ? { ...f, layers: [...f.layers, newLayer] }
              : f
          )
        );
        setActiveLayerId(newLayer.id);
      }

      setLightingGizmoState({
        isActive: true,
        layerId: targetId,
        config: fxConfig,
      });
      return;
    }

    saveSnapshot(`Apply Lighting: ${fxConfig.name}`);

    if (fxConfig.applyScope === 'new-layer') {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = config.width;
      newCanvas.height = config.height;
      const ctx = newCanvas.getContext('2d');
      if (ctx) {
        LightingEngine.renderEffect(ctx, config.width, config.height, fxConfig);
      }

      const lightLayer: Layer = {
        id: `layer_light_${Date.now()}`,
        name: `💡 ${fxConfig.name}`,
        type: 'raster',
        visible: true,
        locked: false,
        alphaLocked: false,
        opacity: 1,
        blendMode: (fxConfig.blendMode as any) || 'screen',
        canvas: newCanvas,
        vectors: [],
      };

      setFrames((prev) =>
        prev.map((f, i) =>
          i === animSettings.currentFrameIndex
            ? { ...f, layers: [...f.layers, lightLayer] }
            : f
        )
      );
      setActiveLayerId(lightLayer.id);
    } else if (fxConfig.applyScope === 'current-layer') {
      const currFrame = frames[animSettings.currentFrameIndex];
      const targetLayer = currFrame?.layers.find((l) => l.id === activeLayerId);
      if (targetLayer && targetLayer.type === 'raster') {
        const ctx = targetLayer.canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.globalCompositeOperation = fxConfig.blendMode || 'source-over';
          LightingEngine.renderEffect(ctx, config.width, config.height, fxConfig);
          ctx.restore();
        }
        setFrames([...frames]);
      }
    } else if (fxConfig.applyScope === 'all-frames') {
      // Apply lighting effect across all animation frames for animated scenes!
      setFrames((prev) =>
        prev.map((frame, fi) => {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = config.width;
          newCanvas.height = config.height;
          const ctx = newCanvas.getContext('2d');
          if (ctx) {
            LightingEngine.renderEffect(ctx, config.width, config.height, fxConfig);
          }
          const lightLayer: Layer = {
            id: `layer_light_${Date.now()}_${fi}`,
            name: `💡 ${fxConfig.name}`,
            type: 'raster',
            visible: true,
            locked: false,
            alphaLocked: false,
            opacity: 1,
            blendMode: (fxConfig.blendMode as any) || 'screen',
            canvas: newCanvas,
            vectors: [],
          };
          return {
            ...frame,
            layers: [...frame.layers, lightLayer],
          };
        })
      );
    }
  }, [saveSnapshot, config.width, config.height, animSettings.currentFrameIndex, frames, activeLayerId]);

  const handleCommitLightingGizmo = useCallback(() => {
    if (!lightingGizmoState.isActive) return;
    saveSnapshot(`Fix Light: ${lightingGizmoState.config.name}`);

    const targetLayer = currentFrame.layers.find((l) => l.id === (lightingGizmoState.layerId || activeLayerId));
    if (targetLayer && targetLayer.type === 'raster') {
      const ctx = targetLayer.canvas.getContext('2d');
      if (ctx) {
        LightingEngine.renderEffect(ctx, config.width, config.height, lightingGizmoState.config);
      }
    }
    setLightingGizmoState((prev) => ({ ...prev, isActive: false }));
    setFrames([...frames]);
  }, [lightingGizmoState, currentFrame.layers, activeLayerId, config.width, config.height, frames, saveSnapshot]);

  const handleCancelLightingGizmo = useCallback(() => {
    setLightingGizmoState((prev) => ({ ...prev, isActive: false }));
  }, []);

  /**
   * Selection Actions (Photoshop Marquee Parity)
   */
  const handleSelectAll = () => {
    setSelection({
      type: 'rect',
      rect: { x: 0, y: 0, width: config.width, height: config.height },
      active: true,
    });
  };

  const handleDeselect = () => {
    setSelection({ type: null, active: false });
  };

  const handleInvertSelection = () => {
    if (!selection.active || !selection.rect) {
      handleSelectAll();
      return;
    }
    // Swap dimensions or invert bounds
    setSelection({
      type: 'rect',
      rect: {
        x: config.width - (selection.rect.x + selection.rect.width),
        y: config.height - (selection.rect.y + selection.rect.height),
        width: selection.rect.width,
        height: selection.rect.height,
      },
      active: true,
    });
  };

  const handleFillSelection = () => {
    if (activeLayer.locked || activeLayer.type !== 'raster') return;
    saveSnapshot('Fill Selection');
    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = primaryColor;
    if (selection.active && selection.rect) {
      ctx.fillRect(
        selection.rect.x,
        selection.rect.y,
        selection.rect.width,
        selection.rect.height
      );
    } else {
      ctx.fillRect(0, 0, config.width, config.height);
    }
    ctx.restore();
    setFrames([...frames]);
  };

  const handleDeleteSelection = () => {
    if (activeLayer.locked) return;

    if (activeLayer.type === 'raster') {
      saveSnapshot('Clear Content');
      const ctx = activeLayer.canvas.getContext('2d');
      if (!ctx) return;
      if (selection.active && selection.rect) {
        ctx.clearRect(
          selection.rect.x,
          selection.rect.y,
          selection.rect.width,
          selection.rect.height
        );
      } else {
        ctx.clearRect(0, 0, config.width, config.height);
      }
      setFrames([...frames]);
    } else if (activeLayer.type === 'vector' && selectedVectorShapeId) {
      handleDeleteSelectedShape();
    }
  };

  /**
   * Vector Shape Operations (Illustrator Parity)
   */
  const handleUpdateSelectedShape = (updates: Partial<VectorShape>) => {
    if (!selectedVectorShapeId) return;
    setFrames((prevFrames) =>
      prevFrames.map((frame, idx) => {
        if (idx !== animSettings.currentFrameIndex) return frame;
        return {
          ...frame,
          layers: frame.layers.map((l) => {
            if (l.type !== 'vector') return l;
            return {
              ...l,
              vectors: l.vectors.map((s) => (s.id === selectedVectorShapeId ? { ...s, ...updates } : s)),
            };
          }),
        };
      })
    );
  };

  const handleScaleSelectedShape = useCallback(
    (scaleX: number, scaleY: number, originX?: number, originY?: number) => {
      if (!selectedVectorShape) return;
      saveSnapshot('Scale Vector Shape');
      VectorEngine.scaleShape(selectedVectorShape, scaleX, scaleY, originX, originY);
      setFrames([...frames]);
    },
    [selectedVectorShape, saveSnapshot, frames]
  );

  const handleDeleteSelectedShape = useCallback(() => {
    if (!selectedVectorShapeId) return;
    saveSnapshot('Delete Vector Shape');
    const targetId = selectedVectorShapeId;
    setSelectedVectorShapeId(undefined);
    setFrames((prevFrames) =>
      prevFrames.map((frame, idx) => {
        if (idx !== animSettings.currentFrameIndex) return frame;
        return {
          ...frame,
          layers: frame.layers.map((l) => {
            if (l.type !== 'vector') return l;
            return {
              ...l,
              vectors: l.vectors.filter((s) => s.id !== targetId),
            };
          }),
        };
      })
    );
  }, [selectedVectorShapeId, saveSnapshot, animSettings.currentFrameIndex]);

  const handleDuplicateSelectedShape = useCallback(() => {
    let shapeToDup = selectedVectorShape;
    let targetLayerId = activeLayer.id;
    if (!shapeToDup && selectedVectorShapeId) {
      for (const l of currentFrame.layers) {
        if (l.type === 'vector') {
          const found = l.vectors.find((s) => s.id === selectedVectorShapeId);
          if (found) {
            shapeToDup = found;
            targetLayerId = l.id;
            break;
          }
        }
      }
    }
    if (!shapeToDup) return;
    saveSnapshot('Duplicate Vector Shape');
    const dup: VectorShape = JSON.parse(JSON.stringify(shapeToDup));
    dup.id = `shape_${Date.now()}`;
    VectorEngine.moveShape(dup, 24, 24);

    setSelectedVectorShapeId(dup.id);
    setActiveTool('vector-select');
    setFrames((prevFrames) =>
      prevFrames.map((frame, idx) => {
        if (idx !== animSettings.currentFrameIndex) return frame;
        return {
          ...frame,
          layers: frame.layers.map((l) => {
            if (l.id === targetLayerId && l.type === 'vector') {
              return {
                ...l,
                vectors: [...l.vectors, dup],
              };
            }
            return l;
          }),
        };
      })
    );
  }, [selectedVectorShape, selectedVectorShapeId, currentFrame, activeLayer, saveSnapshot, animSettings.currentFrameIndex]);

  /**
   * Ensure Vector Layer exists and is active for vector & mesh tools
   */
  const handleEnsureVectorLayer = (): Layer => {
    if (activeLayer.type === 'vector' && !activeLayer.locked) {
      return activeLayer;
    }
    const existing = currentFrame.layers.find((l) => l.type === 'vector' && !l.locked);
    if (existing) {
      setActiveLayerId(existing.id);
      return existing;
    }
    const newCanvas = document.createElement('canvas');
    newCanvas.width = config.width;
    newCanvas.height = config.height;
    const newLayer: Layer = {
      id: `layer_vector_${Date.now()}`,
      name: `Vector Layer ${currentFrame.layers.filter((l) => l.type === 'vector').length + 1}`,
      type: 'vector',
      visible: true,
      locked: false,
      alphaLocked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: newCanvas,
      vectors: [],
    };
    currentFrame.layers = [...currentFrame.layers, newLayer];
    setFrames([...frames]);
    setActiveLayerId(newLayer.id);
    return newLayer;
  };

  /**
   * Ensure Raster Layer exists and is active for raster brushes, pencils, erasers & paint bucket
   * Seamlessly allows user to draw with Glow Pencil / Brushes even when a vector layer was selected!
   */
  const handleEnsureRasterLayer = (): Layer => {
    // 1. If active layer is already an unlocked raster, use it
    if (activeLayer && activeLayer.type === 'raster' && !activeLayer.locked) {
      return activeLayer;
    }
    // 2. Find any existing unlocked artwork raster layer (prefer above background)
    const existingArt = currentFrame.layers.find(
      (l) => l.type === 'raster' && !l.locked && l.id !== 'layer_bg' && l.name.toLowerCase() !== 'background'
    );
    if (existingArt) {
      setActiveLayerId(existingArt.id);
      return existingArt;
    }
    const anyRaster = currentFrame.layers.find((l) => l.type === 'raster' && !l.locked);
    if (anyRaster) {
      setActiveLayerId(anyRaster.id);
      return anyRaster;
    }
    // 3. Create a fresh raster drawing layer
    const newCanvas = document.createElement('canvas');
    newCanvas.width = config.width;
    newCanvas.height = config.height;
    const newLayer: Layer = {
      id: `layer_art_${Date.now()}`,
      name: `Art Layer ${currentFrame.layers.filter((l) => l.type === 'raster').length + 1}`,
      type: 'raster',
      visible: true,
      locked: false,
      alphaLocked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: newCanvas,
      vectors: [],
    };
    currentFrame.layers = [...currentFrame.layers, newLayer];
    setFrames([...frames]);
    setActiveLayerId(newLayer.id);
    return newLayer;
  };

  /**
   * Object & Pixels Clipboard System (Photoshop & Illustrator Parity)
   */
  const clipboardRef = useRef<{
    type: 'vector' | 'raster';
    shape?: VectorShape;
    rasterCanvas?: HTMLCanvasElement;
  } | null>(null);

  const [hasClipboardContent, setHasClipboardContent] = useState<boolean>(false);

  const handleCopyObject = useCallback(() => {
    // 1. Copy Selected Vector Object
    let shapeToCopy = selectedVectorShape;
    if (!shapeToCopy && selectedVectorShapeId) {
      for (const l of currentFrame.layers) {
        if (l.type === 'vector') {
          const found = l.vectors.find((s) => s.id === selectedVectorShapeId);
          if (found) {
            shapeToCopy = found;
            break;
          }
        }
      }
    }

    if (shapeToCopy) {
      clipboardRef.current = {
        type: 'vector',
        shape: JSON.parse(JSON.stringify(shapeToCopy)),
      };
      setHasClipboardContent(true);
      return;
    }

    // 2. Copy Selected Marquee Pixel Area
    if (selection.active && selection.rect && activeLayer.type === 'raster') {
      const { x, y, width: w, height: h } = selection.rect;
      if (w > 0 && h > 0) {
        const temp = document.createElement('canvas');
        temp.width = w;
        temp.height = h;
        const tCtx = temp.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(activeLayer.canvas, x, y, w, h, 0, 0, w, h);
          clipboardRef.current = {
            type: 'raster',
            rasterCanvas: temp,
          };
          setHasClipboardContent(true);
        }
      }
      return;
    }

    // 3. Fallback: Copy active layer pixels or vector content
    if (activeLayer) {
      if (activeLayer.type === 'raster') {
        const temp = document.createElement('canvas');
        temp.width = activeLayer.canvas.width;
        temp.height = activeLayer.canvas.height;
        const tCtx = temp.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(activeLayer.canvas, 0, 0);
          clipboardRef.current = {
            type: 'raster',
            rasterCanvas: temp,
          };
          setHasClipboardContent(true);
        }
      } else if (activeLayer.type === 'vector' && activeLayer.vectors.length > 0) {
        clipboardRef.current = {
          type: 'vector',
          shape: JSON.parse(JSON.stringify(activeLayer.vectors[activeLayer.vectors.length - 1])),
        };
        setHasClipboardContent(true);
      }
    }
  }, [selectedVectorShape, selectedVectorShapeId, currentFrame, activeLayer, selection]);

  const handlePasteObject = useCallback(() => {
    if (!clipboardRef.current) return;

    if (clipboardRef.current.type === 'vector' && clipboardRef.current.shape) {
      saveSnapshot('Paste Vector Object');
      const targetLayer = handleEnsureVectorLayer();
      const newShape: VectorShape = JSON.parse(JSON.stringify(clipboardRef.current.shape));
      newShape.id = `shape_${Date.now()}`;
      VectorEngine.moveShape(newShape, 24, 24);

      setSelectedVectorShapeId(newShape.id);
      setActiveTool('vector-select');
      setFrames((prevFrames) =>
        prevFrames.map((frame, idx) => {
          if (idx !== animSettings.currentFrameIndex) return frame;
          return {
            ...frame,
            layers: frame.layers.map((l) => {
              if (l.id === targetLayer.id && l.type === 'vector') {
                return {
                  ...l,
                  vectors: [...l.vectors, newShape],
                };
              }
              return l;
            }),
          };
        })
      );
      return;
    }

    if (clipboardRef.current.type === 'raster' && clipboardRef.current.rasterCanvas) {
      saveSnapshot('Paste Pixels');
      const targetLayer = handleEnsureRasterLayer();
      const ctx = targetLayer.canvas.getContext('2d');
      if (ctx) {
        const x = selection.rect ? selection.rect.x + 20 : 60;
        const y = selection.rect ? selection.rect.y + 20 : 60;
        ctx.drawImage(clipboardRef.current.rasterCanvas, x, y);
        setFrames((prevFrames) =>
          prevFrames.map((frame, idx) => {
            if (idx !== animSettings.currentFrameIndex) return frame;
            return {
              ...frame,
              layers: [...frame.layers],
            };
          })
        );
      }
    }
  }, [animSettings.currentFrameIndex, handleEnsureVectorLayer, handleEnsureRasterLayer, saveSnapshot, selection.rect]);

  const handleCutObject = useCallback(() => {
    handleCopyObject();
    if (selectedVectorShapeId) {
      handleDeleteSelectedShape();
    } else if (selection.active) {
      handleDeleteSelection();
    }
  }, [handleCopyObject, selectedVectorShapeId, selection.active, handleDeleteSelectedShape, handleDeleteSelection]);

  /**
   * Keyboard Shortcuts Handler (Photoshop / Illustrator Standard)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when typing in inputs or text areas
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyObject();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteObject();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCutObject();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedVectorShape) {
          handleDuplicateSelectedShape();
        } else {
          handleDeselect();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "'") {
        e.preventDefault();
        if (e.shiftKey) {
          setShowGridModal((prev) => !prev);
        } else {
          handleToggleGrid();
        }
        return;
      }

      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        setIsFullPageMode((prev) => !prev);
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setRightPanelOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedVectorShapeId) {
          e.preventDefault();
          handleDeleteSelectedShape();
          return;
        } else if (selection.active) {
          e.preventDefault();
          handleDeleteSelection();
          return;
        }
      }

      // Layer Reordering Keyboard Shortcuts:
      // Ctrl/Cmd + ]: Move active layer up
      // Ctrl/Cmd + [: Move active layer down
      // Ctrl/Cmd + Shift + ]: Move active layer to top
      // Ctrl/Cmd + Shift + [: Move active layer to bottom
      if ((e.ctrlKey || e.metaKey) && (e.key === ']' || e.key === '[')) {
        e.preventDefault();
        const activeIdx = currentFrame.layers.findIndex((l) => l.id === activeLayerId);
        if (activeIdx !== -1) {
          if (e.key === ']') {
            if (e.shiftKey) {
              handleReorderLayer(activeIdx, currentFrame.layers.length - 1);
            } else if (activeIdx < currentFrame.layers.length - 1) {
              handleReorderLayer(activeIdx, activeIdx + 1);
            }
          } else if (e.key === '[') {
            if (e.shiftKey) {
              handleReorderLayer(activeIdx, 0);
            } else if (activeIdx > 0) {
              handleReorderLayer(activeIdx, activeIdx - 1);
            }
          }
        }
        return;
      }

      // Alt+D: Toggle Dynamic Island HUD
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDynamicIslandEnabled((prev) => !prev);
        return;
      }

      // Alt+P: Polyline Tool
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleSelectTool('polyline');
        return;
      }

      // Alt+B: Bézier Curve Tool
      if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleSelectTool('bezier');
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v': handleSelectTool('transform'); break;
        case 'b': setActiveTool('brush'); break;
        case 'e': setActiveTool('eraser'); break;
        case 'p': setActiveTool('vector-pen'); break;
        case 'u': setActiveTool('vector-shape'); break;
        case 'a': setActiveTool('vector-select'); break;
        case 't': setActiveTool('text'); break;
        case 'g': setActiveTool(activeTool === 'bucket' ? 'gradient' : 'bucket'); break;
        case 's': setActiveTool(activeTool === 'clone' ? 'smudge' : 'clone'); break;
        case 'i': setActiveTool('eyedropper'); break;
        case 'h': setActiveTool('hand'); break;
        case 'z': setActiveTool('zoom'); break;
        case 'r': setActiveTool('blur'); break;
        case 'm': setActiveTool('marquee'); break;
        case 'l': setActiveTool('lasso'); break;
        case 'x': handleSwapColors(); break;
        case 'd': handleResetColors(); break;
        case '[':
          setBrushSettings((prev) => ({ ...prev, size: Math.max(1, prev.size - 4) }));
          break;
        case ']':
          setBrushSettings((prev) => ({ ...prev, size: Math.min(300, prev.size + 4) }));
          break;
        case ' ':
          if (timelineVisible) {
            e.preventDefault();
            setAnimSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, frames, config, animSettings, timelineVisible, selection, selectedVectorShapeId, activeTool]);

  /**
   * Layer Management Handlers
   */
  const handleAddLayer = (type: 'raster' | 'vector') => {
    saveSnapshot(`Add ${type} Layer`);
    const newCanvas = document.createElement('canvas');
    newCanvas.width = config.width;
    newCanvas.height = config.height;

    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: `${type === 'raster' ? 'Raster' : 'Vector'} Layer ${currentFrame.layers.length + 1}`,
      type,
      visible: true,
      locked: false,
      alphaLocked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: newCanvas,
      vectors: [],
    };

    const updatedLayers = [...currentFrame.layers, newLayer];
    currentFrame.layers = updatedLayers;
    setFrames([...frames]);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (id: string) => {
    if (currentFrame.layers.length <= 1) return;
    saveSnapshot('Delete Layer');
    const updatedLayers = currentFrame.layers.filter((l) => l.id !== id);
    currentFrame.layers = updatedLayers;
    setFrames([...frames]);
    if (activeLayerId === id) {
      setActiveLayerId(updatedLayers[updatedLayers.length - 1].id);
    }
  };

  const handleDuplicateLayer = (id: string) => {
    const layerToDup = currentFrame.layers.find((l) => l.id === id);
    if (!layerToDup) return;
    saveSnapshot('Duplicate Layer');

    const dupCanvas = document.createElement('canvas');
    dupCanvas.width = config.width;
    dupCanvas.height = config.height;
    if (layerToDup.type === 'raster') {
      const dCtx = dupCanvas.getContext('2d');
      if (dCtx) dCtx.drawImage(layerToDup.canvas, 0, 0);
    }

    const dupLayer: Layer = {
      ...layerToDup,
      id: `layer_${Date.now()}`,
      name: `${layerToDup.name} (Copy)`,
      canvas: dupCanvas,
      vectors: JSON.parse(JSON.stringify(layerToDup.vectors)),
    };

    const targetIdx = currentFrame.layers.findIndex((l) => l.id === id);
    const updated = [...currentFrame.layers];
    updated.splice(targetIdx + 1, 0, dupLayer);
    currentFrame.layers = updated;
    setFrames([...frames]);
    setActiveLayerId(dupLayer.id);
  };

  const handleMergeDown = (id: string) => {
    const idx = currentFrame.layers.findIndex((l) => l.id === id);
    if (idx <= 0) return;
    saveSnapshot('Merge Down');

    const upper = currentFrame.layers[idx];
    const lower = currentFrame.layers[idx - 1];

    if (lower.type === 'raster') {
      const lCtx = lower.canvas.getContext('2d');
      if (lCtx) {
        lCtx.save();
        lCtx.globalAlpha = upper.opacity;
        lCtx.globalCompositeOperation = upper.blendMode;
        if (upper.type === 'raster') {
          lCtx.drawImage(upper.canvas, 0, 0);
        } else if (upper.type === 'vector') {
          VectorEngine.renderShapes(lCtx, upper.vectors);
        }
        lCtx.restore();
      }
    }

    const updated = currentFrame.layers.filter((_, i) => i !== idx);
    currentFrame.layers = updated;
    setFrames([...frames]);
    setActiveLayerId(lower.id);
  };

  const handleMergeVisible = () => {
    if (currentFrame.layers.filter((l) => l.visible).length <= 1) return;
    saveSnapshot('Merge Visible Layers');

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = config.width;
    mergedCanvas.height = config.height;
    const mCtx = mergedCanvas.getContext('2d');

    if (mCtx) {
      for (const layer of currentFrame.layers) {
        if (!layer.visible || layer.opacity <= 0) continue;
        mCtx.save();
        mCtx.globalAlpha = layer.opacity;
        mCtx.globalCompositeOperation = layer.clippingMask ? 'source-atop' : layer.blendMode;
        if (layer.type === 'raster') {
          mCtx.drawImage(layer.canvas, 0, 0);
        } else if (layer.type === 'vector') {
          VectorEngine.renderShapes(mCtx, layer.vectors);
        }
        mCtx.restore();
      }
    }

    const mergedLayer: Layer = {
      id: `layer_merged_${Date.now()}`,
      name: 'Merged Visible Layers',
      type: 'raster',
      visible: true,
      locked: false,
      alphaLocked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: mergedCanvas,
      vectors: [],
    };

    const hiddenLayers = currentFrame.layers.filter((l) => !l.visible);
    currentFrame.layers = [mergedLayer, ...hiddenLayers];
    setFrames([...frames]);
    setActiveLayerId(mergedLayer.id);
  };

  const handleFlattenImage = () => {
    saveSnapshot('Flatten Image');

    const flattenedCanvas = document.createElement('canvas');
    flattenedCanvas.width = config.width;
    flattenedCanvas.height = config.height;
    const fCtx = flattenedCanvas.getContext('2d');

    if (fCtx) {
      if (config.background === 'white') {
        fCtx.fillStyle = '#ffffff';
        fCtx.fillRect(0, 0, config.width, config.height);
      } else if (config.background === 'dark') {
        fCtx.fillStyle = '#121214';
        fCtx.fillRect(0, 0, config.width, config.height);
      } else if (config.background === 'custom' && config.customBgColor) {
        fCtx.fillStyle = config.customBgColor;
        fCtx.fillRect(0, 0, config.width, config.height);
      }

      for (const layer of currentFrame.layers) {
        if (!layer.visible || layer.opacity <= 0) continue;
        fCtx.save();
        fCtx.globalAlpha = layer.opacity;
        fCtx.globalCompositeOperation = layer.clippingMask ? 'source-atop' : layer.blendMode;
        if (layer.type === 'raster') {
          fCtx.drawImage(layer.canvas, 0, 0);
        } else if (layer.type === 'vector') {
          VectorEngine.renderShapes(fCtx, layer.vectors);
        }
        fCtx.restore();
      }
    }

    const bgLayer: Layer = {
      id: `layer_bg_${Date.now()}`,
      name: 'Background',
      type: 'raster',
      visible: true,
      locked: false,
      alphaLocked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: flattenedCanvas,
      vectors: [],
    };

    currentFrame.layers = [bgLayer];
    setFrames([...frames]);
    setActiveLayerId(bgLayer.id);
  };

  const handleToggleClippingMask = (id: string) => {
    saveSnapshot('Toggle Clipping Mask');
    currentFrame.layers = currentFrame.layers.map((l) =>
      l.id === id ? { ...l, clippingMask: !l.clippingMask } : l
    );
    setFrames([...frames]);
  };

  const handleToggleLinkLayer = (id: string) => {
    currentFrame.layers = currentFrame.layers.map((l) =>
      l.id === id ? { ...l, linked: !l.linked } : l
    );
    setFrames([...frames]);
  };

  const handleReorderLayer = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFrames((prev) => {
      const frameIdx = animSettings.currentFrameIndex;
      const current = prev[frameIdx];
      if (!current || !current.layers) return prev;
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.layers.length ||
        toIndex >= current.layers.length
      ) {
        return prev;
      }
      const reordered = [...current.layers];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return prev.map((f, i) => (i === frameIdx ? { ...f, layers: reordered } : f));
    });
  }, [animSettings.currentFrameIndex]);

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    currentFrame.layers = currentFrame.layers.map((l) =>
      l.id === id ? { ...l, ...updates } : l
    );
    setFrames([...frames]);
  };

  /**
   * Frame Management Handlers
   */
  const handleAddFrame = () => {
    const newFrameId = `frame_${Date.now()}`;
    const newLayers: Layer[] = currentFrame.layers.map((l, i) => {
      const c = document.createElement('canvas');
      c.width = config.width;
      c.height = config.height;
      return {
        ...l,
        id: `layer_${Date.now()}_${i}`,
        canvas: c,
        vectors: [],
      };
    });

    const newFrame: AnimationFrame = {
      id: newFrameId,
      name: `Frame ${frames.length + 1}`,
      layers: newLayers,
    };

    setFrames([...frames, newFrame]);
    setAnimSettings((prev) => ({ ...prev, currentFrameIndex: frames.length }));
  };

  const handleDuplicateFrame = (index: number) => {
    const sourceFrame = frames[index];
    if (!sourceFrame) return;

    const dupLayers: Layer[] = sourceFrame.layers.map((l, i) => {
      const c = document.createElement('canvas');
      c.width = config.width;
      c.height = config.height;
      if (l.type === 'raster') {
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(l.canvas, 0, 0);
      }
      return {
        ...l,
        id: `layer_${Date.now()}_${i}`,
        canvas: c,
        vectors: JSON.parse(JSON.stringify(l.vectors)),
      };
    });

    const dupFrame: AnimationFrame = {
      id: `frame_${Date.now()}`,
      name: `${sourceFrame.name} (Copy)`,
      layers: dupLayers,
    };

    const newFrames = [...frames];
    newFrames.splice(index + 1, 0, dupFrame);
    setFrames(newFrames);
    setAnimSettings((prev) => ({ ...prev, currentFrameIndex: index + 1 }));
  };

  const handleReorderFrame = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      fromIndex >= frames.length ||
      toIndex < 0 ||
      toIndex >= frames.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const newFrames = [...frames];
    const [movedFrame] = newFrames.splice(fromIndex, 1);
    newFrames.splice(toIndex, 0, movedFrame);
    setFrames(newFrames);
    setAnimSettings((prev) => ({
      ...prev,
      currentFrameIndex: toIndex,
    }));
  };

  const handleDeleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    setAnimSettings((prev) => ({
      ...prev,
      currentFrameIndex: Math.min(prev.currentFrameIndex, newFrames.length - 1),
    }));
  };

  /**
   * Vector Shape Commit (Always ensures editable Vector Layer for shapes and pen paths)
   */
  const handleCommitVectorShape = (shape: VectorShape) => {
    const targetLayer = handleEnsureVectorLayer();
    saveSnapshot(`Add Vector Shape (${shape.type})`);
    targetLayer.vectors.push(shape);
    setSelectedVectorShapeId(shape.id);
    setActiveTool('vector-select');
    setFrames([...frames]);
  };

  /**
   * Close Active Vector Pen Path (Illustrator Pen Tool)
   */
  const handleCloseActivePath = () => {
    if (!activeVectorPath || activeVectorPath.length < 2) {
      setActiveVectorPath(null);
      return;
    }

    const shapeType: VectorShapeType =
      activeTool === 'polyline' ? 'polyline' : activeTool === 'bezier' ? 'bezier' : 'path';

    const shape: VectorShape = {
      id: `${shapeType}_${Date.now()}`,
      type: shapeType,
      points: activeVectorPath,
      strokeColor: vectorSettings.strokeColor,
      strokeWidth: vectorSettings.strokeWidth,
      fillColor: vectorSettings.hasFill ? vectorSettings.fillColor : 'transparent',
      hasFill: vectorSettings.hasFill,
      hasStroke: true,
      lineCap: vectorSettings.lineCap,
      lineJoin: vectorSettings.lineJoin,
      closed: true,
    };

    handleCommitVectorShape(shape);
    setActiveVectorPath(null);
  };

  /**
   * Create New Canvas Document
   */
  const handleCreateNewCanvas = (newConfig: CanvasConfig) => {
    setConfig(newConfig);

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = newConfig.width;
    bgCanvas.height = newConfig.height;

    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = newConfig.width;
    layerCanvas.height = newConfig.height;

    const newLayers: Layer[] = [
      {
        id: 'layer_bg',
        name: 'Background',
        type: 'raster',
        visible: true,
        locked: false,
        alphaLocked: false,
        opacity: 1,
        blendMode: 'source-over',
        canvas: bgCanvas,
        vectors: [],
      },
      {
        id: 'layer_1',
        name: 'Artwork Layer 1',
        type: 'raster',
        visible: true,
        locked: false,
        alphaLocked: false,
        opacity: 1,
        blendMode: 'source-over',
        canvas: layerCanvas,
        vectors: [],
      },
    ];

    setFrames([
      {
        id: 'frame_1',
        name: 'Frame 1',
        layers: newLayers,
      },
    ]);
    setActiveLayerId('layer_1');
    setAnimSettings((prev) => ({ ...prev, currentFrameIndex: 0 }));
    historyStack.current = [];
    historyIndex.current = -1;
  };

  /**
   * Open / Import File Handlers
   */
  /**
   * Import Image directly from File (for file pickers, drag & drop, and layer insertion)
   */
  const handleImportImageFile = (
    file: File,
    targetLayerId?: string,
    dropCoords?: { x: number; y: number }
  ) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        saveSnapshot(targetLayerId ? 'Upload Image into Layer' : 'Upload Image as New Layer');

        // Scale to fit canvas while preserving aspect ratio
        const scale = Math.min(config.width / img.width, config.height / img.height, 1);
        const dw = Math.round(img.width * scale);
        const dh = Math.round(img.height * scale);

        let dx = Math.round((config.width - dw) / 2);
        let dy = Math.round((config.height - dh) / 2);

        if (dropCoords) {
          dx = Math.round(dropCoords.x - dw / 2);
          dy = Math.round(dropCoords.y - dh / 2);
        }

        if (targetLayerId) {
          const target = currentFrame.layers.find((l) => l.id === targetLayerId);
          if (target) {
            const ctx = target.canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, dx, dy, dw, dh);
            }
            target.type = 'raster';
            setFrames([...frames]);
            setActiveLayerId(target.id);
            return;
          }
        }

        const newCanvas = document.createElement('canvas');
        newCanvas.width = config.width;
        newCanvas.height = config.height;
        const ctx = newCanvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, dx, dy, dw, dh);
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Image';
        const newLayer: Layer = {
          id: `layer_${Date.now()}`,
          name: cleanName,
          type: 'raster',
          visible: true,
          locked: false,
          alphaLocked: false,
          opacity: 1,
          blendMode: 'source-over',
          canvas: newCanvas,
          vectors: [],
        };

        const activeIdx = currentFrame.layers.findIndex((l) => l.id === activeLayerId);
        if (activeIdx >= 0) {
          currentFrame.layers.splice(activeIdx + 1, 0, newLayer);
        } else {
          currentFrame.layers.push(newLayer);
        }
        setFrames([...frames]);
        setActiveLayerId(newLayer.id);
      };
      img.src = re.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImportImage = (targetLayerId?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handleImportImageFile(file, targetLayerId);
    };
    input.click();
  };

  /**
   * Import Video or Image as Reference with frame-by-frame extraction
   */
  const handleImportReferenceVideo = () => {
    setReferenceConfig((prev) => ({ ...prev, open: true }));
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*,.mp4,.webm,.mov,.m4v,.mkv,.avi';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (VideoFrameExtractor.isVideoFile(file)) {
        try {
          const result = await VideoFrameExtractor.extractFrames(file, {
            fps: 12,
            maxFrames: 120,
          });
          if (result.frames.length > 0) {
            setReferenceConfig((prev) => ({
              ...prev,
              open: true,
              visible: true,
              name: file.name,
              url: result.frames[0],
              isVideoReference: true,
              videoFrames: result.frames,
              videoFrameIndex: 0,
              videoFps: result.fps,
              syncWithTimeline: true,
            }));
          }
        } catch (err) {
          console.error('Failed to extract video reference frames', err);
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
          setReferenceConfig((prev) => ({
            ...prev,
            open: true,
            visible: true,
            name: file.name,
            url: re.target?.result as string,
            isVideoReference: false,
            videoFrames: undefined,
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  /**
   * Converts extracted video frames into individual AnimationFrames in the timeline
   */
  const handleImportVideoFramesToTimeline = async (videoFrames: string[]) => {
    if (!videoFrames || videoFrames.length === 0) return;

    saveSnapshot('Import Reference Video Frames to Timeline');

    const newFrames: AnimationFrame[] = [];

    for (let idx = 0; idx < videoFrames.length; idx++) {
      const dataUrl = videoFrames[idx];
      const refCanvas = await VideoFrameExtractor.renderFrameToCanvas(
        dataUrl,
        config.width,
        config.height
      );

      const drawCanvas = document.createElement('canvas');
      drawCanvas.width = config.width;
      drawCanvas.height = config.height;

      const refLayer: Layer = {
        id: `layer_ref_${Date.now()}_${idx}`,
        name: `Video Ref ${idx + 1}`,
        type: 'raster',
        visible: true,
        locked: false,
        alphaLocked: false,
        opacity: 0.8,
        blendMode: 'source-over',
        canvas: refCanvas,
        vectors: [],
      };

      const sketchLayer: Layer = {
        id: `layer_draw_${Date.now()}_${idx}`,
        name: `Drawing ${idx + 1}`,
        type: 'raster',
        visible: true,
        locked: false,
        alphaLocked: false,
        opacity: 1,
        blendMode: 'source-over',
        canvas: drawCanvas,
        vectors: [],
      };

      newFrames.push({
        id: `frame_ref_${Date.now()}_${idx}`,
        name: `Frame ${idx + 1}`,
        layers: [refLayer, sketchLayer],
      });
    }

    setFrames(newFrames);
    setTimelineVisible(true);
    setAnimSettings((prev) => ({
      ...prev,
      currentFrameIndex: 0,
      fps: referenceConfig.videoFps || 12,
    }));
    if (newFrames[0]?.layers[1]) {
      setActiveLayerId(newFrames[0].layers[1].id);
    }
  };

  const handleOpenProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ps8k,.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const data = JSON.parse(re.target?.result as string);
          if (data.config) setConfig(data.config);

          const loadedFrames: AnimationFrame[] = await Promise.all(
            data.frames.map(async (f: any) => {
              const loadedLayers: Layer[] = await Promise.all(
                f.layers.map(
                  (l: any): Promise<Layer> =>
                    new Promise((res) => {
                      const canvas = document.createElement('canvas');
                      canvas.width = data.config.width;
                      canvas.height = data.config.height;

                      if (l.type === 'raster' && l.rasterData) {
                        const img = new Image();
                        img.onload = () => {
                          const ctx = canvas.getContext('2d');
                          if (ctx) ctx.drawImage(img, 0, 0);
                          res({
                            ...l,
                            canvas,
                            vectors: l.vectors || [],
                          });
                        };
                        img.src = l.rasterData;
                      } else {
                        res({
                          ...l,
                          canvas,
                          vectors: l.vectors || [],
                        });
                      }
                    })
                )
              );

              return {
                id: f.id,
                name: f.name,
                layers: loadedLayers,
              };
            })
          );

          setFrames(loadedFrames);
          setActiveLayerId(loadedFrames[0].layers[0].id);
        } catch (err) {
          console.error('Failed to load project:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSelectTool = (tool: ToolType) => {
    // If mesh tool is clicked while mesh is already active, toggle it off cleanly
    if (tool === 'mesh' && transformState.isActive && transformState.mode === 'mesh') {
      handleCancelTransform();
      setActiveTool('brush');
      return;
    }

    // If transform tool is clicked while transform is active, toggle it off
    if (tool === 'transform' && transformState.isActive && transformState.mode === 'translate-scale') {
      handleCancelTransform();
      setActiveTool('brush');
      return;
    }

    // If bone tool is clicked while bone rig is active, toggle it off
    if (tool === 'bone' && boneRigState.isActive) {
      handleCancelBoneRig();
      setActiveTool('brush');
      return;
    }

    // If clone tool is clicked while clone is already active, toggle it off back to brush
    if (tool === 'clone' && activeTool === 'clone') {
      setCloneSettings((prev) => ({ ...prev, isSettingSource: false }));
      setActiveTool('brush');
      return;
    }

    // When switching to any drawing/selection tool, turn OFF transform/mesh & bone modes
    if (tool !== 'mesh' && tool !== 'transform') {
      if (transformState.isActive) {
        handleApplyTransform();
      }
    }
    if (tool !== 'bone' && boneRigState.isActive) {
      handleCancelBoneRig();
    }
    if (lightingGizmoState.isActive) {
      handleCommitLightingGizmo();
    }
    if (tool !== 'vector-pen' && activeVectorPath) {
      setActiveVectorPath(null);
    }

    setActiveTool(tool);
    if (tool === 'bone') {
      handleStartBoneRig(activeLayerId);
    } else if (tool === 'transform' || tool === 'mesh') {
      initLayerTransform(activeLayerId, tool === 'mesh' ? 'mesh' : 'translate-scale');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Priority 1: Close active modals
        if (showProjectsModal) { setShowProjectsModal(false); return; }
        if (showGridModal) { setShowGridModal(false); return; }
        if (showQuickVoiceRecorder) { setShowQuickVoiceRecorder(false); return; }
        if (showSoundStudio) { setShowSoundStudio(false); return; }
        if (showLightingModal) { setShowLightingModal(false); return; }
        if (showTweenModal) { setShowTweenModal(false); return; }
        if (showBrushStudioModal) { setShowBrushStudioModal(false); return; }
        if (showFiltersModal) { setShowFiltersModal(false); return; }
        if (showExportModal) { setShowExportModal(false); return; }
        if (showNewCanvasModal) { setShowNewCanvasModal(false); return; }
        if (showResolutionModal) { setShowResolutionModal(false); return; }
        if (referenceConfig.open) { setReferenceConfig((prev) => ({ ...prev, open: false })); return; }

        // Priority 2: Close floating tools and overlays
        if (lightingGizmoState.isActive) {
          handleCancelLightingGizmo();
          return;
        }
        if (boneRigState.isActive) {
          handleCancelBoneRig();
          return;
        }
        if (transformState.isActive) {
          handleCancelTransform();
          return;
        }
        if (activeVectorPath) {
          setActiveVectorPath(null);
          return;
        }
        if (selection.active) {
          handleDeselect();
          return;
        }
      }

      if (e.key === 'Enter') {
        if (activeVectorPath && activeVectorPath.length >= 2) {
          handleCloseActivePath();
          return;
        }
      }

      if (boneRigState.isActive) {
        if (e.key === 'Enter') {
          handleApplyBoneRig();
        }
      } else if (transformState.isActive) {
        if (e.key === 'Enter') {
          handleApplyTransform();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showProjectsModal,
    showGridModal,
    showLightingModal,
    showTweenModal,
    showBrushStudioModal,
    showFiltersModal,
    showExportModal,
    showNewCanvasModal,
    showResolutionModal,
    referenceConfig.open,
    lightingGizmoState.isActive,
    handleCancelLightingGizmo,
    boneRigState.isActive,
    handleApplyBoneRig,
    handleCancelBoneRig,
    transformState.isActive,
    handleApplyTransform,
    handleCancelTransform,
    activeVectorPath,
    selection.active,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none text-neutral-100">
      {/* 1. Top Menu Bar (Photoshop Menu Structure) - Hidden in Full Page Zen Mode or Collapsed */}
      {!isFullPageMode && topBarsVisible && (
        <TopMenuBar
          config={config}
          transform={transform}
          canUndo={historyIndex.current >= 0}
          canRedo={historyIndex.current < historyStack.current.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={() => setTransform((prev) => ({ ...prev, zoom: Math.min(32, prev.zoom * 1.25) }))}
          onZoomOut={() => setTransform((prev) => ({ ...prev, zoom: Math.max(0.05, prev.zoom * 0.8) }))}
          onResetZoom={handleFitZoom}
          onFlipH={handleFlipCanvasH}
          onFlipV={handleFlipCanvasV}
          onRotate90={handleRotateCanvas90}
          onRotate270={handleRotateCanvas270}
          onNewCanvas={() => setShowNewCanvasModal(true)}
          onOpenResolutionModal={() => setShowResolutionModal(true)}
          onSaveProject={handleSaveProject}
          onOpenProject={handleOpenProject}
          onOpenProjectsModal={() => setShowProjectsModal(true)}
          onRestoreAutosave={handleRestoreAutosave}
          onImportImage={handleImportImage}
          onImportReferenceVideo={handleImportReferenceVideo}
          onExport={() => setShowExportModal(true)}
          onOpenFilters={() => setShowFiltersModal(true)}
          onOpenBrushSettings={() => setShowBrushStudioModal(true)}
          timelineVisible={timelineVisible}
          onToggleTimeline={() => setTimelineVisible(!timelineVisible)}
          gridEnabled={gridConfig.enabled}
          gridConfig={gridConfig}
          onToggleGrid={handleToggleGrid}
          onOpenGridStudio={() => setShowGridModal(true)}
          onSelectAll={handleSelectAll}
          onDeselect={handleDeselect}
          onInvertSelection={handleInvertSelection}
          onFillSelection={handleFillSelection}
          onClearSelection={handleDeleteSelection}
          onOpenTransform={(mode) => initLayerTransform(activeLayerId, mode)}
          onToggleReference={() => setReferenceConfig((prev) => ({ ...prev, open: !prev.open }))}
          isReferenceOpen={referenceConfig.open}
          onOpenTween={() => setShowTweenModal(true)}
          onOpenBoneRig={() => handleStartBoneRig(activeLayerId)}
          onOpenLighting={() => setShowLightingModal(true)}
          onOpenSoundStudio={() => setShowSoundStudio(true)}
          onOpenQuickVoice={() => setShowQuickVoiceRecorder(true)}
          audioTrackCount={audioTracks.length}
          dynamicIslandEnabled={dynamicIslandEnabled}
          onToggleDynamicIsland={() => setDynamicIslandEnabled(!dynamicIslandEnabled)}
          onCopy={handleCopyObject}
          onPaste={handlePasteObject}
          onCut={handleCutObject}
          onDuplicate={selectedVectorShape ? handleDuplicateSelectedShape : () => handleDuplicateLayer(activeLayerId)}
          canPaste={hasClipboardContent}
          isFullPageMode={isFullPageMode}
          onToggleFullPageMode={() => setIsFullPageMode((prev) => !prev)}
          rightPanelOpen={rightPanelOpen}
          onToggleRightPanel={() => handleToggleRightPanel('layers')}
          onHideTopBars={() => setTopBarsVisible(false)}
          autosaveStatus={autosaveStatus}
        />
      )}

      {/* 2. Contextual Tool Options Bar (Full Photoshop / Illustrator Parity) - Hidden in Full Page Zen Mode or Collapsed */}
      {!isFullPageMode && topBarsVisible && (
        <ToolOptionsBar
          activeTool={activeTool}
          brushSettings={brushSettings}
          onUpdateBrushSettings={(updates) => setBrushSettings((prev) => ({ ...prev, ...updates }))}
          vectorSettings={vectorSettings}
          onUpdateVectorSettings={(updates: Partial<VectorSettings>) =>
            setVectorSettings((prev: VectorSettings) => ({ ...prev, ...updates }))
          }
          textSettings={textSettings}
          onUpdateTextSettings={(updates) => setTextSettings((prev) => ({ ...prev, ...updates }))}
          gradientSettings={gradientSettings}
          onUpdateGradientSettings={(updates) => setGradientSettings((prev) => ({ ...prev, ...updates }))}
          cloneSettings={cloneSettings}
          onToggleCloneSampling={() =>
            setCloneSettings((prev) => ({ ...prev, isSettingSource: !prev.isSettingSource }))
          }
          primaryColor={primaryColor}
          hasActivePath={activeVectorPath !== null && activeVectorPath.length > 0}
          onCloseActivePath={handleCloseActivePath}
          onCancelActivePath={() => setActiveVectorPath(null)}
          hasSelection={selection.active}
          onClearSelection={handleDeselect}
          onFillSelection={handleFillSelection}
          onDeleteSelection={handleDeleteSelection}
          onInvertSelection={handleInvertSelection}
          bucketTolerance={bucketTolerance}
          onChangeBucketTolerance={setBucketTolerance}
          onOpenBrushStudio={() => setShowBrushStudioModal(true)}
          selectedVectorShape={selectedVectorShape}
          onUpdateSelectedShape={handleUpdateSelectedShape}
          onDeleteSelectedShape={handleDeleteSelectedShape}
          onDuplicateSelectedShape={handleDuplicateSelectedShape}
          onCopyObject={handleCopyObject}
          onPasteObject={handlePasteObject}
          canPaste={hasClipboardContent}
          onNudgeLayer={handleNudgeLayer}
          onFlipLayerH={handleFlipLayerH}
          onFlipLayerV={handleFlipLayerV}
          onRotateLayer90={handleRotateLayer90}
          onCenterLayer={handleCenterLayer}
          meshSettings={meshSettings}
          onUpdateMeshSettings={(updates) => setMeshSettings((prev) => ({ ...prev, ...updates }))}
          zoomSettings={zoomSettings}
          onUpdateZoomSettings={(updates) => setZoomSettings((prev) => ({ ...prev, ...updates }))}
          currentZoom={transform.zoom}
          onSetZoom={(newZoom) => setTransform((prev) => ({ ...prev, zoom: Math.max(0.05, Math.min(32, newZoom)) }))}
          onResetZoom={handleFitZoom}
          hasStrayShapes={hasStrayShapes}
          onClearStrayShapes={handleClearStrayShapes}
          activeLayer={activeLayer}
          onEnsureVectorLayer={handleEnsureVectorLayer}
          isTransformActive={transformState.isActive}
          onCancelTransform={handleCancelTransform}
          onApplyTransform={handleApplyTransform}
          isBoneActive={boneRigState.isActive}
          onCancelBoneRig={handleCancelBoneRig}
          onApplyBoneRig={handleApplyBoneRig}
          onSelectTool={handleSelectTool}
          onHideTopBars={() => setTopBarsVisible(false)}
          onScaleVectorShape={handleScaleSelectedShape}
        />
      )}

      {/* Collapsed Top Menu & Tools Pull Tab on Top Screen Edge */}
      {!topBarsVisible && !isFullPageMode && (
        <button
          onClick={() => setTopBarsVisible(true)}
          className="absolute top-0 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 hover:bg-neutral-800 text-cyan-300 hover:text-white border-b border-x border-cyan-500/60 shadow-2xl px-3 py-1 rounded-b-xl backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 group select-none text-[11px] font-bold"
          title="Show Top Menu & Tools Bar"
        >
          <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform text-cyan-400" />
          <span>Menu & Tools</span>
        </button>
      )}

      {/* 3. Main Workspace Area: Tools Sidebar + Canvas Viewport + Right Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Tools Sidebar (Hidden in Full Page Zen Mode or Collapsed) */}
        {!isFullPageMode && leftToolsVisible && (
          <ToolsSidebar
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onSwapColors={handleSwapColors}
            onResetColors={handleResetColors}
            onPrimaryColorChange={handlePrimaryColorChange}
            brushPreset={brushSettings.preset}
            onSelectGlowPencil={() => {
              handleSelectTool('brush');
              setBrushSettings((prev) => ({
                ...prev,
                preset: 'glow-pencil',
                isGlow: true,
                glowIntensity: prev.glowIntensity || 28,
              }));
            }}
            gridEnabled={gridConfig.enabled}
            onToggleGrid={handleToggleGrid}
            onOpenGridStudio={() => setShowGridModal(true)}
            onHideTools={() => setLeftToolsVisible(false)}
            onToggleRightPanel={() => handleToggleRightPanel('layers')}
            rightPanelOpen={rightPanelOpen}
          />
        )}

        {/* Collapsed Left Tools Sidebar Pull Tab on Left Screen Edge */}
        {!leftToolsVisible && !isFullPageMode && (
          <button
            onClick={() => setLeftToolsVisible(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-35 bg-neutral-900/90 hover:bg-neutral-800 text-cyan-300 hover:text-white border-r border-y border-cyan-500/60 shadow-2xl py-3 px-1 rounded-r-xl backdrop-blur-md flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 group select-none"
            title="Show Tools Sidebar"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-cyan-400" />
            <span className="text-[10px] [writing-mode:vertical-lr] font-bold tracking-wider">Tools</span>
          </button>
        )}

        {/* Center Interactive Canvas Viewport */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">
          <CanvasViewport
            config={config}
            currentFrame={currentFrame}
            allFrames={frames}
            activeLayerId={activeLayerId}
            transform={transform}
            onUpdateTransform={handleUpdateTransform}
            activeTool={activeTool}
            brushSettings={brushSettings}
            vectorSettings={vectorSettings}
            textSettings={textSettings}
            gradientSettings={gradientSettings}
            cloneSettings={cloneSettings}
            onUpdateCloneSettings={(updates) => setCloneSettings((prev) => ({ ...prev, ...updates }))}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onPickColor={handlePrimaryColorChange}
            animSettings={animSettings}
            onSaveSnapshot={saveSnapshot}
            selection={selection}
            onUpdateSelection={setSelection}
            bucketTolerance={bucketTolerance}
            activeVectorPath={activeVectorPath}
            onUpdateActiveVectorPath={setActiveVectorPath}
            onCommitVectorShape={handleCommitVectorShape}
            selectedVectorShapeId={selectedVectorShapeId}
            onSelectVectorShapeId={setSelectedVectorShapeId}
            gridEnabled={gridConfig.enabled}
            gridConfig={gridConfig}
            onToggleGrid={handleToggleGrid}
            onOpenGridStudio={() => setShowGridModal(true)}
            onCommitLayerTransform={(dx, dy) => handleNudgeLayer(dx, dy)}
            onNudgeLayerContent={(dx, dy, moveAll) => handleNudgeLayer(dx, dy, moveAll)}
            onReorderLayer={handleReorderLayer}
            onDeleteLayer={handleDeleteLayer}
            onToggleAllLayersVisibility={handleToggleAllLayersVisibility}
            onSelectTool={handleSelectTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex.current >= 0}
            canRedo={historyIndex.current < historyStack.current.length - 1}
            onMoveVectorShape={(shapeId, dx, dy) => {
              setFrames((prev) =>
                prev.map((frame, idx) => {
                  if (idx !== animSettings.currentFrameIndex) return frame;
                  return {
                    ...frame,
                    layers: frame.layers.map((l) => {
                      if (l.type !== 'vector') return l;
                      const target = l.vectors.find((s) => s.id === shapeId);
                      if (target && (dx !== 0 || dy !== 0)) {
                        VectorEngine.moveShape(target, dx, dy);
                      }
                      return { ...l, vectors: [...l.vectors] };
                    }),
                  };
                })
              );
            }}
            onDeleteSelectedShape={handleDeleteSelectedShape}
            onCopyObject={handleCopyObject}
            onPasteObject={handlePasteObject}
            onCutObject={handleCutObject}
            onDuplicateSelectedShape={handleDuplicateSelectedShape}
            canPaste={hasClipboardContent}
            onDeleteSelection={handleDeleteSelection}
            onClearSelection={handleDeselect}
            isFullPageMode={isFullPageMode}
            onToggleFullPage={() => setIsFullPageMode((prev) => !prev)}
            rightPanelOpen={rightPanelOpen}
            onToggleRightPanel={() => handleToggleRightPanel('layers')}
            bottomBarVisible={bottomBarVisible}
            onToggleBottomBar={() => setBottomBarVisible((prev) => !prev)}
            onFitZoom={handleFitZoom}
            onEnsureVectorLayer={handleEnsureVectorLayer}
            onEnsureRasterLayer={handleEnsureRasterLayer}
            meshSettings={meshSettings}
            onUpdateMeshSettings={(updates) => setMeshSettings((prev) => ({ ...prev, ...updates }))}
            zoomSettings={zoomSettings}
            onSelectLayerId={setActiveLayerId}
            transformState={transformState}
            onUpdateTransformState={(updates) => setTransformState((prev) => ({ ...prev, ...updates }))}
            boneState={boneRigState}
            onUpdateBoneState={(updates) => setBoneRigState((prev) => ({ ...prev, ...updates }))}
            lightingGizmoState={lightingGizmoState}
            onUpdateLightingGizmoState={(updates) => setLightingGizmoState((prev) => ({ ...prev, ...updates }))}
            onOpenSoundStudio={() => setShowSoundStudio(true)}
            onOpenQuickVoice={() => setShowQuickVoiceRecorder(true)}
            dynamicIslandEnabled={dynamicIslandEnabled}
            onToggleDynamicIsland={() => setDynamicIslandEnabled((prev) => !prev)}
            onDropImageFile={(file, coords) => handleImportImageFile(file, undefined, coords)}
            onScaleVectorShape={handleScaleSelectedShape}
            onOpenTransform={(mode) => initLayerTransform(activeLayerId, mode)}
          />

          {/* Toast Notification Banner for Autosave / Project Restored */}
          {autosaveToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-cyan-500/80 shadow-2xl px-4 py-2 rounded-xl backdrop-blur-md text-cyan-300 font-medium text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{autosaveToast}</span>
            </div>
          )}

          {/* Collapsed Right Dock Quick Pull Tab on Canvas Right Edge - ALWAYS Accessible */}
          {!rightPanelOpen && (
            <button
              onClick={() => handleToggleRightPanel('layers')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-45 bg-neutral-950/95 hover:bg-neutral-850 text-cyan-300 hover:text-white border-l-2 border-y-2 border-cyan-400 shadow-2xl py-3.5 px-2 rounded-l-2xl backdrop-blur-md flex flex-col items-center gap-1.5 cursor-pointer transition-all active:scale-95 group select-none ring-2 ring-cyan-500/30"
              title="Open Color & Layers Panel"
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform animate-pulse" />
              <span className="text-[11px] [writing-mode:vertical-lr] font-bold tracking-wider text-cyan-200">Layers & Color</span>
            </button>
          )}

          {/* Floating Transform & Mesh Form Control Suite */}
          {transformState.isActive && (
            <TransformWarpBar
              transformState={transformState}
              layers={currentFrame.layers}
              activeLayerId={transformState.layerId}
              onSelectLayerId={(id) => {
                setActiveLayerId(id);
                initLayerTransform(id, transformState.mode);
              }}
              onSetMode={(m) => setTransformState((prev) => ({ ...prev, mode: m }))}
              onUpdateState={(updates) => setTransformState((prev) => ({ ...prev, ...updates }))}
              onChangeDivisionX={handleChangeDivisionX}
              onChangeDivisionY={handleChangeDivisionY}
              onChangeSmoothness={(delta) =>
                setTransformState((prev) => ({
                  ...prev,
                  smoothness: Math.max(1, Math.min(5, prev.smoothness + delta)),
                }))
              }
              onApplyCurvePreset={handleApplyCurvePreset}
              onResetMeshGrid={handleResetMeshGrid}
              onNudge={handleNudge}
              onRotateDegrees={handleRotateDegrees}
              onRotateStep={handleRotateStep}
              onFlipH={handleFlipH}
              onFlipV={handleFlipV}
              onMoveLayerOrder={handleMoveLayerOrder}
              onCenterLayer={handleCenterTransformLayer}
              onApplyTransform={handleApplyTransform}
              onCancelTransform={handleCancelTransform}
              onClearStrayShapes={handleClearStrayShapes}
              hasStrayShapes={hasStrayShapes}
            />
          )}

          {/* Floating Bone Rigging Control Suite (Blender / Moho Parity) */}
          {boneRigState.isActive && (
            <BoneRigBar
              boneState={boneRigState}
              layers={currentFrame.layers}
              activeLayerId={boneRigState.layerId || activeLayerId}
              onSelectLayerId={handleSelectBoneLayer}
              currentFrameIndex={animSettings.currentFrameIndex}
              totalFrames={frames.length}
              onSelectFrame={handleSelectBoneFrame}
              onUpdateBoneState={(updates) => {
                setBoneRigState((prev) => {
                  const nextState = { ...prev, ...updates };
                  if (updates.bones) {
                    const key = `${animSettings.currentFrameIndex}_${nextState.layerId || activeLayerId}`;
                    boneArmaturesRef.current[key] = updates.bones;
                  }
                  return nextState;
                });
              }}
              onApplyRig={handleApplyBoneRig}
              onCancelRig={handleCancelBoneRig}
              onResetPose={handleResetBonePose}
              onApplyPreset={handleApplyBonePreset}
              onDeleteSelectedBone={handleDeleteSelectedBone}
              onClearStrayShapes={handleClearStrayShapes}
              hasStrayShapes={hasStrayShapes}
            />
          )}

          {/* Floating Cinematic Lighting & Celestial Gizmo Suite (Sun, Moon, Lamp, Gadget FX) */}
          {lightingGizmoState.isActive && (
            <LightingGizmoBar
              state={lightingGizmoState}
              canvasWidth={config.width}
              canvasHeight={config.height}
              onUpdateConfig={(updates) =>
                setLightingGizmoState((prev) => ({
                  ...prev,
                  config: { ...prev.config, ...updates },
                }))
              }
              onApply={handleCommitLightingGizmo}
              onCancel={handleCancelLightingGizmo}
              onOpenFullStudio={() => setShowLightingModal(true)}
            />
          )}
        </div>

        {/* Right Side Dock: Color Studio + Layers Panel (Movable, Draggable, Non-blocking on Mobile) */}
        <MovableStudioPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          isFullPageMode={isFullPageMode}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
          colorPickerContent={
            <ColorPickerPanel
              color={primaryColor}
              onChange={handlePrimaryColorChange}
              recentColors={recentColors}
              onClose={() => setRightPanelOpen(false)}
            />
          }
          layersContent={
            <LayersPanel
              layers={currentFrame.layers}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              onAddLayer={handleAddLayer}
              onUploadImageToNewLayer={() => handleImportImage()}
              onUploadImageToLayer={(layerId) => handleImportImage(layerId)}
              onDropImageFile={(file, layerId) => handleImportImageFile(file, layerId)}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onMergeDown={handleMergeDown}
              onMergeVisible={handleMergeVisible}
              onFlattenImage={handleFlattenImage}
              onToggleClippingMask={handleToggleClippingMask}
              onToggleLinkLayer={handleToggleLinkLayer}
              onReorderLayer={handleReorderLayer}
              onUpdateLayer={handleUpdateLayer}
              onToggleAllLayersVisibility={handleToggleAllLayersVisibility}
              onNudgeLayer={handleNudgeLayer}
              onClose={() => setRightPanelOpen(false)}
            />
          }
        />
      </div>

      {/* 4. Bottom Dock: Frame-by-Frame Animation Timeline (Collapsible) */}
      {timelineVisible && !isFullPageMode && (
        <AnimationTimeline
          frames={frames}
          settings={animSettings}
          onUpdateSettings={(updates) => setAnimSettings((prev) => ({ ...prev, ...updates }))}
          onSelectFrame={(idx) => setAnimSettings((prev) => ({ ...prev, currentFrameIndex: idx }))}
          onAddFrame={handleAddFrame}
          onDuplicateFrame={handleDuplicateFrame}
          onDeleteFrame={handleDeleteFrame}
          onReorderFrame={handleReorderFrame}
          onClose={() => setTimelineVisible(false)}
          audioTracks={audioTracks}
          onOpenSoundStudio={() => setShowSoundStudio(true)}
          onOpenQuickVoice={() => setShowQuickVoiceRecorder(true)}
          onImportReferenceVideo={handleImportReferenceVideo}
        />
      )}

      {/* Collapsed Timeline Pull Tab on Bottom Edge when hidden - ALWAYS Accessible */}
      {!timelineVisible && (
        <button
          onClick={() => setTimelineVisible(true)}
          className="absolute bottom-2 right-2 z-35 bg-neutral-900/95 hover:bg-neutral-800 text-cyan-300 hover:text-white border border-cyan-500/80 shadow-2xl px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 group select-none text-[11px] font-bold animate-in fade-in ring-2 ring-cyan-500/20"
          title="Show Animation Timeline"
        >
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span>Timeline</span>
          <ChevronUp className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Zen Full Page Mode Exit Floating Indicator */}
      {isFullPageMode && (
        <button
          onClick={() => setIsFullPageMode(false)}
          className="fixed top-2 right-2 z-50 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 cursor-pointer active:scale-95 animate-in fade-in transition-all ring-2 ring-amber-300"
          title="Exit Full Screen Zen Mode"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Normal Mode</span>
        </button>
      )}

      {/* Floating Dynamic Island (Mobile & Rapid Animation Command Center) */}
      {dynamicIslandEnabled && !isFullPageMode && (
        <DynamicIsland
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          primaryColor={primaryColor}
          onPrimaryColorChange={handlePrimaryColorChange}
          brushSettings={brushSettings}
          onUpdateBrushSettings={(updates) => setBrushSettings((prev) => ({ ...prev, ...updates }))}
          frames={frames}
          animSettings={animSettings}
          onUpdateAnimSettings={(updates) => setAnimSettings((prev) => ({ ...prev, ...updates }))}
          onSelectFrame={(idx) => setAnimSettings((prev) => ({ ...prev, currentFrameIndex: idx }))}
          onAddFrame={handleAddFrame}
          onDuplicateFrame={handleDuplicateFrame}
          onDeleteFrame={handleDeleteFrame}
          onReorderFrame={handleReorderFrame}
          layers={currentFrame.layers}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onAddLayer={() => handleAddLayer('raster')}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex.current >= 0}
          canRedo={historyIndex.current < historyStack.current.length - 1}
          onFitZoom={handleFitZoom}
          onOpenSoundStudio={() => setShowSoundStudio(true)}
          onOpenQuickVoice={() => setShowQuickVoiceRecorder(true)}
          onOpenExportModal={() => setShowExportModal(true)}
          audioTracks={audioTracks}
          onAddAudioTrack={handleAddAudioTrack}
          onCopy={handleCopyObject}
          onPaste={handlePasteObject}
          onCut={handleCutObject}
          onDuplicate={selectedVectorShape ? handleDuplicateSelectedShape : () => handleDuplicateLayer(activeLayerId)}
          canPaste={hasClipboardContent}
          selectedVectorShapeId={selectedVectorShapeId}
          cloneSettings={cloneSettings}
          onToggleCloneSampling={() =>
            setCloneSettings((prev) => ({ ...prev, isSettingSource: !prev.isSettingSource }))
          }
          isFullPageMode={isFullPageMode}
          gridConfig={gridConfig}
          onToggleGrid={handleToggleGrid}
          onOpenGridStudio={() => setShowGridModal(true)}
          onReorderLayer={handleReorderLayer}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onToggleRightPanel={() => handleToggleRightPanel('layers')}
          onClose={() => setDynamicIslandEnabled(false)}
          topBarsVisible={topBarsVisible}
        />
      )}

      {/* 5. Modals */}
      {showQuickVoiceRecorder && (
        <QuickVoiceRecorder
          isOpen={showQuickVoiceRecorder}
          onClose={() => setShowQuickVoiceRecorder(false)}
          onAddAudioTrack={handleAddAudioTrack}
          currentFrameIndex={animSettings.currentFrameIndex}
          totalFrames={frames.length}
          fps={animSettings.fps}
        />
      )}
      {showSoundStudio && (
        <SoundStudioModal
          isOpen={showSoundStudio}
          onClose={() => setShowSoundStudio(false)}
          audioTracks={audioTracks}
          onAddAudioTrack={handleAddAudioTrack}
          onDeleteAudioTrack={handleDeleteAudioTrack}
          onUpdateAudioTrack={handleUpdateAudioTrack}
          currentFrameIndex={animSettings.currentFrameIndex}
          totalFrames={frames.length}
          fps={animSettings.fps}
        />
      )}
      {showProjectsModal && (
        <ProjectsModal
          isOpen={showProjectsModal}
          onClose={() => setShowProjectsModal(false)}
          currentFrames={frames}
          currentConfig={config}
          currentAnimSettings={animSettings}
          currentAudioTracks={audioTracks}
          onLoadProject={handleLoadProjectFromStorage}
          onSaveFile={handleDownloadProjectFile}
          onOpenFile={handleOpenProject}
        />
      )}

      {showNewCanvasModal && (
        <NewCanvasModal
          currentConfig={config}
          onCreate={handleCreateNewCanvas}
          onClose={() => setShowNewCanvasModal(false)}
        />
      )}

      {showResolutionModal && (
        <ResolutionModal
          currentConfig={config}
          onApply={handleApplyResolution}
          onClose={() => setShowResolutionModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          currentFrame={currentFrame}
          allFrames={frames}
          config={config}
          animSettings={animSettings}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showFiltersModal && activeLayer && (
        <FiltersModal
          activeLayer={activeLayer}
          onApply={(filtered) => {
            saveSnapshot('Apply Filter');
            const ctx = activeLayer.canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
              ctx.drawImage(filtered, 0, 0);
            }
            setFrames([...frames]);
          }}
          onClose={() => setShowFiltersModal(false)}
        />
      )}

      {showBrushStudioModal && (
        <BrushSettingsModal
          settings={brushSettings}
          onUpdate={(updates) => setBrushSettings((prev) => ({ ...prev, ...updates }))}
          color={primaryColor}
          onClose={() => setShowBrushStudioModal(false)}
        />
      )}

      {/* Advanced Pro Grid & Guide Studio Modal */}
      {showGridModal && (
        <GridStudioModal
          isOpen={showGridModal}
          onClose={() => setShowGridModal(false)}
          gridConfig={gridConfig}
          onUpdateGridConfig={handleUpdateGridConfig}
          onResetGridConfig={handleResetGridConfig}
          canvasWidth={config.width}
          canvasHeight={config.height}
        />
      )}

      {/* 6. Floating Reference Image Guide Panel */}
      {referenceConfig.open && (
        <ReferenceImagePanel
          config={referenceConfig}
          onUpdateConfig={(updates) => setReferenceConfig((prev) => ({ ...prev, ...updates }))}
          onClose={() => setReferenceConfig((prev) => ({ ...prev, open: false }))}
          currentTimelineFrameIndex={animSettings.currentFrameIndex}
          totalTimelineFrames={frames.length}
          onImportFramesToTimeline={handleImportVideoFramesToTimeline}
        />
      )}

      {/* 7. Keyframe Object Scale / Transform Animation Modal */}
      {showTweenModal && (
        <TweenModal
          onClose={() => setShowTweenModal(false)}
          layers={currentFrame.layers}
          activeLayerId={activeLayerId}
          frames={frames}
          currentFrameIndex={animSettings.currentFrameIndex}
          onApplyTween={handleApplyTween}
        />
      )}

      {/* 8. Cinematic Lighting & Environmental VFX Studio */}
      {showLightingModal && (
        <CinematicLightingModal
          isOpen={showLightingModal}
          onClose={() => setShowLightingModal(false)}
          config={config}
          currentFrame={currentFrame}
          activeLayer={activeLayer}
          onApplyLighting={handleApplyLighting}
        />
      )}

      {/* 9. Mobile PWA Install Prompt Banner */}
      <PWAInstallBanner />
    </div>
  );
}
