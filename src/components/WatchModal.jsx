import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Star,
  Calendar,
  Clock,
  Radio,
  ExternalLink,
  Check,
  Bookmark,
  Heart,
  Share2,
  Tv,
  Film,
  Sparkles,
  Users,
  ChevronDown,
  Volume2,
  Headphones,
  Languages,
  Server,
  SkipForward,
  SkipBack,
  Zap,
  PlayCircle
} from 'lucide-react';
import { getAnimeDetails, hasEnglishDub } from '../api/anilist';
import { useWatchlist, WATCH_STATUSES } from '../context/WatchlistContext';
import VideoPlayer from './VideoPlayer';
import { OUR_ANIME_CATALOG } from '../data/ourAnimeService';

const FALLBACK_QUALITY_ART = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1400 900'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0%' stop-color='#0a0f0c'/>
        <stop offset='50%' stop-color='#101613'/>
        <stop offset='100%' stop-color='#0a0f0c'/>
      </linearGradient>
    </defs>
    <rect width='1400' height='900' fill='url(#g)'/>
    <circle cx='260' cy='180' r='180' fill='#f0b429' opacity='0.2'/>
    <circle cx='1180' cy='760' r='220' fill='#2dd4bf' opacity='0.16'/>
    <rect x='84' y='82' width='420' height='86' rx='20' fill='rgba(255,255,255,0.08)'/>
    <rect x='84' y='208' width='700' height='120' rx='22' fill='rgba(255,255,255,0.08)'/>
    <rect x='84' y='370' width='960' height='24' rx='12' fill='rgba(255,255,255,0.08)'/>
    <rect x='84' y='420' width='860' height='24' rx='12' fill='rgba(255,255,255,0.08)'/>
    <text x='84' y='690' fill='white' font-size='82' font-family='Arial, sans-serif' font-weight='700'>ANIME</text>
  </svg>
`);

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function WatchModal({ anime, onClose, onSelectAnime }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'episodes' | 'characters' | 'recommendations'
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState('dub'); // 'dub' | 'sub'
  const [vaLanguageTab, setVaLanguageTab] = useState('english'); // 'english' | 'japanese'
  const [episodeRange, setEpisodeRange] = useState(0);
  const [episodeSearch, setEpisodeSearch] = useState('');

  const {
    watchlist,
    setAnimeStatus,
    toggleFavorite,
    isFavorite,
    recordWatch,
    getWatchProgress,
    savePlaybackProgress,
    isAgeConfirmed,
    isMatureAnime,
    getAnimeRating,
    getAnimeWarnings,
    reportContent
  } = useWatchlist();

  const savedProgress = anime?.id ? getWatchProgress(anime.id) : null;

  // Auto-sync episode range tab when selectedEpisode changes
  useEffect(() => {
    const calculatedRange = Math.floor((selectedEpisode - 1) / 25);
    if (calculatedRange !== episodeRange) {
      setEpisodeRange(calculatedRange);
    }
  }, [selectedEpisode]);

  // Resume saved episode or start from episode 1 whenever an anime is opened
  useEffect(() => {
    if (!anime?.id) return;
    const progress = getWatchProgress(anime.id);
    const initialEp = (progress && progress.episode) ? Number(progress.episode) : 1;
    setSelectedEpisode(initialEp);
    const calculatedRange = Math.floor((initialEp - 1) / 25);
    setEpisodeRange(calculatedRange);
    setEpisodeSearch('');
  }, [anime?.id]);

  useEffect(() => {
    if (!anime) return;
    let isCancelled = false;

    // Don't block loading - fetch details in background
    getAnimeDetails(anime.id)
      .then((data) => {
        if (!isCancelled) {
          setDetails(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch anime details:', err);
      });

    // Only record default watch history if no previous progress exists
    const progress = getWatchProgress(anime.id);
    if (!progress) {
      recordWatch(anime, 1);
    }

    return () => {
      isCancelled = true;
    };
  }, [anime]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!anime) return null;

  const currentStatus = watchlist[anime.id]?.status;
  const favorited = isFavorite(anime.id);

  // Match in our verified catalog to guarantee full direct video streams
  const catalogMatch = OUR_ANIME_CATALOG.find(
    (c) =>
      c.id === anime.id ||
      (c.title?.english && anime.title?.english && c.title.english.toLowerCase() === anime.title.english.toLowerCase()) ||
      (c.title?.romaji && anime.title?.romaji && c.title.romaji.toLowerCase() === anime.title.romaji.toLowerCase()) ||
      (typeof anime.title === 'string' && (
        (c.title?.english && c.title.english.toLowerCase() === anime.title.toLowerCase()) ||
        (c.title?.romaji && c.title.romaji.toLowerCase() === anime.title.toLowerCase())
      ))
  );

  // Authoritative episodes from our verified catalog ALWAYS come first
  const ourEpisodes = (Array.isArray(catalogMatch?.episodes) && catalogMatch.episodes.length > 0)
    ? catalogMatch.episodes
    : (Array.isArray(anime.episodes) && anime.episodes.length > 0)
      ? anime.episodes
      : (Array.isArray(details?.episodes) && details.episodes.length > 0 ? details.episodes : []);

  const merged = {
    ...anime,
    ...(details || {}),
    ...(catalogMatch || {}), // Authoritative catalog data overrides stale cache
    episodes: ourEpisodes,
    characters: details?.characters || anime.characters,
    recommendations: details?.recommendations || anime.recommendations,
    relations: details?.relations || anime.relations,
  };

  const title = anime.title?.english || anime.title?.romaji || merged.title?.english || merged.title?.romaji || 'Unknown Anime';
  const japaneseTitle = anime.title?.native || merged.title?.native;
  const trailerId = merged.trailer?.site === 'youtube' ? merged.trailer.id : null;
  const score = merged.averageScore ? (merged.averageScore / 10).toFixed(1) : null;
  const isDubAvailable = hasEnglishDub(merged);
  const matureRating = getAnimeRating(merged);
  const matureWarnings = getAnimeWarnings(merged);
  const isMature = isMatureAnime(merged);

  // Parse and sort all streaming episodes numerically ascending (Ep 1, 2, 3...)
  const sortedStreamingEpisodes = React.useMemo(() => {
    if (!merged.streamingEpisodes || !Array.isArray(merged.streamingEpisodes)) return [];

    const parsed = merged.streamingEpisodes.map((ep, idx) => {
      let num = idx + 1;
      if (ep?.title) {
        const match = ep.title.match(/(?:episode|ep\.?|#)\s*(\d+)/i) || ep.title.match(/\b(\d+)\b/);
        if (match) {
          const parsedInt = parseInt(match[1], 10);
          if (!isNaN(parsedInt) && parsedInt > 0 && parsedInt < 3000) {
            num = parsedInt;
          }
        }
      }
      return { ...ep, episodeNum: num };
    });

    // Sort strictly ascending: Ep 1, Ep 2, Ep 3...
    parsed.sort((a, b) => a.episodeNum - b.episodeNum);

    // Filter duplicates by episode number
    const seen = new Set();
    return parsed.filter((ep) => {
      if (seen.has(ep.episodeNum)) return false;
      seen.add(ep.episodeNum);
      return true;
    });
  }, [merged.streamingEpisodes]);

  const totalEpisodes = ourEpisodes.length > 0
    ? ourEpisodes.length
    : Math.max(
        typeof merged.episodes === 'number' ? merged.episodes : 0,
        merged.nextAiringEpisode?.episode ? merged.nextAiringEpisode.episode - 1 : 0,
        1
      );

  const cleanDescription = merged.description
    ? merged.description.replace(/<[^>]*>?/gm, '')
    : 'No synopsis available for this anime.';

  const handleStatusChange = (status) => {
    setAnimeStatus(merged, status);
  };

  const handleEpisodeClick = (epNum) => {
    setSelectedEpisode(epNum);
    recordWatch(merged, epNum);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredEpisodes = React.useMemo(() => {
    return ourEpisodes.filter((ep) => {
      if (!episodeSearch.trim()) return true;
      const q = episodeSearch.toLowerCase().trim();
      return (
        String(ep.episodeNumber).includes(q) ||
        (ep.title && ep.title.toLowerCase().includes(q))
      );
    });
  }, [ourEpisodes, episodeSearch]);

  const safeRecommendations = (merged.recommendations?.nodes || [])
    .filter((rec) => rec.mediaRecommendation)
    .filter((rec) => !isMatureAnime(rec.mediaRecommendation) || isAgeConfirmed)
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Box */}
      <div className="relative w-full max-w-5xl bg-[#0b100e] border border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-full sm:max-h-[92vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-gray-300 hover:text-white border border-white/10 transition-colors shadow-lg"
            title="Share Anime"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur-md text-gray-300 hover:text-white border border-white/10 transition-all shadow-lg group"
            title="Close"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Full Anime Video Player Component */}
          <VideoPlayer
            anime={merged}
            episode={selectedEpisode}
            totalEpisodes={totalEpisodes}
            audioLanguage={audioLanguage}
            onAudioLanguageChange={setAudioLanguage}
            trailerId={trailerId}
            onNextEpisode={() => handleEpisodeClick(Math.min(totalEpisodes, selectedEpisode + 1))}
            onPrevEpisode={() => handleEpisodeClick(Math.max(1, selectedEpisode - 1))}
          />

          {/* Quick Info & Action Bar */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {isMature && (
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider">
                      {matureRating || '18+'}
                    </span>
                  )}
                  {merged.format && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                      {merged.format}
                    </span>
                  )}
                  {merged.status === 'RELEASING' && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                      <Radio className="w-3 h-3 animate-pulse" />
                      Currently Airing
                    </span>
                  )}
                  {merged.season && merged.seasonYear && (
                    <span className="text-gray-400">
                      {merged.season} {merged.seasonYear}
                    </span>
                  )}
                  {merged.duration && (
                    <span className="text-gray-400">• {merged.duration} min/ep</span>
                  )}
                  {isDubAvailable ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                      English Dub Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 text-gray-400 border border-white/10 font-semibold">
                      Subtitled (Original Audio)
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-display">
                  {title}
                </h1>

                {isMature && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {matureWarnings.length > 0 ? matureWarnings.map((warning) => (
                      <span key={warning} className="px-2 py-1 rounded-md text-[10px] font-semibold text-rose-200 bg-rose-500/10 border border-rose-500/25">
                        {warning}
                      </span>
                    )) : (
                      <span className="px-2 py-1 rounded-md text-[10px] font-semibold text-rose-200 bg-rose-500/10 border border-rose-500/25">
                        Graphic content • strong language • sexual themes
                      </span>
                    )}
                  </div>
                )}

                {japaneseTitle && (
                  <p className="text-sm text-gray-400 font-medium">{japaneseTitle}</p>
                )}
              </div>

              {/* Action Buttons (Audio track switcher, Watchlist status, favorite) */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* 100% English Dub Badge */}
                <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/10">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>100% English Dub</span>
                </div>

                {/* Watch Status Selector */}
                <div className="relative group">
                  <select
                    value={currentStatus || ''}
                    onChange={(e) => handleStatusChange(e.target.value || null)}
                    aria-label="Watch status"
                    className="appearance-none bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0a0f0c] text-xs sm:text-sm font-bold pl-4 pr-9 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-amber-600/30 border-0 outline-none transition-all"
                  >
                    <option value="" className="bg-[#121915] text-gray-200">+ Add to Watchlist</option>
                    <option value={WATCH_STATUSES.WATCHING} className="bg-[#121915] text-gray-200">▶ Watching</option>
                    <option value={WATCH_STATUSES.PLAN_TO_WATCH} className="bg-[#121915] text-gray-200">📌 Plan to Watch</option>
                    <option value={WATCH_STATUSES.COMPLETED} className="bg-[#121915] text-gray-200">✓ Completed</option>
                    <option value={WATCH_STATUSES.DROPPED} className="bg-[#121915] text-gray-200">✕ Dropped</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={() => toggleFavorite(merged)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    favorited
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10'
                  }`}
                  title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-white' : ''}`} />
                </button>

                <button
                  onClick={() => reportContent({
                    animeId: merged.id,
                    title: title,
                    reason: 'Mature content concern',
                    details: 'User reported this title for content review or moderation.',
                  })}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold"
                >
                  Report
                </button>
              </div>
            </div>

            {/* English Dub Active Announcement Bar */}
            {audioLanguage === 'dub' && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {isDubAvailable
                        ? "English Dub Mode Active"
                        : "English Dub Mode Selected"}
                    </span>
                    <span className="text-emerald-300 text-[11px]">
                      {isDubAvailable
                        ? "Streaming links and voice actors below are tuned to the English Dub release."
                        : "Official English Dub streaming search links are activated below!"}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  DUB SELECTED
                </span>
              </div>
            )}

            {/* Pick Up Where You Left Off Progress Banner */}
            {savedProgress && (savedProgress.currentTime > 5 || savedProgress.episode > 1) && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#1a1708] to-amber-500/10 border border-amber-500/30 text-xs shadow-lg animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">
                      Pick up where you left off: Episode {savedProgress.episode}
                    </span>
                    <span className="text-amber-300/90 text-[11px] font-medium flex items-center gap-1.5">
                      <span>{savedProgress.currentTime > 0 ? `Stopped at ${formatTime(savedProgress.currentTime)}` : 'In progress'}</span>
                      {savedProgress.percentage > 0 && <span>• {Math.round(savedProgress.percentage)}% watched</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedEpisode !== savedProgress.episode ? (
                    <button
                      type="button"
                      onClick={() => setSelectedEpisode(savedProgress.episode)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#070b09] font-black text-xs transition-all shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Resume Ep {savedProgress.episode}</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                      Current Episode
                    </span>
                  )}
                  {savedProgress.currentTime > 10 && (
                    <button
                      type="button"
                      onClick={() => {
                        savePlaybackProgress(anime, { episode: selectedEpisode, currentTime: 0, duration: savedProgress.duration });
                        const v = document.querySelector('video');
                        if (v) v.currentTime = 0;
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors"
                      title="Restart this episode from 00:00"
                    >
                      Restart
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* AniSphere Direct Streaming Engine Hub */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#101512] to-teal-950/40 border border-amber-500/20 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shadow-md">
                    <Zap className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      AniSphere Direct Streaming Cloud
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      100% native in-house playback • Zero external redirects, zero pirate ads
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    SERVER ONLINE • 1080P
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black border border-teal-500/30">
                    DIRECT MP4
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Episode Navigator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-teal-400" />
                    <span>Select Episode to Watch ({ourEpisodes.length || totalEpisodes} Episodes)</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Full Episodes
                  </span>
                </div>

                {/* Episode Quick Search Input */}
                {ourEpisodes.length > 5 && (
                  <div className="relative">
                    <input
                      type="text"
                      value={episodeSearch}
                      onChange={(e) => setEpisodeSearch(e.target.value)}
                      placeholder="Search episode # or title..."
                      className="w-48 sm:w-64 px-3 py-1.5 pl-8 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-black/80 border border-white/10 focus:border-amber-500 text-xs text-white placeholder-gray-500 outline-none transition-all"
                    />
                    <Play className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {episodeSearch && (
                      <button
                        onClick={() => setEpisodeSearch('')}
                        className="text-gray-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Episode batch switcher for anime with > 25 episodes (when not searching) */}
              {!episodeSearch && totalEpisodes > 25 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <span className="text-gray-400 text-[11px] font-bold mr-1">Range:</span>
                  {Array.from({ length: Math.ceil(totalEpisodes / 25) }).map((_, idx) => {
                    const start = idx * 25 + 1;
                    const end = Math.min(totalEpisodes, (idx + 1) * 25);
                    const isActive = episodeRange === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEpisodeRange(idx)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          isActive
                            ? 'bg-amber-500 text-[#0a0f0c] shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {start}-{end}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Episodes from Our Direct Streaming Service */}
              {ourEpisodes.length > 0 ? (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar p-0.5">
                    {filteredEpisodes.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-gray-400 text-xs">
                        No episodes found matching "{episodeSearch}".
                        <button
                          onClick={() => setEpisodeSearch('')}
                          className="ml-2 text-amber-400 underline hover:text-amber-300"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      filteredEpisodes.map((ep) => {
                        const epNum = ep.episodeNumber;
                        const isCurrent = selectedEpisode === epNum;
                        return (
                          <div
                            key={epNum}
                            onClick={() => handleEpisodeClick(epNum)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-400/80 shadow-lg shadow-amber-900/30 ring-1 ring-amber-400'
                                : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div
                              className={`w-14 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black transition-all ${
                                isCurrent
                                  ? 'bg-amber-500 text-[#0a0f0c] shadow-md'
                                  : 'bg-white/10 text-amber-200 border border-white/10'
                              }`}
                            >
                              EP {epNum}
                            </div>
                            <div className="overflow-hidden min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-200 truncate" title={ep.title}>
                                {ep.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {isCurrent ? (
                                  <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-black">
                                    <div className="flex items-end gap-0.5 h-3">
                                      <span className="w-0.5 bg-amber-400 rounded-full animate-equalizer-1" />
                                      <span className="w-0.5 bg-amber-400 rounded-full animate-equalizer-2" />
                                      <span className="w-0.5 bg-amber-400 rounded-full animate-equalizer-3" />
                                    </div>
                                    <span>PLAYING</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400 hover:text-amber-300 font-medium flex items-center gap-1">
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Play Ep {epNum}</span>
                                  </span>
                                )}

                                {savedProgress && savedProgress.episode === epNum && savedProgress.percentage > 0 ? (
                                  <span className="text-[9px] text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-400/15 border border-amber-400/30">
                                    {Math.round(savedProgress.percentage)}%
                                  </span>
                                ) : savedProgress && epNum < savedProgress.episode ? (
                                  <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Watched
                                  </span>
                                ) : null}

                                {ep.duration && (
                                  <span className="text-[10px] text-amber-300/90 font-medium px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/20">
                                    {ep.duration}
                                  </span>
                                )}
                                {(ep.dubUrl || anime.hasDub) && (
                                  <span className="text-[9px] text-emerald-300 font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30">
                                    DUB
                                  </span>
                                )}
                              </div>

                              {savedProgress && savedProgress.episode === epNum && savedProgress.percentage > 0 && (
                                <div className="mt-2 w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-amber-400 to-yellow-400 h-full rounded-full transition-all"
                                    style={{ width: `${savedProgress.percentage}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : sortedStreamingEpisodes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Episode Gallery ({sortedStreamingEpisodes.length} Episodes):
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Sorted in Order (Ep 1, 2, 3...)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
                    {sortedStreamingEpisodes.map((ep) => {
                      const epNum = ep.episodeNum;
                      const isCurrent = selectedEpisode === epNum;
                      return (
                        <div
                          key={epNum}
                          onClick={() => handleEpisodeClick(epNum)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-amber-500/20 border-amber-500/50 shadow-md ring-1 ring-amber-400'
                              : 'bg-white/5 hover:bg-white/10 border-white/5'
                          }`}
                        >
                          {ep.thumbnail ? (
                            <img
                              src={ep.thumbnail}
                              alt={ep.title}
                              className="w-16 h-10 object-cover rounded-lg flex-shrink-0 bg-black"
                            />
                          ) : (
                            <div className="w-16 h-10 rounded-lg bg-amber-950 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-300">
                              Ep {epNum}
                            </div>
                          )}
                          <div className="overflow-hidden min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-200 truncate" title={ep.title}>
                              {ep.title}
                            </p>
                            <div className="flex items-center justify-between gap-1.5 mt-0.5">
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                                <Play className="w-2.5 h-2.5 fill-amber-400" />
                                Episode {epNum}
                              </span>
                              {ep.url && (
                                <a
                                  href={ep.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[9px] text-gray-400 hover:text-amber-400 flex items-center gap-0.5"
                                  title="Open episode on official source"
                                >
                                  <span>Official</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Rating Score</span>
                <span className="text-amber-300 font-bold text-sm flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  {score ? `${score} / 10` : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Studio</span>
                <span className="text-white font-semibold text-sm">
                  {merged.studios?.nodes?.[0]?.name || 'Unknown'}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Total Episodes</span>
                <span className="text-white font-semibold text-sm">
                  {Array.isArray(merged.episodes)
                    ? `${merged.episodes.length} Episodes`
                    : merged.episodes
                      ? `${merged.episodes} Episodes`
                      : 'Complete'}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Status</span>
                <span className="text-amber-300 font-semibold text-sm">
                  {merged.status || 'Finished'}
                </span>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Synopsis</h3>
              <p className={`text-sm text-gray-300 leading-relaxed ${showFullSynopsis ? '' : 'line-clamp-4'}`}>
                {cleanDescription}
              </p>
              {cleanDescription.length > 250 && (
                <button
                  onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  {showFullSynopsis ? 'Show Less' : 'Read Full Synopsis'}
                </button>
              )}
            </div>

            {/* Characters & Voice Actors */}
            {merged.characters?.edges?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    Characters & Voice Actors
                  </h3>

                  {/* Voice Cast Language Selector */}
                  <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl text-xs">
                    <button
                      onClick={() => setVaLanguageTab('english')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                        vaLanguageTab === 'english'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>English Dub Cast</span>
                    </button>
                    <button
                      onClick={() => setVaLanguageTab('japanese')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                        vaLanguageTab === 'japanese'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Languages className="w-3 h-3" />
                      <span>Japanese Cast</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {merged.characters.edges.slice(0, 8).map((charEdge) => {
                    const char = charEdge.node;
                    const englishVa = charEdge.voiceActors?.find((v) => v.languageV2 === 'English');
                    const japaneseVa = charEdge.voiceActors?.find((v) => v.languageV2 === 'Japanese');
                    const activeVa = vaLanguageTab === 'english' ? (englishVa || japaneseVa) : (japaneseVa || englishVa);
                    const isEnglish = activeVa?.languageV2 === 'English';

                    return (
                      <div
                        key={char.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all"
                      >
                        <img
                          src={activeVa?.image?.medium || char.image?.medium}
                          alt={char.name?.full}
                          className="w-10 h-10 rounded-lg object-cover bg-black flex-shrink-0"
                        />
                        <div className="overflow-hidden min-w-0">
                          <p className="text-xs font-semibold text-gray-100 truncate">
                            {char.name?.full}
                          </p>
                          {activeVa ? (
                            <p className="text-[10px] text-gray-300 truncate flex items-center gap-1 mt-0.5">
                              <span
                                className={`px-1 py-0.2 rounded font-black text-[9px] ${
                                  isEnglish
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                }`}
                              >
                                {isEnglish ? 'EN DUB' : 'JP'}
                              </span>
                              <span className="truncate">{activeVa.name?.full}</span>
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {charEdge.role}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Anime */}
            {safeRecommendations.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  More Like This
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {safeRecommendations.map((rec) => {
                    const item = rec.mediaRecommendation;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectAnime(item)}
                        className="cursor-pointer group flex flex-col gap-1.5"
                      >
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-amber-500/50 transition-colors">
                          <img
                            src={item.coverImage?.large}
                            alt={item.title?.english || item.title?.romaji}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-[11px] font-semibold text-gray-300 truncate group-hover:text-amber-300">
                          {item.title?.english || item.title?.romaji}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
