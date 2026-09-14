import React, { useState, useEffect } from 'react';
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
  Megaphone
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import AnnouncementBar from './AnnouncementBar';
import MilestoneCelebrationModal from './MilestoneCelebrationModal';

export default function Navbar({
  onOpenSearch,
  onOpenWatchlist,
  onRollRandom,
  activeSection,
  onNavigateSection,
  onOpenAdmin,
  onOpenProfile,
  onOpenAuth,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const { watchlist, announcement } = useWatchlist();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  const totalSaved = Object.keys(watchlist).length;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'featured', label: 'Featured', icon: Sparkles },
    { id: 'staff-picks', label: 'Staff Picks', icon: Award, badge: 'HOT' },
    { id: 'action', label: 'Action', icon: Flame },
    { id: 'top-rated', label: 'Top Rated', icon: Star },
    { id: 'scifi', label: 'Sci-Fi', icon: Zap },
    { id: 'mature', label: 'Mature', icon: ShieldAlert, badge: '18+' },
    { id: 'explore', label: 'Catalog', icon: Database, badge: 'DUB' },
  ];

  const handleNavigate = (id) => {
    onNavigateSection(id);
    setIsMenuOpen(false);
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
          onOpenCelebrationModal={() => setIsCelebrationModalOpen(true)}
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
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-gradient-to-r from-emerald-500/30 to-teal-600/30 text-emerald-400 border border-emerald-500/40">
                100% DIRECT
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
              Our Own Streaming Service • Native HD Playback
            </p>
          </div>
        </div>

        {/* Navigation links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-white/5 border border-white/10 p-1 rounded-full backdrop-blur-xl shadow-lg flex-shrink-0">
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

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={onRollRandom}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-bold text-amber-200 transition-all hover:scale-105 shadow-sm"
            title="Roll a random anime"
          >
            <Dices className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden 2xl:inline">Surprise Me</span>
            <span className="hidden xl:inline 2xl:hidden">Random</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-gray-200 transition-all hover:scale-105 group shadow-sm"
            title="Search Catalog"
          >
            <Search className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110" />
            <span className="hidden 2xl:inline text-gray-300">Search 2,600+ Dubs...</span>
            <span className="hidden xl:inline 2xl:hidden text-gray-300">Search</span>
          </button>

          {/* Xron Admin Panel Launcher */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border border-amber-300/40 text-[#0a0f0c] text-xs font-black transition-all hover:scale-105 shadow-md"
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-all hover:scale-105 shadow-sm"
              title="Open Profile Settings"
            >
              <img
                src={user?.avatar || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-50mB868V8K2m.jpg'}
                alt=""
                className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/50"
              />
              <span className="hidden sm:inline font-bold">{user?.displayName || user?.username}</span>
              {isAdmin && (
                <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-amber-500 text-[#0a0f0c]">
                  ADM
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => (onOpenAuth ? onOpenAuth() : setIsAuthModalOpen(true))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border border-amber-300/40 text-xs font-semibold text-[#0a0f0c] transition-all hover:scale-105 shadow-md"
              title="Sign in"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Quick Direct Sign Out Button */}
          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all hover:scale-105 shadow-sm"
              title="Sign Out of AniSphere"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          )}

          <button
            onClick={onOpenWatchlist}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-all hover:scale-105 shadow-sm"
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
            className="md:hidden p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isMenuOpen && (
        <div className="md:hidden glass-nav border-b border-white/10 px-4 pb-5 pt-2 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] shadow-lg shadow-amber-500/30'
                      : 'bg-white/5 text-gray-200 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0a0f0c]' : 'text-teal-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0f0c]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                onRollRandom();
                setIsMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-sm font-bold text-amber-200 mt-2"
            >
              <Dices className="w-4 h-4 text-amber-300" />
              Surprise Me
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onOpenAdmin();
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-300/40 text-sm font-black text-[#0a0f0c] shadow-lg shadow-amber-500/30"
              >
                <Shield className="w-4 h-4" />
                Admin Control Center
              </button>
            )}

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    onOpenProfile();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-sm font-bold text-amber-200"
                >
                  <img
                    src={user?.avatar || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-50mB868V8K2m.jpg'}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400"
                  />
                  Profile ({user?.displayName || user?.username})
                </button>

                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-sm font-bold text-rose-300 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else setIsAuthModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-sm font-bold text-[#0a0f0c] shadow-lg"
              >
                <User className="w-4 h-4" />
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <MilestoneCelebrationModal
        isOpen={isCelebrationModalOpen}
        onClose={() => setIsCelebrationModalOpen(false)}
        onExploreCatalog={() => handleNavigate('featured')}
        onRollRandom={onRollRandom}
      />
    </header>
  );
}