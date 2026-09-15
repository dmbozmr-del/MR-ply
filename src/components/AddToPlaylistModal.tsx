import React, { useState } from 'react';
import {
  X,
  Plus,
  ListMusic,
  Check,
  Music,
  Sparkles,
} from 'lucide-react';
import { Playlist, PlaylistItem, UnifiedSongItem, TrackSegment, AudioTrack } from '../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  songToAdd: UnifiedSongItem | TrackSegment | AudioTrack | null;
  onAddToPlaylist: (playlistId: string, item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
  onCreatePlaylistAndAdd: (name: string, item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  songToAdd,
  onAddToPlaylist,
  onCreatePlaylistAndAdd,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  if (!isOpen || !songToAdd) return null;

  // Convert the input songToAdd to unified item properties
  const isSegment = 'startTime' in songToAdd && 'endTime' in songToAdd && !('segments' in songToAdd);
  const title = songToAdd.title;
  const artist = songToAdd.artist || 'فنان غير محدد';
  const album =
    ('album' in songToAdd && songToAdd.album) ||
    ('notes' in songToAdd && songToAdd.notes) ||
    'ألبوم منفرد';
  const duration =
    isSegment
      ? Math.max(1, (songToAdd as TrackSegment).endTime - (songToAdd as TrackSegment).startTime)
      : (songToAdd as AudioTrack).duration || 180;
  const startTime = isSegment ? (songToAdd as TrackSegment).startTime : 0;
  const endTime = isSegment ? (songToAdd as TrackSegment).endTime : duration;
  const trackId = 'trackId' in songToAdd ? (songToAdd as TrackSegment).trackId : (songToAdd as AudioTrack).id;
  const segmentId = isSegment ? (songToAdd as TrackSegment).id : undefined;
  const color = 'color' in songToAdd ? (songToAdd as TrackSegment).color : undefined;
  const coverArt = 'coverArt' in songToAdd ? (songToAdd as AudioTrack).coverArt : undefined;
  const src = 'src' in songToAdd ? (songToAdd as AudioTrack).src : '';

  const itemPayload: Omit<PlaylistItem, 'id' | 'addedAt'> = {
    trackId,
    segmentId,
    title,
    artist,
    album,
    duration,
    startTime,
    endTime,
    src,
    coverArt,
    color,
  };

  const handleSelect = (playlistId: string) => {
    onAddToPlaylist(playlistId, itemPayload);
    setAddedPlaylistId(playlistId);
    setTimeout(() => {
      setAddedPlaylistId(null);
      onClose();
    }, 900);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylistAndAdd(newPlaylistName.trim(), itemPayload);
    setNewPlaylistName('');
    setIsCreatingNew(false);
    onClose();
  };

  return (
    <div
      id="add-to-playlist-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      dir="rtl"
    >
      <div
        id="add-to-playlist-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">إضافة إلى قائمة تشغيل</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                {title} • {artist}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Playlists list */}
        {!isCreatingNew ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">اختر قائمة التشغيل:</span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                قائمة تشغيل جديدة
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-0.5">
              {playlists.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
                  لا توجد قوائم تشغيل حالياً.
                  <br />
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="mt-2 text-indigo-400 hover:underline font-bold"
                  >
                    أنشئ أول قائمة تشغيل الآن
                  </button>
                </div>
              ) : (
                playlists.map((pl) => {
                  const alreadyInPlaylist = pl.items.some(
                    (it) =>
                      (segmentId && it.segmentId === segmentId) ||
                      (!segmentId && it.trackId === trackId && !it.segmentId)
                  );
                  const isJustAdded = addedPlaylistId === pl.id;

                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => handleSelect(pl.id)}
                      disabled={isJustAdded}
                      className={`w-full p-3 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                        isJustAdded
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                            pl.colorGradient || 'from-indigo-600 to-indigo-800'
                          } flex items-center justify-center text-white shrink-0 text-xs font-bold`}
                        >
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{pl.name}</h4>
                          <span className="text-[10px] text-slate-400">
                            {pl.items.length} أغاني
                            {alreadyInPlaylist && ' • موجودة بالفعل'}
                          </span>
                        </div>
                      </div>

                      {isJustAdded ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <Check className="w-4 h-4" />
                          تمت الإضافة!
                        </div>
                      ) : alreadyInPlaylist ? (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          إضافة مكررة +
                        </span>
                      ) : (
                        <span className="text-xs text-indigo-400 font-bold group-hover:translate-x-[-2px] transition-transform">
                          + إضافة
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Create new playlist form */
          <form onSubmit={handleCreateAndAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم قائمة التشغيل الجديدة:
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="مثلاً: أغاني السفر، جلسة روقان..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                رجوع للقوائم
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="text-xs px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold transition-colors shadow-md shadow-indigo-600/20"
              >
                إنشاء وإضافة الأغنية
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
