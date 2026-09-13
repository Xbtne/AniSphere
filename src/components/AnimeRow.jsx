import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Rows } from 'lucide-react';
import AnimeCard from './AnimeCard';

export default function AnimeRow({
  id,
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = 'amber',
  animeList = [],
  loading = false,
  onSelectAnime,
}) {
  const scrollRef = useRef(null);
  const [isGrid, setIsGrid] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScrollability, 350);
  };

  const badgeStyles = {
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    cyan: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  }[badgeColor] || 'bg-amber-500/15 text-amber-300 border-amber-500/30';

  return (
    <section id={id} className="py-7 sm:py-9 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 group/row">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 shadow-lg shadow-black/40">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
              {badgeText && (
                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border ${badgeStyles}`}>
                  {badgeText}
                </span>
              )}
              <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">
                • {animeList.length} titles
              </span>
            </div>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</p>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGrid(!isGrid)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all hover:scale-105"
            title={isGrid ? 'Switch to Carousel' : 'View All'}
          >
            {isGrid ? <Rows className="w-3.5 h-3.5 text-amber-400" /> : <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isGrid ? 'Carousel' : `View All (${animeList.length})`}</span>
          </button>

          {!isGrid && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleScroll('left')}
                className={`w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all hover:scale-110 active:scale-95 ${
                  !canScrollLeft ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className={`w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all hover:scale-110 active:scale-95 ${
                  !canScrollRight ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                disabled={!canScrollRight}
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
            <div key={i} className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : animeList.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No anime found in this category.
        </div>
      ) : isGrid ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5 animate-fade-in">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onSelect={onSelectAnime} />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={checkScrollability}
            className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-5 pt-1 no-scrollbar scroll-smooth snap-x"
          >
            {animeList.map((anime) => (
              <div
                key={anime.id}
                className="w-[185px] sm:w-[215px] md:w-[230px] flex-shrink-0 snap-start"
              >
                <AnimeCard anime={anime} onSelect={onSelectAnime} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
