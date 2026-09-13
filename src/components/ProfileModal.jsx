import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Award,
  Bookmark,
  Heart,
  Clock,
  LogOut,
  Edit2,
  Check,
  Sparkles,
  Camera,
  Tv
} from 'lucide-react';
import { useAuth, DEFAULT_AVATARS } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function ProfileModal({ isOpen, onClose, onOpenAdmin }) {
  const { user, updateProfile, logout, isAdmin } = useAuth();
  const { watchlist, favorites, history, watchProgress } = useWatchlist();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || DEFAULT_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState(user?.favoriteGenre || 'Action');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const totalWatchlist = Object.keys(watchlist || {}).length;
  const totalFavorites = Object.keys(favorites || {}).length;
  const totalHistory = history?.length || 0;
  const totalProgress = Object.keys(watchProgress || {}).length;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : selectedAvatar;
    updateProfile({
      displayName: displayName.trim() || user.username,
      bio: bio.trim(),
      avatar: finalAvatar,
      favoriteGenre,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#090e0b] border border-amber-500/30 rounded-[32px] shadow-2xl shadow-amber-950/40 overflow-hidden">
        {/* Header / Cover */}
        <div className="h-32 bg-gradient-to-r from-amber-600/30 via-yellow-600/20 to-teal-600/30 relative flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-full bg-black/60 text-amber-300 border border-amber-500/30">
              {isAdmin ? 'ADMINISTRATOR' : 'MEMBER PROFILE'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative -mt-14 space-y-5">
          {/* Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div className="relative">
                <img
                  src={selectedAvatar || user.avatar || DEFAULT_AVATARS[0].url}
                  alt={user.username}
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-[#090e0b] shadow-2xl bg-black"
                />
                {isAdmin && (
                  <div
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-[#0a0f0c] shadow-lg"
                    title="AniSphere Administrator"
                  >
                    <Shield className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="mb-1">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  {user.displayName || user.username}
                  {isAdmin && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ADMIN
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400">@{user.username}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30 hover:scale-105 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>
          </div>

          {/* User Bio */}
          {!isEditing && (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-gray-300 leading-relaxed italic">
                "{user.bio || 'Streaming anime on AniSphere • 100% English Dub.'}"
              </p>
            </div>
          )}

          {/* Editing Mode Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                  Choose Anime Avatar
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 bg-black/40 rounded-2xl border border-white/10">
                  {DEFAULT_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(av.url);
                        setCustomAvatarUrl('');
                      }}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        selectedAvatar === av.url && !customAvatarUrl
                          ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Or Custom Avatar URL</label>
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://... image url"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your favorite anime..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Favorite Genre</label>
                <select
                  value={favoriteGenre}
                  onChange={(e) => setFavoriteGenre(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="Action">Action & Shonen</option>
                  <option value="Supernatural">Supernatural</option>
                  <option value="Sci-Fi">Sci-Fi & Thriller</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Drama">Drama & Romance</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] text-xs font-black shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Save Profile Changes
              </button>
            </form>
          )}

          {/* Watch Statistics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <Bookmark className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-base font-black text-white">{totalWatchlist}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Watchlist</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <div className="text-base font-black text-white">{totalFavorites}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Favorites</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <Tv className="w-4 h-4 text-teal-400 mx-auto mb-1" />
              <div className="text-base font-black text-white">{totalHistory}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Watched</div>
            </div>
          </div>

          {/* Success Message */}
          {savedSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Check className="w-4 h-4" /> Profile saved successfully!
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <span className="text-[11px] text-gray-500 font-medium">
              AniSphere v2.0 • 100% Direct Dub
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
