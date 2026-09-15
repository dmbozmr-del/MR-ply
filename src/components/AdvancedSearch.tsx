import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Music,
  Disc3,
  Clock,
  Star,
  Play,
  Pause,
  Plus,
  Filter,
  Download,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';
import { UnifiedSongItem, SortField, SortOrder, TrackSegment, AudioTrack } from '../types';
import { formatTime } from '../utils/formatters';

interface AdvancedSearchProps {
  tracks: AudioTrack[];
  activeSongId: string | null;
  isPlaying: boolean;
  onPlaySong: (song: UnifiedSongItem) => void;
  onToggleFavorite: (trackId: string, segmentId?: string) => void;
  onOpenAddToPlaylist: (song: UnifiedSongItem) => void;
  onDownloadSegment?: (segment: TrackSegment, parentTrack: AudioTrack) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  tracks,
  activeSongId,
  isPlaying,
  onPlaySong,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onDownloadSegment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeFilter, setActiveFilter] = useState<'all' | 'segments' | 'tracks' | 'favorites'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Flatten all audio sources: both full tracks and segments into a unified list
  const allSongs: UnifiedSongItem[] = useMemo(() => {
    const list: UnifiedSongItem[] = [];

    tracks.forEach((track) => {
      // 1. Add full track
      list.push({
        id: `track-${track.id}`,
        type: 'fullTrack',
        trackId: track.id,
        title: track.title,
        artist: track.artist || 'فنان غير محدد',
        album: track.album || track.title,
        duration: track.duration || 180,
        startTime: 0,
        endTime: track.duration || 180,
        src: track.src,
        coverArt: track.coverArt,
        tags: ['تسجيل كامل'],
        isFavorite: false,
        addedAt: track.addedAt,
      });

      // 2. Add each segment identified inside this track
      track.segments.forEach((seg) => {
        list.push({
          id: `seg-${seg.id}`,
          type: 'segment',
          trackId: track.id,
          segmentId: seg.id,
          title: seg.title,
          artist: seg.artist || track.artist || 'فنان غير محدد',
          album: seg.album || track.album || track.title,
          duration: Math.max(1, seg.endTime - seg.startTime),
          startTime: seg.startTime,
          endTime: seg.endTime,
          src: track.src,
          coverArt: track.coverArt,
          color: seg.color,
          tags: seg.tags,
          notes: seg.notes,
          isFavorite: seg.isFavorite,
          addedAt: seg.createdAt,
        });
      });
    });

    return list;
  }, [tracks]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    allSongs.forEach((song) => {
      song.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [allSongs]);

  // Filter and sort songs
  const filteredAndSortedSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Filtering
    const filtered = allSongs.filter((song) => {
      // Text search in title, artist, album, tags, notes
      const matchesText =
        !q ||
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q) ||
        (song.notes && song.notes.toLowerCase().includes(q)) ||
        (song.tags && song.tags.some((t) => t.toLowerCase().includes(q)));

      // Type / Status filter
      let matchesType = true;
      if (activeFilter === 'segments') matchesType = song.type === 'segment';
      if (activeFilter === 'tracks') matchesType = song.type === 'fullTrack';
      if (activeFilter === 'favorites') matchesType = !!song.isFavorite;

      // Tag filter
      const matchesTag = !selectedTag || (song.tags && song.tags.includes(selectedTag));

      return matchesText && matchesType && matchesTag;
    });

    // Sorting according to user's criteria: Title, Artist, Album, Duration
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'ar', { sensitivity: 'base' });
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist, 'ar', { sensitivity: 'base' });
          break;
        case 'album':
          comparison = a.album.localeCompare(b.album, 'ar', { sensitivity: 'base' });
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allSongs, searchQuery, sortField, sortOrder, activeFilter, selectedTag]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div id="advanced-search-module" className="space-y-4" dir="rtl">
      {/* Header and Search Controls Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              البحث المتقدم وفرز الأغاني
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {filteredAndSortedSongs.length} أغنية
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ابحث بسهولة عبر العنوان أو الفنان أو الألبوم وقم بفرز النتائج حسب رغبتك
            </p>
          </div>

          {/* Quick stats / pill */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
              إجمالي التسجيلات والمقاطع: <strong className="text-white">{allSongs.length}</strong>
            </span>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="advanced-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، الفنان، الألبوم، أو الكلمات الدلالية..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sorting Controls & Category Filters Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-2">
          {/* Sorting Dropdown & Order Toggle (العنوان، الفنان، الألبوم، المدة) */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              الفرز حسب:
            </span>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="sort-by-title-btn"
                type="button"
                onClick={() => setSortField('title')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  sortField === 'title'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                العنوان
              </button>
              <button
                id="sort-by-artist-btn"
                type="button"
                onClick={() => setSortField('artist')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  sortField === 'artist'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الفنان
              </button>
              <button
                id="sort-by-album-btn"
                type="button"
                onClick={() => setSortField('album')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  sortField === 'album'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الألبوم
              </button>
              <button
                id="sort-by-duration-btn"
                type="button"
                onClick={() => setSortField('duration')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  sortField === 'duration'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                المدة
              </button>
            </div>

            {/* Ascending / Descending Toggle */}
            <button
              id="toggle-sort-order-btn"
              type="button"
              onClick={toggleSortOrder}
              className="p-1.5 px-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title={sortOrder === 'asc' ? 'ترتيب تصاعدي (أ ⟵ ي)' : 'ترتيب تنازلي (ي ⟵ أ)'}
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">تصاعدي</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">تنازلي</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Filter Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-[11px] ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('segments')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-[11px] ${
                activeFilter === 'segments'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              الأغاني المقطعة
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('tracks')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-[11px] ${
                activeFilter === 'tracks'
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              التسجيلات الطويلة
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('favorites')}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-[11px] flex items-center gap-1 ${
                activeFilter === 'favorites'
                  ? 'bg-amber-600 text-white border-amber-500 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Star className="w-3 h-3 fill-current text-amber-400" />
              المفضلة
            </button>
          </div>
        </div>

        {/* Tag chips row if available */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-800/60 pb-1 text-xs">
            <span className="text-[11px] text-slate-500 shrink-0">الوسوم:</span>
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-md text-[10px] transition-colors cursor-pointer whitespace-nowrap ${
                selectedTag === null ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-md text-[10px] border transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Songs List */}
      {filteredAndSortedSongs.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 mb-1">لم يتم العثور على نتائج</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            جرب كتابة كلمات بحث أخرى أو تغيير خيارات الفرز والتصفية في الأعلى
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAndSortedSongs.map((song, index) => {
            const isSongActive =
              activeSongId === song.id ||
              (song.segmentId && activeSongId === `seg-${song.segmentId}`) ||
              (!song.segmentId && activeSongId === song.trackId);

            return (
              <div
                key={song.id}
                id={`search-item-${song.id}`}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSongActive
                    ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-900 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Left side: Artwork & Track details */}
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  {/* Song thumbnail or color marker */}
                  <div className="relative shrink-0">
                    {song.coverArt ? (
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: song.color || '#6366f1' }}
                      >
                        <Music className="w-5 h-5" />
                      </div>
                    )}

                    {/* Quick play overlay button */}
                    <button
                      type="button"
                      onClick={() => onPlaySong(song)}
                      className={`absolute inset-0 m-auto w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md ${
                        isSongActive && isPlaying
                          ? 'bg-indigo-600 text-white'
                          : 'bg-black/70 hover:bg-indigo-600 text-white'
                      }`}
                      title={isSongActive && isPlaying ? 'إيقاف مؤقت' : 'تشغيل الآن'}
                    >
                      {isSongActive && isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current translate-x-[-1px]" />
                      )}
                    </button>
                  </div>

                  {/* Title, Artist, Album, Duration */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100 truncate">{song.title}</h4>
                      {song.isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="text-indigo-300 font-medium truncate">{song.artist}</span>

                      {/* Album badge */}
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 max-w-[180px] truncate">
                        <Disc3 className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{song.album}</span>
                      </span>

                      {/* Duration */}
                      <span className="flex items-center gap-1 font-mono text-[11px] text-amber-300">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatTime(song.duration)}
                      </span>

                      {/* Tag pill */}
                      {song.type === 'segment' ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          مقطع مقطع
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          تسجيل كامل
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Interactive Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {/* Add to Playlist Button */}
                  <button
                    id={`add-to-playlist-btn-${song.id}`}
                    type="button"
                    onClick={() => onOpenAddToPlaylist(song)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700 hover:border-indigo-500/50 text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="إضافة إلى قائمة تشغيل مخصصة"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">قائمة تشغيل</span>
                  </button>

                  {/* Favorite Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(song.trackId, song.segmentId)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      song.isFavorite
                        ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700'
                    }`}
                    title="إضافة للمفضلة"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Download Slice if it's a segment */}
                  {song.type === 'segment' && onDownloadSegment && (
                    <button
                      type="button"
                      onClick={() => {
                        const parent = tracks.find((t) => t.id === song.trackId);
                        const seg = parent?.segments.find((s) => s.id === song.segmentId);
                        if (seg && parent) onDownloadSegment(seg, parent);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      title="تحميل المقطع كملف صوتي WAV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
