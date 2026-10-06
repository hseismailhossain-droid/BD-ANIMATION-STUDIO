/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripHorizontal, X, Palette, Layers, Move, Pin, PinOff } from 'lucide-react';

interface MovableStudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  colorPickerContent: React.ReactNode;
  layersContent: React.ReactNode;
  isFullPageMode?: boolean;
  activeTab?: 'both' | 'color' | 'layers';
  onTabChange?: (tab: 'both' | 'color' | 'layers') => void;
}

export const MovableStudioPanel: React.FC<MovableStudioPanelProps> = ({
  isOpen,
  onClose,
  colorPickerContent,
  layersContent,
  isFullPageMode = false,
  activeTab: controlledTab,
  onTabChange,
}) => {
  // Mobile check
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : true;
  const isLandscape = typeof window !== 'undefined' ? window.innerWidth > window.innerHeight && window.innerHeight < 600 : false;

  // Active view tab: on mobile, default to 'layers' or controlled tab
  const [internalTab, setInternalTab] = useState<'both' | 'color' | 'layers'>(() => {
    if (controlledTab) return controlledTab;
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'layers';
    }
    return 'both';
  });

  const activeTab = controlledTab || internalTab;
  const handleTabSelect = (tab: 'both' | 'color' | 'layers') => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Floating vs Docked mode - movable by default
  const [isFloating, setIsFloating] = useState<boolean>(true);

  // Floating Position (X, Y)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const panelWidth = Math.min(320, window.innerWidth - 16);
      return {
        x: Math.max(8, window.innerWidth - panelWidth - 8),
        y: Math.max(48, 56),
      };
    }
    return { x: 400, y: 56 };
  });

  const isDragging = useRef(false);
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionRef = useRef(position);
  positionRef.current = position;
  const panelRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const startDrag = (clientX: number, clientY: number) => {
    isDragging.current = true;
    dragStartOffset.current = {
      x: clientX - positionRef.current.x,
      y: clientY - positionRef.current.y,
    };
  };

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!isDragging.current) return;
      const panel = panelRef.current;
      const width = panel ? panel.offsetWidth : 300;
      const height = panel ? panel.offsetHeight : 420;

      let newX = clientX - dragStartOffset.current.x;
      let newY = clientY - dragStartOffset.current.y;

      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - width - 8);
      const minY = 44;
      const maxY = Math.max(44, window.innerHeight - height - 12);

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setPosition({ x: newX, y: newY });
    });
  }, []);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const handleDragStartPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsFloating(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    startDrag(e.clientX, e.clientY);
  };

  const handlePointerMoveCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();
    e.stopPropagation();
    moveDrag(e.clientX, e.clientY);
  };

  const handlePointerUpCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      stopDrag();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Global window release fallback
  useEffect(() => {
    const onWindowRelease = () => stopDrag();
    window.addEventListener('pointerup', onWindowRelease);
    window.addEventListener('pointercancel', onWindowRelease);
    return () => {
      window.removeEventListener('pointerup', onWindowRelease);
      window.removeEventListener('pointercancel', onWindowRelease);
    };
  }, [stopDrag]);

  // Viewport bounds clamping whenever opened or screen resized/rotated
  useEffect(() => {
    if (!isOpen) return;
    const clampToScreen = () => {
      if (typeof window === 'undefined') return;
      setPosition((prev) => {
        const width = panelRef.current?.offsetWidth || 300;
        const height = panelRef.current?.offsetHeight || 420;
        const maxX = Math.max(8, window.innerWidth - width - 8);
        const maxY = Math.max(44, window.innerHeight - height - 12);
        return {
          x: Math.min(maxX, Math.max(8, prev.x)),
          y: Math.min(maxY, Math.max(44, prev.y)),
        };
      });
    };

    clampToScreen();
    window.addEventListener('resize', clampToScreen);
    window.addEventListener('orientationchange', clampToScreen);
    return () => {
      window.removeEventListener('resize', clampToScreen);
      window.removeEventListener('orientationchange', clampToScreen);
    };
  }, [isOpen]);

  // Quick snap positions
  const snapTo = (loc: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'center' | 'reset') => {
    setIsFloating(true);
    const panel = panelRef.current;
    const width = panel ? panel.offsetWidth : 300;
    const height = panel ? panel.offsetHeight : 420;

    if (loc === 'top-left') {
      setPosition({ x: 8, y: 48 });
    } else if (loc === 'top-right' || loc === 'reset') {
      setPosition({ x: Math.max(8, window.innerWidth - width - 8), y: 48 });
    } else if (loc === 'bottom-right') {
      setPosition({
        x: Math.max(8, window.innerWidth - width - 8),
        y: Math.max(48, window.innerHeight - height - 12),
      });
    } else if (loc === 'bottom-left') {
      setPosition({
        x: 8,
        y: Math.max(48, window.innerHeight - height - 12),
      });
    } else if (loc === 'center') {
      setPosition({
        x: Math.max(8, (window.innerWidth - width) / 2),
        y: Math.max(48, (window.innerHeight - height) / 2),
      });
    }
  };

  if (!isOpen) return null;

  // Render floating movable panel (or right docked on large screens if requested)
  const isTrulyFloating = isFloating || isFullPageMode || isMobile;

  return (
    <div
      ref={panelRef}
      style={
        isTrulyFloating
          ? {
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 48,
              width: isLandscape ? '310px' : '300px',
              maxWidth: 'calc(100vw - 16px)',
              maxHeight: isLandscape ? '94vh' : '86vh',
              height: isLandscape ? 'min(94vh, 520px)' : 'min(86vh, 600px)',
            }
          : undefined
      }
      className={`flex flex-col bg-neutral-900 border border-cyan-500/70 shadow-2xl rounded-2xl overflow-hidden text-neutral-100 select-none ${
        isTrulyFloating
          ? 'animate-in fade-in zoom-in-95 duration-150 ring-1 ring-cyan-500/30'
          : 'fixed right-0 top-0 bottom-0 z-45 w-72 max-w-[85vw] lg:static lg:w-72 lg:h-full border-l border-neutral-800'
      }`}
    >
      {/* Draggable Movable Header Bar */}
      <div
        onPointerDown={handleDragStartPointer}
        onPointerMove={handlePointerMoveCapture}
        onPointerUp={handlePointerUpCapture}
        className="h-10 px-3 bg-neutral-950/95 border-b border-neutral-800 flex items-center justify-between cursor-move active:cursor-grabbing shrink-0 select-none touch-none"
        title="Touch & drag to move anywhere"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
          <GripHorizontal className="w-4 h-4 text-cyan-500 animate-pulse shrink-0" />
          <span className="truncate">Color & Layers</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick snap & reset buttons */}
          <button
            onClick={() => snapTo('reset')}
            title="Reset Position"
            className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 text-[10px] font-bold cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => snapTo('top-left')}
            title="Move to top left"
            className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
          >
            Left
          </button>
          <button
            onClick={() => snapTo('top-right')}
            title="Move to top right"
            className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
          >
            Right
          </button>
          <button
            onClick={() => snapTo('bottom-right')}
            title="Move to bottom right"
            className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
          >
            Bottom
          </button>

          {/* Dock / Float Toggle (Desktop only) */}
          {!isMobile && !isFullPageMode && (
            <button
              onClick={() => setIsFloating(!isFloating)}
              title={isFloating ? 'Dock to Right' : 'Float & Move'}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {isFloating ? <PinOff className="w-3.5 h-3.5 text-cyan-400" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close / Minimize Button */}
          <button
            onClick={onClose}
            title="Hide / Minimize Panel"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Selector: Color Studio / Layers Panel / Both */}
      <div className="h-8 bg-neutral-950 px-2 flex items-center gap-1 border-b border-neutral-800/80 shrink-0 text-[11px] font-medium">
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            handleTabSelect('color');
          }}
          onClick={() => handleTabSelect('color')}
          className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'color'
              ? 'bg-cyan-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
          }`}
          title="View Color Studio only"
        >
          <Palette className="w-3 h-3" />
          <span>Color</span>
        </button>

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            handleTabSelect('layers');
          }}
          onClick={() => handleTabSelect('layers')}
          className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-cyan-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
          }`}
          title="View Layers Panel only"
        >
          <Layers className="w-3 h-3" />
          <span>Layers</span>
        </button>

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            handleTabSelect('both');
          }}
          onClick={() => handleTabSelect('both')}
          className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'both'
              ? 'bg-cyan-600 text-white font-bold shadow border border-cyan-400/50'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
          }`}
          title="View Both Panels (Color & Layers)"
        >
          <span>Both</span>
        </button>
      </div>

      {/* Content Area - Isolated from panel drag */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        {activeTab === 'color' && (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
            {colorPickerContent}
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {layersContent}
          </div>
        )}

        {activeTab === 'both' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Top: Compact Color Studio with its own internal scroll */}
            <div className="h-[180px] shrink-0 overflow-y-auto overscroll-contain touch-pan-y border-b border-neutral-800 bg-neutral-900/60">
              {colorPickerContent}
            </div>
            {/* Bottom: Layers Panel takes all remaining space with its own smooth internal scroll */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {layersContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
