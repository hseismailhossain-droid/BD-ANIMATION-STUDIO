import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  Download,
  Upload,
  Clock,
  Trash2,
  X,
  Layers,
  Film,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  FileText,
  Smartphone,
  HardDrive,
} from 'lucide-react';
import { ProjectStorage } from '../engine/projectStorage';
import { AnimationFrame, CanvasConfig, AnimationSettings, AudioTrackItem } from '../types';

interface SavedProjectItem {
  id: string;
  name: string;
  timestamp: number;
  frameCount: number;
  layerCount: number;
  width: number;
  height: number;
  previewUrl?: string | null;
}

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFrames: AnimationFrame[];
  currentConfig: CanvasConfig;
  currentAnimSettings: AnimationSettings;
  currentAudioTracks?: AudioTrackItem[];
  onLoadProject: (project: {
    frames: AnimationFrame[];
    config: CanvasConfig;
    animSettings: { fps: number; loop: boolean };
    audioTracks?: AudioTrackItem[];
  }) => void;
  onSaveFile: () => void;
  onOpenFile: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  currentFrames,
  currentConfig,
  currentAnimSettings,
  currentAudioTracks = [],
  onLoadProject,
  onSaveFile,
  onOpenFile,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'autosave' | 'library' | 'files'>('all');
  const [savedProjects, setSavedProjects] = useState<SavedProjectItem[]>([]);
  const [autosaveInfo, setAutosaveInfo] = useState<{
    timestamp: number;
    frameCount: number;
    layerCount: number;
    config: CanvasConfig;
    previewUrl?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load project library and autosave metadata on open
  useEffect(() => {
    if (isOpen) {
      loadLibraryData();
      setProjectNameInput(currentConfig.name || 'My Animation');
    }
  }, [isOpen]);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const [list, auto] = await Promise.all([
        ProjectStorage.listSavedProjects(),
        ProjectStorage.getAutosaveInfo(),
      ]);
      setSavedProjects(list);
      setAutosaveInfo(auto);
    } catch (e) {
      console.warn('Error loading library projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreAutosave = async () => {
    setLoading(true);
    try {
      const auto = await ProjectStorage.loadAutosave();
      if (auto && auto.frames && auto.frames.length > 0) {
        onLoadProject(auto);
        setStatusMessage({
          type: 'success',
          text: '✓ সর্বশেষ অটোসেভ প্রজেক্ট সফলভাবে লোড হয়েছে!',
        });
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'কোনো অটোসেভ ডাটা খুঁজে পাওয়া যায়নি।',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'অটোসেভ লোড করতে সমস্যা হয়েছে।',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentToLibrary = async () => {
    const name = projectNameInput.trim() || currentConfig.name || 'Untitled Animation';
    setLoading(true);
    try {
      const id = await ProjectStorage.saveNamedProject(
        name,
        currentFrames,
        { ...currentConfig, name },
        currentAnimSettings,
        currentAudioTracks
      );
      if (id) {
        setStatusMessage({
          type: 'success',
          text: `✓ "${name}" ব্রাউজারের লোকাল লাইব্রেরিতে সুরক্ষিত হয়েছে!`,
        });
        await loadLibraryData();
      } else {
        setStatusMessage({
          type: 'error',
          text: 'প্রজেক্ট সেভ করতে ব্যর্থ হয়েছে।',
        });
      }
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: 'প্রজেক্ট সেভ করতে সমস্যা হয়েছে।',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSavedProject = async (id: string, name: string) => {
    setLoading(true);
    try {
      const proj = await ProjectStorage.loadProjectById(id);
      if (proj && proj.frames && proj.frames.length > 0) {
        onLoadProject(proj);
        setStatusMessage({
          type: 'success',
          text: `✓ "${name}" সফলভাবে ক্যানভাসে খোলা হয়েছে!`,
        });
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: 'প্রজেক্ট ফাইল খুলতে সমস্যা হয়েছে।',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${name}" প্রজেক্টটি মুছে ফেলতে চান?`)) {
      return;
    }
    setLoading(true);
    try {
      const ok = await ProjectStorage.deleteProjectById(id);
      if (ok) {
        setSavedProjects((prev) => prev.filter((p) => p.id !== id));
        setStatusMessage({
          type: 'success',
          text: `"${name}" প্রজেক্টটি মুছে ফেলা হয়েছে।`,
        });
      }
    } catch (e) {
      console.warn('Delete error:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: number) => {
    try {
      const date = new Date(ts);
      return date.toLocaleDateString('bn-BD', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Date(ts).toLocaleString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 cursor-default">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>আগের প্রজেক্ট সমূহ (Project Library & Storage)</span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                ডিভাইস ও ব্রাউজারে সংরক্ষিত সমস্ত অ্যানিমেশন প্রজেক্ট অ্যাক্সেস করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/80 border-b border-red-800/80 text-red-300'
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              {statusMessage.text}
            </span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-neutral-400 hover:text-white p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center px-5 pt-3 border-b border-neutral-800 gap-2 bg-neutral-950/40 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            সব প্রজেক্ট (Overview)
          </button>
          <button
            onClick={() => setActiveTab('autosave')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'autosave'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            অটোসেভ (Autosave)
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'library'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            লোকাল লাইব্রেরি ({savedProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'files'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ফাইল ব্যাকআপ (.ps8k)
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-neutral-300">
          {/* Quick Notice about where files live */}
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3 flex items-start gap-3 text-neutral-300">
            <HardDrive className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-cyan-300">প্রজেক্ট কোথায় সংরক্ষিত থাকে?</span>
              <p className="mt-0.5 text-neutral-300">
                BD Animation Studio আপনার সব প্রজেক্ট আপনার নিজের ডিভাইসের ব্রাউজারে (IndexedDB)
                সম্পূর্ণ নিরাপদে স্বয়ংক্রিয়ভাবে সেভ করে রাখে। এছাড়া আপনি <span className="text-cyan-300 font-mono">.ps8k</span> ফাইল
                হিসেবে আপনার কম্পিউটার বা মোবাইলে ডাউনলোড করে চিরতরে সংরক্ষণ করতে পারেন।
              </p>
            </div>
          </div>

          {/* Section 1: Latest Autosave Card */}
          {(activeTab === 'all' || activeTab === 'autosave') && (
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-neutral-100 text-sm">
                    সর্বশেষ অটোসেভ প্রজেক্ট (Autosaved Work)
                  </span>
                </div>
                {autosaveInfo && (
                  <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {formatTime(autosaveInfo.timestamp)}
                  </span>
                )}
              </div>

              {autosaveInfo ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-750 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    {autosaveInfo.previewUrl ? (
                      <img
                        src={autosaveInfo.previewUrl}
                        alt="Autosave preview"
                        className="w-14 h-14 object-contain bg-neutral-950 rounded border border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-neutral-800 rounded border border-neutral-700 flex items-center justify-center shrink-0">
                        <Film className="w-6 h-6 text-neutral-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-neutral-200">
                        {autosaveInfo.config?.name || 'বর্তমান অটোসেভ প্রজেক্ট'}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2 font-mono">
                        <span>
                          {autosaveInfo.config?.width} × {autosaveInfo.config?.height} px
                        </span>
                        <span>•</span>
                        <span>{autosaveInfo.frameCount} ফ্রেম</span>
                        <span>•</span>
                        <span>{autosaveInfo.layerCount} লেয়ার</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium mt-1">
                        ✓ ব্রাউজারে সুরক্ষিত রয়েছে
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRestoreAutosave}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>অটোসেভ লোড করুন (Restore)</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">
                  কোনো সক্রিয় অটোসেভ পাওয়া যায়নি। ক্যানভাসে ড্রয়িং শুরু করলে তা স্বয়ংক্রিয়ভাবে সেভ হবে।
                </div>
              )}
            </div>
          )}

          {/* Section 2: Save Current Project into Library */}
          {(activeTab === 'all' || activeTab === 'library') && (
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
              <h3 className="font-bold text-neutral-100 text-sm mb-2 flex items-center gap-2">
                <Save className="w-4 h-4 text-amber-400" />
                <span>বর্তমান প্রজেক্ট লাইব্রেরিতে সংরক্ষণ করুন</span>
              </h3>
              <p className="text-[11px] text-neutral-400 mb-3">
                প্রজেক্টটির একটি নাম দিয়ে ব্রাউজারের স্থায়ী লাইব্রেরিতে সেভ করে রাখুন, যাতে ভবিষ্যতে যেকোনো সময় আবার খুলতে পারেন।
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  placeholder="প্রজেক্টের নাম দিন (যেমন: Scene 1 Walk Cycle)"
                  className="flex-1 bg-neutral-900 border border-neutral-750 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSaveCurrentToLibrary}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>লাইব্রেরিতে সেভ করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Saved Projects in Browser Library */}
          {(activeTab === 'all' || activeTab === 'library') && (
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-neutral-100 text-sm flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  <span>সংরক্ষিত প্রজেক্টসমূহ ({savedProjects.length})</span>
                </h3>
                <span className="text-[11px] text-neutral-500">ব্রাউজার মেমোরি</span>
              </div>

              {savedProjects.length > 0 ? (
                <div className="space-y-2.5">
                  {savedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 hover:border-cyan-600/60 p-3 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {proj.previewUrl ? (
                          <img
                            src={proj.previewUrl}
                            alt={proj.name}
                            className="w-12 h-12 object-contain bg-neutral-950 rounded border border-neutral-700 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-800 rounded border border-neutral-700 flex items-center justify-center shrink-0">
                            <Film className="w-5 h-5 text-neutral-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-neutral-200 group-hover:text-cyan-300 transition-colors">
                            {proj.name}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2 font-mono">
                            <span>
                              {proj.width} × {proj.height}
                            </span>
                            <span>•</span>
                            <span>{proj.frameCount} ফ্রেম</span>
                            <span>•</span>
                            <span>{formatTime(proj.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleLoadSavedProject(proj.id, proj.name)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>খুলুন (Open)</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id, proj.name)}
                          disabled={loading}
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                          title="প্রজেক্ট মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-neutral-800 rounded-lg text-neutral-500">
                  এখনো কোনো প্রজেক্ট লাইব্রেরিতে সংরক্ষণ করা হয়নি। উপরের বোতাম দিয়ে বর্তমান প্রজেক্ট সেভ করুন।
                </div>
              )}
            </div>
          )}

          {/* Section 4: Physical File Import & Export (.ps8k) */}
          {(activeTab === 'all' || activeTab === 'files') && (
            <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4">
              <h3 className="font-bold text-neutral-100 text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>কম্পিউটার ও ফোনের ফাইল স্টোরেজ (.ps8k / .json)</span>
              </h3>
              <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
                আপনার তৈরি করা যেকোনো অ্যানিমেশন প্রজেক্ট ফাইল হিসেবে আপনার কম্পিউটারে বা ফোনের ডাউনলোড ফোল্ডারে সেভ করে রাখতে পারেন। পরবর্তীতে সেই ফাইলটি সিলেক্ট করে যেকোনো সময় পুনরায় ওপেন করা যায়।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onOpenFile();
                    onClose();
                  }}
                  className="p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-cyan-500/80 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200 group-hover:text-cyan-300">
                      📂 ফাইল থেকে খুলুন (Open File)
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      ডিভাইস থেকে .ps8k বা .json প্রজেক্ট সিলেক্ট করুন
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onSaveFile();
                    setStatusMessage({
                      type: 'success',
                      text: '✓ প্রজেক্ট ফাইলটি আপনার ডিভাইসে ডাউনলোড হয়েছে!',
                    });
                  }}
                  className="p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-emerald-500/80 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200 group-hover:text-emerald-300">
                      💾 ফাইল ডাউনলোড করুন (Save File)
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      সম্পূর্ণ প্রজেক্ট .ps8k ফাইল হিসেবে ডাউনলোড করুন
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-5 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/80 shrink-0">
          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>টিপস: কিবোর্ডে Ctrl+O দিয়ে ওপেন এবং Ctrl+S দিয়ে সেভ করতে পারেন</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
