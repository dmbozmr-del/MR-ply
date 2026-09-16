import React, { useState } from 'react';
import {
  Music,
  Play,
  Pause,
  MoreVertical,
  Star,
  Plus,
  Scissors,
  Download,
  Info,
  Disc3,
  Share2,
  Smartphone,
  FolderPlus,
  Mic,
  Music2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Tag,
  Edit2,
} from 'lucide-react';
import { UnifiedSongItem, AudioTrack, TrackSegment } from '../types';
import { formatTime } from '../utils/formatters';

interface LarkSongListProps {
  songs: UnifiedSongItem[];
  activeSongId: string | null;
  isPlaying: boolean;
  onPlaySong: (song: UnifiedSongItem) => void;
  onToggleFavorite: (trackId: string, segmentId?: string) => void;
  onOpenAddToPlaylist: (song: UnifiedSongItem) => void;
  onOpenSlicerForSong: (song: UnifiedSongItem) => void;
  onDownloadSegment?: (segment: TrackSegment, parentTrack: AudioTrack) => void;
  onEditSegment?: (segment: TrackSegment, parentSong: UnifiedSongItem) => void;
  onOpenImporter?: () => void;
  onLoadDemoSample?: () => void;
}

export const LarkSongList: React.FC<LarkSongListProps> = ({
  songs,
  activeSongId,
  isPlaying,
  onPlaySong,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onOpenSlicerForSong,
  onDownloadSegment,
  onEditSegment,
  onOpenImporter,
  onLoadDemoSample,
}) => {
  const [menuSongId, setMenuSongId] = useState<string | null>(null);
  const [expandedSongIds, setExpandedSongIds] = useState<Set<string>>(new Set());

  const toggleExpandSong = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  if (songs.length === 0) {
    return (
      <div className="py-8 sm:py-12 px-4 max-w-lg mx-auto text-center animate-fadeIn" dir="rtl">
        {/* MR Monogram Badge */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 p-1 shadow-xl shadow-orange-600/30 flex items-center justify-center mx-auto mb-5">
          <div className="w-full h-full bg-[#1b140f] rounded-[22px] flex items-center justify-center border border-orange-500/30 relative overflow-hidden">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-orange-400 to-amber-300 font-sans">
              MR
            </span>
            <div className="absolute bottom-2 flex items-end gap-1 h-2 opacity-70">
              <div className="w-1 h-2 bg-orange-400 rounded-full" />
              <div className="w-1 h-3 bg-amber-400 rounded-full" />
              <div className="w-1 h-1.5 bg-orange-500 rounded-full" />
            </div>
          </div>
        </div>

        <h3 className="text-xl font-black text-white mb-2">
          مرحباً بك في تطبيق MR
        </h3>
        <p className="text-sm text-stone-300 mb-6 leading-relaxed max-w-md mx-auto">
          التطبيق مخصص لتشغيل أغانيك وتسجيلاتك الصوتية المخزنة على هاتفك مباشرة وبدون أي أغانٍ محملة مسبقاً.
        </p>

        {/* Primary Phone Action Buttons */}
        <div className="space-y-3 mb-6">
          {onOpenImporter && (
            <button
              type="button"
              onClick={onOpenImporter}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-l from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black text-base shadow-xl shadow-orange-600/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 border border-orange-400/30"
            >
              <Smartphone className="w-5 h-5 text-amber-200" />
              <span>اختيار أغانٍ وتسجيلات من هاتفك 📱</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {onOpenImporter && (
              <button
                type="button"
                onClick={onOpenImporter}
                className="py-3 px-3 rounded-xl bg-[#221a14] hover:bg-[#2d221b] text-stone-200 hover:text-white font-bold text-xs transition-colors border border-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>استيراد مجلد كامل</span>
              </button>
            )}

            {onOpenImporter && (
              <button
                type="button"
                onClick={onOpenImporter}
                className="py-3 px-3 rounded-xl bg-[#221a14] hover:bg-[#2d221b] text-stone-200 hover:text-white font-bold text-xs transition-colors border border-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-orange-400" />
                <span>تسجيل بالمايكروفون</span>
              </button>
            )}
          </div>
        </div>

        {/* Features for phone */}
        <div className="bg-[#19130f] border border-[#2e231b] rounded-2xl p-4 text-right space-y-2.5 text-xs text-stone-400">
          <div className="text-[11px] font-bold text-stone-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>مميزات تطبيق MR على الهاتف:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>تشغيل كافة صيغ الصوت (MP3, M4A, WAV, AAC, FLAC, وتسجيلات الهاتف).</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>تحكم كامل من شاشة قفل الهاتف والإشعارات (MediaSession).</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>تقسيم التسجيلات الطويلة إلى أغانٍ مستقلة وصنع نغمات رنين مخصصة.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>حفظ ملفاتك وقوائمك محلياً على جهازك دون حاجة للإنترنت.</span>
          </div>
        </div>

        {/* Optional Demo Loader */}
        {onLoadDemoSample && (
          <div className="mt-6 pt-4 border-t border-stone-800/80">
            <button
              type="button"
              onClick={onLoadDemoSample}
              className="text-xs text-stone-400 hover:text-orange-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              أو انقر هنا لتجربة ملف تسجيل تجريبي (0309_260426) للتأكد من عمل الصوت
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 sm:space-y-1.5 pb-24" dir="rtl">
      {songs.map((song) => {
        const isCurrent =
          activeSongId === song.id ||
          (song.segmentId && activeSongId === `seg-${song.segmentId}`) ||
          (!song.segmentId && activeSongId === song.trackId) ||
          activeSongId === song.trackId;

        const isRowPlaying = isCurrent && isPlaying;

        return (
          <React.Fragment key={song.id}>
            <div
              id={`lark-song-row-${song.id}`}
            onClick={() => onPlaySong(song)}
            className={`group relative px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 select-none ${
              isCurrent
                ? 'bg-orange-950/30 border border-orange-500/40 shadow-md ring-1 ring-orange-500/20'
                : 'hover:bg-[#231e19]/80 border border-transparent'
            }`}
          >
            {/* Right Side: Artwork Thumbnail + Info (RTL) */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Thumbnail matching Lark Player's style */}
              <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 bg-[#25201b] border border-stone-800 flex items-center justify-center shadow-xs">
                {song.coverArt ? (
                  <img
                    src={song.coverArt}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2a241e] flex items-center justify-center text-stone-500">
                    <Music className="w-6 h-6 stroke-[1.5]" />
                  </div>
                )}

                {/* Animated live equalizer overlay bars if currently playing */}
                {isRowPlaying ? (
                  <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-2 gap-0.5">
                    <span className="w-1 bg-orange-400 rounded-full animate-[bounce_0.6s_infinite_ease-in-out] h-4" />
                    <span className="w-1 bg-orange-300 rounded-full animate-[bounce_0.8s_infinite_ease-in-out] h-6" />
                    <span className="w-1 bg-orange-400 rounded-full animate-[bounce_0.5s_infinite_ease-in-out] h-3" />
                    <span className="w-1 bg-orange-500 rounded-full animate-[bounce_0.7s_infinite_ease-in-out] h-5" />
                  </div>
                ) : (
                  /* Subtle play overlay on hover */
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-5 h-5 text-white fill-current translate-x-[-1px]" />
                  </div>
                )}
              </div>

              {/* Title and Subtitle line */}
              <div className="min-w-0 flex-1">
                {/* Title */}
                <h4
                  className={`text-sm sm:text-base font-bold truncate leading-snug ${
                    isCurrent ? 'text-orange-400' : 'text-stone-100 group-hover:text-white'
                  }`}
                >
                  {song.title}
                </h4>

                {/* Subtitle Line: Tags / Lyrics pill / Artist / Folder */}
                <div className="flex items-center gap-2 text-xs text-stone-400 mt-1 flex-wrap">
                  {/* Lyrics badge (الكلمات) as seen in user's screenshot */}
                  {song.hasLyrics && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-stone-600/80 text-stone-300 bg-stone-900/60 leading-none">
                      الكلمات
                    </span>
                  )}

                  {/* Artist / Author */}
                  <span className="truncate max-w-[200px] text-stone-300 font-medium">
                    {song.artist}
                  </span>

                  {/* Folder / Album tag if present */}
                  {song.folder && (
                    <>
                      <span className="text-stone-600">•</span>
                      <span className="text-stone-400 truncate max-w-[140px]">
                        {song.folder}
                      </span>
                    </>
                  )}

                  {/* Duration */}
                  <span className="text-stone-600">•</span>
                  <span className="font-mono text-[11px] text-stone-400">
                    {formatTime(song.duration)}
                  </span>

                  {/* Segments inside song badge */}
                  {Boolean(song.segmentsCount && song.segmentsCount > 0) && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpandSong(song.id, e)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-950/60 hover:bg-orange-900/80 text-orange-400 border border-orange-600/40 transition-colors cursor-pointer"
                      title="عرض الأجزاء المقسمة داخل الأغنية"
                    >
                      <Layers className="w-3 h-3 text-orange-400" />
                      <span>{song.segmentsCount} أجزاء</span>
                      {expandedSongIds.has(song.id) ? (
                        <ChevronUp className="w-3 h-3 text-orange-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-orange-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Left Side: Playing Indicator (Equalizer) & Options 3-Dots Menu */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Playing equalizing icon in orange */}
              {isRowPlaying && (
                <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <span className="w-1 h-3 bg-orange-500 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-orange-400 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-orange-500 rounded-full animate-pulse delay-150" />
                </div>
              )}

              {/* Favorite Quick Heart */}
              <button
                type="button"
                onClick={() => onToggleFavorite(song.trackId, song.segmentId)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  song.isFavorite
                    ? 'text-orange-400 hover:text-orange-300'
                    : 'text-stone-600 hover:text-stone-300'
                }`}
                title={song.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                <Star className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Three Dots More Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuSongId(menuSongId === song.id ? null : song.id)}
                  className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-[#2c241d] transition-colors cursor-pointer"
                  title="خيارات إضافية"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Context Menu Dropdown */}
                {menuSongId === song.id && (
                  <div
                    className="absolute left-0 top-full mt-1 w-52 bg-[#1f1915] border border-stone-700/80 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onPlaySong(song);
                        setMenuSongId(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-stone-200 hover:bg-[#2c241e] hover:text-orange-400 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>تشغيل الأغنية</span>
                    </button>

                    {Boolean(song.segmentsCount && song.segmentsCount > 0) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          toggleExpandSong(song.id, e);
                          setMenuSongId(null);
                        }}
                        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-stone-200 hover:bg-[#2c241e] hover:text-orange-400 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5 text-orange-400" />
                        <span>الأجزاء داخل الأغنية ({song.segmentsCount})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onOpenAddToPlaylist(song);
                        setMenuSongId(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-stone-200 hover:bg-[#2c241e] hover:text-orange-400 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة إلى قائمة تشغيل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenSlicerForSong(song);
                        setMenuSongId(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-stone-200 hover:bg-[#2c241e] hover:text-orange-400 transition-colors"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>تقطيع وتقسيم داخل الأغنية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleFavorite(song.trackId, song.segmentId);
                        setMenuSongId(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-stone-200 hover:bg-[#2c241e] hover:text-orange-400 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>{song.isFavorite ? 'إزالة من المفضلة' : 'تمييز كمفضلة'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Internal Segments Accordion (أجزاء داخل الأغنية دون فصلها خارج الأغنية) */}
          {expandedSongIds.has(song.id) && Boolean(song.segments && song.segments.length > 0) && (
            <div
              className="mr-8 sm:mr-16 ml-2 sm:ml-4 mb-3 p-3 rounded-2xl bg-[#1a1410] border border-[#38281d] space-y-2 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-[11px] text-stone-400 px-2 pb-1.5 border-b border-stone-800/80 font-bold">
                <span className="flex items-center gap-1.5 text-orange-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>الأجزاء المقسمة داخل الأغنية ({song.segments!.length}):</span>
                </span>
                <span className="text-[10px] text-stone-500">انقر للتشغيل أو التنقل الفوري</span>
              </div>

              <div className="space-y-1">
                {song.segments!.map((seg, idx) => {
                  const isThisSegActive =
                    isPlaying && activeSongId === `seg-${seg.id}`;

                  return (
                    <div
                      key={seg.id}
                      onClick={() =>
                        onPlaySong({
                          ...song,
                          type: 'segment',
                          segmentId: seg.id,
                          title: seg.title,
                          startTime: seg.startTime,
                          endTime: seg.endTime,
                          duration: Math.max(1, seg.endTime - seg.startTime),
                        })
                      }
                      className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs select-none ${
                        isThisSegActive
                          ? 'bg-orange-950/60 text-orange-400 border border-orange-500/40'
                          : 'hover:bg-[#261d16] text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold truncate">{seg.title}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-stone-400">
                          {formatTime(seg.startTime)} ⟷ {formatTime(seg.endTime)}
                        </span>
                        {onEditSegment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSegment(seg, song);
                            }}
                            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-orange-600/30 text-stone-400 hover:text-orange-300 flex items-center justify-center transition-colors cursor-pointer"
                            title="تعديل هذا المقطع ونطاقه الزمني"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            isThisSegActive
                              ? 'bg-orange-500 text-white'
                              : 'bg-stone-800 text-stone-300 hover:bg-orange-600 hover:text-white'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </React.Fragment>
        );
      })}
    </div>
  );
};
