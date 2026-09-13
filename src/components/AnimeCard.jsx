import React from 'react';
import { Play, Plus, Check, Star, Clock, Heart, Radio, Volume2 } from 'lucide-react';
import { useWatchlist, WATCH_STATUSES } from '../context/WatchlistContext';
import { hasEnglishDub } from '../api/anilist';

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return null;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

const FALLBACK_POSTER = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1066'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='#0a0f0c'/>
        <stop offset='50%' stop-color='#0f1512'/>
        <stop offset='100%' stop-color='#0a0f0c'/>
      </linearGradient>
    </defs>
    <rect width='800' height='1066' fill='url(#g)'/>
    <circle cx='190' cy='170' r='170' fill='#f0b429' opacity='0.25'/>
    <circle cx='620' cy='900' r='200' fill='#2dd4bf' opacity='0.18'/>
    <rect x='76' y='110' width='240' height='72' rx='16' fill='rgba(255,255,255,0.08)'/>
    <rect x='76' y='220' width='540' height='140' rx='22' fill='rgba(255,255,255,0.08)'/>
    <rect x='76' y='406' width='610' height='24' rx='12' fill='rgba(255,255,255,0.08)'/>
    <rect x='76' y='454' width='540' height='24' rx='12' fill='rgba(255,255,255,0.08)'/>
    <text x='80' y='730' fill='white' font-size='74' font-family='Arial, sans-serif' font-weight='700'>ANIME</text>
  </svg>
`);

export default function AnimeCard({ anime, onSelect, compact = false }) {
  const { watchlist, setAnimeStatus, toggleFavorite, isFavorite, isMatureAnime, getAnimeRating, getAnimeWarnings } = useWatchlist();

  if (!anime) return null;

  const currentStatus = watchlist[anime.id]?.status;
  const favorited = isFavorite(anime.id);
  const isMature = isMatureAnime(anime);
  const matureRating = getAnimeRating(anime);
  const matureWarnings = getAnimeWarnings(anime).slice(0, 2);

  const title = anime.title?.english || anime.title?.romaji || 'Unknown Anime';
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const nextEp = anime.nextAiringEpisode;

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
      className="group relative w-full max-w-[240px] cursor-pointer select-none card-hover"
    >
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0d1411] shadow-[0_15px 40px_rgba(0,0,0,0.4)]">
        <div className="relative h-[300px] overflow-hidden">
          <img
            src={cover || FALLBACK_POSTER}
            alt={title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_POSTER;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute left-3 top-3 z-10 rounded-lg bg-[#151a17]/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white border border-white/10 shadow-lg backdrop-blur-sm">
            HD
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-3">
            <div className="rounded-lg bg-black/75 px-2.5 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/10 backdrop-blur-sm shadow-lg">
              {anime.format === 'MOVIE' ? 'Ep 1/1' : `Ep ${Math.min(12, Array.isArray(anime.episodes) ? anime.episodes.length : 1)}/${Array.isArray(anime.episodes) ? anime.episodes.length : 1}`}
            </div>

            <div className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-600/40">
              DUB
            </div>
          </div>

          {/* Play button overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/40 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-600/50 transform scale-0 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-3">
          <div className="min-w-0 flex-1">
            <h3 title={title} className="truncate text-[15px] font-semibold text-white/95 leading-snug group-hover:text-amber-200 transition-colors">
              {title}
            </h3>
            {score && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[11px] text-gray-400 font-medium">{score}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
            <button
              onClick={handleFavoriteClick}
              aria-label="Favorite"
              className={`rounded-lg p-1.5 transition-all duration-200 ${favorited ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/30' : 'bg-black/60 text-gray-200 hover:bg-black/80 hover:scale-110'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${favorited ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={handleWatchlistClick}
              aria-label="Add to Watchlist"
              className={`rounded-lg p-1.5 transition-all duration-200 ${currentStatus ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] shadow-lg shadow-amber-500/30' : 'bg-black/60 text-gray-200 hover:bg-black/80 hover:scale-110'}`}
            >
              {currentStatus ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
