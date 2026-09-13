import React, { useState } from 'react';
import { X, Bookmark, Play, Trash2, Heart, Clock, CheckCircle2, Film, LogOut } from 'lucide-react';
import { useWatchlist, WATCH_STATUSES } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';

export default function WatchlistDrawer({ isOpen, onClose, onSelectAnime }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'watching' | 'plan' | 'completed' | 'favorites' | 'history'
  const { watchlist, favorites, history, setAnimeStatus, removeAnime, toggleFavorite } = useWatchlist();
  const { logout, isAuthenticated } = useAuth();

  if (!isOpen) return null;

  const watchlistEntries = Object.values(watchlist);

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'watching':
        return watchlistEntries.filter((item) => item.status === WATCH_STATUSES.WATCHING);
      case 'plan':
        return watchlistEntries.filter((item) => item.status === WATCH_STATUSES.PLAN_TO_WATCH);
      case 'completed':
        return watchlistEntries.filter((item) => item.status === WATCH_STATUSES.COMPLETED);
      case 'favorites':
        return favorites.map((anime) => ({ anime, isFav: true }));
      case 'history':
        return history;
      case 'all':
      default:
        return watchlistEntries;
    }
  };

  const filteredItems = getFilteredItems();

  const tabs = [
    { id: 'all', label: 'All Saved', count: watchlistEntries.length },
    { id: 'watching', label: 'Watching', count: watchlistEntries.filter(i => i.status === WATCH_STATUSES.WATCHING).length },
    { id: 'plan', label: 'Plan to Watch', count: watchlistEntries.filter(i => i.status === WATCH_STATUSES.PLAN_TO_WATCH).length },
    { id: 'completed', label: 'Completed', count: watchlistEntries.filter(i => i.status === WATCH_STATUSES.COMPLETED).length },
    { id: 'favorites', label: 'Favorites', count: favorites.length },
    { id: 'history', label: 'History', count: history.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-[#0b100e] border-l border-white/10 h-full flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">My Anime Hub</h2>
              <p className="text-xs text-gray-400">Manage watchlist, history & favorites</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all hover:scale-105"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="p-3 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-[#0a0f0c] shadow-md shadow-amber-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20' : 'bg-black/40 text-gray-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">
                <Film className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-gray-300">No anime in this section yet</p>
              <p className="text-xs max-w-xs text-gray-500">
                Browse all the new anime and click the bookmark or heart button to track your shows here!
              </p>
            </div>
          ) : (
            filteredItems.map((entry, idx) => {
              const anime = entry.anime || entry;
              const title = anime.title?.english || anime.title?.romaji;
              const cover = anime.coverImage?.large || anime.coverImage?.medium;
              const status = entry.status;

              return (
                <div
                  key={anime.id || idx}
                  className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <div
                    onClick={() => {
                      onSelectAnime(anime);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
                  >
                    <img
                      src={cover}
                      alt={title}
                      className="w-14 h-20 rounded-xl object-cover bg-black flex-shrink-0 shadow"
                    />
                    <div className="overflow-hidden space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-100 group-hover:text-amber-300 transition-colors truncate">
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        {status && (
                          <span className="capitalize font-medium text-amber-400">
                            {status}
                          </span>
                        )}
                        {entry.episode && (
                          <span className="text-gray-400 font-medium">
                            Watched Ep {entry.episode}
                          </span>
                        )}
                        {anime.format && <span>• {anime.format}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        onSelectAnime(anime);
                        onClose();
                      }}
                      className="p-2 rounded-xl bg-amber-500/25 hover:bg-amber-500 text-amber-200 hover:text-[#0a0f0c] transition-colors"
                      title="Watch / Preview"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {activeTab !== 'history' && activeTab !== 'favorites' && (
                      <button
                        onClick={() => removeAnime(anime.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors"
                        title="Remove from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {activeTab === 'favorites' && (
                      <button
                        onClick={() => toggleFavorite(anime)}
                        className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition-colors"
                        title="Remove from favorites"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
