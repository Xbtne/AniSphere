import React from 'react';
import {
  PartyPopper,
  Sparkles,
  Trophy,
  Flame,
  Zap,
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowRight,
  X,
  Gift
} from 'lucide-react';

export default function AnnouncementBar({
  announcement,
  onDismiss,
  onNavigate,
  onOpenCelebrationModal
}) {
  if (!announcement?.active || !announcement?.message) {
    return null;
  }

  const type = announcement.type || 'celebration';
  const isCelebration = type === 'celebration' || announcement.message.includes('140');

  // Parse message highlights or stats if present
  const messageText = announcement.message;
  const badgeText = announcement.badge || (isCelebration ? '140TH ANIME MILESTONE' : 'NOTICE');

  if (isCelebration) {
    return (
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#0a0f0d] via-[#1a1506] to-[#0a0f0d] border-b border-amber-500/30 text-white z-50 transition-all duration-300">
        {/* Shimmering Top Accent Beam */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

        {/* Shifting Cyber Gradient Sheen */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-400/10 to-teal-500/5 pointer-events-none animate-celebration-gradient opacity-60" />

        <div className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-4 relative z-10">
          {/* Left Celebration Icon & Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenCelebrationModal}
              title="View 140th Anime Celebration details!"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-[#070b09] font-black text-[10px] sm:text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.55)] hover:scale-105 active:scale-95 transition-all group cursor-pointer"
            >
              <PartyPopper className="w-3.5 h-3.5 text-[#070b09] animate-float-gentle" />
              <span>{badgeText}</span>
              <Sparkles className="w-3 h-3 text-[#070b09] animate-twinkle hidden sm:inline-block" />
            </button>
          </div>

          {/* Center Message & Stats Pills */}
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 text-center min-w-0">
            <p className="text-xs sm:text-sm font-bold text-gray-200 truncate flex items-center gap-2">
              <span className="text-amber-300 font-extrabold hidden md:inline-block">✨ 140 Anime Catalog:</span>
              <span className="text-white font-medium truncate">{messageText}</span>
            </p>

            {/* Desktop Quick Stats Chips */}
            <div className="hidden xl:flex items-center gap-1.5 shrink-0 text-[11px] font-semibold">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                140 Full Anime
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300">
                6,050+ Dub Episodes
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                100% Direct Playback
              </span>
            </div>
          </div>

          {/* Right Action CTA & Dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate?.('featured')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-100 text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              <span>Explore 140 Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenCelebrationModal}
              title="Celebration Perks & Highlights"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 text-xs font-bold transition-all hover:scale-[1.03]"
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Perks</span>
            </button>

            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Info Style
  if (type === 'info') {
    return (
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#061114] via-[#0b1f24] to-[#061114] border-b border-cyan-500/30 text-cyan-100 z-50">
        <div className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] tracking-wide uppercase flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>INFO</span>
            </span>
          </div>
          <div className="flex-1 text-center font-medium truncate px-2">
            {messageText}
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-cyan-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Warning Style
  if (type === 'warning') {
    return (
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#170e04] via-[#241706] to-[#170e04] border-b border-amber-500/30 text-amber-100 z-50">
        <div className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] tracking-wide uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>WARNING</span>
            </span>
          </div>
          <div className="flex-1 text-center font-medium truncate px-2">
            {messageText}
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-amber-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Alert Style
  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#160608] via-[#26090d] to-[#160608] border-b border-rose-500/30 text-rose-100 z-50">
      <div className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[10px] tracking-wide uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>ALERT</span>
          </span>
        </div>
        <div className="flex-1 text-center font-medium truncate px-2">
          {messageText}
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
