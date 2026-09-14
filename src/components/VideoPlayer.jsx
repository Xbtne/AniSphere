import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Zap,
  Tv,
  CheckCircle2,
  Languages,
  Server,
  RefreshCw
} from 'lucide-react';

import { OUR_ANIME_CATALOG } from '../data/ourAnimeService';
import { useWatchlist } from '../context/WatchlistContext';

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

export default function VideoPlayer({
  anime,
  episode = 1,
  totalEpisodes = 1,
  audioLanguage = 'dub',
  onAudioLanguageChange,
  onNextEpisode,
  onPrevEpisode,
}) {
  const { updateWatchProgress, getWatchProgress, recordWatch, savePlaybackProgress } = useWatchlist();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_player_volume');
      return saved !== null ? parseFloat(saved) : 1;
    } catch (e) {
      return 1;
    }
  });
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('anisphere_player_muted') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [selectedServer, setSelectedServer] = useState(() => {
    try {
      return localStorage.getItem('anisphere_stream_server') || 'direct';
    } catch (e) {
      return 'direct';
    }
  });
  const [hasAutoFailedOver, setHasAutoFailedOver] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [introSkipEndTime, setIntroSkipEndTime] = useState(90);
  const [showBuffering, setShowBuffering] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const previousSeekRef = useRef(0);
  const previousEpRef = useRef(episode);
  const targetTimeRef = useRef(0);
  const lastSavedTimeRef = useRef(0);
  const progressSaveTimeoutRef = useRef(null);
  const bufferingTimerRef = useRef(null);

  // Stable refs so changing context function identities never restart the player
  const getWatchProgressRef = useRef(getWatchProgress);
  getWatchProgressRef.current = getWatchProgress;
  const recordWatchRef = useRef(recordWatch);
  recordWatchRef.current = recordWatch;
  const updateWatchProgressRef = useRef(updateWatchProgress);
  updateWatchProgressRef.current = updateWatchProgress;
  const savePlaybackProgressRef = useRef(savePlaybackProgress);
  savePlaybackProgressRef.current = savePlaybackProgress;

  const title = anime?.title?.english || anime?.title?.romaji || 'Anime';

  // Guaranteed catalog fallback to always get verified working video streams
  const catalogAnime = OUR_ANIME_CATALOG.find(
    (c) =>
      c.id === anime?.id ||
      (c.title?.english && anime?.title?.english && c.title.english.toLowerCase() === anime.title.english.toLowerCase()) ||
      (c.title?.romaji && anime?.title?.romaji && c.title.romaji.toLowerCase() === anime.title.romaji.toLowerCase()) ||
      (typeof anime?.title === 'string' && (
        (c.title?.english && c.title.english.toLowerCase() === anime.title.toLowerCase()) ||
        (c.title?.romaji && c.title.romaji.toLowerCase() === anime.title.toLowerCase())
      ))
  );

  const episodesList = (Array.isArray(catalogAnime?.episodes) && catalogAnime.episodes.length > 0)
    ? catalogAnime.episodes
    : (Array.isArray(anime?.episodes) && anime.episodes.length > 0)
      ? anime.episodes
      : [];

  const currentEpObj =
    episodesList.find((e) => e.episodeNumber === episode) ||
    episodesList[episode - 1] ||
    episodesList[0];

  // Resolve audio track: English Dub prioritized if requested or available
  const hasDub = Boolean(currentEpObj?.dubUrl || catalogAnime?.hasDub || anime?.hasDub);
  const effectiveAudioLang = (audioLanguage === 'dub' && hasDub)
    ? 'dub'
    : (audioLanguage === 'sub' && currentEpObj?.subUrl)
      ? 'sub'
      : hasDub
        ? 'dub'
        : 'sub';

  const rawVideoSrc = effectiveAudioLang === 'dub'
    ? (currentEpObj?.dubUrl || currentEpObj?.hdUrl || currentEpObj?.videoUrl)
    : (currentEpObj?.subUrl || currentEpObj?.hdUrl || currentEpObj?.videoUrl);

  const videoSrc = React.useMemo(() => {
    if (!rawVideoSrc) return '';
    if (selectedServer === 'proxy') {
      return `/mproxy?u=${encodeURIComponent(rawVideoSrc)}`;
    }
    return rawVideoSrc;
  }, [rawVideoSrc, selectedServer]);

  // Reset auto-failover flag when changing episodes or anime
  useEffect(() => {
    setHasAutoFailedOver(false);
  }, [episode, anime?.id]);

  // Dynamic stream quality + source labels
  const streamQuality = (() => {
    if (currentEpObj?.quality) return currentEpObj.quality;
    if (currentEpObj?.videoUrl?.includes('archive.org')) return 'HD';
    return 'HD';
  })();
  const streamSource = selectedServer === 'proxy' ? 'Turbo Edge Proxy' : (currentEpObj?.source || 'Direct CDN');

  // Keep isFullscreen in sync with the browser fullscreen API
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Auto load and play video when episode or videoSrc changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    setIsLoadingVideo(true);
    if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
    setShowBuffering(false);
    const isSameEp = previousEpRef.current === episode;
    
    // Load saved progress for this anime (read through ref — never a dep)
    const savedProgress = getWatchProgressRef.current(anime?.id);
    let targetTime = 0;
    if (isSameEp && previousSeekRef.current > 0) {
      targetTime = previousSeekRef.current;
    } else if (
      savedProgress &&
      Number(savedProgress.episode) === Number(episode) &&
      savedProgress.currentTime > 5 &&
      (!savedProgress.duration || savedProgress.currentTime < savedProgress.duration - 15)
    ) {
      targetTime = savedProgress.currentTime;
    }
    targetTimeRef.current = targetTime;
    
    previousEpRef.current = episode;

    let isSubscribed = true;
    let hls = null;

    const playAfterReady = () => {
      if (!isSubscribed || !video) return;
      if (targetTime > 0) {
        try {
          video.currentTime = targetTime;
          setCurrentTime(targetTime);
          showToast(`Resumed Ep ${episode} at ${formatTime(targetTime)}`);
        } catch (err) {}
      }
      setIsLoadingVideo(false);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (isSubscribed) setIsPlaying(true);
          })
          .catch(() => {
            if (isSubscribed) setIsPlaying(false);
          });
      }
    };

    // Destroy any previous HLS engine
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (err) {}
      hlsRef.current = null;
    }

    const isHlsSource = /\.m3u8(\?|$)/i.test(videoSrc);

    if (isHlsSource) {
      // HLS / adaptive streams (non-archive sources, e.g. HLS CDNs)
      // hls.js is lazy-loaded only when a stream actually needs it
      let hls = null;
      let cancelled = false;
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return;

        hls = new Hls({ maxBufferLength: 30, enableWorker: true });
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels;
          if (levels && levels.length > 1) {
            hls.autoLevelCapping = -1; // always pick the best quality for the bandwidth
            hls.currentLevel = hls.levels.length - 1; // start at the highest variant
          }
          playAfterReady();
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data && data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              try { hls.destroy(); } catch (err) {}
              hlsRef.current = null;
              if (isSubscribed) setIsLoadingVideo(false);
            }
          }
        });

        hls.loadSource(videoSrc);
        hls.attachMedia(video);
      });

      return () => {
        cancelled = true;
        isSubscribed = false;
        if (hls) {
          try { hls.destroy(); } catch (err) {}
          if (hlsRef.current === hls) hlsRef.current = null;
        }
        video.removeAttribute('src');
        if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
      };
    }

    // Native MP4 / direct media
    video.addEventListener('loadedmetadata', playAfterReady, { once: true });
    video.addEventListener('canplay', playAfterReady, { once: true });
    video.addEventListener('loadeddata', playAfterReady, { once: true });

    // Reduced safety timeout: clear buffer spinner after 1s for instant feel
    const bufferTimer = setTimeout(() => {
      if (isSubscribed) {
        setIsLoadingVideo(false);
        // Try to play anyway even if not fully buffered
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    }, 1000);

    video.src = videoSrc;
    video.load();

    return () => {
      isSubscribed = false;
      clearTimeout(bufferTimer);
      video.removeAttribute('src');
      if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
      video.removeEventListener('loadedmetadata', playAfterReady);
      video.removeEventListener('canplay', playAfterReady);
      video.removeEventListener('loadeddata', playAfterReady);
    };
  }, [episode, videoSrc, anime?.id]);

  // Save watch progress periodically during playback and whenever leaving the page
  useEffect(() => {
    if (!anime?.id) return;

    const saveCurrentProgress = () => {
      const video = videoRef.current;
      if (!video) return;
      const curTime = video.currentTime;
      const dur = video.duration || 0;
      if (curTime > 1) {
        savePlaybackProgressRef.current?.(anime, {
          episode,
          currentTime: curTime,
          duration: dur
        });
      }
    };

    // Save progress every 3.5 seconds while playing
    let interval = null;
    if (isPlaying) {
      interval = setInterval(saveCurrentProgress, 3500);
    }

    // Save on beforeunload and pagehide so exiting tab/browser persists progress immediately
    const handleBeforeUnload = () => {
      saveCurrentProgress();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      saveCurrentProgress();
    };
  }, [isPlaying, episode, anime?.id]);

  const [hotkeyToast, setHotkeyToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message) => {
    setHotkeyToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setHotkeyToast(null);
    }, 1200);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        showToast(videoRef.current?.paused ? 'Paused' : 'Playing');
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
        showToast('-10s');
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
        showToast('+10s');
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, Math.round((volume + 0.1) * 10) / 10);
        setVolume(newVol);
        setIsMuted(false);
        if (videoRef.current) {
          videoRef.current.volume = newVol;
          videoRef.current.muted = false;
        }
        showToast(`Volume ${Math.round(newVol * 100)}%`);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, Math.round((volume - 0.1) * 10) / 10);
        setVolume(newVol);
        setIsMuted(newVol === 0);
        if (videoRef.current) {
          videoRef.current.volume = newVol;
          videoRef.current.muted = newVol === 0;
        }
        showToast(`Volume ${Math.round(newVol * 100)}%`);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
        showToast(isMuted ? 'Unmuted' : 'Muted');
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isMuted, isPlaying, duration]);

  // Controls hide timeout on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    const computedIntroEnd = duration > 0 ? Math.min(Math.max(90, duration * 0.12), duration - 10) : 90;
    setIntroSkipEndTime(computedIntroEnd);
    const introStart = Math.max(5, Math.min(20, computedIntroEnd * 0.1));
    const isInIntroWindow = duration > 0 && t >= introStart && t < computedIntroEnd;
    setShowSkipIntro(isInIntroWindow);
    setCurrentTime(t);
    previousSeekRef.current = t;

    // Save progress periodically as time updates
    if (t > 2 && Math.abs(t - lastSavedTimeRef.current) >= 3.5) {
      lastSavedTimeRef.current = t;
      savePlaybackProgressRef.current?.(anime, {
        episode,
        currentTime: t,
        duration: videoRef.current.duration || duration || 0
      });
    }
  };

  const handleSkipIntro = () => {
    if (!videoRef.current) return;
    const targetTime = Math.max(0, Math.min(introSkipEndTime, duration || introSkipEndTime));
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    setShowSkipIntro(false);
    previousSeekRef.current = targetTime;
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const loadedDuration = videoRef.current.duration || 0;
    setDuration(loadedDuration);
    setIntroSkipEndTime(loadedDuration > 0 ? Math.min(Math.max(90, loadedDuration * 0.12), loadedDuration - 10) : 90);
    setIsLoadingVideo(false);

    if (targetTimeRef.current > 0 && Math.abs((videoRef.current.currentTime || 0) - targetTimeRef.current) > 2) {
      try {
        videoRef.current.currentTime = targetTimeRef.current;
        setCurrentTime(targetTimeRef.current);
      } catch (err) {}
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    try {
      localStorage.setItem('anisphere_player_volume', String(val));
      localStorage.setItem('anisphere_player_muted', String(val === 0));
    } catch (err) {}
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    if (nextMuted) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    }
    try {
      localStorage.setItem('anisphere_player_muted', String(nextMuted));
    } catch (err) {}
  };

  const skipTime = (amount) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!viewportRef.current) return;
    if (!document.fullscreenElement) {
      viewportRef.current.requestFullscreen?.({ navigationUI: 'hide' }).then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (anime?.id) {
      savePlaybackProgressRef.current?.(anime, {
        episode,
        currentTime: duration || 1440,
        duration: duration || 1440
      });
    }
    if (episode < totalEpisodes && onNextEpisode) {
      onNextEpisode();
    }
  };

  const handleWaiting = () => {
    if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
    bufferingTimerRef.current = setTimeout(() => {
      setShowBuffering(true);
      // Auto failover to Turbo Edge Proxy if direct server stalls for > 4.5 seconds
      if (selectedServer === 'direct' && !hasAutoFailedOver) {
        setHasAutoFailedOver(true);
        if (videoRef.current) {
          previousSeekRef.current = videoRef.current.currentTime || 0;
        }
        setSelectedServer('proxy');
        try { localStorage.setItem('anisphere_stream_server', 'proxy'); } catch (e) {}
        showToast('🚀 Turbo Edge Proxy activated for smoother buffer');
      }
    }, 4500);
  };

  const handleVideoError = () => {
    console.warn('Video error on server:', selectedServer);
    if (selectedServer === 'direct' && !hasAutoFailedOver) {
      setHasAutoFailedOver(true);
      if (videoRef.current) {
        previousSeekRef.current = videoRef.current.currentTime || 0;
      }
      setSelectedServer('proxy');
      try { localStorage.setItem('anisphere_stream_server', 'proxy'); } catch (e) {}
      showToast('⚡ Auto-switched to Turbo Edge Proxy');
      return;
    }
    setIsLoadingVideo(false);
    setIsPlaying(false);
  };

  const switchServer = (srv) => {
    if (srv === selectedServer) return;
    if (videoRef.current) {
      previousSeekRef.current = videoRef.current.currentTime || 0;
    }
    setSelectedServer(srv);
    try { localStorage.setItem('anisphere_stream_server', srv); } catch (e) {}
    showToast(`Switched to ${srv === 'proxy' ? 'Turbo Edge Proxy' : 'Direct CDN'}`);
  };

  const reloadStream = () => {
    const video = videoRef.current;
    if (!video) return;
    previousSeekRef.current = video.currentTime || 0;
    video.load();
    showToast('🔄 Stream reloaded');
  };

  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full bg-black border-b border-white/10 flex flex-col group select-none"
    >
      {/* Top Stream Header Bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[#0a0f0c] border-b border-white/10 flex-wrap z-30">
        {/* Our Network Badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>AniSphere Direct Stream Engine</span>
          </span>

          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Our Service • Zero Third-Party Iframes</span>
          </span>
        </div>

        {/* 100% English Dub Guarantee */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black shadow-sm">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% ENGLISH DUB</span>
        </div>

        {/* Server Selector Hub */}
        <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-1 text-xs shadow-inner">
          <div className="flex items-center gap-1 px-1.5 text-[11px] font-bold text-gray-400">
            <Server className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">Server:</span>
          </div>
          <button
            type="button"
            onClick={() => switchServer('direct')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              selectedServer === 'direct'
                ? 'bg-amber-500 text-[#0a0f0c] shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Direct CDN: Fastest native stream with low latency"
          >
            Direct CDN
          </button>
          <button
            type="button"
            onClick={() => switchServer('proxy')}
            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
              selectedServer === 'proxy'
                ? 'bg-teal-400 text-[#0a0f0c] shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Turbo Edge Proxy: Cloudflare edge route with anti-buffering"
          >
            <Zap className="w-2.5 h-2.5" />
            Turbo Proxy
          </button>
        </div>

        {/* Episode Stepper & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevEpisode}
              disabled={episode <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-35 text-gray-200 hover:text-white text-xs font-bold transition-all"
              title="Previous Episode"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-black border border-amber-500/30">
              Ep {episode} of {totalEpisodes || 1}
            </span>

            <button
              type="button"
              onClick={onNextEpisode}
              disabled={episode >= totalEpisodes}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-35 text-gray-200 hover:text-white text-xs font-bold transition-all"
              title="Next Episode"
            >
              <span className="hidden sm:inline">Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport (100% Native HTML5 Video) */}
      <div
        ref={viewportRef}
        className={`relative bg-black flex items-center justify-center overflow-hidden ${
          isFullscreen ? 'w-screen h-screen' : 'w-full aspect-video'
        }`}
      >
        {videoSrc ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={anime?.bannerImage || anime?.coverImage?.extraLarge}
              preload="auto"
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={() => setIsLoadingVideo(false)}
              onCanPlay={() => setIsLoadingVideo(false)}
              onEnded={handleVideoEnded}
              onWaiting={handleWaiting}
              onPlaying={() => {
                setIsLoadingVideo(false);
                setIsPlaying(true);
                if (bufferingTimerRef.current) clearTimeout(bufferingTimerRef.current);
                setShowBuffering(false);
              }}
              onPause={() => setIsPlaying(false)}
              onError={handleVideoError}
              playsInline
              className="w-full h-full object-contain cursor-pointer"
            />

            {/* Loading Spinner */}
            {showBuffering && isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none z-10">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold text-gray-200">Buffering {title} Ep {episode}...</p>
              </div>
            )}

            {/* Hotkey Toast Notification */}
            {hotkeyToast && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white text-sm font-black shadow-2xl pointer-events-none z-30 animate-fade-in flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{hotkeyToast}</span>
              </div>
            )}

            {showSkipIntro && (
              <button
                type="button"
                onClick={handleSkipIntro}
                className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-amber-300/60 bg-black/70 px-3 py-2 text-sm font-black text-amber-200 shadow-[0_0_28px_rgba(240,180,41,0.35)] backdrop-blur-md transition hover:bg-amber-500/90 hover:text-[#0a0f0c]"
              >
                <SkipForward className="h-4 w-4" />
                Skip Intro
              </button>
            )}

            {/* Big Center Play Button (When Paused) */}
            {!isPlaying && !hotkeyToast && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0a0f0c] flex items-center justify-center shadow-2xl shadow-amber-600/60 transform hover:scale-110 transition-transform">
                  <Play className="w-9 h-9 fill-white ml-1" />
                </div>
              </div>
            )}

            {/* Top Info HUD Bar */}
            <div
              className={`absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                  <Tv className="w-3 h-3 text-amber-400" />
                  {title} • Episode {episode}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md border shadow-lg flex items-center gap-1.5 ${
                    effectiveAudioLang === 'dub'
                      ? 'bg-emerald-600/90 text-white border-emerald-400 ring-2 ring-emerald-400/30'
                      : 'bg-teal-600/90 text-white border-teal-400 ring-2 ring-teal-400/30'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {effectiveAudioLang === 'dub' ? 'English Dub (Active)' : 'Subtitled (Active)'}
                </span>

                {currentEpObj?.duration && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border bg-amber-500/80 text-white border-amber-400/50 shadow-sm">
                    ⏱️ {currentEpObj.duration} Full Runtime
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur-md">
                  ● {streamQuality.toUpperCase()} • {streamSource}
                </span>
              </div>
            </div>

            {/* Custom Control Bar Overlay */}
            <div
              className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-20 transition-opacity duration-300 flex flex-col gap-2 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Scrubbing Timeline Slider */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.5"
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Seek timeline"
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:h-2 transition-all"
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between gap-3 text-white">
                {/* Left: Play/Pause, Rewind, Forward, Volume, Time */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => skipTime(-10)}
                    className="p-1.5 text-gray-300 hover:text-white transition-colors"
                    title="Rewind 10s"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => skipTime(10)}
                    className="p-1.5 text-gray-300 hover:text-white transition-colors"
                    title="Skip 10s"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5 group/vol">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1 text-gray-300 hover:text-white transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume"
                      className="w-16 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs font-mono text-gray-300 hidden sm:block">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right: Audio Switcher, Speed, Fullscreen */}
                <div className="flex items-center gap-2.5">
                  {/* English Dub Indicator */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>ENGLISH DUB</span>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 text-[11px] font-bold">
                    {[0.75, 1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-1.5 py-0.5 rounded ${
                          playbackSpeed === speed
                            ? 'bg-amber-500 text-[#0a0f0c]'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Reload Stream / Buffer Recovery Button */}
                  <button
                    type="button"
                    onClick={reloadStream}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Reload Stream (Buffer Recovery)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {/* Picture-in-Picture */}
                  {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                    <button
                      type="button"
                      onClick={togglePip}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors hidden sm:flex items-center justify-center"
                      title="Picture-in-Picture"
                    >
                      <Tv className="w-4 h-4" />
                    </button>
                  )}

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-bold text-gray-300">Video source loading for Episode {episode}...</p>
            <p className="text-xs text-gray-500">Connecting to AniSphere streaming cloud</p>
          </div>
        )}
      </div>

      {/* Under Player Status Bar */}
      <div className="px-4 py-2 bg-[#050806] flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Playing <strong className="text-gray-200">{title}</strong> — {currentEpObj?.title || `Episode ${episode}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-semibold flex items-center gap-1.5 ${selectedServer === 'proxy' ? 'text-teal-300' : 'text-amber-300'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${selectedServer === 'proxy' ? 'bg-teal-400' : 'bg-amber-400'} animate-pulse`} />
            {streamSource} • {streamQuality.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
