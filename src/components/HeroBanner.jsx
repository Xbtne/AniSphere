import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Info, Star, Volume2, ChevronLeft, ChevronRight, Sparkles, Film, Tv } from 'lucide-react';
import { useWatchlist, WATCH_STATUSES } from '../context/WatchlistContext';

const FALLBACK_HERO = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='#0a0f0c'/>
        <stop offset='55%' stop-color='#101613'/>
        <stop offset='100%' stop-color='#0a0f0c'/>
      </linearGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#g)'/>
    <circle cx='260' cy='200' r='180' fill='#f0b429' opacity='0.22'/>
    <circle cx='1220' cy='680' r='220' fill='#2dd4bf' opacity='0.16'/>
    <rect x='120' y='130' width='400' height='80' rx='18' fill='rgba(255,255,255,0.08)'/>
    <rect x='120' y='260' width='760' height='120' rx='22' fill='rgba(255,255,255,0.08)'/>
    <rect x='120' y='410' width='950' height='26' rx='13' fill='rgba(255,255,255,0.08)'/>
    <rect x='120' y='456' width='820' height='26' rx='13' fill='rgba(255,255,255,0.08)'/>
    <rect x='120' y='520' width='300' height='52' rx='18' fill='#f0b429' opacity='0.8'/>
    <text x='120' y='740' fill='white' font-size='84' font-family='Arial, sans-serif' font-weight='700'>ANIME</text>
  </svg>
`);

export default function HeroBanner({ animeList = [], onSelectAnime }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { watchlist, setAnimeStatus } = useWatchlist();

  const currentAnime = animeList[currentIndex];

  useEffect(() => {
    if (animeList.length === 0 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animeList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [animeList.length, isHovered]);

  if (!currentAnime) {
    return (
      <div className="relative w-full h-[65vh] min-h-[500px] max-h-[750px] bg-[#070b09] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5" />
          <div className="h-6 w-48 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  const title = currentAnime.title?.english || currentAnime.title?.romaji || 'Featured Anime';
  const banner = currentAnime.bannerImage || currentAnime.coverImage?.extraLarge;
  const score = currentAnime.averageScore ? (currentAnime.averageScore / 10).toFixed(1) : '9.2';
  const isSaved = watchlist[currentAnime.id]?.status;
  const epCount = currentAnime.episodes?.length || 1;

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
      className="relative w-full h-[82vh] min-h-[580px] max-h-[850px] overflow-hidden select-none bg-[#080c0a]"
    >
      {/* Background High-Res Cinematic Visual */}
      <div className="absolute inset-0">
        <img
          key={banner || FALLBACK_HERO}
          src={banner || FALLBACK_HERO}
          alt={title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_HERO;
          }}
          className="w-full h-full object-cover object-center transform scale-105 transition-all duration-[1500ms] ease-out brightness-90 animate-fade-in hover:scale-110"
        />

        {/* Ambient Color Glows & Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b09] via-[#070b09]/90 to-transparent z-10 w-full md:w-2/3" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b09] via-[#070b09]/60 to-transparent z-10" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#070b09]/95 to-transparent z-10" />
        
        {/* Purple ambient glow overlay */}
        <div className="absolute inset-0 bg-gradient-radial z-10 opacity-60" />
      </div>

      {/* Hero Content Section */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-24">
        <div className="max-w-2xl space-y-4">
          {/* Spotlight Badges Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-[#0a0f0c] text-xs font-black shadow-lg shadow-amber-600/40 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              SPOTLIGHT • OUR STREAMING SERVICE
            </span>

            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 backdrop-blur-md shadow-md">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              100% English Dub
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-500/30">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              {score} Rating
            </span>

<span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-900/40 backdrop-blur-md text-teal-200 text-xs font-bold border border-teal-500/30">
  <Tv className="w-3.5 h-3.5 text-teal-300" />
  {epCount > 1 ? `${epCount} Full Episodes` : 'Full Movie'}
</span>
          </div>

          {/* Anime Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] font-serif drop-shadow-xl">
            {title}
          </h1>

          {/* Genres */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentAnime.genres?.slice(0, 4).map((g) => (
              <span
                key={g}
                className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-white/10 text-gray-200 border border-white/10 backdrop-blur-sm"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
            {cleanDescription}
          </p>

          {/* Call to Action Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => onSelectAnime(currentAnime)}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-[#0a0f0c] font-extrabold text-sm sm:text-base shadow-2xl shadow-amber-600/50 hover:shadow-amber-600/70 transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-amber-300/40"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Watch Ep 1 Now</span>
            </button>

            <button
              onClick={handleToggleWatchlist}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl backdrop-blur-xl border font-bold text-sm sm:text-base transition-all ${
                isSaved
                  ? 'bg-emerald-600/30 border-emerald-400/60 text-emerald-200'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              {isSaved ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
              <span>{isSaved ? 'In My Watchlist' : 'Add to Watchlist'}</span>
            </button>

            <button
              onClick={() => onSelectAnime(currentAnime)}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 text-gray-200 hover:text-white text-sm font-semibold transition-all backdrop-blur-md"
            >
              <Info className="w-4 h-4" />
              <span>Episodes ({epCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Spotlight Rail (Bottom Right) */}
      <div className="absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-30 flex flex-col items-end gap-3">
        {/* Quick Clickable Poster Thumbnails */}
        <div className="hidden lg:flex items-center gap-2.5 p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
          {animeList.slice(0, 6).map((anime, idx) => {
            const isCurrent = currentIndex === idx;
            const thumb = anime.coverImage?.large || anime.coverImage?.extraLarge;
            return (
              <button
                key={anime.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-14 h-20 rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                  isCurrent
                    ? 'border-amber-400 scale-105 shadow-lg shadow-amber-600/50 ring-2 ring-amber-400/50'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:scale-102'
                }`}
                title={anime.title?.english || anime.title?.romaji}
              >
                <img src={thumb} alt="" className="w-full h-full object-cover" />
                {isCurrent && (
                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Carousel Stepper Buttons & Dots */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/15 shadow-xl">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/15 transition-all"
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
                  currentIndex === idx ? 'w-7 bg-amber-500 shadow-md shadow-amber-500/50' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/15 transition-all"
            aria-label="Next Spotlight"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
