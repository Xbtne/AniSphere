import React from 'react';
import {
  Sparkles,
  Zap,
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowRight,
  X
} from 'lucide-react';

export default function AnnouncementBar({
  announcement,
  onDismiss,
  onNavigate
}) {
  if (!announcement?.active || !announcement?.message) {
    return null;
  }

  const type = announcement.type || 'info';
  const messageText = announcement.message;
  const badgeText = announcement.badge || (type === 'warning' ? 'WARNING' : type === 'alert' ? 'ALERT' : 'STREAM UPDATE');

  // Warning Style
  if (type === 'warning') {
    return (
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#170e04] via-[#241706] to-[#170e04] border-b border-amber-500/30 text-amber-100 z-50 animate-fade-in">
        <div className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px] tracking-wide uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>{badgeText}</span>
            </span>
          </div>
          <div className="flex-1 text-center font-medium truncate px-2 text-gray-200">
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
  if (type === 'alert') {
    return (
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#160608] via-[#26090d] to-[#160608] border-b border-rose-500/30 text-rose-100 z-50 animate-fade-in">
        <div className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-[10px] tracking-wide uppercase flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>{badgeText}</span>
            </span>
          </div>
          <div className="flex-1 text-center font-medium truncate px-2 text-gray-200">
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

  // Default Info / Stream Cloud Style
  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#06110e] via-[#0d1a14] to-[#06110e] border-b border-emerald-500/30 text-emerald-100 z-50 animate-fade-in">
      {/* Subtle Top Accent Shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />

      <div className="w-full max-w-[1880px] mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>{badgeText}</span>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 text-center min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-gray-200 truncate flex items-center gap-2">
            <span className="text-emerald-400 font-bold hidden sm:inline">⚡</span>
            <span className="truncate">{messageText}</span>
          </p>

          <div className="hidden xl:flex items-center gap-1.5 shrink-0 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              150 Full Anime
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300">
              6,300+ Episodes
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
              100% Direct Playback
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate?.('featured')}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all hover:scale-105"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-emerald-400/80 hover:text-white hover:bg-white/10 transition-colors"
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

