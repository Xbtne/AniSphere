import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Play,
  Bookmark,
  Check,
  Star,
  Film,
  Tv,
  Sparkles,
  Flame,
  Zap,
  Heart,
  TrendingUp,
  Clock
} from 'lucide-react';
import { OUR_ANIME_CATALOG } from '../data/ourAnimeService';
import { useWatchlist } from '../context/WatchlistContext';

export default function SearchModal({
  isOpen,
  onClose,
  onSelectAnime,
  initialQuery = ''
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);

  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isStaffPick } = useWatchlist();

  // Reset or focus input on open
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredResults.length > 0) {
        e.preventDefault();
        const selected = filteredResults[selectedIndex];
        if (selected) {
          onSelectAnime(selected);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Keep selected index in view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeElement = resultsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Compute filtered results
  const categories = [
    { id: 'All', label: 'All', icon: Sparkles },
    { id: 'StaffPicks', label: 'Staff Picks', icon: Flame },
    { id: 'Movies', label: 'Movies', icon: Film },
    { id: 'Romance', label: 'Romance', icon: Heart },
    { id: 'Action', label: 'Action', icon: Zap },
    { id: 'Sci-Fi', label: 'Sci-Fi', icon: TrendingUp }
  ];

  const q = query.trim().toLowerCase();

  let filteredResults = OUR_ANIME_CATALOG.filter((anime) => {
    // Category match
    if (selectedCategory === 'StaffPicks' && !isStaffPick(anime.id)) return false;
    if (selectedCategory === 'Movies' && anime.format !== 'MOVIE' && (!anime.episodes || anime.episodes.length > 1)) return false;
    if (selectedCategory === 'Romance' && !anime.genres?.includes('Romance')) return false;
    if (selectedCategory === 'Action' && !anime.genres?.includes('Action')) return false;
    if (selectedCategory === 'Sci-Fi' && !anime.genres?.includes('Sci-Fi')) return false;

    // Search query match
    if (!q) return true;

    const eng = (anime.title?.english || (typeof anime.title === 'string' ? anime.title : '') || '').toLowerCase();
    const rom = (anime.title?.romaji || '').toLowerCase();
    const nat = (anime.title?.native || '').toLowerCase();
    const aliases = Array.isArray(anime.aliases) ? anime.aliases.map((a) => a.toLowerCase()) : [];
    const genres = (anime.genres || []).map((g) => g.toLowerCase());
    const year = String(anime.seasonYear || '');

    return (
      eng.includes(q) ||
      rom.includes(q) ||
      nat.includes(q) ||
      aliases.some((a) => a.includes(q)) ||
      genres.some((g) => g.includes(q)) ||
      year.includes(q)
    );
  });

  // Prioritize exact/prefix matches
  if (q) {
    filteredResults.sort((a, b) => {
      const aTitle = (a.title?.english || a.title?.romaji || '').toLowerCase();
      const bTitle = (b.title?.english || b.title?.romaji || '').toLowerCase();

      const aStarts = aTitle.startsWith(q);
      const bStarts = bTitle.startsWith(q);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return (b.averageScore || 0) - (a.averageScore || 0);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-6 pb-6 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Search Modal Window */}
      <div className="relative w-full max-w-4xl bg-[#0b120e]/95 border border-amber-500/30 rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] z-10 animate-scale-up">
        {/* Top Header & Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-black/60 via-amber-950/20 to-black/60">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-amber-400 shrink-0 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search by anime name, genre, movie, or year... (e.g. Dan Da Dan, Monster, Romance, Ghibli)"
              className="w-full bg-white/5 border border-amber-500/40 focus:border-amber-400 text-white placeholder-gray-400 text-sm sm:text-base font-medium rounded-xl pl-12 pr-12 py-3.5 outline-none transition-all shadow-inner focus:ring-2 focus:ring-amber-500/20"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="absolute right-12 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="absolute right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close modal (Esc)"
            >
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/20 text-gray-300">
                ESC
              </kbd>
              <X className="sm:hidden w-5 h-5" />
            </button>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-[#0a0f0c] shadow-md shadow-amber-500/30 font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0a0f0c]' : 'text-amber-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
            <div className="ml-auto hidden sm:flex items-center text-[11px] text-gray-400 shrink-0 pl-2">
              <span className="font-semibold text-amber-300">{filteredResults.length}</span>
              <span className="ml-1">anime found</span>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-white/5 custom-scrollbar"
        >
          {filteredResults.length === 0 ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center">
              <Search className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-base font-bold text-gray-300">No matching anime found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Try searching for a different title, English or Japanese name, or explore our curated categories above.
              </p>
            </div>
          ) : (
            filteredResults.map((anime, index) => {
              const isSelected = index === selectedIndex;
              const title = anime.title?.english || anime.title?.romaji || 'Unknown Title';
              const isSaved = isInWatchlist(anime.id);
              const isMovie = anime.format === 'MOVIE' || (!anime.episodes || anime.episodes.length === 1);
              const poster = anime.coverImage?.extraLarge || anime.coverImage?.large;

              return (
                <div
                  key={anime.id}
                  data-index={index}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    onSelectAnime(anime);
                    onClose();
                  }}
                  className={`group flex items-center justify-between gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 shadow-lg'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Left: Poster + Details */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-black/40 ring-1 ring-white/10 group-hover:ring-amber-400/50 transition-all shadow-md">
                      <img
                        src={poster}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {isMovie ? (
                        <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-purple-600/90 text-white text-[8px] font-black uppercase tracking-wider shadow">
                          Movie
                        </div>
                      ) : (
                        <div className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/80 backdrop-blur-xs text-amber-300 text-[8px] font-bold">
                          {anime.episodes?.length || 0} EPS
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-200 transition-colors truncate">
                          {title}
                        </h4>
                        {anime.badgeText && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-black text-amber-300 uppercase tracking-wider">
                            {anime.badgeText}
                          </span>
                        )}
                      </div>

                      {anime.title?.romaji && anime.title.romaji !== title && (
                        <p className="text-[11px] text-gray-400 truncate italic">
                          {anime.title.romaji}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 flex-wrap">
                        {anime.averageScore && (
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{anime.averageScore}%</span>
                          </span>
                        )}
                        <span>•</span>
                        <span>{anime.seasonYear || 'Classic'}</span>
                        <span>•</span>
                        <span className="text-teal-300 font-medium">100% Direct Stream</span>
                        {anime.genres && anime.genres.length > 0 && (
                          <>
                            <span className="hidden md:inline">•</span>
                            <span className="hidden md:inline text-gray-400 truncate">
                              {anime.genres.slice(0, 3).join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (isSaved) {
                          removeFromWatchlist(anime.id);
                        } else {
                          addToWatchlist(anime);
                        }
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        isSaved
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-rose-500/20 hover:text-rose-300'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={isSaved ? 'Remove from My List' : 'Add to My List'}
                    >
                      {isSaved ? <Check className="w-4 h-4 text-amber-300" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        onSelectAnime(anime);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0a0f0c] text-xs font-black transition-all hover:scale-105 shadow-md shadow-amber-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#0a0f0c]" />
                      <span className="hidden sm:inline">Play</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-2.5 sm:p-3 bg-black/70 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 px-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] text-gray-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] text-gray-300">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] text-gray-300">Enter</kbd>
              <span className="ml-1">Select & Play</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-semibold ml-auto">
            <span>⚡ Instant Search Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
}
