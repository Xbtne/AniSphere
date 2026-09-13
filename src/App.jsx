import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import AnimeRow from './components/AnimeRow';
import SearchFilter from './components/SearchFilter';
import MatureSection from './components/MatureSection';
import WatchModal from './components/WatchModal';
import WatchlistDrawer from './components/WatchlistDrawer';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileModal from './components/ProfileModal';
import { OUR_ANIME_CATALOG } from './data/ourAnimeService';
import {
  Sparkles,
  Flame,
  Star,
  Trophy,
  Tv,
  Film,
  Zap,
  ArrowUp,
  ShieldAlert,
  CheckCircle2,
  X,
  Award,
  Megaphone
} from 'lucide-react';
import { useWatchlist } from './context/WatchlistContext';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMatureGateOpen, setIsMatureGateOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const {
    history,
    isAgeConfirmed,
    confirmAge,
    revokeAgeConfirmation,
    isMatureAnime,
    staffPicks,
    isStaffPick,
    announcement
  } = useWatchlist();
  const { isAuthenticated, user, isAdmin } = useAuth();

  const regularCatalog = React.useMemo(
    () => OUR_ANIME_CATALOG.filter((anime) => !isMatureAnime(anime)),
    [isMatureAnime]
  );

  const matureCatalog = React.useMemo(
    () => OUR_ANIME_CATALOG.filter((anime) => isMatureAnime(anime)),
    [isMatureAnime]
  );

  // Curated categories strictly from OUR_ANIME_CATALOG (100% playable direct streams)
  const heroSpotlight = React.useMemo(() => regularCatalog.slice(0, 8), [regularCatalog]);
  const staffPicksList = React.useMemo(
    () => regularCatalog.filter((a) => isStaffPick(a.id)),
    [regularCatalog, isStaffPick, staffPicks]
  );
  const featured = React.useMemo(() => regularCatalog, [regularCatalog]);
  const actionHits = React.useMemo(() => regularCatalog.filter(a => a.genres.includes('Action')), [regularCatalog]);
  const topRated = React.useMemo(() => [...regularCatalog].sort((a, b) => b.averageScore - a.averageScore), [regularCatalog]);
  const sciFiSupernatural = React.useMemo(() => regularCatalog.filter(a => a.genres.includes('Sci-Fi') || a.genres.includes('Supernatural') || a.genres.includes('Psychological')), [regularCatalog]);
  const dramaRomanceMovies = React.useMemo(() => regularCatalog.filter(a => a.genres.includes('Romance') || a.genres.includes('Drama') || a.format === 'MOVIE'), [regularCatalog]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectAnime = (anime) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    if (anime && isMatureAnime(anime) && !isAgeConfirmed) {
      setIsMatureGateOpen(true);
      return;
    }
    setSelectedAnime(anime);
  };

  const handleNavigateSection = (sectionId) => {
    if (sectionId === 'mature' && !isAgeConfirmed) {
      setIsMatureGateOpen(true);
      setActiveSection('hero');
      return;
    }

    setActiveSection(sectionId);
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenSearch = () => {
    handleNavigateSection('explore');
    const input = document.querySelector('#explore input');
    if (input) input.focus();
  };

  const handleRollRandom = () => {
    const randomChoice = regularCatalog.length > 0 ? regularCatalog : OUR_ANIME_CATALOG;
    const randomIdx = Math.floor(Math.random() * randomChoice.length);
    const randomAnime = randomChoice[randomIdx];
    handleSelectAnime(randomAnime);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070b09] text-gray-100 flex flex-col selection:bg-amber-500 selection:text-[#0a0f0c]">
      {/* Navigation Header */}
      <Navbar
        onOpenSearch={handleOpenSearch}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onRollRandom={handleRollRandom}
        activeSection={activeSection}
        onNavigateSection={handleNavigateSection}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Sitewide Announcement Banner */}
      {announcement?.active && announcement?.message && (
        <div className="fixed top-16 left-0 right-0 z-30 px-4 py-2 bg-gradient-to-r from-amber-600/90 via-yellow-600/90 to-amber-700/90 text-[#0a0f0c] backdrop-blur-md border-b border-amber-300/40 shadow-lg text-center text-xs font-bold flex items-center justify-center gap-2">
          <Megaphone className="w-3.5 h-3.5 shrink-0 text-[#0a0f0c]" />
          <span>{announcement.message}</span>
        </div>
      )}

      {/* Hero Spotlight Billboard */}
      <div id="hero" className={announcement?.active && announcement?.message ? 'pt-6' : ''}>
        <HeroBanner
          animeList={heroSpotlight}
          onSelectAnime={handleSelectAnime}
        />
      </div>

      {/* Main Content Sections */}
      <main className="flex-1 space-y-4 -mt-10 sm:-mt-14 relative z-20">
        {/* Continue Watching (if history exists) */}
        {history.length > 0 && (
          <AnimeRow
            id="continue-watching"
            title="Continue Watching"
            subtitle="Pick up right where you left off"
            icon={Tv}
            badgeText="Recent"
            badgeColor="cyan"
            animeList={history.map((h) => h.anime).filter((anime) => !isMatureAnime(anime))}
            onSelectAnime={handleSelectAnime}
          />
        )}

        {/* STAFF PICKS: CURATED COMMUNITY ESSENTIALS */}
        {staffPicksList.length > 0 && (
          <AnimeRow
            id="staff-picks"
            title="Staff Picks: Curated Masterpieces"
            subtitle="Handpicked essentials chosen by AniSphere staff with custom recommendations"
            icon={Award}
            badgeText="Staff Curated"
            badgeColor="amber"
            animeList={staffPicksList}
            onSelectAnime={handleSelectAnime}
          />
        )}

        {/* 1. OUR STREAMING SERVICE CATALOG */}
        <AnimeRow
          id="featured"
          title="Featured on Our Streaming Service"
          subtitle="100% direct native playback • Zero popups, zero redirects, zero broken streams"
          icon={Sparkles}
          badgeText="Our Service"
          badgeColor="rose"
          animeList={featured}
          onSelectAnime={handleSelectAnime}
        />

        {/* 2. ACTION & SHONEN HITS */}
        <AnimeRow
          id="action"
          title="Action & Shonen Blockbusters"
          subtitle="High-intensity combat, superpowers, and legendary showdowns"
          icon={Flame}
          badgeText="High Octane"
          badgeColor="purple"
          animeList={actionHits}
          onSelectAnime={handleSelectAnime}
        />

        {/* 3. ALL-TIME TOP RATED MASTERPIECES */}
        <AnimeRow
          id="top-rated"
          title="Top Rated Masterpieces"
          subtitle="Critically acclaimed and highest rated anime of all time"
          icon={Star}
          badgeText="Masterpiece"
          badgeColor="amber"
          animeList={topRated}
          onSelectAnime={handleSelectAnime}
        />

        {/* 4. SCI-FI & SUPERNATURAL THRILLERS */}
        <AnimeRow
          id="scifi"
          title="Sci-Fi & Supernatural Thrillers"
          subtitle="Mind games, dark mysteries, time travel, and psychological tension"
          icon={Zap}
          badgeText="Thriller"
          badgeColor="cyan"
          animeList={sciFiSupernatural}
          onSelectAnime={handleSelectAnime}
        />

        {/* 5. DRAMA, ROMANCE & MOVIES */}
        <AnimeRow
          id="drama"
          title="Drama, Romance & Feature Films"
          subtitle="Emotional masterpieces, heartwarming stories, and full-length cinematic experiences"
          icon={Film}
          badgeText="Cinematic"
          badgeColor="purple"
          animeList={dramaRomanceMovies}
          onSelectAnime={handleSelectAnime}
        />

        {isAgeConfirmed && (
          <MatureSection animeList={matureCatalog} onSelectAnime={handleSelectAnime} />
        )}

        {/* 6. SEARCH & MULTI-FILTER EXPLORATION DATABASE */}
        <SearchFilter onSelectAnime={handleSelectAnime} />
      </main>

      {/* Floating Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0a0f0c] shadow-xl shadow-amber-600/40 transition-all hover:scale-110 active:scale-95"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Mature age gate */}
      {isMatureGateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[28px] border border-rose-500/30 bg-[#0a0f0c] p-6 shadow-2xl shadow-rose-900/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-rose-300 font-black">Age verification</p>
                  <h3 className="text-xl font-black text-white">Mature content</h3>
                </div>
              </div>
              <button onClick={() => setIsMatureGateOpen(false)} className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              This section contains legally licensed 18+ anime with explicit content, graphic violence, sexual themes, or strong language.
              Please confirm that you are at least 18 years old to continue.
            </p>

            <div className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-gray-300 space-y-2">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Content is rated TV-MA or 18+.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Titles are separated from general recommendations.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Access is protected by platform moderation and reporting controls.</div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  confirmAge();
                  setIsMatureGateOpen(false);
                  setActiveSection('mature');
                  setTimeout(() => {
                    document.getElementById('mature')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-3 transition-all"
              >
                I am 18+
              </button>
              <button
                onClick={() => {
                  revokeAgeConfirmation();
                  setIsMatureGateOpen(false);
                }}
                className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 font-bold px-4 py-3 border border-white/10 transition-all"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watch Modal with Player & Stream Links */}
      {selectedAnime && (
        <WatchModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onSelectAnime={handleSelectAnime}
        />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Admin Panel for Xron / Admins */}
      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
      />

      {/* Watchlist & History Drawer */}
      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        onSelectAnime={setSelectedAnime}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 bg-[#050806] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-[#0a0f0c] shadow-lg shadow-amber-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-white font-serif italic tracking-tight">
                Ani<span className="text-gradient">Sphere</span>
              </span>
              <p className="text-xs text-gray-400">
                Our exclusive streaming service with 100% verified direct anime playback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-400">
            <span>Our Native Streaming Network</span>
            <span>•</span>
            <span>100% Direct Playable Streams</span>
            <span>•</span>
            <span>Zero 3rd-Party Ads or Popups</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
