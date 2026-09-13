import React, { createContext, useContext, useState, useEffect } from 'react';
import { OUR_ANIME_CATALOG } from '../data/ourAnimeService';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext(null);

export const WATCH_STATUSES = {
  WATCHING: 'watching',
  PLAN_TO_WATCH: 'plan',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
};

// Always ensure stored anime has fresh, working catalog episodes and dub URLs
export function syncWithCatalog(anime) {
  if (!anime) return anime;
  const match = OUR_ANIME_CATALOG.find(
    (c) =>
      c.id === anime.id ||
      (c.title?.english && anime.title?.english && c.title.english.toLowerCase() === anime.title.english.toLowerCase()) ||
      (c.title?.romaji && anime.title?.romaji && c.title.romaji.toLowerCase() === anime.title.romaji.toLowerCase()) ||
      (typeof anime.title === 'string' && (
        (c.title?.english && c.title.english.toLowerCase() === anime.title.toLowerCase()) ||
        (c.title?.romaji && c.title.romaji.toLowerCase() === anime.title.toLowerCase())
      ))
  );
  if (match) {
    return {
      ...anime,
      ...match,
      episodes: match.episodes,
      hasDub: match.hasDub !== undefined ? match.hasDub : true,
      isMature: match.isMature || false,
      contentRating: match.contentRating || 'TV-14',
      contentWarnings: match.contentWarnings || [],
    };
  }
  return anime;
}

export function WatchlistProvider({ children }) {
  const { user } = useAuth();
  const username = user?.username || 'guest';

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(`anisphere_watchlist_${username}`);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      const synced = {};
      for (const key of Object.keys(parsed)) {
        synced[key] = {
          ...parsed[key],
          anime: syncWithCatalog(parsed[key].anime),
        };
      }
      return synced;
    } catch {
      return {};
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(`anisphere_favorites_${username}`);
      if (!saved) return [];
      return JSON.parse(saved).map(syncWithCatalog);
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`anisphere_history_${username}`);
      if (!saved) return [];
      return JSON.parse(saved).map((item) => ({
        ...item,
        anime: syncWithCatalog(item.anime),
      }));
    } catch {
      return [];
    }
  });

  // Watch progress per anime (episode number)
  const [watchProgress, setWatchProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(`anisphere_progress_${username}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Age confirmation state (persisted)
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(() => {
    try {
      return localStorage.getItem('anisphere_age_confirmed') === 'true';
    } catch {
      return false;
    }
  });

  // Admin Mode state (persisted)
  const [isAdminMode, setIsAdminMode] = useState(() => {
    try {
      return localStorage.getItem('anisphere_admin_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Mature Overrides (dynamically modify ratings/warnings from admin panel)
  const [matureOverrides, setMatureOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_mature_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // User content reports queue
  const [contentReports, setContentReports] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_content_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`anisphere_watchlist_${username}`, JSON.stringify(watchlist));
    } catch (e) {
      console.error(e);
    }
  }, [watchlist, username]);

  useEffect(() => {
    try {
      localStorage.setItem(`anisphere_favorites_${username}`, JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites, username]);

  useEffect(() => {
    try {
      localStorage.setItem(`anisphere_history_${username}`, JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history, username]);

  useEffect(() => {
    try {
      localStorage.setItem(`anisphere_progress_${username}`, JSON.stringify(watchProgress));
    } catch (e) {
      console.error(e);
    }
  }, [watchProgress, username]);

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_age_confirmed', isAgeConfirmed ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  }, [isAgeConfirmed]);

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_admin_mode', isAdminMode ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  }, [isAdminMode]);

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_mature_overrides', JSON.stringify(matureOverrides));
    } catch (e) {
      console.error(e);
    }
  }, [matureOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_content_reports', JSON.stringify(contentReports));
    } catch (e) {
      console.error(e);
    }
  }, [contentReports]);

  // Age confirmation methods
  const confirmAge = () => setIsAgeConfirmed(true);
  const revokeAgeConfirmation = () => setIsAgeConfirmed(false);
  const toggleAdminMode = () => setIsAdminMode(prev => !prev);

  // Mature status and rating helpers with admin override support
  const isMatureAnime = (anime) => {
    if (!anime) return false;
    const override = matureOverrides[anime.id];
    if (override && override.isMature !== undefined) {
      return override.isMature;
    }
    return Boolean(anime.isMature || anime.contentRating === 'TV-MA' || anime.contentRating === '18+');
  };

  const getAnimeRating = (anime) => {
    if (!anime) return 'TV-14';
    const override = matureOverrides[anime.id];
    if (override && override.contentRating) {
      return override.contentRating;
    }
    return anime.contentRating || (anime.isMature ? 'TV-MA' : 'TV-14');
  };

  const getAnimeWarnings = (anime) => {
    if (!anime) return [];
    const override = matureOverrides[anime.id];
    if (override && override.contentWarnings) {
      return override.contentWarnings;
    }
    return anime.contentWarnings || [];
  };

  const updateTitleMatureStatus = (animeId, { isMature, contentRating, contentWarnings }) => {
    setMatureOverrides(prev => ({
      ...prev,
      [animeId]: {
        isMature,
        contentRating,
        contentWarnings: Array.isArray(contentWarnings) ? contentWarnings : [],
        updatedAt: Date.now()
      }
    }));
  };

  // Content moderation reporting
  const reportContent = ({ animeId, title, reason, details }) => {
    const newReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      animeId,
      title: title || `Anime #${animeId}`,
      reason: reason || 'Inappropriate Content',
      details: details || '',
      timestamp: Date.now(),
      status: 'pending'
    };
    setContentReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const resolveReport = (reportId) => {
    setContentReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
  };

  const deleteReport = (reportId) => {
    setContentReports(prev => prev.filter(r => r.id !== reportId));
  };

  const setAnimeStatus = (anime, status) => {
    const fresh = syncWithCatalog(anime);
    setWatchlist(prev => {
      if (!status) {
        const next = { ...prev };
        delete next[fresh.id];
        return next;
      }
      return {
        ...prev,
        [fresh.id]: {
          anime: fresh,
          status,
          updatedAt: Date.now(),
        }
      };
    });
  };

  const removeAnime = (animeId) => {
    setWatchlist(prev => {
      const next = { ...prev };
      delete next[animeId];
      return next;
    });
  };

  const toggleFavorite = (anime) => {
    const fresh = syncWithCatalog(anime);
    setFavorites(prev => {
      const exists = prev.some(item => item.id === fresh.id);
      if (exists) {
        return prev.filter(item => item.id !== fresh.id);
      } else {
        return [fresh, ...prev];
      }
    });
  };

  const isFavorite = (animeId) => {
    return favorites.some(item => item.id === animeId);
  };

  const getWatchStatus = (animeId) => {
    return watchlist[animeId]?.status || null;
  };

  const recordWatch = (anime, episode = 1) => {
    const fresh = syncWithCatalog(anime);
    setHistory(prev => {
      const filtered = prev.filter(item => item.anime.id !== fresh.id);
      return [{ anime: fresh, episode, watchedAt: Date.now() }, ...filtered].slice(0, 20);
    });

    // Save watch progress
    setWatchProgress(prev => ({
      ...prev,
      [fresh.id]: episode
    }));

    // Auto set to watching if not already set
    if (!watchlist[fresh.id]) {
      setAnimeStatus(fresh, WATCH_STATUSES.WATCHING);
    }
  };

  const getWatchProgress = (animeId) => {
    return watchProgress[animeId] || 1;
  };

  const updateWatchProgress = (animeId, episode) => {
    setWatchProgress(prev => ({
      ...prev,
      [animeId]: episode
    }));
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        favorites,
        history,
        watchProgress,
        setAnimeStatus,
        removeAnime,
        toggleFavorite,
        isFavorite,
        getWatchStatus,
        recordWatch,
        getWatchProgress,
        updateWatchProgress,
        // Mature & Moderation Controls
        isAgeConfirmed,
        confirmAge,
        revokeAgeConfirmation,
        isAdminMode,
        setIsAdminMode,
        toggleAdminMode,
        isMatureAnime,
        getAnimeRating,
        getAnimeWarnings,
        matureOverrides,
        updateTitleMatureStatus,
        contentReports,
        reportContent,
        resolveReport,
        deleteReport
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}
