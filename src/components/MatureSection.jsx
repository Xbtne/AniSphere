import React, { useMemo, useState } from 'react';
import { ShieldAlert, Sparkles, Flame, Star, Clock3, ShieldCheck, AlertTriangle } from 'lucide-react';
import AnimeRow from './AnimeRow';
import { useWatchlist } from '../context/WatchlistContext';

const RATING_OPTIONS = ['All', 'TV-MA', '18+', 'R', 'R18'];
const LANGUAGE_OPTIONS = ['All', 'English Dub', 'Subtitled'];
const SEASON_OPTIONS = ['All', 'WINTER', 'SPRING', 'SUMMER', 'FALL'];

export default function MatureSection({ animeList = [], onSelectAnime }) {
  const { isAdminMode, toggleAdminMode, getAnimeRating, updateTitleMatureStatus, reportContent } = useWatchlist();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [adminTitleId, setAdminTitleId] = useState(animeList[0]?.id ?? '');
  const [adminRating, setAdminRating] = useState('TV-MA');
  const [adminWarnings, setAdminWarnings] = useState('Graphic violence, nudity, strong language');
  const [adminMature, setAdminMature] = useState(true);

  const genreOptions = useMemo(() => {
    const allGenres = new Set();
    animeList.forEach((anime) => anime.genres?.forEach((genre) => allGenres.add(genre)));
    return ['All', ...Array.from(allGenres).sort()];
  }, [animeList]);

  const years = useMemo(() => {
    const values = new Set(animeList.map((anime) => String(anime.seasonYear)).filter(Boolean));
    return ['All', ...Array.from(values).sort((a, b) => Number(b) - Number(a))];
  }, [animeList]);

  const filteredAnime = useMemo(() => {
    return animeList.filter((anime) => {
      if (selectedGenre !== 'All' && !anime.genres?.includes(selectedGenre)) return false;
      if (selectedRating !== 'All' && getAnimeRating(anime) !== selectedRating) return false;
      if (selectedYear !== 'All' && String(anime.seasonYear) !== String(selectedYear)) return false;
      if (selectedLanguage !== 'All') {
        const isDub = Boolean(anime.hasDub !== false);
        const matchesDub = selectedLanguage === 'English Dub' ? isDub : !isDub;
        if (!matchesDub) return false;
      }
      if (selectedSeason !== 'All' && anime.season !== selectedSeason) return false;
      return true;
    });
  }, [animeList, selectedGenre, selectedRating, selectedYear, selectedLanguage, selectedSeason, getAnimeRating]);

  const featured = filteredAnime.slice(0, 8);
  const recentlyAdded = [...filteredAnime].sort((a, b) => Number(b.seasonYear || 0) - Number(a.seasonYear || 0)).slice(0, 8);
  const trending = [...filteredAnime].sort((a, b) => Number(b.averageScore || 0) - Number(a.averageScore || 0)).slice(0, 8);
  const genreRows = genreOptions
    .filter((genre) => genre !== 'All')
    .slice(0, 4)
    .map((genre) => ({
      genre,
      titles: filteredAnime.filter((anime) => anime.genres?.includes(genre)).slice(0, 8),
    }));

  const handleAdminSave = () => {
    if (!adminTitleId) return;
    const animeToUpdate = animeList.find((anime) => anime.id === Number(adminTitleId));
    if (!animeToUpdate) return;

    updateTitleMatureStatus(Number(adminTitleId), {
      isMature: adminMature,
      contentRating: adminRating,
      contentWarnings: adminWarnings
        .split(',')
        .map((warning) => warning.trim())
        .filter(Boolean),
    });

    reportContent({
      animeId: Number(adminTitleId),
      title: animeToUpdate.title?.english || animeToUpdate.title?.romaji || 'Adult title',
      reason: 'Mature status update',
      details: `Updated to ${adminMature ? 'Mature' : 'Non-mature'} with rating ${adminRating}.`,
    });
  };

  return (
    <section id="mature" className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-rose-500/30 bg-gradient-to-br from-[#0e1018] via-[#111827] to-[#200d1f] p-4 sm:p-6 shadow-2xl shadow-rose-900/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-300">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-rose-300 font-black">18+ Restricted</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
              Mature <span className="text-gradient-fire">Anime Library</span>
            </h2>
            <p className="mt-3 text-sm text-gray-300">
              A legally licensed, age-gated collection with clear content ratings, warnings, and moderation controls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-rose-200 bg-black/20 border border-rose-500/20 rounded-2xl px-3 py-2">
              <AlertTriangle className="w-4 h-4" />
              Restricted to adults 18+ only
            </div>
            <button
              type="button"
              onClick={toggleAdminMode}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-wider text-gray-200"
            >
              {isAdminMode ? 'Admin On' : 'Admin Off'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-100 focus:outline-none focus:border-rose-500"
            >
              {genreOptions.map((genre) => (
                <option key={genre} value={genre} className="bg-[#131a26]">{genre === 'All' ? 'All Genres' : genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">Rating</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-100 focus:outline-none focus:border-rose-500"
            >
              {RATING_OPTIONS.map((rating) => (
                <option key={rating} value={rating} className="bg-[#131a26]">{rating === 'All' ? 'All Ratings' : rating}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-100 focus:outline-none focus:border-rose-500"
            >
              {years.map((year) => (
                <option key={year} value={year} className="bg-[#131a26]">{year === 'All' ? 'All Years' : year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-100 focus:outline-none focus:border-rose-500"
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language} value={language} className="bg-[#131a26]">{language === 'All' ? 'All Languages' : language}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-100 focus:outline-none focus:border-rose-500"
            >
              {SEASON_OPTIONS.map((season) => (
                <option key={season} value={season} className="bg-[#131a26]">{season === 'All' ? 'All Seasons' : season}</option>
              ))}
            </select>
          </div>
        </div>

        {isAdminMode && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-amber-200 font-bold text-sm mb-3">
              <ShieldCheck className="w-4 h-4" />
              Mature admin controls
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={adminTitleId}
                onChange={(e) => setAdminTitleId(e.target.value)}
                className="bg-[#1a1f2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                {animeList.map((anime) => (
                  <option key={anime.id} value={anime.id}>{anime.title?.english || anime.title?.romaji}</option>
                ))}
              </select>
              <select
                value={adminRating}
                onChange={(e) => setAdminRating(e.target.value)}
                className="bg-[#1a1f2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                {RATING_OPTIONS.filter((rating) => rating !== 'All').map((rating) => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
              <input
                value={adminWarnings}
                onChange={(e) => setAdminWarnings(e.target.value)}
                className="bg-[#1a1f2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="Warnings"
              />
              <button
                type="button"
                onClick={() => setAdminMature((value) => !value)}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${adminMature ? 'bg-rose-600 text-white' : 'bg-white/10 text-gray-200'}`}
              >
                {adminMature ? 'Marked Mature' : 'Mark as Mature'}
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleAdminSave}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-black"
              >
                Save Mature Status
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-8">
        <AnimeRow
          id="mature-featured"
          title="Featured Mature Picks"
          subtitle="Legally licensed 18+ content, reviewed and age-gated for adult access"
          icon={Sparkles}
          badgeText="18+"
          badgeColor="rose"
          animeList={featured}
          onSelectAnime={onSelectAnime}
        />

        <AnimeRow
          id="mature-recent"
          title="Recently Added"
          subtitle="Fresh adult-only titles and new releases in the restricted catalog"
          icon={Clock3}
          badgeText="New"
          badgeColor="amber"
          animeList={recentlyAdded}
          onSelectAnime={onSelectAnime}
        />

        <AnimeRow
          id="mature-trending"
          title="Trending Mature"
          subtitle="Most-discussed adult anime with high viewer demand and mature themes"
          icon={Star}
          badgeText="Trending"
          badgeColor="purple"
          animeList={trending}
          onSelectAnime={onSelectAnime}
        />

        {genreRows.map(({ genre, titles }) => (
          titles.length > 0 && (
            <AnimeRow
              key={genre}
              id={`mature-${genre.toLowerCase()}`}
              title={`${genre} Picks`}
              subtitle={`Dark, intense, and explicit stories across the ${genre.toLowerCase()} catalog`}
              icon={Flame}
              badgeText="Genre"
              badgeColor="rose"
              animeList={titles}
              onSelectAnime={onSelectAnime}
            />
          )
        ))}
      </div>
    </section>
  );
}
