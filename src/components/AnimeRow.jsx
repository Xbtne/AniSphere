import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Rows } from 'lucide-react';
import AnimeCard from './AnimeCard';

export default function AnimeRow({
  id,
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = 'purple',
  animeList = [],
  loading = false,
  onSelectAnime,
}) {
  const scrollRef = useRef(null);
  const [isGrid, setIsGrid] = useState(false);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  const badgeStyles = {
    purple: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  }[badgeColor] || 'bg-amber-500/15 text-amber-300 border-amber-500/30';

  return (
    <section id={id} className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                {title}
              </h2>
              {badgeText && (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${badgeStyles}`}>
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGrid(!isGrid)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
            title={isGrid ? 'Switch to Carousel' : 'Switch to Grid'}
          >
            {isGrid ? <Rows className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            <span>{isGrid ? 'Carousel' : 'View All'}</span>
          </button>

          {!isGrid && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleScroll('left')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : animeList.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No anime found in this category.
        </div>
      ) : isGrid ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onSelect={onSelectAnime} />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x"
        >
          {animeList.map((anime) => (
            <div key={anime.id} className="w-[190px] sm:w-[220px] md:w-[240px] flex-shrink-0 snap-start">
              <AnimeCard anime={anime} onSelect={onSelectAnime} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
