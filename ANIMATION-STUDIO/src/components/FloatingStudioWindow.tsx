/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripHorizontal, X, Move, Layers, Palette, Combine } from 'lucide-react';

interface FloatingStudioWindowProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  defaultPosition: { x: number; y: number };
  width?: string;
  maxHeight?: string;
  onDockTogether?: () => void;
  dockButtonTitle?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

export const FloatingStudioWindow: React.FC<FloatingStudioWindowProps> = ({
  id,
  title,
  icon,
  isOpen,
  onClose,
  defaultPosition,
  width = '300px',
  maxHeight = '85vh',
  onDockTogether,
  dockButtonTitle = 'Dock',
  headerExtra,
  children,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const panelWidth = Math.min(310, window.innerWidth - 16);
      return {
        x: Math.max(8, Math.min(window.innerWidth - panelWidth - 8, defaultPosition.x)),
        y: Math.max(48, Math.min(window.innerHeight - 100, defaultPosition.y)),
      };
    }
    return defaultPosition;
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
      const w = panel ? panel.offsetWidth : 300;
      const h = panel ? panel.offsetHeight : 350;

      let newX = clientX - dragStartOffset.current.x;
      let newY = clientY - dragStartOffset.current.y;

      const minX = 4;
      const maxX = Math.max(8, window.innerWidth - w - 4);
      const minY = 40;
      const maxY = Math.max(40, window.innerHeight - 50);

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

  useEffect(() => {
    const onWindowRelease = () => stopDrag();
    window.addEventListener('pointerup', onWindowRelease);
    window.addEventListener('pointercancel', onWindowRelease);
    return () => {
      window.removeEventListener('pointerup', onWindowRelease);
      window.removeEventListener('pointercancel', onWindowRelease);
    };
  }, [stopDrag]);

  // Quick snap positions
  const snapTo = (loc: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'center') => {
    const panel = panelRef.current;
    const w = panel ? panel.offsetWidth : 300;
    const h = panel ? panel.offsetHeight : 350;

    if (loc === 'top-left') {
      setPosition({ x: 8, y: 48 });
    } else if (loc === 'top-right') {
      setPosition({ x: Math.max(8, window.innerWidth - w - 8), y: 48 });
    } else if (loc === 'bottom-right') {
      setPosition({
        x: Math.max(8, window.innerWidth - w - 8),
        y: Math.max(48, window.innerHeight - h - 12),
      });
    } else if (loc === 'bottom-left') {
      setPosition({
        x: 8,
        y: Math.max(48, window.innerHeight - h - 12),
      });
    } else if (loc === 'center') {
      setPosition({
        x: Math.max(8, (window.innerWidth - w) / 2),
        y: Math.max(48, (window.innerHeight - h) / 2),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 48,
        width,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight,
      }}
      className="flex flex-col bg-neutral-900 border border-cyan-500/70 shadow-2xl rounded-2xl overflow-hidden text-neutral-100 select-none animate-in fade-in zoom-in-95 duration-150 ring-1 ring-cyan-500/30"
    >
      {/* Draggable Movable Header Bar */}
      <div
        onPointerDown={handleDragStartPointer}
        onPointerMove={handlePointerMoveCapture}
        onPointerUp={handlePointerUpCapture}
        className="h-10 px-3 bg-neutral-950/95 border-b border-neutral-800 flex items-center justify-between cursor-move active:cursor-grabbing shrink-0 select-none touch-none"
        title="Drag to move anywhere"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
          <GripHorizontal className="w-4 h-4 text-cyan-500 animate-pulse shrink-0" />
          {icon}
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          {headerExtra}

          {/* Quick snap buttons */}
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

          {/* Dock Together Button */}
          {onDockTogether && (
            <button
              onClick={onDockTogether}
              title={dockButtonTitle}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-white transition-colors cursor-pointer text-[10px] flex items-center gap-0.5 px-1.5"
            >
              <Combine className="w-3 h-3" />
              <span className="hidden xs:inline">Dock</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-0.5 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area - Isolated from panel drag */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-auto flex flex-col touch-pan-y"
      >
        {children}
      </div>

      {/* Movable drag bar at bottom */}
      <div
        onPointerDown={handleDragStartPointer}
        onPointerMove={handlePointerMoveCapture}
        onPointerUp={handlePointerUpCapture}
        className="py-1 px-2.5 bg-neutral-950/95 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-300 shrink-0 cursor-move active:cursor-grabbing select-none touch-none"
        title="Drag to move anywhere"
      >
        <span className="flex items-center gap-1.5 font-medium text-cyan-300 text-[10px]">
          <Move className="w-3 h-3 text-cyan-400" />
          <span>Drag to move</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => snapTo('center')}
            className="px-1.5 py-0.5 rounded bg-neutral-850 hover:bg-neutral-750 text-neutral-300 text-[10px] cursor-pointer"
            title="Center"
          >
            Center
          </button>
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-medium text-[10px] cursor-pointer ml-1 active:scale-95"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
};
