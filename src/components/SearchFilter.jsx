import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Filter,
  Loader2,
  Sparkles,
  Dices,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  SlidersHorizontal,
  Volume2
} from 'lucide-react';
import { OUR_ANIME_CATALOG } from '../data/ourAnimeService';
import {
  hasEnglishDub,
  POPULAR_GENRES,
  POPULAR_YEARS,
  ALPHABET_LETTERS
} from '../api/anilist';
import { useWatchlist } from '../context/WatchlistContext';
import AnimeCard from './AnimeCard';
import { Award } from 'lucide-react';

export default function SearchFilter({ onSelectAnime, initialGenre = 'All' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedSort, setSelectedSort] = useState('POPULARITY_DESC');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [selectedAudio, setSelectedAudio] = useState('All'); // 'All' | 'DUB_ONLY' | 'SUB_ONLY'
  const [onlyStaffPicks, setOnlyStaffPicks] = useState(false);

  const { isStaffPick } = useWatchlist();

  const [results, setResults] = useState(OUR_ANIME_CATALOG);
  const [totalCount, setTotalCount] = useState(OUR_ANIME_CATALOG.length);
  const [lastPage, setLastPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [pageInput, setPageInput] = useState('');

  const debounceTimeout = useRef(null);
  const resultsTopRef = useRef(null);

  // Sync initial genre if changed from outside
  useEffect(() => {
    if (initialGenre) setSelectedGenre(initialGenre);
  }, [initialGenre]);

  const fetchCatalog = (pageToFetch = 1) => {
    setLoading(true);

    let list = [...OUR_ANIME_CATALOG];

    if (onlyStaffPicks) {
      list = list.filter((a) => isStaffPick(a.id));
    }

    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((a) => {
        const eng = (a.title.english || '').toLowerCase();
        const rom = (a.title.romaji || '').toLowerCase();
        return eng.includes(q) || rom.includes(q);
      });
    }

    if (selectedLetter && selectedLetter !== 'All') {
      list = list.filter((a) => {
        const titleToTest = (a.title.english || a.title.romaji || '').toUpperCase();
        return titleToTest.startsWith(selectedLetter);
      });
    }

    if (selectedGenre && selectedGenre !== 'All') {
      list = list.filter((a) => a.genres?.includes(selectedGenre));
    }

    if (selectedYear && selectedYear !== 'All') {
      list = list.filter((a) => String(a.seasonYear) === String(selectedYear));
    }

    if (selectedFormat && selectedFormat !== 'All') {
      list = list.filter((a) => a.format === selectedFormat);
    }

    if (selectedSort === 'SCORE_DESC') {
      list.sort((a, b) => b.averageScore - a.averageScore);
    } else if (selectedSort === 'TITLE_ASC') {
      list.sort((a, b) => (a.title.english || a.title.romaji).localeCompare(b.title.english || b.title.romaji));
    }

    setResults(list);
    setTotalCount(list.length);
    setLastPage(1);
    setCurrentPage(1);
    setLoading(false);
  };

  // Debounce search/filter updates
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      fetchCatalog(1);
    }, 350);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [
    searchTerm,
    onlyStaffPicks,
    selectedGenre,
    selectedYear,
    selectedSeason,
    selectedSort,
    selectedStatus,
    selectedFormat,
    selectedLetter,
  ]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > lastPage || newPage === currentPage) return;
    fetchCatalog(newPage);
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const num = parseInt(pageInput, 10);
    if (num >= 1 && num <= lastPage) {
      handlePageChange(num);
      setPageInput('');
    }
  };

  const handleRollRandom = () => {
    setIsRolling(true);
    const randomIndex = Math.floor(Math.random() * OUR_ANIME_CATALOG.length);
    const randomAnime = OUR_ANIME_CATALOG[randomIndex];
    setTimeout(() => {
      setIsRolling(false);
      if (randomAnime) onSelectAnime(randomAnime);
    }, 300);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGenre('All');
    setSelectedYear('All');
    setSelectedSeason('All');
    setSelectedSort('POPULARITY_DESC');
    setSelectedStatus('All');
    setSelectedFormat('All');
    setSelectedLetter('All');
    setSelectedAudio('All');
  };

  const displayedResults = results.filter((anime) => {
    if (selectedAudio === 'DUB_ONLY') return hasEnglishDub(anime);
    if (selectedAudio === 'SUB_ONLY') return !hasEnglishDub(anime);
    return true;
  });

  // Generate pagination pill numbers
  const getPaginationNumbers = () => {
    const pages = [];
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(lastPage, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const activeFilterCount = [
    selectedGenre !== 'All',
    selectedYear !== 'All',
    selectedSeason !== 'All',
    selectedStatus !== 'All',
    selectedFormat !== 'All',
    selectedLetter !== 'All',
    selectedAudio !== 'All',
    searchTerm.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <section id="explore" ref={resultsTopRef} className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mega Library Banner Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
              Our Streaming <span className="text-gradient">Service Catalog</span>
            </h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Verified Working Streams • 100% Direct Playback
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
            Browse our exclusive anime library: all anime episodes are verified and play directly in our high-definition player.
          </p>
        </div>

        {/* Action Buttons: Roll Random & Reset */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRollRandom}
            disabled={isRolling}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            title="Roll a random anime from the entire library"
          >
            <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'Rolling...' : 'Surprise Me (Roll Anime)'}</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* A-Z Alphabetical Directory */}
      <div className="mb-4 bg-anime-card/60 border border-white/10 p-2.5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase text-gray-500 px-2 flex-shrink-0">
            A-Z Index:
          </span>
          {ALPHABET_LETTERS.map((letter) => {
            const isSelected = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`w-7 h-7 flex-shrink-0 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-[#0a0f0c] shadow-md shadow-amber-600/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Filter Toolbox */}
      <div className="space-y-4 bg-anime-card border border-white/10 p-4 sm:p-6 rounded-3xl backdrop-blur-xl mb-8 shadow-2xl">
        {/* Instant Search Bar with Quick Dub Toggle */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-teal-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search our streaming catalog (e.g. Naruto, Dragon Ball Z, Bleach, Attack on Titan, Death Note)..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-44 py-3.5 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedAudio(selectedAudio === 'DUB_ONLY' ? 'All' : 'DUB_ONLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                selectedAudio === 'DUB_ONLY'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10'
              }`}
              title="Filter to anime with English Dub"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">English Dub</span>
              <span className="sm:hidden">Dub</span>
            </button>
            <button
              type="button"
              onClick={() => setOnlyStaffPicks(!onlyStaffPicks)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                onlyStaffPicks
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-[#060907] shadow-lg shadow-amber-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10'
              }`}
              title="Filter to AniSphere Staff Picks"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Staff Picks</span>
            </button>

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Genre Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['All', 'Action', 'Supernatural', 'Sci-Fi', 'Comedy', 'Drama', 'Adventure', 'Romance'].map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-[#060907] shadow-md shadow-amber-500/30 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Multi-Dimensional Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Audio Language */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Audio Language
            </label>
            <div className="w-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% English Dub</span>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Sort By
            </label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="POPULARITY_DESC" className="bg-[#121915]">Most Popular</option>
              <option value="SCORE_DESC" className="bg-[#121915]">Highest Rated</option>
              <option value="TRENDING_DESC" className="bg-[#121915]">Trending Now</option>
              <option value="START_DATE_DESC" className="bg-[#121915]">Newest Releases</option>
              <option value="START_DATE" className="bg-[#121915]">Oldest Classics</option>
              <option value="TITLE_ASC" className="bg-[#121915]">Title (A to Z)</option>
              <option value="TITLE_DESC" className="bg-[#121915]">Title (Z to A)</option>
              <option value="EPISODES_DESC" className="bg-[#121915]">Most Episodes</option>
              <option value="FAVOURITES_DESC" className="bg-[#121915]">Most Favorited</option>
            </select>
          </div>

          {/* Release Year */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Release Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {POPULAR_YEARS.map((yr) => (
                <option key={yr} value={yr} className="bg-[#121915]">
                  {yr === 'All' ? 'All Years' : yr}
                </option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Broadcast Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All" className="bg-[#121915]">All Seasons</option>
              <option value="WINTER" className="bg-[#121915]">❄️ Winter</option>
              <option value="SPRING" className="bg-[#121915]">🌸 Spring</option>
              <option value="SUMMER" className="bg-[#121915]">☀️ Summer</option>
              <option value="FALL" className="bg-[#121915]">🍂 Fall</option>
            </select>
          </div>

          {/* Airing Status */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All" className="bg-[#121915]">All Statuses</option>
              <option value="RELEASING" className="bg-[#121915]">Currently Airing</option>
              <option value="FINISHED" className="bg-[#121915]">Finished</option>
              <option value="NOT_YET_RELEASED" className="bg-[#121915]">Upcoming</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-gray-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All" className="bg-[#121915]">All Formats</option>
              <option value="TV" className="bg-[#121915]">TV Series</option>
              <option value="MOVIE" className="bg-[#121915]">Movie</option>
              <option value="OVA" className="bg-[#121915]">OVA</option>
              <option value="SPECIAL" className="bg-[#121915]">Special</option>
            </select>
          </div>
        </div>

        {/* Genre Badges Bar */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Genres
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
            {POPULAR_GENRES.map((genre) => {
              const isSelected = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
? 'bg-amber-500 text-[#0a0f0c] shadow-md shadow-amber-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalog Status Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 text-xs text-gray-400">
        <p>
          Showing <span className="text-white font-bold">{displayedResults.length}</span> titles{' '}
          {selectedAudio === 'DUB_ONLY' && (
            <span className="text-emerald-400 font-bold ml-1">(English Dub Filter Active)</span>
          )}
          {totalCount > 0 && (
            <span>
              {' '}(of <span className="text-amber-400 font-bold">{totalCount.toLocaleString()}</span> indexed results)
            </span>
          )}
        </p>

        <p>
          Page <span className="text-white font-bold">{currentPage}</span> of{' '}
          <span className="text-white font-bold">{lastPage}</span>
        </p>
      </div>

      {/* Dense Results Grid (48 per page) */}
      {displayedResults.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {displayedResults.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} onSelect={onSelectAnime} />
            ))}
          </div>

          {/* Full Numeric Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
            {/* Quick page jumper */}
            <form onSubmit={handleJumpToPage} className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Jump to page:</span>
              <input
                type="number"
                min="1"
                max={lastPage}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder={currentPage.toString()}
                className="w-16 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-center focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold"
              >
                Go
              </button>
            </form>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-40 transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-40 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered Pills */}
              {getPaginationNumbers().map((num) => (
                <button
                  key={num}
                  onClick={() => handlePageChange(num)}
                  disabled={loading}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    currentPage === num
                      ? 'bg-amber-500 text-[#0a0f0c] shadow-lg shadow-amber-600/40'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === lastPage || loading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-40 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(lastPage)}
                disabled={currentPage === lastPage || loading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 disabled:opacity-40 transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="text-sm font-semibold">Browsing thousands of anime records...</p>
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400 bg-white/5 rounded-3xl border border-white/5 p-8">
          <p className="text-lg font-semibold text-gray-200 mb-1">No anime match this combination</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Try resetting your filters or selecting a different year or genre.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0a0f0c] text-xs font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </section>
  );
}
