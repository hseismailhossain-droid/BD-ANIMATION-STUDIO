import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Volume2,
  Sparkles,
  GripHorizontal,
  Clock,
  Film,
} from 'lucide-react';
import { AudioTrackItem } from '../types';
import { AudioEngine } from '../engine/audioEngine';

interface QuickVoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAudioTrack: (track: AudioTrackItem) => void;
  currentFrameIndex: number;
  totalFrames: number;
  fps: number;
}

export const QuickVoiceRecorder: React.FC<QuickVoiceRecorderProps> = ({
  isOpen,
  onClose,
  onAddAudioTrack,
  currentFrameIndex,
  totalFrames,
  fps,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [rawClip, setRawClip] = useState<{
    url: string;
    blob: Blob;
    duration: number;
  } | null>(null);
  const [recordedClip, setRecordedClip] = useState<{
    url: string;
    blob: Blob;
    duration: number;
  } | null>(null);
  const [selectedVoiceEffect, setSelectedVoiceEffect] = useState<
    'normal' | 'chipmunk' | 'monster' | 'robot' | 'radio'
  >('normal');
  const [isProcessingEffect, setIsProcessingEffect] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [voiceLabel, setVoiceLabel] = useState('Character Voice');
  const [targetFrame, setTargetFrame] = useState(currentFrameIndex);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const recorderRef = useRef<{ stop: () => Promise<{ blob: Blob; url: string; duration: number }> } | null>(null);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Sync target frame when current frame changes
  useEffect(() => {
    setTargetFrame(currentFrameIndex);
  }, [currentFrameIndex]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  // Live waveform animation during recording
  const startWaveformVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ef4444'; // Red recording line
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Glow effect
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ef4444';
    };

    draw();
  }, []);

  // Start voice recording
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setRecordedClip(null);
    setIsPlayingPreview(false);
    setIsRecording(true);
    setRecordDuration(0);

    try {
      const recorder = await AudioEngine.startVoiceRecording((analyser) => {
        analyserRef.current = analyser;
        startWaveformVisualizer();
      });

      recorderRef.current = recorder;

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordDuration((Date.now() - startTime) / 1000);
      }, 100);
    } catch {
      setIsRecording(false);
      setErrorMessage('Could not access microphone. Please allow microphone permission in your browser.');
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    try {
      const result = await recorderRef.current.stop();
      setRawClip(result);
      setRecordedClip(result);
      setSelectedVoiceEffect('normal');
      recorderRef.current = null;
      setIsRecording(false);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = new Audio(result.url);
      }
    } catch {
      setIsRecording(false);
      setErrorMessage('Error saving audio recording.');
    }
  };

  // Change character voice effect
  const handleSelectVoiceEffect = async (
    effect: 'normal' | 'chipmunk' | 'monster' | 'robot' | 'radio'
  ) => {
    if (!rawClip || isProcessingEffect) return;
    setSelectedVoiceEffect(effect);

    if (isPlayingPreview && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    }

    if (effect === 'normal') {
      setRecordedClip(rawClip);
      audioPreviewRef.current = new Audio(rawClip.url);
      return;
    }

    setIsProcessingEffect(true);
    try {
      const processed = await AudioEngine.applyVoiceEffect(rawClip.blob, effect);
      setRecordedClip(processed);
      audioPreviewRef.current = new Audio(processed.url);
    } catch {
      // fallback to raw
      setRecordedClip(rawClip);
    } finally {
      setIsProcessingEffect(false);
    }
  };

  // Preview playback
  const togglePlayPreview = () => {
    if (!recordedClip) return;

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(recordedClip.url);
    }

    audioPreviewRef.current.onended = () => {
      setIsPlayingPreview(false);
      setPreviewProgress(0);
    };
    audioPreviewRef.current.ontimeupdate = () => {
      if (audioPreviewRef.current && audioPreviewRef.current.duration) {
        setPreviewProgress(
          (audioPreviewRef.current.currentTime / audioPreviewRef.current.duration) * 100
        );
      }
    };

    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  // Add recorded voice to animation timeline
  const handleAddToTimeline = () => {
    if (!recordedClip) return;

    const effectTagMap: Record<string, string> = {
      normal: '',
      chipmunk: ' [Chipmunk]',
      monster: ' [Deep Monster]',
      robot: ' [Robot]',
      radio: ' [Walkie-Talkie]',
    };

    const effectTag = effectTagMap[selectedVoiceEffect] || '';
    const durationFrames = Math.max(1, Math.round(recordedClip.duration * fps));
    const newTrack: AudioTrackItem = {
      id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `🎙️ ${voiceLabel.trim() || 'Voice'}${effectTag}`,
      category: 'voice',
      audioUrl: recordedClip.url,
      startFrame: targetFrame,
      durationFrames,
      durationSeconds: recordedClip.duration,
      volume: 1.0,
      muted: false,
    };

    onAddAudioTrack(newTrack);
    onClose();
  };

  // Infallible window-level dragging for Quick Voice Recorder
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;

    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      const panelW = panelRef.current?.offsetWidth || 340;
      const panelH = panelRef.current?.offsetHeight || 380;

      const newX = Math.max(8, Math.min(window.innerWidth - panelW - 8, dragStartRef.current.initX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - panelH - 8, dragStartRef.current.initY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handleWindowPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'none' }
          : undefined
      }
      className={`fixed z-50 select-none ${
        position ? '' : 'bottom-32 sm:bottom-36 left-1/2 -translate-x-1/2'
      } w-[92vw] max-w-md bg-neutral-950/95 backdrop-blur-2xl border-2 border-red-500/60 rounded-3xl p-4 shadow-2xl text-neutral-200 ring-2 ring-red-500/20 animate-in zoom-in-95 duration-200`}
    >
      {/* Header with Drag Handle */}
      <div
        onPointerDown={handlePointerDown}
        className={`flex items-center justify-between pb-3 border-b border-neutral-800 touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-sm font-bold text-white tracking-wide">
            🎙️ Direct Voice Recorder
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex flex-col gap-3 pt-3">
        {/* Error message */}
        {errorMessage && (
          <div className="p-2.5 bg-red-950/60 border border-red-700/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <X className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Waveform Canvas */}
        <div className="relative w-full h-16 bg-neutral-900/90 rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center">
          <canvas ref={canvasRef} width={400} height={64} className="w-full h-full" />
          {!isRecording && !recordedClip && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500 pointer-events-none gap-1.5">
              <Mic className="w-4 h-4 text-red-400" />
              <span>Tap the red record button and speak clearly into your mic</span>
            </div>
          )}
          {isRecording && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-mono text-[10px] font-bold flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>REC</span>
            </div>
          )}
        </div>

        {/* Record / Stop Button & Timer Counter */}
        <div className="flex items-center justify-center gap-4 py-1">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-900/40 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              </div>
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-red-400 font-bold text-sm border-2 border-red-500 shadow-xl shadow-red-500/20 transition-all hover:scale-105 active:scale-95 animate-pulse"
            >
              <Square className="w-4 h-4 fill-current text-red-500" />
              <span>Stop & Save Recording</span>
            </button>
          )}

          {/* Time Counter */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span className={isRecording ? 'text-red-400 font-bold' : 'text-neutral-300'}>
              {recordDuration.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Recorded Audio Preview & Options */}
        {recordedClip && !isRecording && (
          <div className="flex flex-col gap-2.5 bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800 animate-in fade-in-50">
            {/* Player Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPreview}
                className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
                title={isPlayingPreview ? 'Pause' : 'Play Preview'}
              >
                {isPlayingPreview ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Audio Recorded
                  </span>
                  <span className="font-mono text-neutral-400">
                    {recordedClip.duration.toFixed(1)}s
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-100"
                    style={{ width: `${previewProgress}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleStartRecording}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white transition-colors"
                title="Record Again"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Character Voice Effects Selector */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Character Voice FX:</span>
                </span>
                {isProcessingEffect ? (
                  <span className="text-[10px] text-amber-400 animate-pulse font-mono">Processing FX...</span>
                ) : (
                  <span className="text-[10px] text-neutral-400">Tap to Preview</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1 text-[10px]">
                {[
                  { id: 'normal', label: '🎤 Normal' },
                  { id: 'chipmunk', label: '🐿️ Chipmunk' },
                  { id: 'monster', label: '🦁 Monster' },
                  { id: 'robot', label: '🤖 Robot' },
                  { id: 'radio', label: '📻 Radio' },
                ].map((eff) => (
                  <button
                    key={eff.id}
                    type="button"
                    disabled={isProcessingEffect}
                    onClick={() => handleSelectVoiceEffect(eff.id as any)}
                    className={`py-1.5 px-1 rounded-xl font-bold border transition-all text-center ${
                      selectedVoiceEffect === eff.id
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-400 shadow-md scale-102 ring-1 ring-red-400/50'
                        : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-750'
                    }`}
                  >
                    {eff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Tag & Target Frame Settings */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-400">Voice Title / Character:</span>
                <input
                  type="text"
                  value={voiceLabel}
                  onChange={(e) => setVoiceLabel(e.target.value)}
                  placeholder="e.g. Hero Dialogue"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-neutral-400">Starting Frame #:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTargetFrame((prev) => Math.max(0, prev - 1))}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-cyan-400 bg-neutral-800/60 py-1 rounded border border-neutral-750">
                    #{targetFrame + 1}
                  </span>
                  <button
                    onClick={() => setTargetFrame((prev) => Math.min(totalFrames - 1, prev + 1))}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preset Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-neutral-500">Tags:</span>
              {['Hero', 'Villain', 'Dialogue', 'Laughter', 'Scream', 'Song'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setVoiceLabel(tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                    voiceLabel === tag
                      ? 'bg-red-950 border-red-500 text-red-200'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Add to Timeline Button */}
            <button
              onClick={handleAddToTimeline}
              className="mt-1 w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Add Voice to Frame #{targetFrame + 1}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
