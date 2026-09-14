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

export function loadUserWatchlist(uname) {
  try {
    const saved = localStorage.getItem(`anisphere_watchlist_${uname}`);
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
}

export function loadUserFavorites(uname) {
  try {
    const saved = localStorage.getItem(`anisphere_favorites_${uname}`);
    if (!saved) return [];
    return JSON.parse(saved).map(syncWithCatalog);
  } catch {
    return [];
  }
}

export function loadUserHistory(uname) {
  try {
    const saved = localStorage.getItem(`anisphere_history_${uname}`);
    if (!saved) return [];
    return JSON.parse(saved).map((item) => ({
      ...item,
      anime: syncWithCatalog(item.anime),
    }));
  } catch {
    return [];
  }
}

export function loadUserProgress(uname) {
  try {
    const saved = localStorage.getItem(`anisphere_progress_${uname}`);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    const normalized = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (typeof val === 'number') {
        normalized[id] = { episode: val, currentTime: 0, duration: 0, percentage: 0, updatedAt: Date.now() };
      } else if (val && typeof val === 'object') {
        normalized[id] = {
          episode: Number(val.episode) || 1,
          currentTime: Number(val.currentTime) || 0,
          duration: Number(val.duration) || 0,
          percentage: Number(val.percentage) || (val.duration > 0 ? (val.currentTime / val.duration) * 100 : 0),
          updatedAt: val.updatedAt || Date.now()
        };
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

export function WatchlistProvider({ children }) {
  const { user } = useAuth();
  const username = user?.username || 'guest';
  const currentUserRef = React.useRef(username);

  const [watchlist, setWatchlist] = useState(() => loadUserWatchlist(username));
  const [favorites, setFavorites] = useState(() => loadUserFavorites(username));
  const [history, setHistory] = useState(() => loadUserHistory(username));
  const [watchProgress, setWatchProgress] = useState(() => loadUserProgress(username));

  // Reload user state cleanly whenever username switches (login, logout, switch user)
  useEffect(() => {
    if (currentUserRef.current !== username) {
      currentUserRef.current = username;
      setWatchlist(loadUserWatchlist(username));
      setFavorites(loadUserFavorites(username));
      setHistory(loadUserHistory(username));
      setWatchProgress(loadUserProgress(username));
    }
  }, [username]);

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

  // Staff Picks curation state (persisted)
  const [staffPicks, setStaffPicks] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_staff_picks');
      if (saved) return JSON.parse(saved);
      return {
        171018: { isStaffPick: true, staffNotes: 'Supernatural alien chaos with mind-blowing animation and comedy!' },
        130298: { isStaffPick: true, staffNotes: 'Masterpiece of unintentional chuunibyou genius and overpowered action.' },
        120377: { isStaffPick: true, staffNotes: 'Studio Trigger masterpiece with pure emotional devastation.' },
        127230: { isStaffPick: true, staffNotes: 'Cinematic perfection and visceral action from MAPPA.' },
        392: { isStaffPick: true, staffNotes: 'The gold standard of 90s supernatural shonen tournament arcs.' },
        101302: { isStaffPick: true, staffNotes: 'Peak Dragon Ball animation and god-tier fight choreography.' },
        16498: { isStaffPick: true, staffNotes: 'The ultimate psychological battle of wits that redefined anime.' },
        1535: { isStaffPick: true, staffNotes: 'L vs Light — the most gripping battle of intellect ever animated.' },
        98659: { isStaffPick: true, staffNotes: 'Calculated psychological mind games in elite high school society.' },
      };
    } catch {
      return {};
    }
  });

  // Sitewide Broadcast Announcement
  const [announcement, setAnnouncement] = useState(() => {
    const celebrationAnnouncement = {
      active: true,
      message: 'Celebrating 140 Anime! Over 6,050+ Verified English Dub Episodes with Direct Native Playback',
      type: 'celebration',
      badge: '140TH ANIME MILESTONE'
    };

    try {
      const saved = localStorage.getItem('anisphere_announcement');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically upgrade outdated messages to the 140th anime milestone celebration
        if (!parsed?.message || !parsed.message.includes('140') || parsed.message.includes('100 Legendary') || parsed.message.includes('66 Legendary') || parsed.message.includes('Login as Xron')) {
          localStorage.setItem('anisphere_announcement', JSON.stringify(celebrationAnnouncement));
          return celebrationAnnouncement;
        }
        return parsed;
      }
      localStorage.setItem('anisphere_announcement', JSON.stringify(celebrationAnnouncement));
      return celebrationAnnouncement;
    } catch {
      return celebrationAnnouncement;
    }
  });

  useEffect(() => {
    if (currentUserRef.current === username) {
      try {
        localStorage.setItem(`anisphere_watchlist_${username}`, JSON.stringify(watchlist));
      } catch (e) {
        console.error(e);
      }
    }
  }, [watchlist, username]);

  useEffect(() => {
    if (currentUserRef.current === username) {
      try {
        localStorage.setItem(`anisphere_favorites_${username}`, JSON.stringify(favorites));
      } catch (e) {
        console.error(e);
      }
    }
  }, [favorites, username]);

  useEffect(() => {
    if (currentUserRef.current === username) {
      try {
        localStorage.setItem(`anisphere_history_${username}`, JSON.stringify(history));
      } catch (e) {
        console.error(e);
      }
    }
  }, [history, username]);

  useEffect(() => {
    if (currentUserRef.current === username) {
      try {
        localStorage.setItem(`anisphere_progress_${username}`, JSON.stringify(watchProgress));
      } catch (e) {
        console.error(e);
      }
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

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_staff_picks', JSON.stringify(staffPicks));
    } catch (e) {
      console.error(e);
    }
  }, [staffPicks]);

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_announcement', JSON.stringify(announcement));
    } catch (e) {
      console.error(e);
    }
  }, [announcement]);

  // Staff Picks helpers
  const isStaffPick = (animeId) => {
    if (!animeId) return false;
    return Boolean(staffPicks[animeId]?.isStaffPick);
  };

  const getStaffNotes = (animeId) => {
    return staffPicks[animeId]?.staffNotes || 'Handpicked recommendation from AniSphere Staff.';
  };

  const toggleStaffPick = (animeId, staffNotes = 'Handpicked by AniSphere Staff') => {
    setStaffPicks(prev => {
      const current = prev[animeId]?.isStaffPick;
      if (current) {
        const next = { ...prev };
        delete next[animeId];
        return next;
      }
      return {
        ...prev,
        [animeId]: {
          isStaffPick: true,
          staffNotes,
          updatedAt: Date.now()
        }
      };
    });
  };

  const setBroadcastAnnouncement = (newAnnouncement) => {
    setAnnouncement(newAnnouncement);
  };

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

  const getWatchProgress = (animeId) => {
    if (!animeId) return null;
    const p = watchProgress[animeId];
    if (!p) return null;
    if (typeof p === 'number') {
      return { episode: p, currentTime: 0, duration: 0, percentage: 0 };
    }
    return p;
  };

  const savePlaybackProgress = (anime, { episode = 1, currentTime = 0, duration = 0 }) => {
    if (!anime?.id) return;
    const fresh = syncWithCatalog(anime);
    const validCurrentTime = Math.max(0, Number(currentTime) || 0);
    const validDuration = Math.max(0, Number(duration) || 0);
    const percentage = validDuration > 0
      ? Math.min(100, Math.max(0, Math.round((validCurrentTime / validDuration) * 1000) / 10))
      : 0;

    const progressObj = {
      episode: Number(episode) || 1,
      currentTime: Math.round(validCurrentTime * 10) / 10,
      duration: Math.round(validDuration * 10) / 10,
      percentage,
      updatedAt: Date.now()
    };

    setWatchProgress(prev => {
      const updated = {
        ...prev,
        [fresh.id]: progressObj
      };
      try {
        localStorage.setItem(`anisphere_progress_${username}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setHistory(prev => {
      const filtered = prev.filter(item => item.anime.id !== fresh.id);
      const updatedHistory = [{
        anime: fresh,
        episode: progressObj.episode,
        currentTime: progressObj.currentTime,
        duration: progressObj.duration,
        percentage: progressObj.percentage,
        watchedAt: Date.now()
      }, ...filtered].slice(0, 25);
      try {
        localStorage.setItem(`anisphere_history_${username}`, JSON.stringify(updatedHistory));
      } catch (e) {}
      return updatedHistory;
    });

    // Auto set to watching if not already set
    if (!watchlist[fresh.id]) {
      setAnimeStatus(fresh, WATCH_STATUSES.WATCHING);
    }
  };

  const recordWatch = (anime, episode = 1, currentTime = 0, duration = 0) => {
    savePlaybackProgress(anime, { episode, currentTime, duration });
  };

  const updateWatchProgress = (animeId, episode, currentTime = 0, duration = 0) => {
    const catalogItem = OUR_ANIME_CATALOG.find(a => a.id === animeId);
    if (catalogItem) {
      savePlaybackProgress(catalogItem, { episode, currentTime, duration });
    } else {
      setWatchProgress(prev => ({
        ...prev,
        [animeId]: {
          episode: Number(episode) || 1,
          currentTime: Number(currentTime) || 0,
          duration: Number(duration) || 0,
          percentage: duration > 0 ? (currentTime / duration) * 100 : 0,
          updatedAt: Date.now()
        }
      }));
    }
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
        savePlaybackProgress,
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
        deleteReport,
        // Staff Picks
        staffPicks,
        isStaffPick,
        getStaffNotes,
        toggleStaffPick,
        // Announcement
        announcement,
        setBroadcastAnnouncement
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
