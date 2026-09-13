import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Check,
  Info,
  Star,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tv,
  Award,
  Flame
} from 'lucide-react';
import { useWatchlist, WATCH_STATUSES } from '../context/WatchlistContext';

const FALLBACK_HERO = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='#060907'/>
        <stop offset='55%' stop-color='#0f1712'/>
        <stop offset='100%' stop-color='#060907'/>
      </linearGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#g)'/>
    <circle cx='260' cy='200' r='180' fill='#f59e0b' opacity='0.22'/>
    <circle cx='1220' cy='680' r='220' fill='#14b8a6' opacity='0.16'/>
    <text x='120' y='740' fill='white' font-size='84' font-family='Arial, sans-serif' font-weight='700'>ANISPHERE</text>
  </svg>
`);

export default function HeroBanner({ animeList = [], onSelectAnime }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { watchlist, setAnimeStatus, isStaffPick } = useWatchlist();

  const currentAnime = animeList[currentIndex];

  useEffect(() => {
    if (animeList.length === 0 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animeList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [animeList.length, isHovered]);

  if (!currentAnime) {
    return (
      <div className="relative w-full h-[70vh] min-h-[520px] max-h-[800px] bg-[#060907] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white/5" />
          <div className="h-6 w-52 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  const title = currentAnime.title?.english || currentAnime.title?.romaji || 'Featured Anime';
  const nativeTitle = currentAnime.title?.native || '';
  const banner = currentAnime.bannerImage || currentAnime.coverImage?.extraLarge;
  const score = currentAnime.averageScore ? (currentAnime.averageScore / 10).toFixed(1) : '9.2';
  const isSaved = watchlist[currentAnime.id]?.status;
  const epCount = currentAnime.episodes?.length || 1;
  const dominantColor = currentAnime.coverImage?.color || '#f59e0b';
  const staffPicked = isStaffPick(currentAnime.id);

  const handleToggleWatchlist = () => {
    if (isSaved) {
      setAnimeStatus(currentAnime, null);
    } else {
      setAnimeStatus(currentAnime, WATCH_STATUSES.WATCHING);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + animeList.length) % animeList.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % animeList.length);
  };

  const cleanDescription = currentAnime.description
    ? currentAnime.description.replace(/<[^>]*>?/gm, '')
    : 'Stream the complete series exclusively on AniSphere with verified English Dub audio and instant HD streaming.';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[85vh] min-h-[620px] max-h-[920px] overflow-hidden select-none bg-[#060907]"
    >
      {/* Background Cinematic Visual */}
      <div className="absolute inset-0">
        <img
          key={banner || FALLBACK_HERO}
          src={banner || FALLBACK_HERO}
          alt={title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_HERO;
          }}
          className="w-full h-full object-cover object-center transform scale-105 transition-all duration-[1600ms] ease-out brightness-[0.88] animate-fade-in"
        />

        {/* Ambient Color Glow matched to Anime Palette */}
        <div
          className="absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25 pointer-events-none transition-all duration-1000"
          style={{ backgroundColor: dominantColor }}
        />

        {/* Multi-layered Cinema Vignette & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060907] via-[#060907]/90 to-transparent z-10 w-full md:w-3/4 lg:w-3/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060907] via-[#060907]/50 to-transparent z-10" />
        <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-[#060907]/90 to-transparent z-10" />

        {/* Authentic Japanese Kanji Watermark */}
        {nativeTitle && (
          <div className="absolute right-12 top-24 z-10 hidden xl:block pointer-events-none select-none">
            <span className="text-[120px] font-black text-white/[0.03] tracking-widest font-serif leading-none">
              {nativeTitle.slice(0, 5)}
            </span>
          </div>
        )}
      </div>

      {/* Hero Content Section */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-24">
        <div className="max-w-2xl lg:max-w-3xl space-y-4">
          {/* Spotlight Badges Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {staffPicked && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[#060907] text-xs font-black shadow-lg shadow-amber-500/40 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                STAFF PICK
              </span>
            )}

            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-black border border-emerald-500/30 backdrop-blur-md shadow-sm">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              100% ENGLISH DUB
            </span>

            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-black border border-amber-500/30 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              {score} Rating
            </span>

            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-gray-200 text-xs font-bold border border-white/10">
              <Tv className="w-3.5 h-3.5 text-teal-300" />
              {currentAnime.format === 'MOVIE' ? 'Full Movie' : `${epCount} Episodes`}
            </span>

            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-gray-300">
              {currentAnime.seasonYear || 'Classic'}
            </span>
          </div>

          {/* Anime Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] drop-shadow-2xl">
            {title}
          </h1>

          {/* Genres Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentAnime.genres?.slice(0, 4).map((g) => (
              <span
                key={g}
                className="text-xs font-semibold px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-white/15 text-gray-200 border border-white/10 backdrop-blur-md transition-colors"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-gray-300/90 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
            {cleanDescription}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex items-center gap-3 pt-3 flex-wrap">
            <button
              onClick={() => onSelectAnime(currentAnime)}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-[#060907] font-black text-sm sm:text-base shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group border border-amber-300/60"
            >
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-amber-300 shadow group-hover:scale-110 transition-transform">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span>Stream Episode 1</span>
            </button>

            <button
              onClick={handleToggleWatchlist}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl backdrop-blur-xl border font-bold text-sm sm:text-base transition-all hover:scale-105 ${
                isSaved
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 hover:bg-white/15 border-white/15 text-white shadow-lg'
              }`}
            >
              {isSaved ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
              <span>{isSaved ? 'In My Watchlist' : 'Add to Watchlist'}</span>
            </button>

            <button
              onClick={() => onSelectAnime(currentAnime)}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white text-sm font-semibold transition-all backdrop-blur-md"
            >
              <Info className="w-4 h-4 text-teal-400" />
              <span>Episodes ({epCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Spotlight Rail (Bottom Right) */}
      <div className="absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-30 flex flex-col items-end gap-3">
        {/* Quick Clickable Poster Thumbnails */}
        <div className="hidden lg:flex items-center gap-2 p-1.5 rounded-2xl bg-[#060907]/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
          {animeList.slice(0, 6).map((anime, idx) => {
            const isCurrent = currentIndex === idx;
            const thumb = anime.coverImage?.large || anime.coverImage?.extraLarge;
            return (
              <button
                key={anime.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-14 h-20 rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                  isCurrent
                    ? 'border-amber-400 scale-105 shadow-xl shadow-amber-500/50 ring-2 ring-amber-400/50'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                }`}
                title={anime.title?.english || anime.title?.romaji}
              >
                <img src={thumb} alt="" className="w-full h-full object-cover" />
                {isCurrent && (
                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-lg shadow-amber-400 animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Carousel Stepper Buttons & Indicators */}
        <div className="flex items-center gap-2 bg-[#060907]/80 backdrop-blur-2xl px-2.5 py-1.5 rounded-full border border-white/10 shadow-xl">
          <button
            onClick={handlePrev}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Previous Spotlight"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            {animeList.slice(0, 8).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-8 bg-amber-400 shadow-md shadow-amber-400/60' : 'w-2 bg-white/20 hover:bg-white/50'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Next Spotlight"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
