import React, { useState } from 'react';
import {
  X,
  Shield,
  Award,
  ShieldAlert,
  Users,
  Megaphone,
  Search,
  Check,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { OUR_ANIME_CATALOG } from '../data/ourAnimeService';

export default function AdminPanel({ isOpen, onClose }) {
  const {
    staffPicks,
    isStaffPick,
    getStaffNotes,
    toggleStaffPick,
    matureOverrides,
    updateTitleMatureStatus,
    getAnimeRating,
    getAnimeWarnings,
    isMatureAnime,
    contentReports,
    resolveReport,
    deleteReport,
    announcement,
    setBroadcastAnnouncement
  } = useWatchlist();

  const { user, users, updateProfile, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('staff-picks');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [tempNotes, setTempNotes] = useState('');

  // Announcement state
  const [announceActive, setAnnounceActive] = useState(announcement?.active ?? true);
  const [announceMessage, setAnnounceMessage] = useState(announcement?.message ?? '');
  const [announceType, setAnnounceType] = useState(announcement?.type ?? 'info');
  const [announceSaved, setAnnounceSaved] = useState(false);

  // Mature controls state
  const [matureSearch, setMatureSearch] = useState('');
  const [editingMatureId, setEditingMatureId] = useState(null);
  const [selectedRating, setSelectedRating] = useState('TV-MA');
  const [selectedWarnings, setSelectedWarnings] = useState('Intense action, mature themes');

  if (!isOpen) return null;

  // Filter animes for Staff Picks
  const filteredForStaff = OUR_ANIME_CATALOG.filter((anime) => {
    const title = (anime.title.english || anime.title.romaji || '').toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  // Filter animes for Mature
  const filteredForMature = OUR_ANIME_CATALOG.filter((anime) => {
    const title = (anime.title.english || anime.title.romaji || '').toLowerCase();
    return title.includes(matureSearch.toLowerCase());
  });

  const staffPicksCount = Object.values(staffPicks).filter((p) => p.isStaffPick).length;

  const handleSaveAnnouncement = (e) => {
    e.preventDefault();
    setBroadcastAnnouncement({
      active: announceActive,
      message: announceMessage,
      type: announceType
    });
    setAnnounceSaved(true);
    setTimeout(() => setAnnounceSaved(false), 2500);
  };

  const handleSaveStaffNotes = (animeId) => {
    toggleStaffPick(animeId, tempNotes);
    setEditingNotesId(null);
  };

  const handleSaveMatureOverride = (animeId, currentMature) => {
    updateTitleMatureStatus(animeId, {
      isMature: !currentMature,
      contentRating: selectedRating,
      contentWarnings: selectedWarnings
    });
    setEditingMatureId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#090e0b] border border-amber-500/30 rounded-[28px] shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-[#0a0f0c] shadow-lg shadow-amber-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ADMINISTRATOR PANEL
                </span>
                <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                  Logged in as <strong className="text-amber-200">{user?.displayName || user?.username || 'Xron'}</strong>
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">AniSphere Control Center</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-black/40 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('staff-picks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'staff-picks'
                ? 'bg-amber-500 text-[#0a0f0c] shadow-lg shadow-amber-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Staff Picks ({staffPicksCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'announcement'
                ? 'bg-amber-500 text-[#0a0f0c] shadow-lg shadow-amber-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Sitewide Broadcast</span>
          </button>

          <button
            onClick={() => setActiveTab('mature')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'mature'
                ? 'bg-amber-500 text-[#0a0f0c] shadow-lg shadow-amber-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Mature & Ratings</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-[#0a0f0c] shadow-lg shadow-amber-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Reports ({contentReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-amber-500 text-[#0a0f0c] shadow-lg shadow-amber-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users ({Object.keys(users).length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. STAFF PICKS MANAGER */}
          {activeTab === 'staff-picks' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-950/20 border border-amber-500/20 p-4 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Curate Staff Recommendations
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Titles marked as Staff Picks appear in the exclusive top row on the homepage with curator badges.
                  </p>
                </div>
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search catalog titles..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {filteredForStaff.map((anime) => {
                  const picked = isStaffPick(anime.id);
                  const notes = getStaffNotes(anime.id);
                  const isEditing = editingNotesId === anime.id;

                  return (
                    <div
                      key={anime.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        picked
                          ? 'bg-amber-950/25 border-amber-500/50 shadow-md shadow-amber-950/30'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <img
                        src={anime.coverImage?.large || anime.coverImage?.extraLarge}
                        alt=""
                        className="w-14 h-20 object-cover rounded-xl shrink-0 shadow"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {anime.title.english || anime.title.romaji}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 font-bold shrink-0">
                            {anime.episodes.length} eps
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {anime.seasonYear || 'Classic'} • {anime.genres.slice(0, 2).join(', ')}
                        </p>

                        {/* Curator Notes Display / Editing */}
                        {isEditing ? (
                          <div className="mt-2 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add curator recommendation note..."
                              className="flex-1 px-2.5 py-1 rounded-lg bg-black/60 border border-amber-500/40 text-[11px] text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveStaffNotes(anime.id)}
                              className="px-2 py-1 bg-amber-500 text-[#0a0f0c] rounded-lg text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2 py-1 bg-white/10 text-gray-300 rounded-lg text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-amber-300/80 italic truncate">
                              "{notes}"
                            </p>
                            {picked && (
                              <button
                                onClick={() => {
                                  setEditingNotesId(anime.id);
                                  setTempNotes(notes);
                                }}
                                className="text-[10px] text-gray-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                            )}
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
                          <button
                            onClick={() => toggleStaffPick(anime.id, notes)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                              picked
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] shadow-md shadow-amber-500/20'
                                : 'bg-white/5 hover:bg-white/10 text-gray-300'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            {picked ? 'Staff Pick Active' : 'Add to Staff Picks'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. BROADCAST ANNOUNCEMENT */}
          {activeTab === 'announcement' && (
            <div className="max-w-2xl space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                Broadcast a live alert banner to all AniSphere users at the top of the homepage.
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="announceActive"
                    checked={announceActive}
                    onChange={(e) => setAnnounceActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-black/40 border-white/20"
                  />
                  <label htmlFor="announceActive" className="text-sm font-bold text-white cursor-pointer">
                    Enable Sitewide Announcement Banner
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    Banner Message
                  </label>
                  <textarea
                    value={announceMessage}
                    onChange={(e) => setAnnounceMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 text-sm"
                    placeholder="Enter broadcast message (e.g. New 2024 anime dubs added!)..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    Banner Style
                  </label>
                  <div className="flex gap-3">
                    {['info', 'warning', 'alert'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAnnounceType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                          announceType === type
                            ? 'bg-amber-500 text-[#0a0f0c]'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {announceSaved && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Announcement updated live!
                  </div>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0a0f0c] font-black text-sm shadow-xl shadow-amber-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Save & Broadcast
                </button>
              </form>
            </div>
          )}

          {/* 3. MATURE & RATINGS CONTROL */}
          {activeTab === 'mature' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-300">
                  Override maturity rating or content warnings for any catalog title.
                </p>
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={matureSearch}
                    onChange={(e) => setMatureSearch(e.target.value)}
                    placeholder="Search titles..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {filteredForMature.map((anime) => {
                  const isMature = isMatureAnime(anime);
                  const rating = getAnimeRating(anime);
                  const isEditing = editingMatureId === anime.id;

                  return (
                    <div
                      key={anime.id}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 flex items-start gap-3.5"
                    >
                      <img
                        src={anime.coverImage?.large || anime.coverImage?.extraLarge}
                        alt=""
                        className="w-12 h-16 object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {anime.title.english || anime.title.romaji}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-black ${
                              isMature ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {rating}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <select
                              value={selectedRating}
                              onChange={(e) => setSelectedRating(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-white"
                            >
                              <option value="TV-MA">TV-MA (Mature)</option>
                              <option value="TV-14">TV-14</option>
                              <option value="PG-13">PG-13</option>
                            </select>
                            <input
                              type="text"
                              value={selectedWarnings}
                              onChange={(e) => setSelectedWarnings(e.target.value)}
                              placeholder="Content warnings..."
                              className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-white"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveMatureOverride(anime.id, isMature)}
                                className="px-2.5 py-1 bg-amber-500 text-[#0a0f0c] text-[10px] font-bold rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMatureId(null)}
                                className="px-2.5 py-1 bg-white/10 text-gray-300 text-[10px] rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">
                              Status: <strong className={isMature ? 'text-rose-400' : 'text-emerald-400'}>{isMature ? 'Mature (18+)' : 'Standard'}</strong>
                            </span>
                            <button
                              onClick={() => {
                                setEditingMatureId(anime.id);
                                setSelectedRating(rating);
                                setSelectedWarnings(getAnimeWarnings(anime).join(', '));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. REPORTS QUEUE */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {contentReports.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No pending user reports. Everything is running smoothly!
                </div>
              ) : (
                <div className="space-y-3">
                  {contentReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-400 uppercase">
                            {report.reason || 'Content Issue'}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">
                            {new Date(report.reportedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white mt-1">
                          Anime ID: {report.animeId}
                        </p>
                        {report.details && (
                          <p className="text-xs text-gray-300 mt-0.5">{report.details}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resolveReport(report.id)}
                          className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                          title="Resolve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. USER ACCOUNTS & PROFILES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Registered profiles on this AniSphere instance ({Object.keys(users).length} total).
              </p>
              <div className="space-y-3">
                {Object.values(users).map((u) => {
                  const isUserAdmin = u.role === 'admin' || u.username?.toLowerCase() === 'xron';

                  return (
                    <div
                      key={u.username}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-50mB868V8K2m.jpg'}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{u.displayName || u.username}</span>
                            {isUserAdmin && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{u.bio || 'Anime Enthusiast'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Joined {new Date(u.joinedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
