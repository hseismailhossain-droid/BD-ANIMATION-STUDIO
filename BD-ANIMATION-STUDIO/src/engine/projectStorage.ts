import { AnimationFrame, CanvasConfig, AnimationSettings, Layer, AudioTrackItem } from '../types';

const DB_NAME = 'bd_anim_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const AUTOSAVE_KEY = 'current_autosave_project';

export interface SavedProjectPayload {
  version: string;
  timestamp: number;
  config: CanvasConfig;
  animSettings: {
    fps: number;
    loop: boolean;
  };
  audioTracks?: AudioTrackItem[];
  frames: {
    id: string;
    name: string;
    layers: {
      id: string;
      name: string;
      type: 'raster' | 'vector';
      visible: boolean;
      locked: boolean;
      alphaLocked: boolean;
      opacity: number;
      blendMode: any;
      clippingMask?: boolean;
      rasterData?: string | null;
      vectors?: any[];
      mesh?: any;
    }[];
  }[];
}

export class ProjectStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save complete project to IndexedDB automatically
   */
  public static async saveAutosave(
    frames: AnimationFrame[],
    config: CanvasConfig,
    animSettings: AnimationSettings,
    audioTracks: AudioTrackItem[] = []
  ): Promise<boolean> {
    try {
      const db = await this.getDB();

      const payload: SavedProjectPayload = {
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

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(payload, AUTOSAVE_KEY);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (err) {
      console.warn('Autosave to IndexedDB failed:', err);
      return false;
    }
  }

  /**
   * Load autosaved project from IndexedDB
   */
  public static async loadAutosave(): Promise<{
    frames: AnimationFrame[];
    config: CanvasConfig;
    animSettings: { fps: number; loop: boolean };
    audioTracks?: AudioTrackItem[];
    timestamp: number;
  } | null> {
    try {
      const db = await this.getDB();

      const payload: SavedProjectPayload | null = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(AUTOSAVE_KEY);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (!payload || !payload.frames || payload.frames.length === 0) {
        return null;
      }

      // Reconstruct canvases
      const reconstructedFrames: AnimationFrame[] = await Promise.all(
        payload.frames.map(async (f) => {
          const reconstructedLayers: Layer[] = await Promise.all(
            f.layers.map(
              (l): Promise<Layer> =>
                new Promise((res) => {
                  const canvas = document.createElement('canvas');
                  canvas.width = payload.config.width;
                  canvas.height = payload.config.height;

                  if (l.type === 'raster' && l.rasterData) {
                    const img = new Image();
                    img.onload = () => {
                      const ctx = canvas.getContext('2d');
                      if (ctx) ctx.drawImage(img, 0, 0);
                      res({
                        id: l.id,
                        name: l.name,
                        type: 'raster',
                        visible: l.visible,
                        locked: l.locked,
                        alphaLocked: l.alphaLocked,
                        opacity: l.opacity,
                        blendMode: l.blendMode,
                        clippingMask: l.clippingMask,
                        canvas,
                        vectors: l.vectors || [],
                        mesh: l.mesh,
                      });
                    };
                    img.onerror = () => {
                      res({
                        id: l.id,
                        name: l.name,
                        type: 'raster',
                        visible: l.visible,
                        locked: l.locked,
                        alphaLocked: l.alphaLocked,
                        opacity: l.opacity,
                        blendMode: l.blendMode,
                        clippingMask: l.clippingMask,
                        canvas,
                        vectors: l.vectors || [],
                        mesh: l.mesh,
                      });
                    };
                    img.src = l.rasterData;
                  } else {
                    res({
                      id: l.id,
                      name: l.name,
                      type: l.type,
                      visible: l.visible,
                      locked: l.locked,
                      alphaLocked: l.alphaLocked,
                      opacity: l.opacity,
                      blendMode: l.blendMode,
                      clippingMask: l.clippingMask,
                      canvas,
                      vectors: l.vectors || [],
                      mesh: l.mesh,
                    });
                  }
                })
            )
          );

          return {
            id: f.id,
            name: f.name,
            layers: reconstructedLayers,
          };
        })
      );

      return {
        frames: reconstructedFrames,
        config: payload.config,
        animSettings: payload.animSettings,
        audioTracks: payload.audioTracks,
        timestamp: payload.timestamp,
      };
    } catch (err) {
      console.warn('Failed to load autosave from IndexedDB:', err);
      return null;
    }
  }

  /**
   * Clear autosave from IndexedDB
   */
  public static async clearAutosave(): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(AUTOSAVE_KEY);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Get metadata info about current autosave without reconstructing full canvases
   */
  public static async getAutosaveInfo(): Promise<{
    timestamp: number;
    frameCount: number;
    layerCount: number;
    config: CanvasConfig;
    previewUrl?: string | null;
  } | null> {
    try {
      const db = await this.getDB();
      const payload: SavedProjectPayload | null = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(AUTOSAVE_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (!payload || !payload.frames || payload.frames.length === 0) return null;

      const firstFrame = payload.frames[0];
      const previewLayer = firstFrame?.layers.find((l) => l.type === 'raster' && l.rasterData);

      return {
        timestamp: payload.timestamp,
        frameCount: payload.frames.length,
        layerCount: firstFrame?.layers.length || 0,
        config: payload.config,
        previewUrl: previewLayer?.rasterData || null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Save a project to the user's permanent local project library in IndexedDB
   */
  public static async saveNamedProject(
    projectName: string,
    frames: AnimationFrame[],
    config: CanvasConfig,
    animSettings: AnimationSettings,
    audioTracks: AudioTrackItem[] = []
  ): Promise<string | null> {
    try {
      const db = await this.getDB();
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const payload: SavedProjectPayload & { id: string; name: string } = {
        id: projectId,
        name: projectName || config.name || 'Untitled Project',
        version: '1.0',
        timestamp: Date.now(),
        config: { ...config, name: projectName || config.name },
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

      const success = await new Promise<boolean>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(payload, projectId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });

      return success ? projectId : null;
    } catch (err) {
      console.warn('Failed to save named project:', err);
      return null;
    }
  }

  /**
   * List all projects stored in local IndexedDB
   */
  public static async listSavedProjects(): Promise<
    Array<{
      id: string;
      name: string;
      timestamp: number;
      frameCount: number;
      layerCount: number;
      width: number;
      height: number;
      previewUrl?: string | null;
    }>
  > {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();
        const results: Array<{
          id: string;
          name: string;
          timestamp: number;
          frameCount: number;
          layerCount: number;
          width: number;
          height: number;
          previewUrl?: string | null;
        }> = [];

        req.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor) {
            const key = String(cursor.key);
            // Skip autosave key here (handled separately)
            if (key !== AUTOSAVE_KEY && key.startsWith('project_')) {
              const val = cursor.value;
              const firstFrame = val.frames?.[0];
              const previewLayer = firstFrame?.layers?.find((l: any) => l.type === 'raster' && l.rasterData);
              results.push({
                id: key,
                name: val.name || val.config?.name || 'Untitled Project',
                timestamp: val.timestamp || Date.now(),
                frameCount: val.frames?.length || 1,
                layerCount: firstFrame?.layers?.length || 1,
                width: val.config?.width || 1920,
                height: val.config?.height || 1080,
                previewUrl: previewLayer?.rasterData || null,
              });
            }
            cursor.continue();
          } else {
            // Sort newest first
            results.sort((a, b) => b.timestamp - a.timestamp);
            resolve(results);
          }
        };

        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Load a named project from IndexedDB by ID
   */
  public static async loadProjectById(id: string): Promise<{
    frames: AnimationFrame[];
    config: CanvasConfig;
    animSettings: { fps: number; loop: boolean };
    audioTracks?: AudioTrackItem[];
    timestamp: number;
  } | null> {
    try {
      const db = await this.getDB();
      const payload: SavedProjectPayload | null = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (!payload || !payload.frames || payload.frames.length === 0) return null;

      // Reconstruct canvases
      const reconstructedFrames: AnimationFrame[] = await Promise.all(
        payload.frames.map(async (f) => {
          const reconstructedLayers: Layer[] = await Promise.all(
            f.layers.map(
              (l): Promise<Layer> =>
                new Promise((res) => {
                  const canvas = document.createElement('canvas');
                  canvas.width = payload.config.width;
                  canvas.height = payload.config.height;

                  if (l.type === 'raster' && l.rasterData) {
                    const img = new Image();
                    img.onload = () => {
                      const ctx = canvas.getContext('2d');
                      if (ctx) ctx.drawImage(img, 0, 0);
                      res({
                        id: l.id,
                        name: l.name,
                        type: 'raster',
                        visible: l.visible,
                        locked: l.locked,
                        alphaLocked: l.alphaLocked,
                        opacity: l.opacity,
                        blendMode: l.blendMode,
                        clippingMask: l.clippingMask,
                        canvas,
                        vectors: l.vectors || [],
                        mesh: l.mesh,
                      });
                    };
                    img.onerror = () => {
                      res({
                        id: l.id,
                        name: l.name,
                        type: 'raster',
                        visible: l.visible,
                        locked: l.locked,
                        alphaLocked: l.alphaLocked,
                        opacity: l.opacity,
                        blendMode: l.blendMode,
                        clippingMask: l.clippingMask,
                        canvas,
                        vectors: l.vectors || [],
                        mesh: l.mesh,
                      });
                    };
                    img.src = l.rasterData;
                  } else {
                    res({
                      id: l.id,
                      name: l.name,
                      type: l.type,
                      visible: l.visible,
                      locked: l.locked,
                      alphaLocked: l.alphaLocked,
                      opacity: l.opacity,
                      blendMode: l.blendMode,
                      clippingMask: l.clippingMask,
                      canvas,
                      vectors: l.vectors || [],
                      mesh: l.mesh,
                    });
                  }
                })
            )
          );

          return {
            id: f.id,
            name: f.name,
            layers: reconstructedLayers,
          };
        })
      );

      return {
        frames: reconstructedFrames,
        config: payload.config,
        animSettings: payload.animSettings,
        audioTracks: payload.audioTracks,
        timestamp: payload.timestamp,
      };
    } catch (err) {
      console.warn('Failed to load project by id:', err);
      return null;
    }
  }

  /**
   * Delete a project from IndexedDB by ID
   */
  public static async deleteProjectById(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }
}
