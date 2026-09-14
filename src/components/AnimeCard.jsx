import React from 'react';
import { Play, Plus, Check, Star, Heart, Volume2, Award, ShieldAlert } from 'lucide-react';
import { useWatchlist, WATCH_STATUSES } from '../context/WatchlistContext';

const FALLBACK_POSTER = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1066'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='#060907'/>
        <stop offset='50%' stop-color='#111814'/>
        <stop offset='100%' stop-color='#060907'/>
      </linearGradient>
    </defs>
    <rect width='800' height='1066' fill='url(#g)'/>
    <circle cx='190' cy='170' r='170' fill='#f59e0b' opacity='0.25'/>
    <text x='80' y='730' fill='white' font-size='74' font-family='Arial, sans-serif' font-weight='700'>ANISPHERE</text>
  </svg>
`);

export default function AnimeCard({ anime, onSelect, compact = false }) {
  const {
    watchlist,
    setAnimeStatus,
    toggleFavorite,
    isFavorite,
    isMatureAnime,
    getAnimeRating,
    isStaffPick,
    getWatchProgress
  } = useWatchlist();

  if (!anime) return null;

  const currentStatus = watchlist[anime.id]?.status;
  const favorited = isFavorite(anime.id);
  const isMature = isMatureAnime(anime);
  const matureRating = getAnimeRating(anime);
  const progress = anime.id ? getWatchProgress(anime.id) : null;

  const title = anime.title?.english || anime.title?.romaji || 'Unknown Anime';
  const cover = anime.coverImage?.large || anime.coverImage?.extraLarge;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const epCount = Array.isArray(anime.episodes) ? anime.episodes.length : 1;
  const staffPicked = isStaffPick(anime.id);

  const handleWatchlistClick = (e) => {
    e.stopPropagation();
    if (currentStatus) {
      setAnimeStatus(anime, null);
    } else {
      setAnimeStatus(anime, WATCH_STATUSES.WATCHING);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(anime);
  };

  return (
    <div
      onClick={() => onSelect(anime)}
      className="group relative w-full cursor-pointer select-none transition-all duration-300 transform hover:-translate-y-2"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0b100d] shadow-xl hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
        {/* Poster Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#060907]">
          <img
            src={cover || FALLBACK_POSTER}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_POSTER;
            }}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />

          {/* Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b100d] via-black/20 to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />

          {/* Top Left: HD Badge */}
          <div className="absolute left-3 top-3 z-10 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-200 border border-white/15 shadow-lg backdrop-blur-md">
            HD 1080P
          </div>

          {/* Top Right: Staff Pick or Mature Badge */}
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
            {staffPicked && (
              <div className="rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#060907] shadow-lg shadow-amber-500/40 flex items-center gap-1 border border-amber-300/50 animate-fade-in">
                <Award className="w-3 h-3" />
                <span>STAFF PICK</span>
              </div>
            )}
            {isMature && !staffPicked && (
              <div className="rounded-lg bg-rose-600/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg flex items-center gap-1 border border-rose-400/40">
                <ShieldAlert className="w-3 h-3" />
                <span>{matureRating}</span>
              </div>
            )}
          </div>

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px]">
            <div className="w-13 h-13 w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl shadow-amber-500/60 transform scale-50 group-hover:scale-100 transition-all duration-300">
              <Play className="w-5 h-5 text-[#060907] fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Stream Badges */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-3 pb-2.5">
            {progress && (progress.percentage > 0 || progress.episode > 1) ? (
              <div className="rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-[#070b09] px-2.5 py-1 text-[10px] font-black ring-1 ring-amber-300 backdrop-blur-md shadow-md shadow-amber-500/30 flex items-center gap-1 animate-fade-in">
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Resume Ep {progress.episode}</span>
              </div>
            ) : (
              <div className="rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-bold text-gray-200 ring-1 ring-white/15 backdrop-blur-md shadow-lg">
                {anime.format === 'MOVIE' ? 'Feature Film' : `${epCount} Episodes`}
              </div>
            )}

            <div className="rounded-lg bg-emerald-500/30 border border-emerald-400/40 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300 backdrop-blur-md shadow-sm">
              100% DUB
            </div>
          </div>

          {/* Progress Bar at very bottom of card image */}
          {progress && progress.percentage > 0 && (
            <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-black/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 shadow-sm shadow-amber-400 transition-all"
                style={{ width: `${Math.min(100, Math.max(5, progress.percentage))}%` }}
              />
            </div>
          )}
        </div>

        {/* Card Details Area */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              title={title}
              className="text-sm font-bold text-white tracking-tight leading-snug line-clamp-1 group-hover:text-amber-300 transition-colors"
            >
              {title}
            </h3>

            {/* Quick action buttons on card */}
            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleFavoriteClick}
                aria-label="Favorite"
                className={`p-1.5 rounded-lg transition-colors ${
                  favorited
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'text-gray-400 hover:text-rose-400 hover:bg-white/5'
                }`}
                title={favorited ? 'Favorited' : 'Favorite'}
              >
                <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleWatchlistClick}
                aria-label="Watchlist"
                className={`p-1.5 rounded-lg transition-colors ${
                  currentStatus
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-gray-400 hover:text-amber-300 hover:bg-white/5'
                }`}
                title={currentStatus ? 'In Watchlist' : 'Add to Watchlist'}
              >
                {currentStatus ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-0.5">
            <div className="flex items-center gap-1.5">
              {score && (
                <div className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{score}</span>
                </div>
              )}
              {score && <span className="text-gray-600">•</span>}
              <span>{anime.seasonYear || 'Classic'}</span>
            </div>

            <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
              {anime.genres?.[0] || 'Anime'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
