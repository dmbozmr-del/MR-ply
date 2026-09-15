import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Plus,
  Play,
  RotateCcw,
  Check,
  Download,
  FileText,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SelectionRange, TrackSegment } from '../types';
import { formatTime, getSegmentColor, parseTimestampsText } from '../utils/formatters';

interface SegmentManagerProps {
  currentTime: number;
  duration: number;
  selectionRange: SelectionRange | null;
  segmentsCount: number;
  activeTrackTitle: string;
  onSetSelectionRange: (range: SelectionRange | null) => void;
  onPreviewSelection: (start: number, end: number) => void;
  onPreviewTransition: (type: 'start' | 'end') => void;
  onSaveSegment: (segment: Omit<TrackSegment, 'id' | 'createdAt'>) => void;
  onDownloadDirectSegment: (start: number, end: number, title: string) => void;
  onBatchImportSegments: (segments: TrackSegment[]) => void;
  trackId: string;
  isDownloading: boolean;
}

export const SegmentManager: React.FC<SegmentManagerProps> = ({
  currentTime,
  duration,
  selectionRange,
  segmentsCount,
  onSetSelectionRange,
  onPreviewSelection,
  onPreviewTransition,
  onSaveSegment,
  onDownloadDirectSegment,
  onBatchImportSegments,
  trackId,
  isDownloading,
}) => {
  // Local form state
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [tag, setTag] = useState('');
  const [notes, setNotes] = useState('');
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize or maintain range
  const start = selectionRange?.start ?? Math.max(0, currentTime);
  const end = selectionRange?.end ?? Math.min(duration || 100, Math.max(start + 180, currentTime + 180));
  const segmentDuration = Math.max(0, end - start);

  // Quick preset tags
  const presetTags = ['طرب', 'مقدمة', 'أغنية رئيسية', 'صولو', 'إيقاعات', 'خاتمة', 'ميدلي'];

  // Adjust times with micro-controls
  const adjustStart = (delta: number) => {
    const newStart = Math.max(0, Math.min(end - 0.5, start + delta));
    onSetSelectionRange({ start: newStart, end });
  };

  const adjustEnd = (delta: number) => {
    const newEnd = Math.max(start + 0.5, Math.min(duration || start + 1000, end + delta));
    onSetSelectionRange({ start, end: newEnd });
  };

  const setStartToCurrent = () => {
    const newStart = Math.min(currentTime, end - 0.5);
    onSetSelectionRange({ start: Math.max(0, newStart), end });
  };

  const setEndToCurrent = () => {
    const newEnd = Math.max(currentTime, start + 0.5);
    onSetSelectionRange({ start, end: Math.min(duration || newEnd, newEnd) });
  };

  // Handle saving new track
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = songTitle.trim() || `أغنية #${segmentsCount + 1}`;
    
    onSaveSegment({
      trackId,
      title: finalTitle,
      artist: artistName.trim(),
      startTime: start,
      endTime: end,
      color: getSegmentColor(segmentsCount),
      tags: tag ? [tag] : undefined,
      notes: notes.trim() || undefined,
    });

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);

    // Auto-prepare next track starting from previous end!
    setSongTitle('');
    setNotes('');
    const nextStart = end;
    const nextEnd = Math.min(duration, nextStart + 180);
    onSetSelectionRange({ start: nextStart, end: nextEnd });
  };

  // Handle YouTube batch import
  const handleBatchImport = () => {
    if (!batchText.trim()) return;
    const parsed = parseTimestampsText(batchText, duration, trackId);
    if (parsed.length > 0) {
      onBatchImportSegments(parsed);
      setShowBatchImport(false);
      setBatchText('');
    }
  };

  // Quick split by fixed interval (e.g. every 4 minutes)
  const handleQuickAutoSplit = (intervalMinutes: number) => {
    if (!duration || duration <= 0) return;
    const intervalSecs = intervalMinutes * 60;
    const count = Math.ceil(duration / intervalSecs);
    const newSegments: TrackSegment[] = [];

    for (let i = 0; i < count; i++) {
      const segStart = i * intervalSecs;
      const segEnd = Math.min(duration, (i + 1) * intervalSecs);
      newSegments.push({
        id: `auto-${Date.now()}-${i}`,
        trackId,
        title: `المقطع ${i + 1}`,
        artist: '',
        startTime: segStart,
        endTime: segEnd,
        color: getSegmentColor(i),
        createdAt: Date.now() + i,
      });
    }

    onBatchImportSegments(newSegments);
  };

  return (
    <div
      id="segment-manager-box"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              أداة تحديد وتقطيع الأغاني من الملف الطويل
              <span className="text-xs font-normal text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                دقة عالية
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              حدد نقطة البداية والنهاية لأي أغنية أو صولو، واكتب اسمها لحفظها أو تنزيلها كملف صوتي منفصل
            </p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-batch-import-btn"
            type="button"
            onClick={() => setShowBatchImport(!showBatchImport)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            استيراد فصول نصية / يوتيوب
          </button>
        </div>
      </div>

      {/* Batch Import Collapsible Panel */}
      {showBatchImport && (
        <div className="mb-5 p-4 rounded-xl bg-slate-950 border border-slate-800 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              لصق فصول أو توقيتات الأغاني (YouTube / Mixcloud Timestamps)
            </span>
            <button
              type="button"
              onClick={() => setShowBatchImport(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              إلغاء
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            الصق النص بالتوقيتات (مثال: <code className="text-indigo-300 font-mono">03:45 أغنية البداية - الفنان</code>)، وسيتعرف النظام عليها تلقائياً:
          </p>
          <textarea
            id="batch-timestamps-input"
            rows={4}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={`00:00 المقدمة والتقاسيم\n04:15 الأغنية الأولى - الفنان\n12:30 الأغنية الثانية\n22:10 الخاتمة`}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>أو تقسيم تلقائي كل:</span>
              {[3, 5, 10].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleQuickAutoSplit(mins)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 cursor-pointer"
                >
                  {mins} دقائق
                </button>
              ))}
            </div>
            <button
              id="apply-batch-import-btn"
              type="button"
              onClick={handleBatchImport}
              disabled={!batchText.trim()}
              className="text-xs px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 transition-colors cursor-pointer"
            >
              تطبيق وتقسيم الملف
            </button>
          </div>
        </div>
      )}

      {/* Main Dual-Marker (A & B) Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Point A (Start) Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              نقطة البداية [A]
            </span>
            <span className="text-base font-mono font-bold text-white bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
              {formatTime(start, true)}
            </span>
          </div>

          <button
            id="set-start-here-btn"
            type="button"
            onClick={setStartToCurrent}
            className="w-full mb-3 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            تثبيت البداية عند موضع الاستماع الحالي ({formatTime(currentTime)})
          </button>

          {/* Micro-adjust buttons */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="text-[10px]">ضبط دقيق:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustStart(-1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تأخير ثانية"
              >
                -1s
              </button>
              <button
                type="button"
                onClick={() => adjustStart(-0.1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تأخير 0.1 ثانية"
              >
                -0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustStart(0.1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تقديم 0.1 ثانية"
              >
                +0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustStart(1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تقديم ثانية"
              >
                +1s
              </button>
            </div>
          </div>
        </div>

        {/* Point B (End) Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              نقطة النهاية [B]
            </span>
            <span className="text-base font-mono font-bold text-white bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
              {formatTime(end, true)}
            </span>
          </div>

          <button
            id="set-end-here-btn"
            type="button"
            onClick={setEndToCurrent}
            className="w-full mb-3 py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            تثبيت النهاية عند موضع الاستماع الحالي ({formatTime(currentTime)})
          </button>

          {/* Micro-adjust buttons */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="text-[10px]">ضبط دقيق:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustEnd(-1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تأخير ثانية"
              >
                -1s
              </button>
              <button
                type="button"
                onClick={() => adjustEnd(-0.1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تأخير 0.1 ثانية"
              >
                -0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustEnd(0.1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تقديم 0.1 ثانية"
              >
                +0.1s
              </button>
              <button
                type="button"
                onClick={() => adjustEnd(1)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer font-mono"
                title="تقديم ثانية"
              >
                +1s
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Duration & Previews Bar */}
      <div className="mb-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">طول الأغنية المحددة:</span>
          <button
            type="button"
            onClick={() => onPreviewSelection(start, end)}
            className="text-sm font-bold font-mono text-amber-400 hover:text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="انقر لتشغيل المقطع المحدد الآن"
          >
            <Play className="w-3 h-3 fill-current text-amber-400" />
            <span>{formatTime(segmentDuration)} ({Math.round(segmentDuration)} ثانية)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Preview Full Snippet */}
          <button
            id="preview-snippet-btn"
            type="button"
            onClick={() => onPreviewSelection(start, end)}
            className="text-xs px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            تشغيل المقطع المحدد
          </button>

          {/* Preview Intro (first 5 seconds) */}
          <button
            id="preview-intro-btn"
            type="button"
            onClick={() => onPreviewTransition('start')}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="الاستماع لأول 5 ثواني للتأكد من بداية الأغنية"
          >
            أول 5 ثوانٍ
          </button>

          {/* Preview Outro (last 5 seconds) */}
          <button
            id="preview-outro-btn"
            type="button"
            onClick={() => onPreviewTransition('end')}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="الاستماع لآخر 5 ثواني للتأكد من نهاية الأغنية"
          >
            آخر 5 ثوانٍ
          </button>
        </div>
      </div>

      {/* Song Metadata Form & Save Button */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="song-title-input" className="block text-xs font-semibold text-slate-300">
                اسم الأغنية أو المقطع <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => onPreviewSelection(start, end)}
                className="text-[11px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="تشغيل المقطع المحدد الآن"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>تشغيل المقطع المحدد</span>
              </button>
            </div>
            <input
              id="song-title-input"
              type="text"
              required
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder={`مثال: أغنية #${segmentsCount + 1} أو موشح يا غصن نقا`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="artist-name-input" className="block text-xs font-semibold text-slate-300 mb-1">
              اسم الفنان أو العازف (اختياري)
            </label>
            <input
              id="artist-name-input"
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="مثال: فيروز، صولو عود، كورال..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Quick Tags Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              وسم أو تصنيف سريع:
            </label>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showAdvanced ? 'إخفاء الملاحظات' : 'إضافة ملاحظة'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presetTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(tag === t ? '' : t)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  tag === t
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Notes field */}
        {showAdvanced && (
          <div>
            <textarea
              id="segment-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات حول المقطع، مثل الإيقاع أو المقام الموسيقي..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {/* Save & Direct Download Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Direct Download Sliced WAV */}
          <button
            id="download-sliced-wav-btn"
            type="button"
            disabled={isDownloading || segmentDuration <= 0}
            onClick={() => onDownloadDirectSegment(start, end, songTitle || `أغنية_${segmentsCount + 1}`)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title="تقطيع المقطع وتنزيله بصيغة WAV نقية وفورية"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isDownloading ? 'جارِ معالجة الصوت...' : 'تنزيل هذا المقطع كملف صوتي (WAV)'}
          </button>

          {/* Save to tracklist */}
          <button
            id="save-song-to-list-btn"
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-98 cursor-pointer"
          >
            {justSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                تمت إضافة الأغنية بنجاح!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                تثبيت الأغنية في قائمة الأغاني
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
