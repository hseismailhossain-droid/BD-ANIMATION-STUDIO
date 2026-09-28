import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Copy,
  ClipboardPaste,
  Scissors,
  Trash2,
  CopyPlus,
  Crosshair,
  Sparkles,
  X,
  Maximize,
  Minimize2,
  Layers as LayersIcon,
  Palette,
} from 'lucide-react';
import {
  Layer,
  AnimationFrame,
  CanvasConfig,
  ViewportTransform,
  ToolType,
  BrushSettings,
  VectorSettings,
  VectorShape,
  VectorNode,
  SelectionArea,
  AnimationSettings,
  TextSettings,
  GradientSettings,
  CloneSettings,
  MeshSettings,
  ZoomSettings,
} from '../types';
import { BrushRenderer, StrokePoint } from '../engine/brushEngine';
import { VectorEngine } from '../engine/vectorEngine';
import { MeshEngine } from '../engine/meshEngine';
import { floodFill } from '../engine/floodFill';
import { LayerTransformState, WarpEngine, Point } from '../engine/warpEngine';
import { BoneRigState, BoneEngine, Bone } from '../engine/boneEngine';
import { LightingEngine } from '../engine/lightingEngine';
import { LightingGizmoState } from './LightingGizmoBar';

interface CanvasViewportProps {
  config: CanvasConfig;
  currentFrame: AnimationFrame;
  allFrames: AnimationFrame[];
  activeLayerId: string;
  transform: ViewportTransform;
  onUpdateTransform: (updates: Partial<ViewportTransform>) => void;
  activeTool: ToolType;
  brushSettings: BrushSettings;
  vectorSettings: VectorSettings;
  textSettings: TextSettings;
  gradientSettings: GradientSettings;
  cloneSettings: CloneSettings;
  onUpdateCloneSettings: (updates: Partial<CloneSettings>) => void;
  primaryColor: string;
  secondaryColor: string;
  onPickColor: (hex: string) => void;
  animSettings: AnimationSettings;
  onSaveSnapshot: (description: string) => void;
  selection: SelectionArea;
  onUpdateSelection: (sel: SelectionArea) => void;
  bucketTolerance: number;
  activeVectorPath: VectorNode[] | null;
  onUpdateActiveVectorPath: (path: VectorNode[] | null) => void;
  onCommitVectorShape: (shape: VectorShape) => void;
  selectedVectorShapeId?: string;
  onSelectVectorShapeId?: (id?: string) => void;
  gridEnabled: boolean;
  onCommitLayerTransform?: (dx: number, dy: number) => void;
  onMoveVectorShape?: (shapeId: string, dx: number, dy: number) => void;
  onDeleteSelectedShape?: () => void;
  onEnsureVectorLayer?: () => Layer;
  onEnsureRasterLayer?: () => Layer;
  meshSettings?: MeshSettings;
  onUpdateMeshSettings?: (settings: Partial<MeshSettings>) => void;
  zoomSettings?: ZoomSettings;
  onSelectLayerId?: (layerId: string) => void;
  transformState?: LayerTransformState;
  onUpdateTransformState?: (updates: Partial<LayerTransformState>) => void;
  boneState?: BoneRigState;
  onUpdateBoneState?: (updates: Partial<BoneRigState>) => void;
  lightingGizmoState?: LightingGizmoState;
  onUpdateLightingGizmoState?: (updates: Partial<LightingGizmoState>) => void;
  onCopyObject?: () => void;
  onPasteObject?: () => void;
  onCutObject?: () => void;
  onDuplicateSelectedShape?: () => void;
  canPaste?: boolean;
  onDeleteSelection?: () => void;
  onClearSelection?: () => void;
  isFullPageMode?: boolean;
  onToggleFullPage?: () => void;
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onFitZoom?: () => void;
  onDropImageFile?: (file: File, coords: { x: number; y: number }) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  config,
  currentFrame,
  allFrames,
  activeLayerId,
  transform,
  onUpdateTransform,
  activeTool,
  brushSettings,
  vectorSettings,
  textSettings,
  gradientSettings,
  cloneSettings,
  onUpdateCloneSettings,
  primaryColor,
  secondaryColor,
  onPickColor,
  animSettings,
  onSaveSnapshot,
  selection,
  onUpdateSelection,
  bucketTolerance,
  activeVectorPath,
  onUpdateActiveVectorPath,
  onCommitVectorShape,
  selectedVectorShapeId,
  onSelectVectorShapeId,
  gridEnabled,
  onCommitLayerTransform,
  onMoveVectorShape,
  onDeleteSelectedShape,
  onEnsureVectorLayer,
  onEnsureRasterLayer,
  meshSettings,
  onUpdateMeshSettings,
  zoomSettings,
  onSelectLayerId,
  transformState,
  onUpdateTransformState,
  boneState,
  onUpdateBoneState,
  lightingGizmoState,
  onUpdateLightingGizmoState,
  onCopyObject,
  onPasteObject,
  onCutObject,
  onDuplicateSelectedShape,
  canPaste = false,
  onDeleteSelection,
  onClearSelection,
  isFullPageMode = false,
  onToggleFullPage,
  rightPanelOpen = true,
  onToggleRightPanel,
  onFitZoom,
  onDropImageFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Interactive Lighting FX Drag Ref
  const lightingDrag = useRef<{
    handle: 'center' | 'radius';
    startX: number;
    startY: number;
    initialX?: number;
    initialY?: number;
    initialRadius?: number;
  } | null>(null);

  const isInteracting = useRef(false);
  const isPanning = useRef(false);
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);
  const activeDrawingLayerRef = useRef<Layer | null>(null);

  // Multi-Touch Pinch Zoom and Pan Tracking (Mobile phones & tablets)
  const activeTouchPointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialPinchZoom = useRef<number>(1);

  // Layer Transform & Mesh Form live dragging refs
  const activeMeshNodeDrag = useRef<{ row: number; col: number; lastPos: { x: number; y: number } } | null>(null);
  const activePerspectiveCornerDrag = useRef<number | null>(null);
  const layerTransformDrag = useRef<{
    mode: 'translate' | 'rotate' | 'scale';
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    initialAngle: number;
    cornerIndex?: number;
    initialScale?: { x: number; y: number };
    centerX?: number;
    centerY?: number;
    initialDist?: number;
  } | null>(null);

  // Non-destructive layer move tracking (preserves 100% drawing quality without iterative degradation)
  const layerMovePristineSnapshots = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const layerMovePristineVectors = useRef<Map<string, VectorShape[]>>(new Map());
  const layerMoveStartCoords = useRef<{ x: number; y: number } | null>(null);
  const layerMoveTotalOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [crispMode, setCrispMode] = useState<boolean>(true);

  // Bone Rigging drag & creation tracking
  const boneDrag = useRef<{
    mode: 'pose' | 'add' | 'edit';
    boneId: string;
    part: 'head' | 'tail' | 'body';
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    initialAngle: number;
  } | null>(null);
  const newBoneStart = useRef<{ x: number; y: number } | null>(null);

  // Brush stroke points buffer for smoothing
  const strokePoints = useRef<StrokePoint[]>([]);
  const smoothedPoint = useRef<StrokePoint | null>(null);
  const brushRenderer = useRef(new BrushRenderer());

  // Vector shape drag start
  const shapeDragStart = useRef<{ x: number; y: number } | null>(null);
  const currentDragVector = useRef<VectorShape | null>(null);

  // Zoom Tool Scrubby Drag
  const zoomDragStart = useRef<{ screenX: number; screenY: number; startZoom: number; canvasX: number; canvasY: number } | null>(null);

  // Mesh Form tool drag & node editing
  const meshDragStart = useRef<{ x: number; y: number } | null>(null);
  const meshNodeDrag = useRef<{ shapeId: string; row: number; col: number; lastPos: { x: number; y: number } } | null>(null);

  // Vector Pen Rubber Band
  const penRubberBand = useRef<{ x: number; y: number } | null>(null);

  // Transform / Move tool tracking
  const transformDragStart = useRef<{ x: number; y: number } | null>(null);
  const transformLastPos = useRef<{ x: number; y: number } | null>(null);

  // Vector select drag tracking
  const vectorDragStart = useRef<{ x: number; y: number } | null>(null);
  const vectorOriginalShape = useRef<VectorShape | null>(null);
  const anchorDrag = useRef<{
    shape: VectorShape;
    pointIndex: number;
    lastPos: { x: number; y: number };
  } | null>(null);
  const transformRaf = useRef<number | null>(null);
  const [cloneToast, setCloneToast] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Lasso points buffer
  const lassoPoints = useRef<{ x: number; y: number }[]>([]);

  // Clone stamp stroke start
  const cloneStrokeStart = useRef<{ x: number; y: number } | null>(null);

  // Animation frame request ID for throttled composite rendering on 8K
  const renderRequestId = useRef<number | null>(null);

  // Cached Onion Skinning canvas (eliminates expensive re-compositing during active drawing)
  const onionCacheCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onionCacheDirty = useRef<boolean>(true);

  // Reusable scratch canvas to avoid garbage collection memory thrashing on 4K/8K/mobile
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightingDragRaf = useRef<number | null>(null);

  // Mark onion cache dirty when frame or onion settings change
  useEffect(() => {
    onionCacheDirty.current = true;
  }, [
    animSettings.currentFrameIndex,
    animSettings.onionSkin,
    animSettings.onionFramesBefore,
    animSettings.onionFramesAfter,
    animSettings.onionOpacity,
    allFrames,
  ]);

  // Find active layer
  const activeLayer = currentFrame.layers.find((l) => l.id === activeLayerId) || currentFrame.layers[0];

  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Find currently selected vector shape across active layer or any frame layers
  let selectedVectorShape: VectorShape | null = null;
  if (selectedVectorShapeId) {
    for (const l of currentFrame.layers) {
      if (l.vectors && l.vectors.length > 0) {
        const found = l.vectors.find((s) => s.id === selectedVectorShapeId);
        if (found) {
          selectedVectorShape = found;
          break;
        }
      }
    }
  }

  /**
   * Keep canvas internal dimensions synchronized without reallocating every frame
   */
  useEffect(() => {
    const main = mainCanvasRef.current;
    const active = activeCanvasRef.current;
    const overlay = overlayCanvasRef.current;

    if (main && (main.width !== config.width || main.height !== config.height)) {
      main.width = config.width;
      main.height = config.height;
    }
    if (active && (active.width !== config.width || active.height !== config.height)) {
      active.width = config.width;
      active.height = config.height;
    }
    if (overlay && (overlay.width !== config.width || overlay.height !== config.height)) {
      overlay.width = config.width;
      overlay.height = config.height;
    }
  }, [config.width, config.height]);

  /**
   * Convert client viewport screen coordinates (e.clientX, e.clientY) to Canvas document coordinates
   */
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();

      const cx = rect.left + rect.width / 2 + transform.panX;
      const cy = rect.top + rect.height / 2 + transform.panY;

      const screenX = clientX - cx;
      const screenY = clientY - cy;

      const cos = Math.cos(-transform.rotation);
      const sin = Math.sin(-transform.rotation);

      const rotX = screenX * cos - screenY * sin;
      const rotY = screenX * sin + screenY * cos;

      const docX = rotX / transform.zoom + config.width / 2;
      const docY = rotY / transform.zoom + config.height / 2;

      return { x: docX, y: docY };
    },
    [transform, config.width, config.height]
  );

  /**
   * Main Composite Render Function
   */
  const renderMainCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, config.width, config.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Canvas Background
    if (config.background === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, config.width, config.height);
    } else if (config.background === 'dark') {
      ctx.fillStyle = '#121214';
      ctx.fillRect(0, 0, config.width, config.height);
    } else if (config.background === 'custom' && config.customBgColor) {
      ctx.fillStyle = config.customBgColor;
      ctx.fillRect(0, 0, config.width, config.height);
    }

    // 2. Render Onion Skinning (Cached for high frame-rates & zero lag on 8K / Mobile; bypassed during playback)
    if (animSettings.onionSkin && allFrames.length > 1 && !animSettings.isPlaying) {
      if (!onionCacheCanvasRef.current) {
        onionCacheCanvasRef.current = document.createElement('canvas');
      }
      const onionCanvas = onionCacheCanvasRef.current;
      if (onionCanvas.width !== config.width || onionCanvas.height !== config.height) {
        onionCanvas.width = config.width;
        onionCanvas.height = config.height;
        onionCacheDirty.current = true;
      }

      if (onionCacheDirty.current) {
        const oCtx = onionCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, config.width, config.height);
          const currIdx = animSettings.currentFrameIndex;

          // Past Frames (tint red)
          for (let step = animSettings.onionFramesBefore; step >= 1; step--) {
            const pIdx = currIdx - step;
            if (pIdx >= 0 && pIdx < allFrames.length) {
              const pFrame = allFrames[pIdx];
              oCtx.save();
              oCtx.globalAlpha = animSettings.onionOpacity * (1 - (step - 1) * 0.2);
              for (const l of pFrame.layers) {
                if (!l.visible) continue;
                if (l.type === 'raster') oCtx.drawImage(l.canvas, 0, 0);
                else if (l.type === 'vector') VectorEngine.renderShapes(oCtx, l.vectors);
              }
              oCtx.globalCompositeOperation = 'source-atop';
              oCtx.fillStyle = 'rgba(239, 68, 68, 0.4)';
              oCtx.fillRect(0, 0, config.width, config.height);
              oCtx.restore();
            }
          }

          // Future Frames (tint green)
          for (let step = 1; step <= animSettings.onionFramesAfter; step++) {
            const fIdx = currIdx + step;
            if (fIdx < allFrames.length) {
              const fFrame = allFrames[fIdx];
              oCtx.save();
              oCtx.globalAlpha = animSettings.onionOpacity * (1 - (step - 1) * 0.2);
              for (const l of fFrame.layers) {
                if (!l.visible) continue;
                if (l.type === 'raster') oCtx.drawImage(l.canvas, 0, 0);
                else if (l.type === 'vector') VectorEngine.renderShapes(oCtx, l.vectors);
              }
              oCtx.globalCompositeOperation = 'source-atop';
              oCtx.fillStyle = 'rgba(16, 185, 129, 0.4)';
              oCtx.fillRect(0, 0, config.width, config.height);
              oCtx.restore();
            }
          }
        }
        onionCacheDirty.current = false;
      }

      ctx.drawImage(onionCanvas, 0, 0);
    }

    // 3. Render Current Frame Visible Layers from bottom to top
    for (const layer of currentFrame.layers) {
      if (!layer.visible || layer.opacity <= 0) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.clippingMask
        ? 'source-atop'
        : (layer.blendMode || 'source-over');

      if (
        transformState &&
        transformState.isActive &&
        layer.id === transformState.layerId &&
        transformState.sourceSnapshot
      ) {
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
      } else if (
        boneState &&
        boneState.isActive &&
        layer.id === boneState.layerId &&
        boneState.sourceSnapshot &&
        boneState.grid
      ) {
        WarpEngine.renderMeshWarp(
          ctx,
          boneState.sourceSnapshot,
          boneState.grid,
          2
        );
      } else if (
        lightingGizmoState &&
        lightingGizmoState.isActive &&
        layer.id === lightingGizmoState.layerId
      ) {
        LightingEngine.renderEffect(ctx, config.width, config.height, lightingGizmoState.config);
      } else {
        if (layer.type === 'raster') {
          ctx.drawImage(layer.canvas, 0, 0);
        } else if (layer.type === 'vector') {
          VectorEngine.renderShapes(
            ctx,
            layer.vectors,
            selectedVectorShapeId,
            activeTool === 'vector-select'
          );
        }
      }

      ctx.restore();
    }
  }, [
    config,
    currentFrame,
    allFrames,
    animSettings,
    selectedVectorShapeId,
    activeTool,
    transformState,
    boneState,
    lightingGizmoState,
  ]);

  /**
   * Throttled composite render via requestAnimationFrame (prevents freezing on 8K)
   */
  const scheduleMainCanvasRender = useCallback(() => {
    if (renderRequestId.current !== null) return;
    renderRequestId.current = requestAnimationFrame(() => {
      renderMainCanvas();
      renderRequestId.current = null;
    });
  }, [renderMainCanvas]);

  // Re-render whenever layers or frame changes
  useEffect(() => {
    renderMainCanvas();
    return () => {
      if (renderRequestId.current !== null) {
        cancelAnimationFrame(renderRequestId.current);
        renderRequestId.current = null;
      }
    };
  }, [renderMainCanvas]);

  /**
   * Render Transform & Mesh Form interactive overlay (Grid nodes, perspective corners, 360 rotation handle)
   */
  const renderTransformOverlay = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const oCtx = overlayCanvas.getContext('2d');
    if (!oCtx) return;

    oCtx.clearRect(0, 0, config.width, config.height);

    if (transformState && transformState.isActive) {
      if (transformState.mode === 'mesh' && transformState.meshGrid) {
        WarpEngine.drawMeshGridOverlay(oCtx, transformState.meshGrid, transformState.selectedMeshNode, transform.zoom);
      } else if (transformState.mode === 'perspective') {
        WarpEngine.drawPerspectiveOverlay(oCtx, transformState.perspectiveCorners, activePerspectiveCornerDrag.current);
      } else if (transformState.mode === 'translate-scale') {
        const bx = transformState.bounds.x + transformState.translation.x;
        const by = transformState.bounds.y + transformState.translation.y;
        const bw = Math.max(20, transformState.bounds.width * transformState.scale.x);
        const bh = Math.max(20, transformState.bounds.height * transformState.scale.y);

        oCtx.save();
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        oCtx.translate(cx, cy);
        oCtx.rotate((transformState.rotation * Math.PI) / 180);

        // Bounding box
        oCtx.strokeStyle = '#0284c7';
        oCtx.lineWidth = 1.5;
        oCtx.setLineDash([4, 4]);
        oCtx.strokeRect(-bw / 2, -bh / 2, bw, bh);

        // 4 Corner resize handles
        const corners = [
          [-bw / 2, -bh / 2],
          [bw / 2, -bh / 2],
          [bw / 2, bh / 2],
          [-bw / 2, bh / 2],
        ];
        corners.forEach(([hx, hy]) => {
          oCtx.beginPath();
          oCtx.arc(hx, hy, 5, 0, Math.PI * 2);
          oCtx.fillStyle = '#ffffff';
          oCtx.fill();
          oCtx.strokeStyle = '#0284c7';
          oCtx.lineWidth = 2;
          oCtx.stroke();
        });

        // 360 Rotation stem & knob above the top edge
        oCtx.beginPath();
        oCtx.moveTo(0, -bh / 2);
        oCtx.lineTo(0, -bh / 2 - 25);
        oCtx.strokeStyle = '#0284c7';
        oCtx.lineWidth = 1.5;
        oCtx.stroke();

        oCtx.beginPath();
        oCtx.arc(0, -bh / 2 - 25, 6, 0, Math.PI * 2);
        oCtx.fillStyle = '#38bdf8';
        oCtx.fill();
        oCtx.strokeStyle = '#ffffff';
        oCtx.lineWidth = 2;
        oCtx.stroke();

        oCtx.restore();
      }
    }

    if (boneState && boneState.isActive) {
      BoneEngine.renderBonesOverlay(
        oCtx,
        boneState.bones,
        boneState.selectedBoneId,
        boneState.showInfluence,
        transform.zoom
      );
    }

    if (lightingGizmoState && lightingGizmoState.isActive) {
      const cfg = lightingGizmoState.config;
      const sx = cfg.sourceX;
      const sy = cfg.sourceY;
      const isMoon = cfg.preset?.startsWith('moon') || cfg.preset === 'night-moon';
      const isSun = cfg.preset?.startsWith('sun') || cfg.preset?.startsWith('day');

      oCtx.save();

      // 1. Draw outer reach dashed circle
      const effectiveRadius = Math.max(60, cfg.radius * 0.4);
      oCtx.strokeStyle = isMoon ? '#38bdf8' : isSun ? '#fbbf24' : '#06b6d4';
      oCtx.lineWidth = 1.5;
      oCtx.setLineDash([5, 5]);
      oCtx.beginPath();
      oCtx.arc(sx, sy, effectiveRadius, 0, Math.PI * 2);
      oCtx.stroke();

      // Radius resize handle on right
      oCtx.setLineDash([]);
      oCtx.fillStyle = '#ffffff';
      oCtx.strokeStyle = isMoon ? '#0284c7' : isSun ? '#d97706' : '#0891b2';
      oCtx.lineWidth = 2;
      oCtx.beginPath();
      oCtx.arc(sx + effectiveRadius, sy, 6, 0, Math.PI * 2);
      oCtx.fill();
      oCtx.stroke();

      // 2. If Moon or Sun, draw celestial disc ring
      const discR = cfg.discRadius || 90;
      oCtx.strokeStyle = isMoon ? 'rgba(224, 242, 254, 0.8)' : 'rgba(254, 240, 138, 0.8)';
      oCtx.lineWidth = 2;
      oCtx.beginPath();
      oCtx.arc(sx, sy, discR, 0, Math.PI * 2);
      oCtx.stroke();

      // 3. Center grab handle
      oCtx.beginPath();
      oCtx.arc(sx, sy, 18, 0, Math.PI * 2);
      oCtx.fillStyle = isMoon ? 'rgba(14, 165, 233, 0.35)' : isSun ? 'rgba(245, 158, 11, 0.35)' : 'rgba(6, 182, 212, 0.35)';
      oCtx.fill();
      oCtx.strokeStyle = '#ffffff';
      oCtx.lineWidth = 2;
      oCtx.stroke();

      // Center crosshair
      oCtx.strokeStyle = '#ffffff';
      oCtx.lineWidth = 1.5;
      oCtx.beginPath();
      oCtx.moveTo(sx - 8, sy);
      oCtx.lineTo(sx + 8, sy);
      oCtx.moveTo(sx, sy - 8);
      oCtx.lineTo(sx, sy + 8);
      oCtx.stroke();

      // 4. Direction pointer if beam / cone < 360
      if (cfg.coneAngle && cfg.coneAngle < 360) {
        const rad = (cfg.beamAngle * Math.PI) / 180;
        const dirLen = effectiveRadius * 0.7;
        const endX = sx + Math.cos(rad) * dirLen;
        const endY = sy + Math.sin(rad) * dirLen;
        oCtx.strokeStyle = '#f59e0b';
        oCtx.lineWidth = 2;
        oCtx.beginPath();
        oCtx.moveTo(sx, sy);
        oCtx.lineTo(endX, endY);
        oCtx.stroke();

        oCtx.fillStyle = '#f59e0b';
        oCtx.beginPath();
        oCtx.arc(endX, endY, 5, 0, Math.PI * 2);
        oCtx.fill();
      }

      // 5. Label tag
      oCtx.font = 'bold 12px sans-serif';
      oCtx.fillStyle = '#ffffff';
      const labelText = isMoon ? '🌙 চাঁদ (ড্র্যাগ করে সুবিধাজনক জায়গায় বসান)' : isSun ? '☀️ সূর্য (ড্র্যাগ করে সুবিধাজনক জায়গায় বসান)' : '💡 ড্র্যাগ করে আলো সুবিধাজনক স্থানে বসান';
      oCtx.fillText(labelText, sx + 25, sy - 15);

      oCtx.restore();
    }
  }, [config.width, config.height, transformState, boneState, lightingGizmoState, transform.zoom]);

  useEffect(() => {
    renderTransformOverlay();
  }, [transformState, boneState, lightingGizmoState, renderTransformOverlay, activeTool]);

  /**
   * Apply text stamping
   */
  const stampText = (x: number, y: number) => {
    let targetLayer = activeLayer;
    if (targetLayer.locked || targetLayer.type !== 'raster') {
      if (onEnsureRasterLayer) targetLayer = onEnsureRasterLayer();
      else return;
    }
    const str = textSettings.text.trim() || 'Sample Text';
    onSaveSnapshot('Insert Text');
    const ctx = targetLayer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    const style = `${textSettings.italic ? 'italic ' : ''}${textSettings.bold ? 'bold ' : ''}${textSettings.fontSize}px ${textSettings.fontFamily}`;
    ctx.font = style;
    ctx.fillStyle = textSettings.color || primaryColor;
    ctx.textAlign = textSettings.align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
    ctx.restore();
    renderMainCanvas();
  };

  /**
   * Apply gradient stamping
   */
  const applyGradient = (x1: number, y1: number, x2: number, y2: number) => {
    let targetLayer = activeLayer;
    if (targetLayer.locked || targetLayer.type !== 'raster') {
      if (onEnsureRasterLayer) targetLayer = onEnsureRasterLayer();
      else return;
    }
    onSaveSnapshot('Gradient Fill');
    const ctx = targetLayer.canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Clip to selection if active
    if (selection.active && selection.rect) {
      ctx.beginPath();
      ctx.rect(selection.rect.x, selection.rect.y, selection.rect.width, selection.rect.height);
      ctx.clip();
    }

    let grad: CanvasGradient;
    if (gradientSettings.type === 'radial') {
      const radius = Math.hypot(x2 - x1, y2 - y1);
      grad = ctx.createRadialGradient(x1, y1, 0, x1, y1, Math.max(10, radius));
    } else {
      grad = ctx.createLinearGradient(x1, y1, x2, y2);
    }

    switch (gradientSettings.preset) {
      case 'fg-to-bg':
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, secondaryColor);
        break;
      case 'fg-to-trans':
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        break;
      case 'sunset':
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#6366f1');
        break;
      case 'rainbow':
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(0.2, '#f59e0b');
        grad.addColorStop(0.4, '#10b981');
        grad.addColorStop(0.6, '#06b6d4');
        grad.addColorStop(0.8, '#3b82f6');
        grad.addColorStop(1, '#8b5cf6');
        break;
      case 'ocean':
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.5, '#3b82f6');
        grad.addColorStop(1, '#1e1b4b');
        break;
      case 'fire':
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.4, '#f97316');
        grad.addColorStop(0.8, '#dc2626');
        grad.addColorStop(1, '#450a0a');
        break;
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, config.width, config.height);
    ctx.restore();
    renderMainCanvas();
  };

  /**
   * Pointer Down Event
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Multi-touch gestures (Pinch-to-zoom and two-finger pan for mobile phones/tablets)
    if (e.pointerType === 'touch') {
      activeTouchPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activeTouchPointers.current.size >= 2) {
        const points = Array.from(activeTouchPointers.current.values());
        initialPinchDist.current = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        initialPinchZoom.current = transform.zoom;
        lastPanPos.current = {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        };
        isInteracting.current = false;
        return;
      }
    }

    // Middle click, Hand tool, or Space key initiates panning
    if (e.button === 1 || e.buttons === 4 || activeTool === 'hand') {
      isPanning.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0) return; // Only primary button for drawing
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Active Lighting Gizmo Drag Handling (Sun / Moon / Light FX interactive positioning)
    if (lightingGizmoState && lightingGizmoState.isActive) {
      try {
        (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignore pointer capture fail
      }

      const cfg = lightingGizmoState.config;
      const distToCenter = Math.hypot(coords.x - cfg.sourceX, coords.y - cfg.sourceY);
      const effectiveRadius = Math.max(60, cfg.radius * 0.4);
      const distToRadiusRing = Math.abs(distToCenter - effectiveRadius);

      if (distToCenter <= 35 / Math.min(1, transform.zoom)) {
        // Dragging center position of sun / moon / lamp
        lightingDrag.current = {
          handle: 'center',
          startX: coords.x,
          startY: coords.y,
          initialX: cfg.sourceX,
          initialY: cfg.sourceY,
        };
        isInteracting.current = true;
        return;
      } else if (distToRadiusRing <= 25 / Math.min(1, transform.zoom)) {
        // Dragging radius ring
        lightingDrag.current = {
          handle: 'radius',
          startX: coords.x,
          startY: coords.y,
          initialRadius: cfg.radius,
        };
        isInteracting.current = true;
        return;
      } else {
        // Click directly places the light at clicked position
        onUpdateLightingGizmoState?.({
          config: {
            ...cfg,
            sourceX: Math.round(coords.x),
            sourceY: Math.round(coords.y),
          },
        });
        lightingDrag.current = {
          handle: 'center',
          startX: coords.x,
          startY: coords.y,
          initialX: coords.x,
          initialY: coords.y,
        };
        isInteracting.current = true;
        return;
      }
    }

    // Active Bone Rigging Armature Handling (Moho / Blender 2D Rigging)
    if (boneState && boneState.isActive) {
      try {
        (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignore pointer capture fail
      }

      if (boneState.mode === 'add') {
        newBoneStart.current = { x: coords.x, y: coords.y };
        isInteracting.current = true;
        return;
      }

      const hit = BoneEngine.hitTestBone(boneState.bones, coords.x, coords.y, transform.zoom);
      if (hit) {
        onUpdateBoneState?.({ selectedBoneId: hit.bone.id });
        const b = hit.bone;
        const curDx = b.tail.x - b.head.x;
        const curDy = b.tail.y - b.head.y;
        const initialAngle = Math.atan2(curDy, curDx);

        boneDrag.current = {
          mode: boneState.mode,
          boneId: hit.bone.id,
          part: hit.part,
          startX: coords.x,
          startY: coords.y,
          lastX: coords.x,
          lastY: coords.y,
          initialAngle,
        };
        isInteracting.current = true;
        renderTransformOverlay();
        return;
      } else {
        onUpdateBoneState?.({ selectedBoneId: null });
        renderTransformOverlay();
        return;
      }
    }

    // Active Layer Transform & Mesh Form Handling
    if (transformState && transformState.isActive) {
      try {
        (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignore if pointer capture fails
      }

      if (transformState.mode === 'mesh' && transformState.meshGrid) {
        const zoom = Math.max(0.05, transform.zoom);

        // 1. Check if user clicked the top 360-degree rotation knob
        if (WarpEngine.hitTestMeshRotationKnob(transformState.meshGrid, coords.x, coords.y, zoom)) {
          layerTransformDrag.current = {
            mode: 'rotate',
            startX: coords.x,
            startY: coords.y,
            lastX: coords.x,
            lastY: coords.y,
            initialAngle: transformState.rotation || 0,
          };
          isInteracting.current = true;
          renderTransformOverlay();
          return;
        }

        // 2. Check if user clicked any mesh node with adaptive hit radius for desktop & touch
        const nodeHitRadius = Math.max(26, 32 / zoom);
        const hit = WarpEngine.hitTestMeshNode(transformState.meshGrid, coords.x, coords.y, nodeHitRadius);
        if (hit) {
          activeMeshNodeDrag.current = {
            row: hit.row,
            col: hit.col,
            lastPos: { x: coords.x, y: coords.y },
          };
          onUpdateTransformState?.({ selectedMeshNode: { row: hit.row, col: hit.col } });
          isInteracting.current = true;
          renderTransformOverlay();
          return;
        } else {
          // 3. User clicked background or mesh interior: Move (translate) the entire mesh (Up, Down, Left, Right)
          layerTransformDrag.current = {
            mode: 'translate',
            startX: coords.x,
            startY: coords.y,
            lastX: coords.x,
            lastY: coords.y,
            initialAngle: 0,
          };
          isInteracting.current = true;
          return;
        }
      } else if (transformState.mode === 'perspective') {
        let hitCorner = -1;
        transformState.perspectiveCorners.forEach((c, idx) => {
          if (Math.hypot(c.x - coords.x, c.y - coords.y) <= 24) {
            hitCorner = idx;
          }
        });
        if (hitCorner >= 0) {
          activePerspectiveCornerDrag.current = hitCorner;
          isInteracting.current = true;
          renderTransformOverlay();
          return;
        }
      } else if (transformState.mode === 'translate-scale') {
        const bx = transformState.bounds.x + transformState.translation.x;
        const by = transformState.bounds.y + transformState.translation.y;
        const bw = Math.max(20, transformState.bounds.width * transformState.scale.x);
        const bh = Math.max(20, transformState.bounds.height * transformState.scale.y);
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        const rad = (transformState.rotation * Math.PI) / 180;
        const knobDist = bh / 2 + 25;
        const knobX = cx + Math.sin(rad) * knobDist;
        const knobY = cy - Math.cos(rad) * knobDist;

        if (Math.hypot(coords.x - knobX, coords.y - knobY) <= 20) {
          layerTransformDrag.current = {
            mode: 'rotate',
            startX: coords.x,
            startY: coords.y,
            lastX: coords.x,
            lastY: coords.y,
            initialAngle: transformState.rotation,
          };
          isInteracting.current = true;
          return;
        }

        // Test 4 Corner resize handles for interactive scaling (ছোট / বড় করা)
        const corners = [
          { x: -bw / 2, y: -bh / 2 },
          { x: bw / 2, y: -bh / 2 },
          { x: bw / 2, y: bh / 2 },
          { x: -bw / 2, y: bh / 2 },
        ];
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        let hitCornerIdx = -1;
        for (let i = 0; i < 4; i++) {
          const worldX = cx + corners[i].x * cos - corners[i].y * sin;
          const worldY = cy + corners[i].x * sin + corners[i].y * cos;
          if (Math.hypot(coords.x - worldX, coords.y - worldY) <= 20) {
            hitCornerIdx = i;
            break;
          }
        }

        if (hitCornerIdx >= 0) {
          layerTransformDrag.current = {
            mode: 'scale',
            startX: coords.x,
            startY: coords.y,
            lastX: coords.x,
            lastY: coords.y,
            initialAngle: transformState.rotation,
            cornerIndex: hitCornerIdx,
            initialScale: { ...transformState.scale },
            centerX: cx,
            centerY: cy,
            initialDist: Math.max(10, Math.hypot(coords.x - cx, coords.y - cy)),
          };
          isInteracting.current = true;
          return;
        }

        layerTransformDrag.current = {
          mode: 'translate',
          startX: coords.x,
          startY: coords.y,
          lastX: coords.x,
          lastY: coords.y,
          initialAngle: 0,
        };
        isInteracting.current = true;
        return;
      }
    }

    // Zoom Tool (Photoshop Z: Click Zoom & Scrubby Drag Zoom)
    if (activeTool === 'zoom') {
      zoomDragStart.current = {
        screenX: e.clientX,
        screenY: e.clientY,
        startZoom: transform.zoom,
        canvasX: coords.x,
        canvasY: coords.y,
      };
      isInteracting.current = true;
      return;
    }

    // Eyedropper tool
    if (activeTool === 'eyedropper') {
      const mainCanvas = mainCanvasRef.current;
      if (!mainCanvas) return;
      const ctx = mainCanvas.getContext('2d');
      if (!ctx) return;
      const px = Math.floor(coords.x);
      const py = Math.floor(coords.y);
      if (px >= 0 && px < config.width && py >= 0 && py < config.height) {
        const pixel = ctx.getImageData(px, py, 1, 1).data;
        const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        onPickColor(hex);
      }
      return;
    }

    // Move & Transform Tool (Photoshop V - Non-destructive with zero quality loss)
    if (activeTool === 'transform') {
      layerMovePristineSnapshots.current.clear();
      layerMovePristineVectors.current.clear();

      const layersToMove = activeLayer.linked
        ? currentFrame.layers.filter((l) => l.linked || l.id === activeLayer.id)
        : [activeLayer];

      for (const lyr of layersToMove) {
        if (lyr.type === 'raster') {
          const snapshot = document.createElement('canvas');
          snapshot.width = lyr.canvas.width;
          snapshot.height = lyr.canvas.height;
          const sCtx = snapshot.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(lyr.canvas, 0, 0);
          }
          layerMovePristineSnapshots.current.set(lyr.id, snapshot);
        } else if (lyr.type === 'vector') {
          layerMovePristineVectors.current.set(
            lyr.id,
            JSON.parse(JSON.stringify(lyr.vectors || []))
          );
        }
      }

      layerMoveStartCoords.current = { x: coords.x, y: coords.y };
      layerMoveTotalOffset.current = { dx: 0, dy: 0 };
      transformDragStart.current = { x: coords.x, y: coords.y };
      transformLastPos.current = { x: coords.x, y: coords.y };
      isInteracting.current = true;
      return;
    }

    // Vector Path / Direct Selection Tool (Illustrator A)
    if (activeTool === 'vector-select') {
      // 1. If a path shape is already selected, check if user clicked an anchor point to move
      if (selectedVectorShape && selectedVectorShape.type === 'path' && selectedVectorShape.points) {
        const anchorHit = VectorEngine.hitTestAnchorNode(
          selectedVectorShape,
          coords.x,
          coords.y,
          20 / Math.max(0.2, transform.zoom)
        );
        if (anchorHit) {
          anchorDrag.current = {
            shape: selectedVectorShape,
            pointIndex: anchorHit.index,
            lastPos: { x: coords.x, y: coords.y },
          };
          isInteracting.current = true;
          onSaveSnapshot('Move Path Anchor Node');
          return;
        }
      }

      // 1.5. If selectedVectorShape is already selected, prioritize clicking/dragging it directly
      let targetLayer = activeLayer.type === 'vector' ? activeLayer : undefined;
      let hit: VectorShape | null = null;

      if (selectedVectorShape) {
        const bounds = VectorEngine.getShapeBounds(selectedVectorShape);
        const tol = Math.max(28, (selectedVectorShape.strokeWidth || 4) / 2 + 18);
        if (
          coords.x >= bounds.minX - tol &&
          coords.x <= bounds.maxX + tol &&
          coords.y >= bounds.minY - tol &&
          coords.y <= bounds.maxY + tol
        ) {
          hit = selectedVectorShape;
          for (const l of currentFrame.layers) {
            if (l.vectors && l.vectors.some((s) => s.id === selectedVectorShape!.id)) {
              targetLayer = l;
              if (l.id !== activeLayerId) onSelectLayerId?.(l.id);
              break;
            }
          }
        }
      }

      // 2. Hit test vector shapes across active layer and other visible vector layers
      if (!hit && targetLayer) {
        hit = VectorEngine.hitTestShape(targetLayer.vectors, coords.x, coords.y);
      }

      if (!hit) {
        for (const l of currentFrame.layers) {
          if (l.type === 'vector' && l.visible && !l.locked) {
            const found = VectorEngine.hitTestShape(l.vectors, coords.x, coords.y);
            if (found) {
              hit = found;
              targetLayer = l;
              onSelectLayerId?.(l.id);
              break;
            }
          }
        }
      }

      if (hit && targetLayer) {
        onSelectVectorShapeId?.(hit.id);

        // Check if user clicked an individual Mesh Node to deform
        if (hit.type === 'mesh' && hit.meshData) {
          const nodeHit = MeshEngine.hitTestMeshNode(hit.meshData, coords.x, coords.y, 16);
          if (nodeHit) {
            meshNodeDrag.current = {
              shapeId: hit.id,
              row: nodeHit.row,
              col: nodeHit.col,
              lastPos: { x: coords.x, y: coords.y },
            };
            onUpdateMeshSettings?.({ selectedNode: { row: nodeHit.row, col: nodeHit.col } });
            isInteracting.current = true;
            onSaveSnapshot('Edit Mesh Node');
            return;
          }
        }

        // Check if clicking an anchor node on the newly hit path
        if (hit.type === 'path' && hit.points) {
          const anchorHit = VectorEngine.hitTestAnchorNode(
            hit,
            coords.x,
            coords.y,
            20 / Math.max(0.2, transform.zoom)
          );
          if (anchorHit) {
            anchorDrag.current = {
              shape: hit,
              pointIndex: anchorHit.index,
              lastPos: { x: coords.x, y: coords.y },
            };
            isInteracting.current = true;
            onSaveSnapshot('Move Path Anchor Node');
            return;
          }
        }

        vectorDragStart.current = { x: coords.x, y: coords.y };
        vectorOriginalShape.current = hit;
        isInteracting.current = true;
        onSaveSnapshot('Move Vector Shape');
      } else {
        onSelectVectorShapeId?.(undefined);
        onUpdateMeshSettings?.({ selectedNode: null });
      }
      return;
    }

    // Mesh Form Tool (Gradient Mesh)
    if (activeTool === 'mesh') {
      const vLayer = onEnsureVectorLayer ? onEnsureVectorLayer() : activeLayer;

      // Check if user clicked on any existing mesh shape's node
      if (vLayer && vLayer.vectors) {
        for (const shape of vLayer.vectors) {
          if (shape.type === 'mesh' && shape.meshData) {
            const nodeHit = MeshEngine.hitTestMeshNode(shape.meshData, coords.x, coords.y, 16);
            if (nodeHit) {
              onSelectVectorShapeId?.(shape.id);
              meshNodeDrag.current = {
                shapeId: shape.id,
                row: nodeHit.row,
                col: nodeHit.col,
                lastPos: { x: coords.x, y: coords.y },
              };
              onUpdateMeshSettings?.({ selectedNode: { row: nodeHit.row, col: nodeHit.col } });
              isInteracting.current = true;
              onSaveSnapshot('Warp Mesh Node');
              return;
            }
          }
        }
      }

      // If not clicking an existing mesh node, ignore accidental click
      return;
    }

    // Text Tool (Photoshop T)
    if (activeTool === 'text') {
      stampText(coords.x, coords.y);
      return;
    }

    // Gradient Tool (Photoshop G)
    if (activeTool === 'gradient') {
      shapeDragStart.current = { x: coords.x, y: coords.y };
      isInteracting.current = true;
      return;
    }

    // Clone Stamp Tool: Check if setting source (Alt key or modal button or uninitialized source)
    if (activeTool === 'clone') {
      if (e.altKey || cloneSettings.isSettingSource || !cloneSettings.source) {
        onUpdateCloneSettings({
          source: { x: coords.x, y: coords.y },
          isSettingSource: false,
        });
        setCloneToast(`📍 ক্লোন সোর্স সেট হয়েছে: (${Math.round(coords.x)}, ${Math.round(coords.y)})`);
        setTimeout(() => setCloneToast(null), 2500);
        return;
      }
    }

    // Paint Bucket tool (Fast 8K Scanline)
    if (activeTool === 'bucket') {
      let targetLayer = activeLayer;
      if (targetLayer.locked || targetLayer.type !== 'raster') {
        if (onEnsureRasterLayer) targetLayer = onEnsureRasterLayer();
        else return;
      }
      onSaveSnapshot('Paint Bucket Fill');
      const ctx = targetLayer.canvas.getContext('2d');
      if (ctx) {
        floodFill(ctx, coords.x, coords.y, primaryColor, bucketTolerance);
        renderMainCanvas();
      }
      return;
    }

    // Vector Bézier Pen Tool (Illustrator P)
    if (activeTool === 'vector-pen') {
      const newPoint: VectorNode = {
        x: Math.round(coords.x),
        y: Math.round(coords.y),
      };

      if (activeVectorPath && activeVectorPath.length > 0) {
        // Check if clicked close to start point (close & commit path into shape)
        const startPt = activeVectorPath[0];
        const dist = Math.hypot(coords.x - startPt.x, coords.y - startPt.y);
        if (dist <= 15 && activeVectorPath.length >= 2) {
          const shape: VectorShape = {
            id: `path_${Date.now()}`,
            type: 'path',
            points: [...activeVectorPath],
            strokeColor: vectorSettings.strokeColor,
            strokeWidth: vectorSettings.strokeWidth,
            fillColor: vectorSettings.hasFill ? vectorSettings.fillColor : 'transparent',
            hasFill: vectorSettings.hasFill,
            hasStroke: vectorSettings.hasStroke,
            lineCap: vectorSettings.lineCap,
            lineJoin: vectorSettings.lineJoin,
            closed: true,
          };

          onSaveSnapshot('Draw Vector Path');
          onEnsureVectorLayer?.();
          onCommitVectorShape(shape);
          onSelectVectorShapeId?.(shape.id);
          onUpdateActiveVectorPath(null);
          penRubberBand.current = null;
          scheduleMainCanvasRender();
          return;
        }
      }

      const path = activeVectorPath ? [...activeVectorPath, newPoint] : [newPoint];
      onUpdateActiveVectorPath(path);
      isInteracting.current = true;
      return;
    }

    // Vector Shape Tool (Illustrator U)
    if (activeTool === 'vector-shape') {
      shapeDragStart.current = { x: coords.x, y: coords.y };
      isInteracting.current = true;
      return;
    }

    // Marquee / Lasso selection
    if (activeTool === 'marquee' || activeTool === 'lasso') {
      shapeDragStart.current = { x: coords.x, y: coords.y };
      if (activeTool === 'lasso') {
        lassoPoints.current = [{ x: coords.x, y: coords.y }];
      }
      isInteracting.current = true;
      return;
    }

    // Brush / Eraser / Smudge / Blur / Clone Stamp Tools
    if (
      activeTool === 'brush' ||
      activeTool === 'eraser' ||
      activeTool === 'smudge' ||
      activeTool === 'blur' ||
      activeTool === 'clone'
    ) {
      let drawLayer = activeLayer;
      if (drawLayer.locked || drawLayer.type !== 'raster') {
        if (onEnsureRasterLayer) {
          drawLayer = onEnsureRasterLayer();
        } else {
          return;
        }
      }
      activeDrawingLayerRef.current = drawLayer;

      onSaveSnapshot(
        activeTool === 'eraser'
          ? 'Eraser Stroke'
          : activeTool === 'smudge'
          ? 'Smudge'
          : activeTool === 'blur'
          ? 'Blur'
          : activeTool === 'clone'
          ? 'Clone Stamp'
          : brushSettings.preset === 'glow-pencil'
          ? 'Glow Pencil Stroke'
          : 'Brush Stroke'
      );

      isInteracting.current = true;
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.6;
      const pt: StrokePoint = {
        x: coords.x,
        y: coords.y,
        pressure,
        time: Date.now(),
      };

      strokePoints.current = [pt];
      smoothedPoint.current = { ...pt };
      if (activeTool === 'clone') {
        cloneStrokeStart.current = { x: coords.x, y: coords.y };
      }

      // Draw initial stamp on active layer
      const layerCtx = drawLayer.canvas.getContext('2d');
      if (layerCtx) {
        if (activeTool === 'smudge') {
          brushRenderer.current.applySmudge(layerCtx, pt, pt, brushSettings.size);
        } else if (activeTool === 'blur') {
          brushRenderer.current.applyBlur(layerCtx, pt, brushSettings.size);
        } else if (activeTool === 'clone' && cloneSettings.source) {
          brushRenderer.current.applyCloneStamp(
            layerCtx,
            cloneSettings.source,
            pt,
            brushSettings.size,
            brushSettings.opacity,
            mainCanvasRef.current
          );
        } else if (activeTool === 'clone') {
          // Do not draw fallback brush if clone source is uninitialized
        } else {
          brushRenderer.current.drawStrokeSegment(
            layerCtx,
            pt,
            pt,
            brushSettings,
            primaryColor,
            activeTool === 'eraser'
          );
        }
        scheduleMainCanvasRender();
      }
    }
  };

  /**
   * Pointer Move Event
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Multi-touch pinch-to-zoom and two-finger pan on touch devices
    if (e.pointerType === 'touch') {
      activeTouchPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activeTouchPointers.current.size >= 2 && initialPinchDist.current) {
        const points = Array.from(activeTouchPointers.current.values());
        const currentDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        const scale = currentDist / initialPinchDist.current;
        const newZoom = Math.max(0.05, Math.min(32, initialPinchZoom.current * scale));

        const midX = (points[0].x + points[1].x) / 2;
        const midY = (points[0].y + points[1].y) / 2;

        if (lastPanPos.current) {
          const dx = midX - lastPanPos.current.x;
          const dy = midY - lastPanPos.current.y;
          lastPanPos.current = { x: midX, y: midY };
          if (transformRaf.current === null) {
            transformRaf.current = requestAnimationFrame(() => {
              onUpdateTransform({
                zoom: newZoom,
                panX: transform.panX + dx,
                panY: transform.panY + dy,
              });
              transformRaf.current = null;
            });
          }
        } else {
          lastPanPos.current = { x: midX, y: midY };
          if (transformRaf.current === null) {
            transformRaf.current = requestAnimationFrame(() => {
              onUpdateTransform({ zoom: newZoom });
              transformRaf.current = null;
            });
          }
        }
        return;
      }
    }

    // Handle Panning (throttled with RAF for 120fps fluid responsiveness)
    if (isPanning.current && lastPanPos.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      if (transformRaf.current === null) {
        transformRaf.current = requestAnimationFrame(() => {
          onUpdateTransform({
            panX: transform.panX + dx,
            panY: transform.panY + dy,
          });
          transformRaf.current = null;
        });
      }
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Live Pen Rubber Band Guide (even before drag)
    if (activeTool === 'vector-pen' && activeVectorPath && activeVectorPath.length > 0) {
      penRubberBand.current = { x: coords.x, y: coords.y };
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const oCtx = overlayCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, config.width, config.height);
          oCtx.save();
          oCtx.strokeStyle = '#06b6d4';
          oCtx.lineWidth = 1.5;
          oCtx.setLineDash([4, 4]);
          const lastPt = activeVectorPath[activeVectorPath.length - 1];
          oCtx.beginPath();
          oCtx.moveTo(lastPt.x, lastPt.y);
          oCtx.lineTo(coords.x, coords.y);
          oCtx.stroke();
          oCtx.restore();
        }
      }
    }

    if (!isInteracting.current) return;

    // Active Lighting Gizmo Drag Handling (Sun / Moon / Light FX interactive positioning)
    if (lightingDrag.current && lightingGizmoState && lightingGizmoState.isActive) {
      const cfg = lightingGizmoState.config;
      let newConfig = { ...cfg };
      if (lightingDrag.current.handle === 'center') {
        newConfig.sourceX = Math.round(coords.x);
        newConfig.sourceY = Math.round(coords.y);
      } else if (lightingDrag.current.handle === 'radius') {
        const dist = Math.hypot(coords.x - cfg.sourceX, coords.y - cfg.sourceY);
        newConfig.radius = Math.max(100, Math.min(3000, Math.round(dist * 2.5)));
      }

      if (lightingDragRaf.current === null) {
        lightingDragRaf.current = requestAnimationFrame(() => {
          onUpdateLightingGizmoState?.({ config: newConfig });
          scheduleMainCanvasRender();
          renderTransformOverlay();
          lightingDragRaf.current = null;
        });
      }
      return;
    }

    // Active Bone Rigging Manipulation (Moho / Blender Armature)
    if (boneState && boneState.isActive) {
      if (newBoneStart.current && boneState.mode === 'add') {
        const overlayCanvas = overlayCanvasRef.current;
        if (overlayCanvas) {
          const oCtx = overlayCanvas.getContext('2d');
          if (oCtx) {
            renderTransformOverlay();
            oCtx.save();
            oCtx.beginPath();
            oCtx.moveTo(newBoneStart.current.x, newBoneStart.current.y);
            oCtx.lineTo(coords.x, coords.y);
            oCtx.strokeStyle = '#10b981';
            oCtx.lineWidth = 3 / Math.max(0.1, transform.zoom);
            oCtx.setLineDash([4, 4]);
            oCtx.stroke();
            oCtx.restore();
          }
        }
        return;
      }

      if (boneDrag.current) {
        const { boneId, part, lastX, lastY } = boneDrag.current;
        const dx = coords.x - lastX;
        const dy = coords.y - lastY;
        boneDrag.current.lastX = coords.x;
        boneDrag.current.lastY = coords.y;

        const targetBone = boneState.bones.find((b) => b.id === boneId);
        if (!targetBone) return;

        if (boneDrag.current.mode === 'pose') {
          if (part === 'tail') {
            const prevDx = lastX - targetBone.head.x;
            const prevDy = lastY - targetBone.head.y;
            const prevAngle = Math.atan2(prevDy, prevDx);

            const curDx = coords.x - targetBone.head.x;
            const curDy = coords.y - targetBone.head.y;
            const curAngle = Math.atan2(curDy, curDx);

            const deltaAngle = curAngle - prevAngle;
            BoneEngine.rotateBoneChain(boneState.bones, boneId, deltaAngle);
          } else if (part === 'head' || part === 'body') {
            BoneEngine.translateBoneChain(boneState.bones, boneId, dx, dy);
          }

          if (boneState.grid && boneState.gridWeights) {
            BoneEngine.deformGridWithBones(boneState.grid, boneState.gridWeights, boneState.bones);
          }

          scheduleMainCanvasRender();
          renderTransformOverlay();
          return;
        } else if (boneDrag.current.mode === 'edit') {
          if (part === 'tail') {
            targetBone.tail.x += dx;
            targetBone.tail.y += dy;
          } else if (part === 'head') {
            targetBone.head.x += dx;
            targetBone.head.y += dy;
          } else {
            targetBone.head.x += dx;
            targetBone.head.y += dy;
            targetBone.tail.x += dx;
            targetBone.tail.y += dy;
          }
          targetBone.restHead = { ...targetBone.head };
          targetBone.restTail = { ...targetBone.tail };

          const { gridWeights } = BoneEngine.buildDeformationGrid(
            boneState.bounds,
            boneState.bones
          );
          boneState.gridWeights = gridWeights;
          renderTransformOverlay();
          return;
        }
      }
      return;
    }

    // Active Layer Mesh Node live warping
    if (activeMeshNodeDrag.current && transformState && transformState.meshGrid) {
      const dx = coords.x - activeMeshNodeDrag.current.lastPos.x;
      const dy = coords.y - activeMeshNodeDrag.current.lastPos.y;
      activeMeshNodeDrag.current.lastPos = { x: coords.x, y: coords.y };

      const { row, col } = activeMeshNodeDrag.current;
      const grid = transformState.meshGrid;
      if (grid.nodes[row] && grid.nodes[row][col]) {
        grid.nodes[row][col].x += dx;
        grid.nodes[row][col].y += dy;
        scheduleMainCanvasRender();
        renderTransformOverlay();
      }
      return;
    }

    // Active Perspective 4-Corner skewing
    if (activePerspectiveCornerDrag.current !== null && transformState) {
      const idx = activePerspectiveCornerDrag.current;
      const corners = [...transformState.perspectiveCorners] as [Point, Point, Point, Point];
      corners[idx] = { x: coords.x, y: coords.y };
      onUpdateTransformState?.({ perspectiveCorners: corners });
      scheduleMainCanvasRender();
      renderTransformOverlay();
      return;
    }

    // Active Layer Translate & 360° Rotate Dragging
    if (layerTransformDrag.current && transformState) {
      if (layerTransformDrag.current.mode === 'rotate') {
        if (transformState.mode === 'mesh' && transformState.meshGrid) {
          // Compute mesh center
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          for (const row of transformState.meshGrid.nodes) {
            for (const node of row) {
              if (node.x < minX) minX = node.x;
              if (node.x > maxX) maxX = node.x;
              if (node.y < minY) minY = node.y;
              if (node.y > maxY) maxY = node.y;
            }
          }
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;

          const currentAngle = Math.atan2(coords.y - cy, coords.x - cx) * (180 / Math.PI) + 90;
          let roundedAngle = Math.round(currentAngle);
          if (roundedAngle > 180) roundedAngle -= 360;
          if (roundedAngle < -180) roundedAngle += 360;

          const deltaDeg = roundedAngle - (transformState.rotation || 0);
          if (Math.abs(deltaDeg) > 0.05) {
            WarpEngine.rotateMeshGrid(transformState.meshGrid, deltaDeg);
            onUpdateTransformState?.({ rotation: roundedAngle });
          }
        } else {
          const bx = transformState.bounds.x + transformState.translation.x;
          const by = transformState.bounds.y + transformState.translation.y;
          const bw = Math.max(20, transformState.bounds.width * transformState.scale.x);
          const bh = Math.max(20, transformState.bounds.height * transformState.scale.y);
          const cx = bx + bw / 2;
          const cy = by + bh / 2;

          const currentAngle = Math.atan2(coords.y - cy, coords.x - cx) * (180 / Math.PI) + 90;
          let roundedAngle = Math.round(currentAngle);
          if (roundedAngle > 180) roundedAngle -= 360;
          if (roundedAngle < -180) roundedAngle += 360;
          onUpdateTransformState?.({ rotation: roundedAngle });
        }
        scheduleMainCanvasRender();
        renderTransformOverlay();
        return;
      } else if (layerTransformDrag.current.mode === 'scale') {
        const curDist = Math.hypot(
          coords.x - (layerTransformDrag.current.centerX || coords.x),
          coords.y - (layerTransformDrag.current.centerY || coords.y)
        );
        const factor = curDist / Math.max(10, layerTransformDrag.current.initialDist || 10);
        const initScale = layerTransformDrag.current.initialScale || { x: 1, y: 1 };
        const newScaleX = Math.max(0.05, Math.min(10, Math.round(initScale.x * factor * 100) / 100));
        const newScaleY = Math.max(0.05, Math.min(10, Math.round(initScale.y * factor * 100) / 100));
        onUpdateTransformState?.({ scale: { x: newScaleX, y: newScaleY } });
        scheduleMainCanvasRender();
        renderTransformOverlay();
        return;
      } else if (layerTransformDrag.current.mode === 'translate') {
        const dx = coords.x - layerTransformDrag.current.lastX;
        const dy = coords.y - layerTransformDrag.current.lastY;
        layerTransformDrag.current.lastX = coords.x;
        layerTransformDrag.current.lastY = coords.y;

        if (transformState.mode === 'mesh' && transformState.meshGrid) {
          for (const row of transformState.meshGrid.nodes) {
            for (const node of row) {
              node.x += dx;
              node.y += dy;
            }
          }
        } else {
          onUpdateTransformState?.({
            translation: {
              x: transformState.translation.x + dx,
              y: transformState.translation.y + dy,
            },
          });
        }
        scheduleMainCanvasRender();
        renderTransformOverlay();
        return;
      }
    }

    // Zoom Tool: Scrubby Zoom (Photoshop style drag left to zoom out, drag right to zoom in)
    if (activeTool === 'zoom' && zoomDragStart.current) {
      const deltaX = e.clientX - zoomDragStart.current.screenX;
      if (Math.abs(deltaX) > 2) {
        const factor = Math.pow(1.012, deltaX);
        const newZoom = Math.max(0.05, Math.min(32, zoomDragStart.current.startZoom * factor));
        onUpdateTransform({ zoom: newZoom });
      }
      return;
    }

    // Mesh Node Dragging (Direct Selection & Mesh Tool)
    if (meshNodeDrag.current) {
      const dx = coords.x - meshNodeDrag.current.lastPos.x;
      const dy = coords.y - meshNodeDrag.current.lastPos.y;
      meshNodeDrag.current.lastPos = { x: coords.x, y: coords.y };

      // Find shape in active layer or current frame
      for (const l of currentFrame.layers) {
        if (l.type === 'vector') {
          const target = l.vectors.find((s) => s.id === meshNodeDrag.current?.shapeId);
          if (target && target.meshData) {
            MeshEngine.moveMeshNode(
              target.meshData,
              meshNodeDrag.current.row,
              meshNodeDrag.current.col,
              dx,
              dy
            );
            scheduleMainCanvasRender();
            break;
          }
        }
      }
      return;
    }

    // Non-destructive Transform / Move Layer (Photoshop V: zero quality loss)
    if (activeTool === 'transform' && layerMoveStartCoords.current) {
      const totalDx = Math.round(coords.x - layerMoveStartCoords.current.x);
      const totalDy = Math.round(coords.y - layerMoveStartCoords.current.y);
      layerMoveTotalOffset.current = { dx: totalDx, dy: totalDy };

      const layersToMove = activeLayer.linked
        ? currentFrame.layers.filter((l) => l.linked || l.id === activeLayer.id)
        : [activeLayer];

      for (const lyr of layersToMove) {
        if (lyr.type === 'raster') {
          const pristine = layerMovePristineSnapshots.current.get(lyr.id);
          if (pristine) {
            const ctx = lyr.canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, config.width, config.height);
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(pristine, totalDx, totalDy);
            }
          }
        } else if (lyr.type === 'vector') {
          const pristineVecs = layerMovePristineVectors.current.get(lyr.id);
          if (pristineVecs) {
            lyr.vectors = pristineVecs.map((v) => {
              const copy = JSON.parse(JSON.stringify(v)) as VectorShape;
              if (copy.x !== undefined) copy.x += totalDx;
              if (copy.y !== undefined) copy.y += totalDy;
              if (copy.points) {
                for (const pt of copy.points) {
                  pt.x += totalDx;
                  pt.y += totalDy;
                }
              }
              return copy;
            });
          }
        }
      }

      scheduleMainCanvasRender();
      return;
    }

    // Move Path Anchor Node (Direct Selection)
    if (activeTool === 'vector-select' && anchorDrag.current) {
      const dx = coords.x - anchorDrag.current.lastPos.x;
      const dy = coords.y - anchorDrag.current.lastPos.y;
      anchorDrag.current.lastPos = { x: coords.x, y: coords.y };
      const pt = anchorDrag.current.shape.points?.[anchorDrag.current.pointIndex];
      if (pt) {
        pt.x += dx;
        pt.y += dy;
        if (pt.handleIn) {
          pt.handleIn.x += dx;
          pt.handleIn.y += dy;
        }
        if (pt.handleOut) {
          pt.handleOut.x += dx;
          pt.handleOut.y += dy;
        }
        scheduleMainCanvasRender();
      }
      return;
    }

    // Move Selected Vector Shape (Illustrator A)
    if (activeTool === 'vector-select' && vectorOriginalShape.current && vectorDragStart.current) {
      const dx = coords.x - vectorDragStart.current.x;
      const dy = coords.y - vectorDragStart.current.y;
      vectorDragStart.current = { x: coords.x, y: coords.y };

      VectorEngine.moveShape(vectorOriginalShape.current, dx, dy);
      scheduleMainCanvasRender();
      return;
    }

    // Mesh Form Drag Preview
    if (activeTool === 'mesh' && meshDragStart.current) {
      const sx = meshDragStart.current.x;
      const sy = meshDragStart.current.y;
      const w = coords.x - sx;
      const h = coords.y - sy;

      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const oCtx = overlayCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, config.width, config.height);
          oCtx.save();
          oCtx.strokeStyle = '#38bdf8';
          oCtx.lineWidth = 1.5;
          oCtx.setLineDash([4, 4]);
          oCtx.strokeRect(Math.min(sx, sx + w), Math.min(sy, sy + h), Math.abs(w), Math.abs(h));

          // Draw sample mesh grid preview
          const rows = meshSettings?.rows || 4;
          const cols = meshSettings?.cols || 4;
          const previewGrid = MeshEngine.createMeshGrid(
            rows,
            cols,
            Math.min(sx, sx + w),
            Math.min(sy, sy + h),
            Math.max(10, Math.abs(w)),
            Math.max(10, Math.abs(h)),
            meshSettings?.preset || 'sphere-3d',
            primaryColor,
            secondaryColor
          );
          MeshEngine.renderMesh(oCtx, previewGrid, true, true);
          oCtx.restore();
        }
      }
      return;
    }

    // Gradient Drag Line Preview
    if (activeTool === 'gradient' && shapeDragStart.current) {
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const oCtx = overlayCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, config.width, config.height);
          oCtx.save();
          oCtx.strokeStyle = '#38bdf8';
          oCtx.lineWidth = 2;
          oCtx.setLineDash([6, 4]);
          oCtx.beginPath();
          oCtx.moveTo(shapeDragStart.current.x, shapeDragStart.current.y);
          oCtx.lineTo(coords.x, coords.y);
          oCtx.stroke();

          // Draw origin & end markers
          oCtx.fillStyle = '#06b6d4';
          oCtx.beginPath();
          oCtx.arc(shapeDragStart.current.x, shapeDragStart.current.y, 5, 0, Math.PI * 2);
          oCtx.fill();
          oCtx.beginPath();
          oCtx.arc(coords.x, coords.y, 5, 0, Math.PI * 2);
          oCtx.fill();
          oCtx.restore();
        }
      }
      return;
    }

    // Vector Shape Drag Preview (Photoshop U / Illustrator)
    if (activeTool === 'vector-shape' && shapeDragStart.current) {
      const sx = shapeDragStart.current.x;
      const sy = shapeDragStart.current.y;
      const w = coords.x - sx;
      const h = coords.y - sy;

      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const oCtx = overlayCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, config.width, config.height);
          const previewShape: VectorShape = {
            id: 'preview',
            type: vectorSettings.shapeType,
            x: Math.min(sx, sx + w),
            y: Math.min(sy, sy + h),
            width: Math.abs(w),
            height: Math.abs(h),
            strokeColor: vectorSettings.strokeColor,
            strokeWidth: vectorSettings.strokeWidth,
            fillColor: vectorSettings.hasFill ? vectorSettings.fillColor : 'transparent',
            hasFill: vectorSettings.hasFill,
            hasStroke: vectorSettings.hasStroke,
            lineCap: vectorSettings.lineCap || 'round',
            lineJoin: vectorSettings.lineJoin || 'round',
            cornerRadius: vectorSettings.cornerRadius,
          };
          currentDragVector.current = previewShape;
          VectorEngine.renderShapes(oCtx, [previewShape]);
        }
      }
      return;
    }

    // Selection Drag Preview (Marquee / Lasso)
    if ((activeTool === 'marquee' || activeTool === 'lasso') && shapeDragStart.current) {
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        const oCtx = overlayCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, config.width, config.height);
          oCtx.save();
          oCtx.strokeStyle = '#38bdf8';
          oCtx.lineWidth = 1.5;
          oCtx.setLineDash([6, 6]);

          if (activeTool === 'marquee') {
            const sx = shapeDragStart.current.x;
            const sy = shapeDragStart.current.y;
            oCtx.strokeRect(sx, sy, coords.x - sx, coords.y - sy);
          } else {
            lassoPoints.current.push({ x: coords.x, y: coords.y });
            oCtx.beginPath();
            oCtx.moveTo(lassoPoints.current[0].x, lassoPoints.current[0].y);
            for (let i = 1; i < lassoPoints.current.length; i++) {
              oCtx.lineTo(lassoPoints.current[i].x, lassoPoints.current[i].y);
            }
            oCtx.stroke();
          }
          oCtx.restore();
        }
      }
      return;
    }

    // Brush Stroke with Stabilizer Smoothing
    if (
      activeTool === 'brush' ||
      activeTool === 'eraser' ||
      activeTool === 'smudge' ||
      activeTool === 'blur' ||
      activeTool === 'clone'
    ) {
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.6;
      const rawPoint: StrokePoint = {
        x: coords.x,
        y: coords.y,
        pressure,
        time: Date.now(),
      };

      if (!smoothedPoint.current) {
        smoothedPoint.current = rawPoint;
      }

      // Streamline Stabilizer calculation
      const smoothingWeight = Math.min(0.92, Math.max(0, brushSettings.smoothing));
      const targetPoint: StrokePoint = {
        x: smoothedPoint.current.x * smoothingWeight + rawPoint.x * (1 - smoothingWeight),
        y: smoothedPoint.current.y * smoothingWeight + rawPoint.y * (1 - smoothingWeight),
        pressure:
          smoothedPoint.current.pressure * smoothingWeight +
          rawPoint.pressure * (1 - smoothingWeight),
        time: rawPoint.time,
      };

      const targetLayer =
        activeDrawingLayerRef.current ||
        (activeLayer.type === 'raster' && !activeLayer.locked ? activeLayer : null) ||
        (onEnsureRasterLayer ? onEnsureRasterLayer() : null);
      if (!targetLayer) return;

      const layerCtx = targetLayer.canvas.getContext('2d');
      if (layerCtx) {
        if (activeTool === 'smudge') {
          brushRenderer.current.applySmudge(
            layerCtx,
            smoothedPoint.current,
            targetPoint,
            brushSettings.size
          );
        } else if (activeTool === 'blur') {
          brushRenderer.current.applyBlur(layerCtx, targetPoint, brushSettings.size);
        } else if (activeTool === 'clone' && cloneSettings.source && cloneStrokeStart.current) {
          const deltaX = targetPoint.x - cloneStrokeStart.current.x;
          const deltaY = targetPoint.y - cloneStrokeStart.current.y;
          const currentSource = {
            x: cloneSettings.source.x + deltaX,
            y: cloneSettings.source.y + deltaY,
          };
          brushRenderer.current.applyCloneStamp(
            layerCtx,
            currentSource,
            targetPoint,
            brushSettings.size,
            brushSettings.opacity,
            mainCanvasRef.current
          );
        } else if (activeTool === 'clone') {
          // Do not draw fallback brush if clone source is uninitialized
        } else {
          brushRenderer.current.drawStrokeSegment(
            layerCtx,
            smoothedPoint.current,
            targetPoint,
            brushSettings,
            primaryColor,
            activeTool === 'eraser'
          );
        }
        scheduleMainCanvasRender();
      }

      smoothedPoint.current = targetPoint;
      strokePoints.current.push(targetPoint);
    }
  };

  /**
   * Pointer Up / End Event
   */
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPanning.current = false;
    lastPanPos.current = null;

    if (activeMeshNodeDrag.current) {
      activeMeshNodeDrag.current = null;
    }
    if (activePerspectiveCornerDrag.current !== null) {
      activePerspectiveCornerDrag.current = null;
    }
    if (layerTransformDrag.current) {
      layerTransformDrag.current = null;
    }
    if (lightingDrag.current) {
      lightingDrag.current = null;
      isInteracting.current = false;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (boneState && boneState.isActive) {
      if (newBoneStart.current && boneState.mode === 'add') {
        const sx = newBoneStart.current.x;
        const sy = newBoneStart.current.y;
        const dx = coords.x - sx;
        const dy = coords.y - sy;
        const len = Math.hypot(dx, dy);
        if (len > 15) {
          const parentBone = boneState.selectedBoneId
            ? boneState.bones.find((b) => b.id === boneState.selectedBoneId)
            : null;
          const newBone: Bone = {
            id: `bone_${Date.now()}`,
            name: `Bone ${boneState.bones.length + 1}`,
            head: { x: sx, y: sy },
            tail: { x: coords.x, y: coords.y },
            restHead: { x: sx, y: sy },
            restTail: { x: coords.x, y: coords.y },
            parentId: parentBone ? parentBone.id : null,
            length: len,
            strength: Math.max(30, len * 0.8),
            color: '#38bdf8',
          };
          const updatedBones = [...boneState.bones, newBone];
          const { gridWeights } = BoneEngine.buildDeformationGrid(boneState.bounds, updatedBones);
          onUpdateBoneState?.({
            bones: updatedBones,
            selectedBoneId: newBone.id,
            gridWeights,
            mode: 'pose',
          });
        }
        newBoneStart.current = null;
      }
      boneDrag.current = null;
      isInteracting.current = false;
      renderTransformOverlay();
      return;
    }

    if (transformState && transformState.isActive) {
      isInteracting.current = false;
      renderTransformOverlay();
      return;
    }

    if (!isInteracting.current) return;
    isInteracting.current = false;

    // 1. Commit active Mesh Node drag back to transformState React state
    if (activeMeshNodeDrag.current) {
      if (transformState && transformState.meshGrid) {
        onUpdateTransformState?.({
          meshGrid: {
            ...transformState.meshGrid,
            nodes: transformState.meshGrid.nodes.map((r) => r.map((n) => ({ ...n }))),
          },
        });
      }
      activeMeshNodeDrag.current = null;
      scheduleMainCanvasRender();
      renderTransformOverlay();
      return;
    }

    // 2. Commit active Layer Transform Drag (Translate / Rotate / Mesh Move)
    if (layerTransformDrag.current) {
      if (transformState && transformState.mode === 'mesh' && transformState.meshGrid) {
        onUpdateTransformState?.({
          meshGrid: {
            ...transformState.meshGrid,
            nodes: transformState.meshGrid.nodes.map((r) => r.map((n) => ({ ...n }))),
          },
        });
      }
      layerTransformDrag.current = null;
      scheduleMainCanvasRender();
      renderTransformOverlay();
      return;
    }

    // 3. Commit active Perspective Corner drag
    if (activePerspectiveCornerDrag.current !== null) {
      activePerspectiveCornerDrag.current = null;
      scheduleMainCanvasRender();
      renderTransformOverlay();
      return;
    }

    // Clear temporary overlay canvas
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const oCtx = overlayCanvas.getContext('2d');
      if (oCtx) oCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }

    // Zoom Tool: Click Zoom (if mouse didn't drag far)
    if (activeTool === 'zoom' && zoomDragStart.current) {
      const moved = Math.hypot(
        e.clientX - zoomDragStart.current.screenX,
        e.clientY - zoomDragStart.current.screenY
      );
      if (moved < 5) {
        const isOut = e.altKey || zoomSettings?.mode === 'out';
        const factor = isOut ? 0.67 : 1.5;
        const newZoom = Math.max(0.05, Math.min(32, transform.zoom * factor));
        onUpdateTransform({ zoom: newZoom });
      }
      zoomDragStart.current = null;
      return;
    }

    // Commit Mesh Form Tool (Gradient Mesh node editing)
    if (activeTool === 'mesh') {
      if (meshNodeDrag.current) {
        meshNodeDrag.current = null;
        renderMainCanvas();
      }
      meshDragStart.current = null;
      return;
    }

    if (meshNodeDrag.current) {
      meshNodeDrag.current = null;
      renderMainCanvas();
    }

    // Commit Gradient Tool (Photoshop G)
    if (activeTool === 'gradient' && shapeDragStart.current) {
      applyGradient(shapeDragStart.current.x, shapeDragStart.current.y, coords.x, coords.y);
      shapeDragStart.current = null;
      return;
    }

    // Commit Vector Shape (Illustrator U)
    if (activeTool === 'vector-shape' && shapeDragStart.current) {
      const sx = shapeDragStart.current.x;
      const sy = shapeDragStart.current.y;
      const w = coords.x - sx;
      const h = coords.y - sy;

      if (Math.abs(w) > 3 || Math.abs(h) > 3) {
        const shape: VectorShape = {
          id: `shape_${Date.now()}`,
          type: vectorSettings.shapeType,
          x: Math.min(sx, sx + w),
          y: Math.min(sy, sy + h),
          width: Math.abs(w),
          height: Math.abs(h),
          strokeColor: vectorSettings.strokeColor,
          strokeWidth: vectorSettings.strokeWidth,
          fillColor: vectorSettings.hasFill ? vectorSettings.fillColor : 'transparent',
          hasFill: vectorSettings.hasFill,
          hasStroke: vectorSettings.hasStroke,
          lineCap: vectorSettings.lineCap || 'round',
          lineJoin: vectorSettings.lineJoin || 'round',
          cornerRadius: vectorSettings.cornerRadius,
        };

        onSaveSnapshot('Add Vector Shape');
        onEnsureVectorLayer?.();
        onCommitVectorShape(shape);
        onSelectVectorShapeId?.(shape.id);
      }
      currentDragVector.current = null;
      shapeDragStart.current = null;
      renderMainCanvas();
      return;
    }

    // Commit Selection (Marquee / Lasso)
    if (activeTool === 'marquee' && shapeDragStart.current) {
      const sx = shapeDragStart.current.x;
      const sy = shapeDragStart.current.y;
      const w = coords.x - sx;
      const h = coords.y - sy;
      if (Math.abs(w) > 4 && Math.abs(h) > 4) {
        onUpdateSelection({
          type: 'rect',
          rect: {
            x: Math.min(sx, sx + w),
            y: Math.min(sy, sy + h),
            width: Math.abs(w),
            height: Math.abs(h),
          },
          active: true,
        });
      } else {
        // Single click deselects
        onUpdateSelection({
          type: null,
          active: false,
        });
      }
      shapeDragStart.current = null;
    } else if (activeTool === 'lasso' && lassoPoints.current.length > 2) {
      onUpdateSelection({
        type: 'lasso',
        path: [...lassoPoints.current],
        active: true,
      });
      lassoPoints.current = [];
    }

    // Clean up touch pointers
    if (e.pointerType === 'touch') {
      activeTouchPointers.current.delete(e.pointerId);
      if (activeTouchPointers.current.size < 2) {
        initialPinchDist.current = null;
        lastPanPos.current = null;
      }
    }

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    // Commit moved path anchor node
    if (anchorDrag.current) {
      if (onMoveVectorShape && anchorDrag.current.shape) {
        onMoveVectorShape(anchorDrag.current.shape.id, 0, 0);
      }
      anchorDrag.current = null;
    }

    // Commit moved vector shape
    if (vectorOriginalShape.current) {
      if (onMoveVectorShape) {
        onMoveVectorShape(vectorOriginalShape.current.id, 0, 0);
      }
      vectorOriginalShape.current = null;
    }

    // Finalize non-destructive Move Layer
    if (activeTool === 'transform' && layerMoveStartCoords.current) {
      const { dx, dy } = layerMoveTotalOffset.current;
      if (dx !== 0 || dy !== 0) {
        onSaveSnapshot('Move Layer');
      }
      layerMovePristineSnapshots.current.clear();
      layerMovePristineVectors.current.clear();
      layerMoveStartCoords.current = null;
      layerMoveTotalOffset.current = { dx: 0, dy: 0 };
    }

    vectorDragStart.current = null;
    transformDragStart.current = null;
    transformLastPos.current = null;
    cloneStrokeStart.current = null;
    isInteracting.current = false;

    strokePoints.current = [];
    smoothedPoint.current = null;
    renderMainCanvas();
  };

  /**
   * Wheel Zoom & Pan
   */
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom centered at cursor
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const newZoom = Math.max(0.05, Math.min(32, transform.zoom * zoomFactor));
      onUpdateTransform({ zoom: newZoom });
    } else {
      // Pan
      onUpdateTransform({
        panX: transform.panX - e.deltaX,
        panY: transform.panY - e.deltaY,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const coords = getCanvasCoords(e.clientX, e.clientY);
          onDropImageFile?.(file, coords);
        }
      }}
      className={`flex-1 h-full relative overflow-hidden bg-neutral-950 select-none flex items-center justify-center ${
        lightingGizmoState && lightingGizmoState.isActive
          ? 'cursor-move'
          : activeTool === 'hand' || isPanning.current
          ? 'cursor-grab active:cursor-grabbing'
          : activeTool === 'transform'
          ? 'cursor-move'
          : activeTool === 'vector-select'
          ? 'cursor-default'
          : activeTool === 'text'
          ? 'cursor-text'
          : activeTool === 'zoom'
          ? zoomSettings?.mode === 'out' ? 'cursor-zoom-out' : 'cursor-zoom-in'
          : activeTool === 'mesh'
          ? 'cursor-cell'
          : 'cursor-crosshair'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Viewport Transform Container */}
      <div
        className="absolute origin-center shadow-2xl"
        style={{
          transform: `translate3d(${Math.round(transform.panX * 10) / 10}px, ${Math.round(transform.panY * 10) / 10}px, 0) scale(${transform.zoom}) rotate(${transform.rotation}rad)`,
          width: `${config.width}px`,
          height: `${config.height}px`,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'subpixel-antialiased',
        }}
      >
        {/* Transparent Checkerboard Background */}
        <div
          className="absolute inset-0 transparency-grid-dark rounded-sm overflow-hidden"
          style={{ width: `${config.width}px`, height: `${config.height}px` }}
        />

        {/* Master Composited Canvas */}
        <canvas
          ref={mainCanvasRef}
          width={config.width}
          height={config.height}
          className="absolute inset-0 pointer-events-none"
          style={{
            imageRendering: crispMode && transform.zoom >= 1.5 ? 'pixelated' : 'auto',
          }}
        />

        {/* Active Stroke Canvas */}
        <canvas
          ref={activeCanvasRef}
          width={config.width}
          height={config.height}
          className="absolute inset-0 pointer-events-none"
          style={{
            imageRendering: crispMode && transform.zoom >= 1.5 ? 'pixelated' : 'auto',
          }}
        />

        {/* Shape / Selection / Gradient Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          width={config.width}
          height={config.height}
          className="absolute inset-0 pointer-events-none"
          style={{
            imageRendering: crispMode && transform.zoom >= 1.5 ? 'pixelated' : 'auto',
          }}
        />

        {/* Alignment Grid Overlay */}
        {gridEnabled && (
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            width={config.width}
            height={config.height}
          >
            <defs>
              <pattern id="canvas-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-grid)" />
          </svg>
        )}

        {/* Symmetry Guidelines Overlay */}
        {brushSettings.symmetry && brushSettings.symmetry !== 'off' && (
          <svg
            className="absolute inset-0 pointer-events-none z-15"
            width={config.width}
            height={config.height}
          >
            {(brushSettings.symmetry === 'vertical' ||
              brushSettings.symmetry === 'quad' ||
              brushSettings.symmetry === 'mandala') && (
              <line
                x1={config.width / 2}
                y1={0}
                x2={config.width / 2}
                y2={config.height}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.6"
              />
            )}
            {(brushSettings.symmetry === 'horizontal' ||
              brushSettings.symmetry === 'quad' ||
              brushSettings.symmetry === 'mandala') && (
              <line
                x1={0}
                y1={config.height / 2}
                x2={config.width}
                y2={config.height / 2}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.6"
              />
            )}
            {brushSettings.symmetry === 'mandala' && (
              <>
                <line
                  x1={0}
                  y1={0}
                  x2={config.width}
                  y2={config.height}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
                <line
                  x1={config.width}
                  y1={0}
                  x2={0}
                  y2={config.height}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
              </>
            )}
          </svg>
        )}

        {/* Clone Stamp Source Crosshair Marker */}
        {cloneSettings.source && (
          <svg
            className="absolute inset-0 pointer-events-none z-15"
            width={config.width}
            height={config.height}
          >
            <g transform={`translate(${cloneSettings.source.x}, ${cloneSettings.source.y})`}>
              <circle r="10" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#f59e0b" strokeWidth="1.5" />
            </g>
          </svg>
        )}

        {/* Active Vector Bézier Path Overlay (Illustrator Pen) */}
        {activeVectorPath && activeVectorPath.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none z-20"
            width={config.width}
            height={config.height}
            viewBox={`0 0 ${config.width} ${config.height}`}
          >
            <path
              d={activeVectorPath.reduce((acc, pt, i) => {
                return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
              }, '')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {activeVectorPath.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#06b6d4" strokeWidth="2" />
                <text x={pt.x + 8} y={pt.y + 4} fill="#06b6d4" fontSize="11" fontFamily="sans-serif">
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        )}

        {/* Selection Marquee Marching Ants */}
        {selection.active && selection.rect && (
          <svg
            className="absolute inset-0 pointer-events-none z-25"
            width={config.width}
            height={config.height}
          >
            <rect
              x={selection.rect.x}
              y={selection.rect.y}
              width={selection.rect.width}
              height={selection.rect.height}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              className="marching-ants"
            />
          </svg>
        )}

        {/* Lasso Selection Marching Ants */}
        {selection.active && selection.type === 'lasso' && selection.path && selection.path.length > 1 && (
          <svg
            className="absolute inset-0 pointer-events-none z-25"
            width={config.width}
            height={config.height}
          >
            <polygon
              points={selection.path.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              className="marching-ants"
            />
          </svg>
        )}

        {/* Direct Selection: Interactive Highlight Bounding Box & Anchor Points */}
        {activeTool === 'vector-select' && selectedVectorShape && (
          (() => {
            const b = VectorEngine.getShapeBounds(selectedVectorShape);
            const pad = 6;
            const bx = b.minX - pad;
            const by = b.minY - pad;
            const bw = Math.max(24, b.maxX - b.minX + pad * 2);
            const bh = Math.max(24, b.maxY - b.minY + pad * 2);
            const scaleAdj = Math.max(0.2, transform.zoom);

            return (
              <>
                <svg
                  className="absolute inset-0 pointer-events-none z-25"
                  width={config.width}
                  height={config.height}
                >
                  {/* Outer glowing selection border */}
                  <rect
                    x={bx}
                    y={by}
                    width={bw}
                    height={bh}
                    fill="rgba(6, 182, 212, 0.06)"
                    stroke="#06b6d4"
                    strokeWidth={2 / scaleAdj}
                    strokeDasharray="6 4"
                  />

                  {/* 4 Corner Anchor Handles */}
                  {[
                    [bx, by],
                    [bx + bw, by],
                    [bx + bw, by + bh],
                    [bx, by + bh],
                  ].map(([hx, hy], idx) => (
                    <rect
                      key={idx}
                      x={hx - 4 / scaleAdj}
                      y={hy - 4 / scaleAdj}
                      width={8 / scaleAdj}
                      height={8 / scaleAdj}
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth={1.5 / scaleAdj}
                    />
                  ))}

                  {/* Anchor Nodes for Path Shapes */}
                  {selectedVectorShape.type === 'path' &&
                    selectedVectorShape.points &&
                    selectedVectorShape.points.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={5 / scaleAdj}
                          fill="#ffffff"
                          stroke="#0891b2"
                          strokeWidth={2 / scaleAdj}
                        />
                      </g>
                    ))}
                </svg>

                {/* Floating Context Toolbar right above selected object */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    position: 'absolute',
                    left: `${(b.minX + b.maxX) / 2}px`,
                    top: `${Math.max(12, b.minY - 14)}px`,
                    transform: `translate(-50%, -100%) scale(${Math.max(0.6, Math.min(1.8, 1 / Math.sqrt(transform.zoom)))})`,
                    transformOrigin: 'bottom center',
                    pointerEvents: 'auto',
                  }}
                  className="z-35 flex items-center gap-1 bg-neutral-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-cyan-500/80 shadow-2xl text-[12px] text-white select-none whitespace-nowrap"
                >
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onCopyObject?.();
                      setCloneToast('📋 অবজেক্ট কপি করা হয়েছে (Copied!)');
                      setTimeout(() => setCloneToast(null), 2000);
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-cyan-600 flex items-center gap-1 font-semibold text-cyan-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                    title="কপি করুন (Ctrl+C)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি (Copy)</span>
                  </button>

                  <button
                    disabled={!canPaste}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onPasteObject?.();
                      setCloneToast('📋 অবজেক্ট পেস্ট করা হয়েছে (Pasted!)');
                      setTimeout(() => setCloneToast(null), 2000);
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-emerald-600 disabled:opacity-40 flex items-center gap-1 font-semibold text-emerald-300 hover:text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    title="পেস্ট করুন (Ctrl+V)"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>পেস্ট (Paste)</span>
                  </button>

                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDuplicateSelectedShape?.();
                      setCloneToast('⧉ অবজেক্ট ডুপ্লিকেট করা হয়েছে (Duplicated!)');
                      setTimeout(() => setCloneToast(null), 2000);
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600 flex items-center gap-1 font-semibold text-purple-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                    title="ডুপ্লিকেট করুন (Ctrl+D)"
                  >
                    <CopyPlus className="w-3.5 h-3.5" />
                    <span>ডুপ্লিকেট</span>
                  </button>

                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onCutObject?.();
                      setCloneToast('✂️ অবজেক্ট কাট করা হয়েছে (Cut!)');
                      setTimeout(() => setCloneToast(null), 2000);
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-amber-600 flex items-center gap-1 font-semibold text-amber-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                    title="কাট করুন (Ctrl+X)"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>কাট</span>
                  </button>

                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDeleteSelectedShape?.();
                      setCloneToast('🗑️ অবজেক্ট ডিলিট করা হয়েছে');
                      setTimeout(() => setCloneToast(null), 2000);
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-red-600 flex items-center gap-1 font-semibold text-red-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                    title="মুছুন (Delete)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছুন</span>
                  </button>
                </div>
              </>
            );
          })()
        )}

        {/* Marquee Pixel Selection: Floating Context Toolbar */}
        {selection.active && selection.rect && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              left: `${selection.rect.x + selection.rect.width / 2}px`,
              top: `${Math.max(12, selection.rect.y - 14)}px`,
              transform: `translate(-50%, -100%) scale(${Math.max(0.6, Math.min(1.8, 1 / Math.sqrt(transform.zoom)))})`,
              transformOrigin: 'bottom center',
              pointerEvents: 'auto',
            }}
            className="z-35 flex items-center gap-1 bg-neutral-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-sky-500/80 shadow-2xl text-[12px] text-white select-none whitespace-nowrap"
          >
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCopyObject?.();
                setCloneToast('📋 পিক্সেল কপি করা হয়েছে (Copied Pixels)');
                setTimeout(() => setCloneToast(null), 2000);
              }}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-cyan-600 flex items-center gap-1 font-semibold text-cyan-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="কপি পিক্সেল (Ctrl+C)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>কপি (Copy)</span>
            </button>

            <button
              disabled={!canPaste}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPasteObject?.();
                setCloneToast('📋 পেস্ট করা হয়েছে (Pasted)');
                setTimeout(() => setCloneToast(null), 2000);
              }}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-emerald-600 disabled:opacity-40 flex items-center gap-1 font-semibold text-emerald-300 hover:text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              title="পেস্ট করুন (Ctrl+V)"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>পেস্ট (Paste)</span>
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCutObject?.();
                setCloneToast('✂️ কাট করা হয়েছে (Cut)');
                setTimeout(() => setCloneToast(null), 2000);
              }}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-amber-600 flex items-center gap-1 font-semibold text-amber-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="কাট করুন (Ctrl+X)"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>কাট</span>
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteSelection?.();
                setCloneToast('🗑️ পিক্সেল মুছা হয়েছে');
                setTimeout(() => setCloneToast(null), 2000);
              }}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-red-600 flex items-center gap-1 font-semibold text-red-400 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="মুছুন (Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছুন</span>
            </button>

            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClearSelection?.();
              }}
              className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center gap-1 font-semibold text-neutral-400 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="নির্বাচন বাতিল (Deselect / Esc)"
            >
              <X className="w-3.5 h-3.5" />
              <span>বাতিল</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Toast Notifications (Clone Stamp & Copy/Paste alerts) */}
      {cloneToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-neutral-900/95 text-cyan-300 border border-cyan-500/70 shadow-2xl px-4 py-2 rounded-2xl text-xs font-bold z-50 flex items-center gap-2 animate-in fade-in zoom-in-95 pointer-events-none">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{cloneToast}</span>
        </div>
      )}

      {/* Floating Canvas Quick Viewport Tooltip */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-3 left-3 bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-neutral-400 flex items-center gap-2 shadow-lg z-30 select-none pointer-events-auto"
      >
        <span>Zoom: {Math.round(transform.zoom * 100)}%</span>
        <span>•</span>
        <span>
          {config.width} × {config.height}
        </span>
        <span>•</span>
        <span className="text-cyan-400 font-semibold">{activeLayer.name}</span>
        {activeTool === 'clone' && cloneSettings.source && (
          <>
            <span>•</span>
            <span className="text-amber-400">Stamp Source Set</span>
          </>
        )}
        <span>•</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setCrispMode((prev) => !prev);
          }}
          className={`flex items-center gap-1 font-sans text-[11px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
            crispMode
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'bg-neutral-800/80 text-neutral-300 hover:text-white'
          }`}
          title="ড্রইং কোয়ালিটি রক্ষা (ক্রিস্প পিক্সেল / স্মুথ ফিল্টার মোড পরিবর্তন)"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{crispMode ? 'Sharp HD' : 'Smooth HD'}</span>
        </button>

        {onFitZoom && (
          <>
            <span>•</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onFitZoom();
              }}
              className="flex items-center gap-1 font-sans text-[11px] px-1.5 py-0.5 rounded cursor-pointer transition-colors bg-neutral-800/80 text-neutral-300 hover:text-white active:scale-95"
              title="ক্যানভাস স্ক্রিনে ফিট করুন (Fit Canvas to Screen)"
            >
              <Maximize className="w-3 h-3 text-cyan-400" />
              <span>ফিট</span>
            </button>
          </>
        )}

        {onToggleFullPage && (
          <>
            <span>•</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullPage();
              }}
              className={`flex items-center gap-1 font-sans text-[11px] px-2 py-0.5 rounded font-bold cursor-pointer transition-all active:scale-95 ${
                isFullPageMode
                  ? 'bg-amber-500 text-black shadow ring-1 ring-amber-300 animate-pulse'
                  : 'bg-amber-950/80 text-amber-300 hover:text-white border border-amber-600/40'
              }`}
              title="ফুল পেইজ ড্রইং মোড (Full Page Zen Drawing)"
            >
              {isFullPageMode ? <Minimize2 className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
              <span>{isFullPageMode ? 'নরমাল' : 'ফুল পেইজ'}</span>
            </button>
          </>
        )}

        {onToggleRightPanel && (
          <>
            <span>•</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleRightPanel();
              }}
              className={`flex items-center gap-1 font-sans text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors active:scale-95 ${
                rightPanelOpen
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
              title="লেয়ার ও কালার প্যানেল খুলুন/বন্ধ করুন"
            >
              <LayersIcon className="w-3 h-3 text-cyan-400" />
              <span>লেয়ার</span>
            </button>
          </>
        )}
      </div>

      {/* Floating Zen Mode / Full Page Exit & Quick Actions Pill */}
      {isFullPageMode && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 z-45 flex items-center gap-2 animate-in fade-in duration-200 select-none pointer-events-auto"
        >
          {onToggleRightPanel && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleRightPanel();
              }}
              className="px-3 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/50 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="লেয়ার ও কালার স্টুডিও"
            >
              <LayersIcon className="w-3.5 h-3.5" />
              <span>লেয়ার</span>
            </button>
          )}

          {onToggleFullPage && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullPage();
              }}
              className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-2xl cursor-pointer active:scale-95 ring-2 ring-amber-300"
              title="ফুল পেইজ মোড বন্ধ করুন (Exit Full Screen)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>নরমাল ভিউ</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Quick Paste Action Button on Canvas (Visible when clipboard has content) */}
      {canPaste && (
        <div className="absolute top-4 right-4 z-40 animate-in fade-in zoom-in-95 duration-150">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onPasteObject?.();
              setCloneToast('📋 অবজেক্ট পেস্ট করা হয়েছে (Pasted!)');
              setTimeout(() => setCloneToast(null), 2000);
            }}
            className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-2xl border border-emerald-400/80 active:scale-95 transition-all cursor-pointer ring-4 ring-emerald-400/25"
            title="ক্যানভাসে পেস্ট করুন (Ctrl+V)"
          >
            <ClipboardPaste className="w-4 h-4 animate-bounce" />
            <span>পেস্ট করুন (Paste)</span>
          </button>
        </div>
      )}

      {/* Right-Click Context Menu on Canvas (Photoshop/Illustrator Standard) */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed z-50 min-w-[190px] bg-neutral-900/95 backdrop-blur-md border border-neutral-750 rounded-xl shadow-2xl py-1 text-xs text-neutral-200 select-none animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              disabled={!canPaste}
              onClick={() => {
                onPasteObject?.();
                setContextMenu(null);
                setCloneToast('📋 অবজেক্ট পেস্ট করা হয়েছে (Pasted!)');
                setTimeout(() => setCloneToast(null), 2000);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2 font-semibold text-emerald-400 hover:text-white">
                <ClipboardPaste className="w-3.5 h-3.5" /> পেস্ট (Paste)
              </span>
              <span className="text-neutral-500 text-[10px]">Ctrl+V</span>
            </button>

            <button
              disabled={!selectedVectorShape && !selection.active}
              onClick={() => {
                onCopyObject?.();
                setContextMenu(null);
                setCloneToast('📋 অবজেক্ট কপি করা হয়েছে (Copied!)');
                setTimeout(() => setCloneToast(null), 2000);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2"><Copy className="w-3.5 h-3.5 text-cyan-400" /> কপি (Copy)</span>
              <span className="text-neutral-500 text-[10px]">Ctrl+C</span>
            </button>

            {selectedVectorShape && (
              <button
                onClick={() => {
                  onDuplicateSelectedShape?.();
                  setContextMenu(null);
                  setCloneToast('⧉ অবজেক্ট ডুপ্লিকেট করা হয়েছে (Duplicated!)');
                  setTimeout(() => setCloneToast(null), 2000);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2"><CopyPlus className="w-3.5 h-3.5 text-purple-400" /> ডুপ্লিকেট (Duplicate)</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+D</span>
              </button>
            )}

            {(selectedVectorShape || selection.active) && (
              <button
                onClick={() => {
                  onCutObject?.();
                  setContextMenu(null);
                  setCloneToast('✂️ অবজেক্ট কাট করা হয়েছে (Cut!)');
                  setTimeout(() => setCloneToast(null), 2000);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-amber-600 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5 text-amber-400" /> কাট (Cut)</span>
                <span className="text-neutral-500 text-[10px]">Ctrl+X</span>
              </button>
            )}

            {(selectedVectorShape || selection.active) && (
              <button
                onClick={() => {
                  if (selectedVectorShape) onDeleteSelectedShape?.();
                  else onDeleteSelection?.();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white flex items-center justify-between cursor-pointer text-red-300"
              >
                <span className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> মুছুন (Delete)</span>
                <span className="text-neutral-500 text-[10px]">Del</span>
              </button>
            )}

            {selection.active && (
              <button
                onClick={() => {
                  onClearSelection?.();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-between cursor-pointer border-t border-neutral-800 mt-1"
              >
                <span className="flex items-center gap-2"><X className="w-3.5 h-3.5" /> নির্বাচন বাতিল</span>
                <span className="text-neutral-500 text-[10px]">Esc</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
