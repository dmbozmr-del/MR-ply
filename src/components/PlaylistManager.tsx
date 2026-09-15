import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Shuffle,
  Trash2,
  Edit2,
  Music,
  Clock,
  Disc3,
  ChevronRight,
  ArrowUpDown,
  Check,
  X,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Playlist, PlaylistItem } from '../types';
import { formatTime } from '../utils/formatters';

interface PlaylistManagerProps {
  playlists: Playlist[];
  activePlaylistItemId: string | null;
  isPlaying: boolean;
  onCreatePlaylist: (name: string, description?: string, colorGradient?: string) => void;
  onRenamePlaylist: (playlistId: string, newName: string, newDesc?: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveItemFromPlaylist: (playlistId: string, itemId: string) => void;
  onPlayPlaylistItem: (playlist: Playlist, item: PlaylistItem) => void;
  onPlayAll: (playlist: Playlist, shuffle?: boolean) => void;
}

const COLOR_PRESETS = [
  { name: 'ياقوت أرجواني', class: 'from-indigo-600 to-purple-800' },
  { name: 'كهرمان دافئ', class: 'from-amber-600 to-rose-700' },
  { name: 'زمرد هادئ', class: 'from-emerald-600 to-teal-800' },
  { name: 'أزرق محيطي', class: 'from-blue-600 to-cyan-800' },
  { name: 'غروب فوشيا', class: 'from-rose-600 to-pink-800' },
];

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  activePlaylistItemId,
  isPlaying,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onRemoveItemFromPlaylist,
  onPlayPlaylistItem,
  onPlayAll,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [newPlaylistColor, setNewPlaylistColor] = useState(COLOR_PRESETS[0].class);

  const [renameTarget, setRenameTarget] = useState<Playlist | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameDescValue, setRenameDescValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);

  // Active playlist
  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  // Total duration of selected playlist
  const totalDuration =
    selectedPlaylist?.items.reduce((acc, it) => acc + (it.duration || 0), 0) || 0;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim(), newPlaylistDesc.trim(), newPlaylistColor);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreateModalOpen(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    onRenamePlaylist(renameTarget.id, renameValue.trim(), renameDescValue.trim());
    setRenameTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    onDeletePlaylist(deleteTarget.id);
    if (selectedPlaylistId === deleteTarget.id) {
      const remaining = playlists.filter((p) => p.id !== deleteTarget.id);
      setSelectedPlaylistId(remaining[0]?.id || null);
    }
    setDeleteTarget(null);
  };

  return (
    <div id="playlist-manager-container" className="space-y-6" dir="rtl">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              قوائم التشغيل المخصصة
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {playlists.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              أنشئ قوائمك الموسيقية الخاصة، أعد تسميتها، ونظم المقاطع المفضلة لديك
            </p>
          </div>
        </div>

        <button
          id="create-playlist-btn"
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إنشاء قائمة تشغيل جديدة
        </button>
      </div>

      {/* Main Grid: Left Column: Playlists Sidebar | Right Column: Playlist Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Playlists Selection Cards (Left / 4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>جميع القوائم:</span>
            <span>{playlists.length} قائمة</span>
          </div>

          {playlists.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
              لا توجد قوائم تشغيل حتى الآن.
              <br />
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 text-indigo-400 hover:underline font-bold"
              >
                اضغط هنا لإنشاء قائمة الآن
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-0.5">
              {playlists.map((playlist) => {
                const isSelected = selectedPlaylistId === playlist.id;

                return (
                  <div
                    key={playlist.id}
                    id={`playlist-card-${playlist.id}`}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${
                          playlist.colorGradient || 'from-indigo-600 to-indigo-800'
                        } flex items-center justify-center text-white shrink-0 shadow-sm`}
                      >
                        <Music className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {playlist.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{playlist.items.length} أغنية</span>
                          <span>•</span>
                          <span className="font-mono">
                            {formatTime(
                              playlist.items.reduce((acc, i) => acc + (i.duration || 0), 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Play all snippet button */}
                      {playlist.items.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayAll(playlist);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="تشغيل القائمة"
                        >
                          <Play className="w-3.5 h-3.5 fill-current translate-x-[-1px]" />
                        </button>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-indigo-400 rotate-180' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Playlist Detailed View (Right / 8 cols) */}
        <div className="lg:col-span-8">
          {selectedPlaylist ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Hero Banner with custom gradient */}
              <div
                className={`p-5 sm:p-6 bg-gradient-to-l ${
                  selectedPlaylist.colorGradient || 'from-indigo-600 to-purple-800'
                } relative`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
                      <Music className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        قائمة تشغيل مخصصة
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold mt-1 text-white">
                        {selectedPlaylist.name}
                      </h3>
                      {selectedPlaylist.description && (
                        <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
                          {selectedPlaylist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-white/90 mt-2 font-mono">
                        <span>{selectedPlaylist.items.length} أغنية</span>
                        <span>•</span>
                        <span>إجمالي الوقت: {formatTime(totalDuration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this playlist */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Rename Button */}
                    <button
                      id="rename-playlist-btn"
                      type="button"
                      onClick={() => {
                        setRenameTarget(selectedPlaylist);
                        setRenameValue(selectedPlaylist.name);
                        setRenameDescValue(selectedPlaylist.description || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/20 text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="إعادة تسمية قائمة التشغيل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      إعادة تسمية
                    </button>

                    {/* Delete Button */}
                    <button
                      id="delete-playlist-btn"
                      type="button"
                      onClick={() => setDeleteTarget(selectedPlaylist)}
                      className="p-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-600/50 border border-rose-300/30 text-rose-100 text-xs transition-colors cursor-pointer"
                      title="حذف هذه القائمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Playback action bar */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    id="play-all-playlist-btn"
                    type="button"
                    disabled={selectedPlaylist.items.length === 0}
                    onClick={() => onPlayAll(selectedPlaylist, false)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current translate-x-[-1px]" />
                    تشغيل الكل بالترتيب
                  </button>

                  <button
                    id="shuffle-all-playlist-btn"
                    type="button"
                    disabled={selectedPlaylist.items.length === 0}
                    onClick={() => onPlayAll(selectedPlaylist, true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4 text-indigo-400" />
                    تشغيل عشوائي
                  </button>
                </div>

                <span className="text-xs text-slate-400 hidden sm:inline">
                  الأغاني داخل هذه القائمة
                </span>
              </div>

              {/* Songs inside selected playlist */}
              <div className="p-4 space-y-2">
                {selectedPlaylist.items.length === 0 ? (
                  <div className="text-center py-12 px-4 text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    <Music className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <h5 className="text-xs font-bold text-slate-300">
                      قائمة التشغيل هذه فارغة حالياً
                    </h5>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                      يمكنك إضافة أي أغنية من تبويب &quot;المكتبة والبحث&quot; أو من تبويب &quot;استوديو التقطيع&quot; بالضغط على زر &quot;قائمة تشغيل&quot;.
                    </p>
                  </div>
                ) : (
                  selectedPlaylist.items.map((item, index) => {
                    const isItemActive = activePlaylistItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        id={`playlist-item-${item.id}`}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isItemActive
                            ? 'bg-indigo-950/50 border-indigo-500/80 shadow ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Order / Play Button */}
                          <button
                            type="button"
                            onClick={() => onPlayPlaylistItem(selectedPlaylist, item)}
                            className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                              isItemActive && isPlaying
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-800 hover:bg-indigo-600/80 text-slate-300 hover:text-white'
                            }`}
                          >
                            {isItemActive && isPlaying ? (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <span className="text-xs font-bold font-mono text-slate-400 group-hover:hidden">
                                {index + 1}
                              </span>
                            )}
                          </button>

                          {/* Song Title, Artist, and Album */}
                          <div className="min-w-0">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                              {item.title}
                            </h5>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                              <span className="text-indigo-300 font-medium truncate">
                                {item.artist}
                              </span>
                              {item.album && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[150px]">
                                  <Disc3 className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate">{item.album}</span>
                                </span>
                              )}
                              <span className="font-mono text-[11px] text-amber-300">
                                {formatTime(item.duration)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Remove from playlist */}
                          <button
                            type="button"
                            onClick={() => onRemoveItemFromPlaylist(selectedPlaylist.id, item.id)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                            title="إزالة من قائمة التشغيل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              اختر قائمة تشغيل لعرض أغانيها أو قم بإنشاء قائمة جديدة.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Playlist */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                إنشاء قائمة تشغيل جديدة
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">اسم قائمة التشغيل:</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="مثلاً: أغاني السهرة، المفضلة، روائع الطرب..."
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">وصف اختياري:</label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="وصف مختصر لمود أو مناسبة القائمة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-2">سمة ولون الغلاف:</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.class}
                      type="button"
                      onClick={() => setNewPlaylistColor(preset.class)}
                      className={`h-10 rounded-xl bg-gradient-to-tr ${preset.class} border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        newPlaylistColor === preset.class
                          ? 'border-white scale-105 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      {newPlaylistColor === preset.class && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  حفظ القائمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Playlist */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                إعادة تسمية قائمة التشغيل
              </h3>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">الاسم الجديد:</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">الوصف:</label>
                <input
                  type="text"
                  value={renameDescValue}
                  onChange={(e) => setRenameDescValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Playlist Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative animate-fadeIn text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">تأكيد حذف قائمة التشغيل</h4>
            <p className="text-xs text-slate-400 mb-5">
              هل أنت متأكد من حذف قائمة &quot;<strong>{deleteTarget.name}</strong>&quot;؟ لن يتم حذف المقاطع الصوتية الأصلية.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                id="confirm-delete-playlist-btn"
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                نعم، احذف القائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
