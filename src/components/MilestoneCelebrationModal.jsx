import React from 'react';
import {
  PartyPopper,
  Sparkles,
  Trophy,
  Flame,
  Tv,
  CheckCircle2,
  X,
  Dices,
  Play,
  Film,
  Zap,
  ShieldCheck,
  Star
} from 'lucide-react';

export default function MilestoneCelebrationModal({
  isOpen,
  onClose,
  onExploreCatalog,
  onRollRandom
}) {
  if (!isOpen) return null;

  const milestoneHighlights = [
    {
      icon: Tv,
      title: '140 Complete Anime',
      desc: '140 full legendary series and cinematic movies available right now.',
      color: 'from-amber-500 to-yellow-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30'
    },
    {
      icon: Flame,
      title: '6,053+ Dub Episodes',
      desc: '100% English Dubbed streams verified with zero missing audio.',
      color: 'from-rose-500 to-orange-500',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/30'
    },
    {
      icon: Zap,
      title: 'Direct Native Playback',
      desc: 'Zero 3rd-party ad redirects, zero scam popups, clean HTML5 video.',
      color: 'from-teal-500 to-emerald-500',
      textColor: 'text-teal-400',
      borderColor: 'border-teal-500/30'
    },
    {
      icon: Trophy,
      title: 'Curated Masterpieces',
      desc: 'From Dandadan & Solo Leveling to DBZ, Naruto, Death Note & Bleach.',
      color: 'from-purple-500 to-indigo-500',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/30'
    }
  ];

  const featuredBadges = [
    'DAN DA DAN',
    'Solo Leveling',
    'Bleach: TYBW',
    'Chainsaw Man',
    'Demon Slayer',
    'Jujutsu Kaisen',
    'Dragon Ball Z',
    'Naruto & Shippuden',
    'One Piece',
    'Attack on Titan',
    'Death Note',
    'Hunter x Hunter',
    'Frieren',
    'Spy x Family',
    'Fullmetal Alchemist',
    'Cowboy Bebop'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0a0f0d] border border-amber-500/40 p-5 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden my-auto">
        {/* Animated Celebration Ambient Background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-teal-400" />
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Floating Party Icon */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-500/10 border border-amber-400/40 shadow-lg shadow-amber-500/20 mb-1">
            <PartyPopper className="w-8 h-8 text-amber-400 animate-float-gentle" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-twinkle" />
            <span>AniSphere Official Milestone</span>
            <Sparkles className="w-3.5 h-3.5 animate-twinkle" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-serif italic">
            Celebrating <span className="text-gradient">140 Legendary Anime</span>!
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
            AniSphere has officially reached <strong className="text-amber-300 font-bold">140 complete anime</strong> with over <strong className="text-white font-bold">6,050+ verified English Dub episodes</strong> — 100% native HD playback with zero intrusive popups!
          </p>
        </div>

        {/* 4 Feature Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {milestoneHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl bg-white/5 border ${item.borderColor} hover:bg-white/[0.08] transition-all flex items-start gap-3`}
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${item.color} text-[#070b09] shrink-0 font-bold shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${item.textColor}`}>{item.title}</h4>
                  <p className="text-xs text-gray-400 leading-snug mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Featured Sample Titles Marquee/Chips */}
        <div className="mb-6 bg-black/40 border border-white/10 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Popular Franchises in the 140 Catalog</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {featuredBadges.map((title, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 text-[11px] font-medium text-gray-300 transition-colors"
              >
                {title}
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
              + 124 More Anime!
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onExploreCatalog?.();
            }}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#070b09] font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Explore All 140 Anime</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onRollRandom?.();
            }}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Dices className="w-4 h-4 text-teal-400" />
            <span>Roll Random 140 Title</span>
          </button>
        </div>
      </div>
    </div>
  );
}
