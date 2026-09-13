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
  Shield
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

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
  const { watchlist } = useWatchlist();
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
    { id: 'action', label: 'Action & Shonen', icon: Flame },
    { id: 'top-rated', label: 'Top Rated', icon: Star },
    { id: 'scifi', label: 'Sci-Fi & Thriller', icon: Zap },
    { id: 'mature', label: 'Mature', icon: ShieldAlert, badge: '18+' },
    { id: 'explore', label: 'Catalog Search', icon: Database, badge: 'STREAM' },
  ];

  const handleNavigate = (id) => {
    onNavigateSection(id);
    setIsMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'glass-nav py-3 shadow-2xl shadow-black/50'
          : 'bg-gradient-to-b from-black/95 via-black/70 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavigate('hero')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-amber-400/60 bg-black/30 shadow-[0_0_30px_rgba(240,180,41,0.45)] group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(240,180,41,0.6)] transition-all duration-300">
            <img src="/anisphere-icon.svg" alt="AniSphere icon" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif italic group-hover:text-amber-200 transition-colors">
                Ani<span className="text-gradient">Sphere</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-emerald-500/30 to-teal-600/30 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                100% DIRECT
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium hidden sm:block group-hover:text-gray-300 transition-colors">
              Our Own Streaming Service • Native HD Playback
            </p>
          </div>
        </div>

        {/* Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 p-1.5 rounded-full backdrop-blur-xl shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateSection(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] shadow-lg shadow-amber-500/40 scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0a0f0c]' : 'text-teal-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0f0c] shadow-md">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRollRandom}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-bold text-amber-200 transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-900/30"
            title="Roll a random anime"
          >
            <Dices className="w-4 h-4 text-amber-300" />
            <span>Surprise Me</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-gray-200 transition-all duration-300 hover:scale-105 group shadow-lg"
            title="Search Catalog"
          >
            <Search className="w-4 h-4 text-teal-400 group-hover:scale-110 group-hover:text-teal-300 transition-all" />
            <span className="hidden md:inline text-gray-300">Search 628+ Dub Episodes...</span>
          </button>

          {/* Xron Admin Panel Launcher */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border border-amber-300/40 text-[#0a0f0c] text-xs font-black transition-all duration-300 hover:scale-105 shadow-xl shadow-amber-500/30"
              title="Open Admin Control Center"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* User Profile Button / Sign In */}
          {isAuthenticated ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-all duration-300 hover:scale-105 shadow-lg group"
              title="Open Profile Settings"
            >
              <img
                src={user?.avatar || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-50mB868V8K2m.jpg'}
                alt=""
                className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-400/50"
              />
              <span className="hidden sm:inline font-bold">{user?.displayName || user?.username}</span>
              {isAdmin && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-[#0a0f0c] shadow">
                  ADMIN
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => (onOpenAuth ? onOpenAuth() : setIsAuthModalOpen(true))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border border-amber-300/40 text-xs font-semibold text-[#0a0f0c] transition-all duration-300 hover:scale-105 shadow-xl shadow-amber-600/40"
              title="Sign in"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          <button
            onClick={onOpenWatchlist}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/40 text-xs font-semibold text-amber-200 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Bookmark className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">My List</span>
            {totalSaved > 0 && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] text-[11px] font-bold shadow-lg">
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
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}