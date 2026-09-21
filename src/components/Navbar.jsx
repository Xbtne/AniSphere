import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Film,
  Bookmark,
  Search,
  Flame,
  Calendar,
  Star,
  Database,
  Dices,
  Zap,
  ShieldAlert,
  LogOut,
  User,
  Menu,
  X,
  Award,
  Shield,
  Megaphone,
  Play,
  Check
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { OUR_ANIME_CATALOG } from '../data/ourAnimeService';
import AuthModal from './AuthModal';
import AnnouncementBar from './AnnouncementBar';

export default function Navbar({
  onOpenSearch,
  onOpenWatchlist,
  onRollRandom,
  activeSection,
  onNavigateSection,
  onOpenAdmin,
  onOpenProfile,
  onOpenAuth,
  onSelectAnime
}) {
  const [scrolled, setScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  
  // Real-time Navbar Search Input & Dropdown State
  const [navSearchTerm, setNavSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const { watchlist, announcement, isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  const totalSaved = Object.keys(watchlist).length;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'featured', label: 'Featured', icon: Sparkles },
    { id: 'staff-picks', label: 'Staff Picks', icon: Award, badge: 'HOT' },
    { id: 'action', label: 'Action', icon: Flame },
    { id: 'top-rated', label: 'Top Rated', icon: Star },
    { id: 'scifi', label: 'Sci-Fi', icon: Zap },
    { id: 'mature', label: 'Mature', icon: ShieldAlert, badge: '18+' },
    { id: 'explore', label: 'Catalog', icon: Database, badge: '200+' },
  ];

  const handleNavigate = (id) => {
    onNavigateSection(id);
    setIsMenuOpen(false);
  };

  // Compute live search matches for the dropdown
  const q = navSearchTerm.trim().toLowerCase();
  const searchMatches = q
    ? OUR_ANIME_CATALOG.filter((anime) => {
        const eng = (anime.title?.english || (typeof anime.title === 'string' ? anime.title : '') || '').toLowerCase();
        const rom = (anime.title?.romaji || '').toLowerCase();
        const nat = (anime.title?.native || '').toLowerCase();
        const aliases = Array.isArray(anime.aliases) ? anime.aliases.map((a) => a.toLowerCase()) : [];
        const genres = (anime.genres || []).map((g) => g.toLowerCase());
        return (
          eng.includes(q) ||
          rom.includes(q) ||
          nat.includes(q) ||
          aliases.some((a) => a.includes(q)) ||
          genres.some((g) => g.includes(q))
        );
      }).slice(0, 7)
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchMatches.length > 0 && onSelectAnime) {
      onSelectAnime(searchMatches[0]);
      setIsDropdownOpen(false);
      setNavSearchTerm('');
    } else if (onOpenSearch) {
      onOpenSearch();
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 flex flex-col ${
        scrolled
          ? 'glass-nav shadow-2xl shadow-black/60'
          : 'bg-gradient-to-b from-black/95 via-black/80 to-transparent'
      }`}
    >
      {/* Sitewide Broadcast Announcement Bar */}
      {!announcementDismissed && (
        <AnnouncementBar
          announcement={announcement}
          onDismiss={() => setAnnouncementDismissed(true)}
          onNavigate={handleNavigate}
        />
      )}

      <div
        className={`w-full max-w-[1880px] mx-auto px-2 sm:px-4 lg:px-6 flex items-center justify-between gap-2 xl:gap-3 transition-all duration-300 ${
          scrolled ? 'py-2 sm:py-2.5' : 'py-3 sm:py-4'
        }`}
      >
        {/* Brand Logo */}
        <div
          onClick={() => handleNavigate('hero')}
          className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden ring-2 ring-amber-400/60 bg-black/30 shadow-[0_0_30px_rgba(240,180,41,0.45)] group-hover:scale-105 transition-all duration-300">
            <img src="/anisphere-icon.svg" alt="AniSphere icon" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-2xl font-black tracking-tight text-white font-serif italic group-hover:text-amber-200 transition-colors">
                Ani<span className="text-gradient">Sphere</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                200+ COMPLETE
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
              Direct Streaming Cloud • 7,100+ High-Def Streams
            </p>
          </div>
        </div>

        {/* Navigation links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-0.5 bg-white/5 border border-white/10 p-1 rounded-full backdrop-blur-xl shadow-lg flex-shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateSection(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] shadow-lg shadow-amber-500/40 font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0a0f0c]' : 'text-teal-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0f0c] shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Search Input & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 max-w-md justify-end">
          {/* Interactive Live Search Bar */}
          <div ref={searchContainerRef} className="relative w-full max-w-[280px] sm:max-w-[320px]">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={navSearchTerm}
                onChange={(e) => {
                  setNavSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search 200+ anime..."
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-[#0d1410] border border-amber-500/30 focus:border-amber-400 text-xs text-white placeholder-gray-400 rounded-xl pl-9 pr-8 py-1.5 outline-none transition-all shadow-inner focus:ring-2 focus:ring-amber-500/20"
              />
              {navSearchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setNavSearchTerm('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-2.5 p-0.5 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd
                  onClick={onOpenSearch}
                  className="hidden sm:inline-flex absolute right-2 text-[9px] font-mono bg-black/40 text-amber-300/80 px-1.5 py-0.5 rounded border border-white/10 cursor-pointer"
                  title="Open Full Search Modal"
                >
                  ⌘K
                </kbd>
              )}
            </form>

            {/* Live Search Instant Results Dropdown */}
            {isDropdownOpen && navSearchTerm.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#09110d]/95 border border-amber-500/40 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl overflow-hidden z-50 animate-scale-up">
                <div className="p-2 space-y-1 max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                  {searchMatches.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">
                      <p className="font-semibold text-gray-300">No matching anime found</p>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenSearch?.();
                        }}
                        className="mt-2 text-[11px] text-amber-400 hover:underline"
                      >
                        Open advanced search
                      </button>
                    </div>
                  ) : (
                    searchMatches.map((anime) => {
                      const title = anime.title?.english || anime.title?.romaji || 'Unknown Title';
                      const poster = anime.coverImage?.extraLarge || anime.coverImage?.large;
                      const isSaved = isInWatchlist(anime.id);

                      return (
                        <div
                          key={anime.id}
                          onClick={() => {
                            if (onSelectAnime) onSelectAnime(anime);
                            setIsDropdownOpen(false);
                            setNavSearchTerm('');
                          }}
                          className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <img
                              src={poster}
                              alt={title}
                              className="w-8 h-11 object-cover rounded-md bg-black/50 shrink-0 ring-1 ring-white/10 group-hover:ring-amber-400/50"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors truncate">
                                {title}
                              </h5>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  <span>{anime.averageScore}%</span>
                                </span>
                                <span>•</span>
                                <span>{anime.episodes?.length || 1} EPS</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                if (isSaved) {
                                  removeFromWatchlist(anime.id);
                                } else {
                                  addToWatchlist(anime);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-all ${
                                isSaved
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                              title={isSaved ? 'In My List' : 'Add to List'}
                            >
                              {isSaved ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Bookmark className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => {
                                if (onSelectAnime) onSelectAnime(anime);
                                setIsDropdownOpen(false);
                                setNavSearchTerm('');
                              }}
                              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0a0f0c] transition-transform hover:scale-105"
                              title="Play Now"
                            >
                              <Play className="w-3.5 h-3.5 fill-[#0a0f0c]" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 bg-black/60 border-t border-white/5 flex items-center justify-between text-[11px] px-3">
                  <span className="text-gray-400">{searchMatches.length} matches</span>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenSearch?.();
                    }}
                    className="text-amber-400 font-bold hover:text-amber-300 hover:underline"
                  >
                    View All in Search Modal →
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onRollRandom}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-bold text-amber-200 transition-all hover:scale-105 shadow-sm shrink-0"
            title="Roll a random anime"
          >
            <Dices className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden 2xl:inline">Surprise</span>
          </button>

          {/* Xron Admin Panel Launcher */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border border-amber-300/40 text-[#0a0f0c] text-xs font-black transition-all hover:scale-105 shadow-md shrink-0"
              title="Open Admin Control Center"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* User Profile Button / Sign In */}
          {isAuthenticated ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-all hover:scale-105 shadow-sm shrink-0"
              title="Open Profile Settings"
            >
              <img
                src={user?.avatar || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-50mB868V8K2m.jpg'}
                alt=""
                className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/50"
              />
              <span className="hidden md:inline font-bold">{user?.displayName || user?.username}</span>
            </button>
          ) : (
            <button
              onClick={() => (onOpenAuth ? onOpenAuth() : setIsAuthModalOpen(true))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border border-amber-300/40 text-xs font-semibold text-[#0a0f0c] transition-all hover:scale-105 shadow-md shrink-0"
              title="Sign in"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          <button
            onClick={onOpenWatchlist}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-all hover:scale-105 shadow-sm shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">My List</span>
            {totalSaved > 0 && (
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] text-[10px] font-black shadow-sm">
                {totalSaved}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isMenuOpen && (
        <div className="xl:hidden glass-nav border-b border-white/10 px-4 pb-5 pt-2 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-[#0a0f0c] font-bold shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Auth Modal Trigger Fallback */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}