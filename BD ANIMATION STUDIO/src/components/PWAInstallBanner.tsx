/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle, Share } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner on mobile devices after 3 seconds if not installed
    const timer = setTimeout(() => {
      if (window.innerWidth < 768 && !isInstalled) {
        setShowBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Guide user
      alert('প্লে স্টোর / অ্যান্ড্রয়েড মোবাইলে হোম স্ক্রিনে যোগ করতে ব্রাউজার মেনু (তিন ডট ⋮) চাপুন এবং "Install App" বা "Add to Home Screen" নির্বাচন করুন।');
    }
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 md:left-auto md:right-4 md:w-96 z-50 bg-neutral-900/95 backdrop-blur-md border border-neutral-700 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            BD Animation Studio মোবাইল অ্যাপ
          </div>
          <div className="text-[11px] text-neutral-400">
            {isIOS ? (
              <span className="flex items-center gap-1">
                <Share className="w-3 h-3 text-cyan-400" /> Share চাপুন &rarr; Add to Home Screen
              </span>
            ) : (
              'ফুলস্ক্রিনে ড্রয়িং ও অ্যানিমেশন করতে অ্যাপ ইনস্টল করুন'
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isIOS && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> ইনস্টল
          </button>
        )}
        <button
          onClick={() => setShowBanner(false)}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
