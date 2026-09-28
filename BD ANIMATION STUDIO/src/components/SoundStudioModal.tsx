import React, { useState, useEffect, useRef } from 'react';
import { AudioTrackItem } from '../types';
import { AudioEngine, SOUND_PRESETS, SoundPreset } from '../engine/audioEngine';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Trash2,
  X,
  Music,
  Plus,
  Upload,
  Check,
  Footprints,
  Car,
  Train,
  Plane,
  CloudRain,
  Zap,
  Frown,
  Smile,
  Sliders,
  Layers,
  Radio,
} from 'lucide-react';

interface SoundStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioTracks: AudioTrackItem[];
  onAddAudioTrack: (track: AudioTrackItem) => void;
  onDeleteAudioTrack: (id: string) => void;
  onUpdateAudioTrack: (id: string, updates: Partial<AudioTrackItem>) => void;
  currentFrameIndex: number;
  totalFrames: number;
  fps: number;
}

export const SoundStudioModal: React.FC<SoundStudioModalProps> = ({
  isOpen,
  onClose,
  audioTracks,
  onAddAudioTrack,
  onDeleteAudioTrack,
  onUpdateAudioTrack,
  currentFrameIndex,
  totalFrames,
  fps,
}) => {
  const [activeTab, setActiveTab] = useState<'sfx' | 'record' | 'tracks'>('sfx');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [targetFrame, setTargetFrame] = useState<number>(currentFrameIndex);

  // Sound FX Preview State
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [recordedClip, setRecordedClip] = useState<{ blob: Blob; url: string; duration: number } | null>(null);
  const [recordingTitle, setRecordingTitle] = useState<string>('ভয়েস ডায়লগ');
  const [isRecordedPlaying, setIsRecordedPlaying] = useState<boolean>(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const recorderRef = useRef<{ stop: () => Promise<{ blob: Blob; url: string; duration: number }> } | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const analyserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setTargetFrame(currentFrameIndex);
  }, [currentFrameIndex]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (isRecording && recorderRef.current) {
        recorderRef.current.stop();
        setIsRecording(false);
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setIsRecordedPlaying(false);
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [isOpen, isRecording]);

  if (!isOpen) return null;

  // Render Category Icon
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'Car':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'Train':
        return <Train className="w-4 h-4 text-orange-400" />;
      case 'Plane':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'CloudRain':
        return <CloudRain className="w-4 h-4 text-cyan-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'Frown':
        return <Frown className="w-4 h-4 text-indigo-400" />;
      case 'Smile':
        return <Smile className="w-4 h-4 text-pink-400" />;
      default:
        return <Music className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Preview Procedural Preset Sound
  const handlePreviewSound = async (presetId: string) => {
    setPreviewingId(presetId);
    try {
      await AudioEngine.previewSound(presetId);
    } catch {
      // preview error
    } finally {
      setTimeout(() => {
        setPreviewingId(null);
      }, 1500);
    }
  };

  // Add Preset to Timeline
  const handleAddPresetToTimeline = async (preset: SoundPreset) => {
    const clip = await AudioEngine.generateSoundClip(preset.id);
    const durationFrames = Math.max(1, Math.round(preset.durationSeconds * fps));

    const newTrack: AudioTrackItem = {
      id: `sfx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: preset.bengaliName,
      category: 'sfx',
      soundType: preset.id,
      audioUrl: clip.url,
      startFrame: targetFrame,
      durationFrames,
      durationSeconds: preset.durationSeconds,
      volume: 0.9,
      muted: false,
    };

    onAddAudioTrack(newTrack);
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    setRecordError(null);
    setRecordedClip(null);
    setIsRecording(true);
    setRecordDuration(0);

    try {
      const recorder = await AudioEngine.startVoiceRecording((analyser) => {
        analyserRef.current = analyser;
        drawLiveWaveform();
      });

      recorderRef.current = recorder;

      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordDuration((Date.now() - start) / 1000);
      }, 100);
    } catch (err: any) {
      setIsRecording(false);
      setRecordError('মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে ব্রাউজার থেকে মাইক্রোফোনের অনুমতি দিন।');
    }
  };

  // Draw Live Waveform
  const drawLiveWaveform = () => {
    if (!analyserRef.current || !analyserCanvasRef.current) return;
    const canvas = analyserCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#06b6d4';
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
    };

    draw();
  };

  // Stop Voice Recording
  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setIsRecording(false);
    try {
      const result = await recorderRef.current.stop();
      setRecordedClip(result);
    } catch {
      setRecordError('রেকর্ডিং সংরক্ষণ করা যায়নি।');
    }
  };

  // Toggle Recorded Audio Playback
  const handleToggleRecordedPlayback = () => {
    if (!recordedClip) return;

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(recordedClip.url);
      audioPreviewRef.current.onended = () => setIsRecordedPlaying(false);
    }

    if (isRecordedPlaying) {
      audioPreviewRef.current.pause();
      setIsRecordedPlaying(false);
    } else {
      audioPreviewRef.current.currentTime = 0;
      audioPreviewRef.current.play();
      setIsRecordedPlaying(true);
    }
  };

  // Add Recorded Voice to Timeline
  const handleAddVoiceToTimeline = () => {
    if (!recordedClip) return;

    const durationFrames = Math.max(1, Math.round(recordedClip.duration * fps));
    const newTrack: AudioTrackItem = {
      id: `voice_${Date.now()}`,
      name: recordingTitle.trim() || `ভয়েস ট্র্যাক #${audioTracks.length + 1}`,
      category: 'voice',
      soundType: 'voice_record',
      audioUrl: recordedClip.url,
      startFrame: targetFrame,
      durationFrames,
      durationSeconds: recordedClip.duration,
      volume: 1.0,
      muted: false,
    };

    onAddAudioTrack(newTrack);
    setRecordedClip(null);
    setActiveTab('tracks');
  };

  // Custom File Upload (MP3, WAV, OGG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      const durationSeconds = audio.duration || 2.0;
      const durationFrames = Math.max(1, Math.round(durationSeconds * fps));

      const newTrack: AudioTrackItem = {
        id: `upload_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'music',
        audioUrl: url,
        startFrame: targetFrame,
        durationFrames,
        durationSeconds,
        volume: 0.9,
        muted: false,
      };

      onAddAudioTrack(newTrack);
      setActiveTab('tracks');
    };
  };

  // Filtered Sound Presets
  const filteredPresets = SOUND_PRESETS.filter((preset) => {
    if (selectedCategory === 'all') return true;
    return preset.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="h-14 px-5 border-b border-neutral-800 bg-neutral-925 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-900/40">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>সাউন্ড স্টুডিও ও ভয়েস রেকর্ডার</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                  Animation Audio Studio
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                ভয়েস রেকর্ড, আবহ সঙ্গীত এবং হাঁটা, গাড়ি, ট্রেন, বৃষ্টি, বজ্রপাত ও কার্টুন সাউন্ড এফেক্টস
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Target Frame Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-850 border border-neutral-750 text-xs">
              <span className="text-neutral-400">যুক্ত হবে ফ্রেম:</span>
              <select
                value={targetFrame}
                onChange={(e) => setTargetFrame(Number(e.target.value))}
                className="bg-neutral-800 text-cyan-300 font-bold rounded px-1.5 py-0.5 border border-neutral-700 focus:outline-none"
              >
                {Array.from({ length: totalFrames }).map((_, i) => (
                  <option key={i} value={i}>
                    ফ্রেম #{i + 1}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sfx')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sfx'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-750'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>সাউন্ড এফেক্টস লাইব্রেরি ({SOUND_PRESETS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('record')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'record'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-750'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>🎙️ ভয়েস রেকর্ডার</span>
            </button>

            <button
              onClick={() => setActiveTab('tracks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tracks'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-750'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>টাইমলাইন ট্র্যাকস ({audioTracks.length})</span>
            </button>
          </div>

          {/* Custom Audio Upload */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>অডিও ফাইল আপলোড (MP3/WAV)</span>
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {/* TAB 1: Sound Effects Library */}
          {activeTab === 'sfx' && (
            <div className="flex flex-col gap-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: '🌟 সব শব্দ' },
                  { id: 'foley', label: '🚶‍♂️ হাঁটা ও মুভমেন্ট' },
                  { id: 'vehicle', label: '🚗 গাড়ি, ট্রেন ও বিমান' },
                  { id: 'nature', label: '🌧️ বৃষ্টি ও বজ্রপাত' },
                  { id: 'emotion', label: '🎭 স্যাড ও আনন্দ মুড' },
                  { id: 'cartoon', label: '💥 কার্টুন ও অ্যাকশন' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700/60 text-neutral-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sound Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 rounded-xl bg-neutral-925 border border-neutral-800 hover:border-neutral-700 flex flex-col justify-between gap-2.5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                          {renderCategoryIcon(preset.icon)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                            {preset.bengaliName}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">{preset.name}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        {preset.durationSeconds}s
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2">{preset.description}</p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/70">
                      <button
                        onClick={() => handlePreviewSound(preset.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          previewingId === preset.id
                            ? 'bg-cyan-600 border-cyan-500 text-white animate-pulse'
                            : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-neutral-300 hover:text-white'
                        }`}
                        title="Play audio preview"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{previewingId === preset.id ? 'বাজছে...' : 'প্লে প্রিভিউ'}</span>
                      </button>

                      <button
                        onClick={() => handleAddPresetToTimeline(preset)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                        title={`Add to Frame #${targetFrame + 1}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ফ্রেম #{targetFrame + 1}-এ যোগ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Voice Recorder */}
          {activeTab === 'record' && (
            <div className="flex flex-col items-center justify-center p-6 bg-neutral-925 rounded-2xl border border-neutral-800 max-w-xl mx-auto gap-5">
              <div className="text-center">
                <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                  <Mic className="w-5 h-5 text-red-500" />
                  <span>লাইভ ভয়েস রেকর্ডার</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  অ্যানিমেশনের সংলাপ, ডায়লগ বা নিজের মুখের সাউন্ড এফেক্ট সরাসরি রেকর্ড করুন
                </p>
              </div>

              {/* Error Alert */}
              {recordError && (
                <div className="w-full p-2.5 rounded-lg bg-red-950/80 border border-red-700/60 text-red-300 text-xs text-center">
                  {recordError}
                </div>
              )}

              {/* Live Waveform Canvas */}
              <div className="w-full h-24 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center relative">
                <canvas ref={analyserCanvasRef} width={500} height={96} className="w-full h-full" />
                {!isRecording && !recordedClip && (
                  <span className="absolute text-xs text-neutral-600">মাইক্রোফোন দিয়ে রেকর্ডিং শুরু করুন</span>
                )}
              </div>

              {/* Timer Display */}
              <div className="font-mono text-2xl font-bold tracking-wider text-cyan-400">
                00:{recordDuration < 10 ? `0${recordDuration.toFixed(1)}` : recordDuration.toFixed(1)}
              </div>

              {/* Record / Stop Button */}
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/40 transition-all hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    <span>রেকর্ড শুরু করুন</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-red-500 text-red-400 font-bold text-sm shadow-lg transition-all animate-pulse"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>রেকর্ড থামান (Stop)</span>
                  </button>
                )}
              </div>

              {/* Post-Recording Preview and Placement */}
              {recordedClip && !isRecording && (
                <div className="w-full p-4 rounded-xl bg-neutral-900 border border-cyan-500/40 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-300">✓ রেকর্ডিং সম্পন্ন হয়েছে!</span>
                    <span className="text-xs text-neutral-400 font-mono">
                      দৈর্ঘ্য: {recordedClip.duration.toFixed(1)}s (
                      {Math.max(1, Math.round(recordedClip.duration * fps))} ফ্রেম)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">নাম:</span>
                    <input
                      type="text"
                      value={recordingTitle}
                      onChange={(e) => setRecordingTitle(e.target.value)}
                      placeholder="ভয়েসের নাম দিন..."
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleToggleRecordedPlayback}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-xs font-semibold text-white transition-colors"
                    >
                      {isRecordedPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>থামুন</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>রেকর্ড শুনুন (Play)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleAddVoiceToTimeline}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-900/30 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>অ্যানিমেশন ফ্রেমে যোগ করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Active Audio Tracks */}
          {activeTab === 'tracks' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-semibold text-neutral-300">
                  অ্যানিমেশনের সাথে যুক্ত অডিও ট্র্যাকসমূহ ({audioTracks.length})
                </span>
                <span className="text-xs text-neutral-500">
                  প্লে করার সময় ফ্রেমের অবস্থান অনুযায়ী সাউন্ড স্বয়ংক্রিয়ভাবে বাজবে
                </span>
              </div>

              {audioTracks.length === 0 ? (
                <div className="p-8 text-center bg-neutral-925 rounded-xl border border-neutral-800/80 text-neutral-500 flex flex-col items-center gap-2">
                  <Music className="w-8 h-8 opacity-40" />
                  <p className="text-xs">এখনো কোনো সাউন্ড বা ভয়েস যোগ করা হয়নি।</p>
                  <p className="text-[11px] text-neutral-600">
                    'সাউন্ড এফেক্টস লাইব্রেরি' বা 'ভয়েস রেকর্ডার' ট্যাব থেকে সাউন্ড যোগ করুন।
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {audioTracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-3 rounded-xl bg-neutral-925 border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Info */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                          {track.category === 'voice' ? (
                            <Mic className="w-4 h-4 text-red-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{track.name}</div>
                          <div className="text-[10px] text-neutral-400 flex items-center gap-2 font-mono">
                            <span className="text-cyan-400 font-bold">শুরু: ফ্রেম #{track.startFrame + 1}</span>
                            <span>•</span>
                            <span>দৈর্ঘ্য: {track.durationFrames} ফ্রেম</span>
                            {track.durationSeconds && (
                              <>
                                <span>•</span>
                                <span>{track.durationSeconds.toFixed(1)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-3">
                        {/* Frame Start Adjust */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-neutral-500">ফ্রেম:</span>
                          <input
                            type="number"
                            min="1"
                            max={totalFrames}
                            value={track.startFrame + 1}
                            onChange={(e) =>
                              onUpdateAudioTrack(track.id, {
                                startFrame: Math.max(0, Number(e.target.value) - 1),
                              })
                            }
                            className="w-12 bg-neutral-800 border border-neutral-700 rounded px-1 text-center font-mono text-cyan-300"
                          />
                        </div>

                        {/* Volume Slider */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateAudioTrack(track.id, { muted: !track.muted })}
                            className="text-neutral-400 hover:text-white"
                          >
                            {track.muted ? (
                              <VolumeX className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={track.muted ? 0 : Math.round(track.volume * 100)}
                            onChange={(e) =>
                              onUpdateAudioTrack(track.id, {
                                volume: Number(e.target.value) / 100,
                                muted: false,
                              })
                            }
                            className="w-16 accent-cyan-400"
                          />
                        </div>

                        {/* Test Play */}
                        <button
                          onClick={() => AudioEngine.playTrack(track)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                          title="Play Track"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Delete Track */}
                        <button
                          onClick={() => onDeleteAudioTrack(track.id)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-300 text-neutral-500 transition-colors"
                          title="Delete Track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
