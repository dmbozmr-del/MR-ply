import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Repeat,
  Download,
  Trash2,
  Edit2,
  Star,
  Search,
  Share2,
  FileSpreadsheet,
  Copy,
  Check,
  Music,
  Clock,
  Sparkles,
  ListPlus,
} from 'lucide-react';
import { TrackSegment } from '../types';
import { formatTime, exportYouTubeTimestamps, exportCueSheet } from '../utils/formatters';

interface TrackListProps {
  segments: TrackSegment[];
  activeSegmentId: string | null;
  isPlaying: boolean;
  isLoopingSegment: boolean;
  trackTitle: string;
  artistTitle: string;
  onPlaySegment: (segment: TrackSegment) => void;
  onToggleLoopSegment: () => void;
  onEditSegment: (segment: TrackSegment) => void;
  onDeleteSegment: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDownloadSegment: (segment: TrackSegment) => void;
  onOpenExportModal: () => void;
  onOpenAddToPlaylist?: (segment: TrackSegment) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  segments,
  activeSegmentId,
  isPlaying,
  isLoopingSegment,
  trackTitle,
  artistTitle,
  onPlaySegment,
  onToggleLoopSegment,
  onEditSegment,
  onDeleteSegment,
  onToggleFavorite,
  onDownloadSegment,
  onOpenExportModal,
  onOpenAddToPlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedTimestamps, setCopiedTimestamps] = useState(false);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    segments.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [segments]);

  // Filtered segments
  const filteredSegments = useMemo(() => {
    return segments.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || s.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [segments, searchQuery, selectedTag]);

  // Copy YouTube timestamps to clipboard
  const handleCopyTimestamps = () => {
    const text = exportYouTubeTimestamps(segments);
    navigator.clipboard.writeText(text);
    setCopiedTimestamps(true);
    setTimeout(() => setCopiedTimestamps(false), 2000);
  };

  return (
    <div
      id="identified-tracks-list"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl"
    >
      {/* List Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              الأغاني والمقاطع المحددة
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {segments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              يمكنك تشغيل أي مقطع بشكل منفصل، تكراره، أو تنزيله كملف صوتي خاص به
            </p>
          </div>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="copy-youtube-timestamps-btn"
            type="button"
            onClick={handleCopyTimestamps}
            disabled={segments.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="نسخ توقيتات الأغاني بتنسيق فصول اليوتيوب"
          >
            {copiedTimestamps ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                تم النسخ!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                نسخ التوقيتات (YouTube)
              </>
            )}
          </button>

          <button
            id="open-export-modal-btn"
            type="button"
            onClick={onOpenExportModal}
            disabled={segments.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="تصدير بصيغ CUE أو JSON أو ملفات"
          >
            <Share2 className="w-3.5 h-3.5" />
            خيارات التصدير
          </button>
        </div>
      </div>

      {/* Search & Tag Filter */}
      {segments.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في الأغاني المحددة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-[11px] ${
                  selectedTag === null
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                الكل
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-[11px] ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {segments.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 mb-1">
            لم يتم تحديد أغاني بعد من هذا الملف الصوتي
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            استمع للأغنية الطويلة، وعندما تبدأ الأغنية المطلوبة اضغط &quot;تعيين بداية [A]&quot; وعند نهايتها اضغط &quot;تعيين نهاية [B]&quot; ثم اضغط تثبيت الأغنية.
          </p>
        </div>
      ) : filteredSegments.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          لا توجد نتائج تطابق بحثك الحالي
        </div>
      ) : (
        /* Segments List */
        <div className="space-y-2.5">
          {filteredSegments.map((segment, index) => {
            const isActive = activeSegmentId === segment.id;
            const duration = Math.max(0, segment.endTime - segment.startTime);

            return (
              <div
                key={segment.id}
                id={`track-item-${segment.id}`}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                {/* Left side: Track details */}
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  {/* Track index badge - also clickable to play */}
                  <button
                    type="button"
                    onClick={() => onPlaySegment(segment)}
                    className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold font-mono text-white shadow-sm cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                    style={{ backgroundColor: segment.color }}
                    title={`تشغيل: ${segment.title}`}
                  >
                    {index + 1}
                  </button>

                  {/* Play snippet button */}
                  <button
                    type="button"
                    onClick={() => onPlaySegment(segment)}
                    className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                      isActive && isPlaying
                        ? 'bg-orange-500 text-white shadow-lg ring-2 ring-orange-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
                    }`}
                    title={isActive && isPlaying ? 'إيقاف مؤقت' : 'تشغيل هذه الأغنية فقط'}
                  >
                    {isActive && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-[-1px]" />
                    )}
                  </button>

                  {/* Segment title and details - clicking title plays the selected song */}
                  <div
                    className="min-w-0 flex-1 cursor-pointer group/title"
                    onClick={() => onPlaySegment(segment)}
                    title={`انقر لتشغيل: ${segment.title}`}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100 group-hover/title:text-orange-400 flex items-center gap-1.5 truncate transition-colors">
                        <Play className="w-3 h-3 text-orange-400 fill-current opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                        <span>{segment.title}</span>
                      </h4>
                      {segment.isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      {segment.artist && (
                        <span className="text-orange-300 font-medium truncate">
                          {segment.artist}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatTime(segment.startTime)} ⟷ {formatTime(segment.endTime)}
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-amber-300">
                        {formatTime(duration)}
                      </span>
                    </div>

                    {segment.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                        {segment.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  {/* Loop toggle for this segment */}
                  {isActive && (
                    <button
                      type="button"
                      onClick={onToggleLoopSegment}
                      className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isLoopingSegment
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="تكرار هذه الأغنية باستمرار (Loop)"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Download this sliced song */}
                  <button
                    type="button"
                    onClick={() => onDownloadSegment(segment)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="تنزيل هذه الأغنية كملف صوتي منفصل (WAV)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px]">تحميل المقطع</span>
                  </button>

                  {/* Add to playlist button */}
                  {onOpenAddToPlaylist && (
                    <button
                      type="button"
                      onClick={() => onOpenAddToPlaylist(segment)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:border-indigo-500/40 border border-slate-700 text-xs transition-colors cursor-pointer"
                      title="إضافة لقائمة تشغيل"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Edit range / metadata */}
                  <button
                    type="button"
                    onClick={() => onEditSegment(segment)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="تعديل النطاق أو اسم الأغنية"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Favorite toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(segment.id)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      segment.isFavorite
                        ? 'text-amber-400 bg-amber-950/40'
                        : 'text-slate-500 hover:text-slate-300 bg-slate-800'
                    }`}
                    title="إضافة للمفضلة"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Delete segment */}
                  <button
                    type="button"
                    onClick={() => onDeleteSegment(segment.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                    title="حذف هذا المقطع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
