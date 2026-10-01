/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripHorizontal, X, Palette, Layers, Move, Pin, PinOff, Eye, EyeOff } from 'lucide-react';

interface MovableStudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  colorPickerContent: React.ReactNode;
  layersContent: React.ReactNode;
  isFullPageMode?: boolean;
}

export const MovableStudioPanel: React.FC<MovableStudioPanelProps> = ({
  isOpen,
  onClose,
  colorPickerContent,
  layersContent,
  isFullPageMode = false,
}) => {
  // Mobile check
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : true;
  const isLandscape = typeof window !== 'undefined' ? window.innerWidth > window.innerHeight && window.innerHeight < 600 : false;

  // Active view tab: 'both', 'color', 'layers' (on mobile landscape, default to 'color' or 'layers' to prevent vertical overflow)
  const [activeTab, setActiveTab] = useState<'both' | 'color' | 'layers'>(() => {
    if (typeof window !== 'undefined' && window.innerHeight < 600) {
      return 'color';
    }
    return 'both';
  });

  // Floating vs Docked mode
  const [isFloating, setIsFloating] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1280 : true;
  });

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

  const startDrag = (clientX: number, clientY: number) => {
    isDragging.current = true;
    dragStartOffset.current = {
      x: clientX - positionRef.current.x,
      y: clientY - positionRef.current.y,
    };
  };

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const panel = panelRef.current;
    const width = panel ? panel.offsetWidth : 300;
    const height = panel ? panel.offsetHeight : 400;

    let newX = clientX - dragStartOffset.current.x;
    let newY = clientY - dragStartOffset.current.y;

    // Viewport clamping - ensure never pushed offscreen
    const minX = 4;
    const maxX = Math.max(10, window.innerWidth - width - 4);
    const minY = 4;
    const maxY = Math.max(10, window.innerHeight - 60);

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

    setPosition({ x: newX, y: newY });
  }, []);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleDragStartPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    startDrag(e.clientX, e.clientY);
  };

  const handlePointerMoveCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    moveDrag(e.clientX, e.clientY);
  };

  const handlePointerUpCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handleDragStartTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }
    const touch = e.touches[0];
    if (touch) {
      startDrag(touch.clientX, touch.clientY);
    }
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => moveDrag(e.clientX, e.clientY);
    const onPointerUp = () => stopDrag();

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current && e.touches[0]) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => stopDrag();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [moveDrag, stopDrag]);

  // Quick snap positions
  const snapTo = (loc: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'center') => {
    const panel = panelRef.current;
    const width = panel ? panel.offsetWidth : 300;
    const height = panel ? panel.offsetHeight : 400;

    if (loc === 'top-left') {
      setPosition({ x: 8, y: 48 });
    } else if (loc === 'top-right') {
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
              maxWidth: '92vw',
              maxHeight: isLandscape ? '94vh' : '88vh',
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
        onTouchStart={handleDragStartTouch}
        className="h-10 px-3 bg-neutral-950/95 border-b border-neutral-800 flex items-center justify-between cursor-move active:cursor-grabbing shrink-0 select-none touch-none"
        title="ধরে যেকোনো জায়গায় ড্র্যাগ করে সরান (Touch & drag to move anywhere)"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
          <GripHorizontal className="w-4 h-4 text-cyan-500 animate-pulse shrink-0" />
          <span className="truncate">কালার ও লেয়ার</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick snap buttons */}
          <button
            onClick={() => snapTo('top-left')}
            title="উপরে বামে নিন"
            className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
          >
            বামে
          </button>
          <button
            onClick={() => snapTo('top-right')}
            title="উপরে ডানে নিন"
            className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
          >
            ডানে
          </button>
          <button
            onClick={() => snapTo('bottom-right')}
            title="নিচে ডানে নিন"
            className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[10px] cursor-pointer"
          >
            নিচে
          </button>

          {/* Dock / Float Toggle (Desktop only) */}
          {!isMobile && !isFullPageMode && (
            <button
              onClick={() => setIsFloating(!isFloating)}
              title={isFloating ? 'ডান পাশে ফিক্সড করুন (Dock to Right)' : 'ভাসমান ও ড্র্যাগেবল করুন (Float)'}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              {isFloating ? <PinOff className="w-3.5 h-3.5 text-cyan-400" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close / Minimize Button */}
          <button
            onClick={onClose}
            title="প্যানেল লুকান (Hide / Minimize)"
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Selector: Color Studio / Layers Panel / Both */}
      <div className="h-8 bg-neutral-950 px-2 flex items-center gap-1 border-b border-neutral-800/80 shrink-0 text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 transition-all ${
            activeTab === 'color'
              ? 'bg-cyan-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
          }`}
          title="শুধুমাত্র কালার স্টুডিও দেখুন"
        >
          <Palette className="w-3 h-3" />
          <span>কালার</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 transition-all ${
            activeTab === 'layers'
              ? 'bg-cyan-600 text-white font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
          }`}
          title="শুধুমাত্র লেয়ার প্যানেল দেখুন"
        >
          <Layers className="w-3 h-3" />
          <span>লেয়ার</span>
        </button>

        {!isLandscape && (
          <button
            onClick={() => setActiveTab('both')}
            className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 transition-all ${
              activeTab === 'both'
                ? 'bg-neutral-800 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
            title="উভয়ই দেখুন (উভয় প্যানেল)"
          >
            <span>উভয়ই</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-neutral-800/60 touch-pan-y">
        {(activeTab === 'color' || activeTab === 'both') && (
          <div className="shrink-0">{colorPickerContent}</div>
        )}

        {(activeTab === 'layers' || activeTab === 'both') && (
          <div className="flex-1 min-h-[220px] overflow-hidden flex flex-col">
            {layersContent}
          </div>
        )}
      </div>

      {/* Movable drag bar at bottom */}
      <div
        onPointerDown={handleDragStartPointer}
        onPointerMove={handlePointerMoveCapture}
        onPointerUp={handlePointerUpCapture}
        onTouchStart={handleDragStartTouch}
        className="py-1.5 px-2.5 bg-neutral-950/95 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-300 shrink-0 cursor-move active:cursor-grabbing select-none touch-none"
        title="ধরে যেকোনো জায়গায় ড্র্যাগ করে সরান"
      >
        <span className="flex items-center gap-1.5 font-medium text-cyan-300">
          <Move className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>টেনে যেকোনো জায়গায় রাখুন</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => snapTo('center')}
            className="px-1.5 py-0.5 rounded bg-neutral-850 hover:bg-neutral-750 text-neutral-300 text-[10px] cursor-pointer"
            title="মাঝখানে রাখুন"
          >
            মাঝে
          </button>
          <button
            onClick={() => snapTo('top-left')}
            className="px-1.5 py-0.5 rounded bg-neutral-850 hover:bg-neutral-750 text-neutral-300 text-[10px] cursor-pointer"
            title="বামে রাখুন"
          >
            বামে
          </button>
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-medium text-[10px] cursor-pointer ml-1"
          >
            লুকান
          </button>
        </div>
      </div>
    </div>
  );
};
