export type ToolType =
  | 'brush'
  | 'eraser'
  | 'eyedropper'
  | 'bucket'
  | 'smudge'
  | 'blur'
  | 'marquee'
  | 'lasso'
  | 'vector-pen'
  | 'polyline'
  | 'bezier'
  | 'vector-shape'
  | 'vector-select'
  | 'mesh'
  | 'bone'
  | 'transform'
  | 'hand'
  | 'rotate'
  | 'zoom'
  | 'text'
  | 'gradient'
  | 'clone';

export type SymmetryMode = 'off' | 'vertical' | 'horizontal' | 'quad' | 'mandala';

export interface MeshNode {
  x: number;
  y: number;
  color: string;
}

export interface MeshGridData {
  rows: number;
  cols: number;
  nodes: MeshNode[][]; // rows x cols grid
}

export interface MeshSettings {
  rows: number;
  cols: number;
  preset: 'custom' | 'sphere-3d' | 'sunset' | 'aurora' | 'wave' | 'torus' | 'fruit';
  wireframe: boolean;
  showMeshLines?: boolean;
  showMeshPoints?: boolean;
  selectedNode?: { row: number; col: number } | null;
}

export interface ZoomSettings {
  mode: 'in' | 'out';
  scrubby: boolean;
}

export interface TextSettings {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface GradientSettings {
  type: 'linear' | 'radial';
  preset: 'fg-to-bg' | 'fg-to-trans' | 'rainbow' | 'sunset' | 'ocean' | 'fire';
  angle?: number;
}

export interface CloneSettings {
  source: { x: number; y: number } | null;
  isSettingSource: boolean;
}

export type BrushPreset =
  | 'pen'
  | 'glow-pencil'
  | 'soft-airbrush'
  | 'calligraphy'
  | 'oil-paint'
  | 'watercolor'
  | 'pencil'
  | 'charcoal'
  | 'screentone'
  | 'spray';

export interface BrushSettings {
  preset: BrushPreset;
  size: number;
  opacity: number;
  flow: number;
  hardness: number;
  spacing: number;
  smoothing: number; // 0 to 1 stabilizer
  jitterSize: number;
  jitterAngle: number;
  pressureSize: boolean;
  pressureOpacity: boolean;
  symmetry?: SymmetryMode;
  isGlow?: boolean;
  glowIntensity?: number;
}

export interface VectorSettings {
  shapeType: VectorShapeType;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  hasFill: boolean;
  hasStroke: boolean;
  lineCap: 'round' | 'butt' | 'square';
  lineJoin: 'round' | 'bevel' | 'miter';
  cornerRadius?: number;
}

export type VectorShapeType = 'path' | 'rect' | 'circle' | 'line' | 'star' | 'polygon' | 'mesh' | 'polyline' | 'bezier';

export interface VectorNode {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface VectorShape {
  id: string;
  type: VectorShapeType;
  points?: VectorNode[];
  meshData?: MeshGridData;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  cornerRadius?: number;
  sides?: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  hasFill: boolean;
  hasStroke: boolean;
  lineCap: 'round' | 'butt' | 'square';
  lineJoin: 'round' | 'bevel' | 'miter';
  closed?: boolean;
  dash?: number[];
}

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface Layer {
  id: string;
  name: string;
  type: 'raster' | 'vector';
  visible: boolean;
  locked: boolean;
  alphaLocked: boolean;
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  canvas: HTMLCanvasElement; // Raster data
  vectors: VectorShape[]; // Vector data
  clippingMask?: boolean; // Clips to non-transparent pixels of the layer directly below
  linked?: boolean; // Linked with other layers to move/transform in sync
  lightingConfig?: any; // Config if this layer was generated as a lighting/celestial effect
  mesh?: any; // Mesh deformation data if applicable
}

export interface AnimationFrame {
  id: string;
  name: string;
  layers: Layer[];
}

export interface AudioTrackItem {
  id: string;
  name: string;
  category: 'voice' | 'sfx' | 'music' | 'foley';
  soundType?: string; // 'walk' | 'car' | 'train' | 'plane' | 'rain' | 'thunder' | 'sad' | 'joy' | 'boing' | 'punch' | 'custom'
  audioUrl: string;
  startFrame: number; // 0-indexed frame where audio triggers
  durationFrames: number;
  durationSeconds?: number;
  volume: number; // 0 to 1
  muted?: boolean;
}

export interface AnimationSettings {
  fps: number;
  isPlaying: boolean;
  currentFrameIndex: number;
  loop: boolean;
  onionSkin: boolean;
  onionFramesBefore: number;
  onionFramesAfter: number;
  onionOpacity: number;
  audioEnabled?: boolean;
}

export type GridType =
  | 'square'
  | 'isometric'
  | 'dots'
  | 'rule-of-thirds'
  | 'perspective'
  | 'golden-ratio'
  | 'triangular'
  | 'polar';

export interface GridConfig {
  enabled: boolean;
  type: GridType;
  size: number; // cell size in px (e.g. 16, 32, 64, 128)
  subdivisions: number; // e.g. 4 (major line every N cells)
  color: string; // hex or rgba, e.g. '#06b6d4' or '#ffffff'
  opacity: number; // 0.05 to 1.0 (e.g. 0.25)
  lineWidth: number; // 1, 1.5, 2
  snapToGrid: boolean; // magnetically snap drawing & vector objects
  snapTolerance: number; // snap radius in px (e.g. 12)
  showPixelGrid?: boolean; // automatically show 1px pixel grid at zoom >= 400%
  polarDivisions?: number; // 6, 8, 12, 16, 24 spokes for polar/radial grid
  showGridHud?: boolean; // on-canvas floating quick controls bar
  guides?: {
    id: string;
    orientation: 'horizontal' | 'vertical';
    position: number;
    color?: string;
  }[];
  vanishingPoints?: {
    vp1: { x: number; y: number }; // left or center
    vp2?: { x: number; y: number }; // right for 2-point perspective
    horizonY: number;
  };
  isoAngle?: number; // 30 degrees default
}

export interface CanvasConfig {
  name: string;
  width: number;
  height: number;
  dpi: number;
  background: 'transparent' | 'white' | 'dark' | 'custom';
  customBgColor?: string;
}

export interface ViewportTransform {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  deltaPanX?: number;
  deltaPanY?: number;
}

export interface SelectionArea {
  type: 'rect' | 'lasso' | null;
  rect?: { x: number; y: number; width: number; height: number };
  path?: { x: number; y: number }[];
  active: boolean;
}

export interface ColorHSB {
  h: number; // 0-360
  s: number; // 0-100
  b: number; // 0-100
}

export interface HistoryEntry {
  description: string;
  timestamp: number;
  // Snapshot data per frame and layers
  frameIndex: number;
  layerId: string;
  snapshotCanvas?: HTMLCanvasElement;
  vectors?: VectorShape[];
}

export interface ReferenceImageConfig {
  url: string | null;
  name: string;
  visible: boolean;
  opacity: number; // 0.1 to 1
  scale: number; // 0.2 to 4
  x: number;
  y: number;
  mode: 'window' | 'overlay';
  flippedH: boolean;
  open?: boolean;
  // Video & Frame-by-frame reference support
  isVideoReference?: boolean;
  videoFrames?: string[]; // Array of extracted frame-by-frame data URLs
  videoFrameIndex?: number; // Active frame index
  videoFps?: number; // Reference playback fps
  syncWithTimeline?: boolean; // Automatically sync with animation timeline frame
  isPlaying?: boolean; // Loop playback inside reference window
}

export type TweenMode = 'camera-zoom' | 'bg-runner' | 'layer-tween';

export interface TweenConfig {
  mode?: TweenMode;
  layerId: string; // 'all' for camera zoom across all layers, or specific layerId
  startFrameIndex: number;
  endFrameIndex: number;
  startScale: number; // 0.1 to 5.0 (1 = 100%)
  endScale: number; // 0.1 to 5.0
  startPosX?: number;
  endPosX?: number;
  startPosY?: number;
  endPosY?: number;
  startRotation?: number; // degrees
  endRotation?: number; // degrees
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  createNewFramesIfNeeded: boolean;
  // Background runner specific settings
  bgDirection?: 'left' | 'right' | 'up' | 'down';
  bgSpeedPixels?: number;
  bgSeamlessLoop?: boolean;
}
