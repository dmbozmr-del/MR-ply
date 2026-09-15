import React, { useState } from 'react';
import { Folder, FolderOpen, Music, Play, ChevronLeft, ArrowRight } from 'lucide-react';
import { UnifiedSongItem } from '../types';
import { formatTime } from '../utils/formatters';

interface LarkFolderViewProps {
  songs: UnifiedSongItem[];
  activeSongId: string | null;
  isPlaying: boolean;
  onPlaySong: (song: UnifiedSongItem) => void;
  onPlayFolderAll: (folderSongs: UnifiedSongItem[]) => void;
  onOpenImporter?: () => void;
}

export const LarkFolderView: React.FC<LarkFolderViewProps> = ({
  songs,
  activeSongId,
  isPlaying,
  onPlaySong,
  onPlayFolderAll,
  onOpenImporter,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Group songs by folder
  const folderMap = new Map<string, UnifiedSongItem[]>();

  songs.forEach((song) => {
    const folderName = song.folder || 'موسيقى الهاتف';
    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, []);
    }
    folderMap.get(folderName)!.push(song);
  });

  const folderList = Array.from(folderMap.entries()).map(([folderName, folderSongs]) => ({
    name: folderName,
    songs: folderSongs,
    totalDuration: folderSongs.reduce((acc, s) => acc + s.duration, 0),
  }));

  if (folderList.length === 0) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto text-center animate-fadeIn" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 mb-4">
          <Folder className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          لا توجد مجلدات صوتية مضافة بعد
        </h3>
        <p className="text-xs text-stone-400 mb-5 leading-relaxed">
          يمكنك استيراد مجلد موسيقى كامل من ذاكرة هاتفك (مثل Downloads أو Music) لتصفح الأغاني حسب مجلداتها.
        </p>
        {onOpenImporter && (
          <button
            type="button"
            onClick={onOpenImporter}
            className="py-3 px-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>استيراد مجلد من الهاتف 📁</span>
          </button>
        )}
      </div>
    );
  }

  // If a folder is opened, show its songs list
  if (selectedFolder) {
    const currentFolderSongs = folderMap.get(selectedFolder) || [];

    return (
      <div className="space-y-4 pb-24" dir="rtl">
        {/* Back to folders header */}
        <div className="flex items-center justify-between p-4 bg-[#211b16] rounded-2xl border border-stone-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedFolder(null)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
              title="الرجوع إلى المجلدات"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <span>{selectedFolder}</span>
              </h3>
              <p className="text-xs text-stone-400">
                {currentFolderSongs.length} أغنية ومقطع •{' '}
                {formatTime(
                  currentFolderSongs.reduce((acc, s) => acc + s.duration, 0)
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPlayFolderAll(currentFolderSongs)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>تشغيل الكل</span>
          </button>
        </div>

        {/* Songs inside this folder */}
        <div className="space-y-1">
          {currentFolderSongs.map((song) => {
            const isCurrent = activeSongId === song.id || activeSongId === song.trackId;
            return (
              <div
                key={song.id}
                onClick={() => onPlaySong(song)}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-orange-950/30 border border-orange-500/40 text-orange-400'
                    : 'bg-[#1b1612]/60 hover:bg-[#251e18] text-stone-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-[#28211b] overflow-hidden shrink-0 flex items-center justify-center text-stone-400">
                    {song.coverArt ? (
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Music className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-bold truncate">{song.title}</h5>
                    <p className="text-xs text-stone-400 truncate">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-400">
                    {formatTime(song.duration)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-stone-800/60 flex items-center justify-center text-stone-300">
                    {isCurrent && isPlaying ? (
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Folder Grid / List View
  return (
    <div className="space-y-3 pb-24" dir="rtl">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-bold text-stone-300 flex items-center gap-2">
          <Folder className="w-4 h-4 text-amber-500" />
          <span>مجلدات الجهاز ({folderList.length})</span>
        </h3>
        <span className="text-xs text-stone-500">منظم حسب المسار والمجلد</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {folderList.map((folder) => (
          <div
            key={folder.name}
            onClick={() => setSelectedFolder(folder.name)}
            className="p-4 rounded-2xl bg-[#1d1814] hover:bg-[#27201b] border border-stone-800/80 hover:border-orange-500/40 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                <Folder className="w-6 h-6 fill-amber-500/20" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white group-hover:text-orange-400 truncate">
                  {folder.name}
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  {folder.songs.length} أغنية • {formatTime(folder.totalDuration)}
                </p>
              </div>
            </div>

            <ChevronLeft className="w-5 h-5 text-stone-500 group-hover:text-orange-400 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};
