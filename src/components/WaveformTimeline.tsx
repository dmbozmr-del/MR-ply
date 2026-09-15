import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { TrackSegment, SelectionRange } from '../types';
import { formatTime } from '../utils/formatters';
import { ZoomIn, ZoomOut, Flag, Play, Bookmark } from 'lucide-react';

interface WaveformTimelineProps {
  duration: number;
  currentTime: number;
  segments: TrackSegment[];
  activeSegmentId: string | null;
  selectionRange: SelectionRange | null;
  waveformPeaks?: number[];
  onSeek: (time: number) => void;
  onSelectSegment: (segment: TrackSegment) => void;
  onSetSelectionRange: (range: SelectionRange | null) => void;
  onSetPointA: (time: number) => void;
  onSetPointB: (time: number) => void;
  onPlaySelection?: (start: number, end: number) => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  duration,
  currentTime,
  segments,
  activeSegmentId,
  selectionRange,
  waveformPeaks,
  onSeek,
  onSelectSegment,
  onSetSelectionRange,
  onSetPointA,
  onSetPointB,
  onPlaySelection,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

  // Generate synthetic waveform bars if not provided
  const peaks = useMemo(() => {
    if (waveformPeaks && waveformPeaks.length > 0) {
      return waveformPeaks;
    }
    const count = 180;
    return Array.from({ length: count }, (_, i) => {
      const v = Math.sin(i * 0.12) * 0.35 + Math.cos(i * 0.05) * 0.25 + 0.45;
      const noise = (i % 5 === 0 ? 0.2 : 0) + (i % 11 === 0 ? 0.15 : 0);
      return Math.max(0.12, Math.min(0.98, v + noise));
    });
  }, [waveformPeaks]);

  // Convert client X to time in seconds
  const getTimeFromEvent = useCallback((e: React.MouseEvent | MouseEvent): number => {
    if (!containerRef.current || duration <= 0) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    return Math.max(0, Math.min(duration, ratio * duration));
  }, [duration]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
    const time = (x / rect.width) * duration;
    setHoverTime(Math.max(0, Math.min(duration, time)));

    if (isDraggingPlayhead) {
      onSeek(Math.max(0, Math.min(duration, time)));
    } else if (draggingHandle === 'start' && selectionRange) {
      const newStart = Math.min(time, selectionRange.end - 0.5);
      onSetSelectionRange({ start: Math.max(0, newStart), end: selectionRange.end });
    } else if (draggingHandle === 'end' && selectionRange) {
      const newEnd = Math.max(time, selectionRange.start + 0.5);
      onSetSelectionRange({ start: selectionRange.start, end: Math.min(duration, newEnd) });
    }
  };

  const handleMouseLeave = () => {
    if (!isDraggingPlayhead && !draggingHandle) {
      setHoverTime(null);
      setHoverX(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only if not clicking a handle or button
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('waveform-bg')) {
      return;
    }
    const time = getTimeFromEvent(e);
    setIsDraggingPlayhead(true);
    onSeek(time);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingPlayhead(false);
      setDraggingHandle(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        const time = getTimeFromEvent(e);
        onSeek(time);
      } else if (draggingHandle === 'start' && selectionRange && duration > 0) {
        const time = getTimeFromEvent(e);
        const newStart = Math.min(time, selectionRange.end - 0.5);
        onSetSelectionRange({ start: Math.max(0, newStart), end: selectionRange.end });
      } else if (draggingHandle === 'end' && selectionRange && duration > 0) {
        const time = getTimeFromEvent(e);
        const newEnd = Math.max(time, selectionRange.start + 0.5);
        onSetSelectionRange({ start: selectionRange.start, end: Math.min(duration, newEnd) });
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDraggingPlayhead, draggingHandle, selectionRange, duration, getTimeFromEvent, onSeek, onSetSelectionRange]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const selectionStartPercent = selectionRange && duration > 0 ? (selectionRange.start / duration) * 100 : 0;
  const selectionEndPercent = selectionRange && duration > 0 ? (selectionRange.end / duration) * 100 : 0;
  const selectionWidthPercent = selectionRange && duration > 0 ? Math.max(0.5, selectionEndPercent - selectionStartPercent) : 0;

  return (
    <div id="waveform-timeline-section" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Top timeline bar: Header, Zoom & Quick Action controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            مخطط الصوت والفصول الموسيقية
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              {segments.length} أغاني محددة
            </span>
          </h3>
        </div>

        {/* Quick point A & B set buttons directly above timeline */}
        <div className="flex items-center gap-2">
          <button
            id="timeline-set-a-btn"
            type="button"
            onClick={() => onSetPointA(currentTime)}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-800/50 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="تعيين نقطة البداية [A] عند موضع التشغيل الحالي"
          >
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            تعيين بداية [A] ({formatTime(currentTime)})
          </button>

          <button
            id="timeline-set-b-btn"
            type="button"
            onClick={() => onSetPointB(currentTime)}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-600/40 text-rose-300 hover:bg-rose-800/50 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="تعيين نقطة النهاية [B] عند موضع التشغيل الحالي"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            تعيين نهاية [B] ({formatTime(currentTime)})
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              id="zoom-out-btn"
              type="button"
              disabled={zoomLevel <= 1}
              onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="تصغير المخطط"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium px-1 text-slate-300">
              {zoomLevel}x
            </span>
            <button
              id="zoom-in-btn"
              type="button"
              disabled={zoomLevel >= 4}
              onClick={() => setZoomLevel((z) => Math.min(4, z + 1))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="تكبير المخطط للتحكم الدقيق"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Waveform Canvas & Segments Area */}
      <div
        ref={scrollWrapperRef}
        className="w-full overflow-x-auto pb-2 select-none"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          className="waveform-bg relative h-28 bg-slate-950/80 border border-slate-800/80 rounded-xl cursor-crosshair overflow-hidden"
          style={{ width: `${zoomLevel * 100}%`, minWidth: '100%' }}
        >
          {/* Time markers bar at the top of waveform */}
          <div className="absolute top-0 left-0 right-0 h-5 border-b border-slate-800/60 flex items-center justify-between px-3 text-[10px] font-mono text-slate-500 pointer-events-none z-10 bg-slate-950/40">
            <span>00:00</span>
            <span>{formatTime(duration * 0.25)}</span>
            <span>{formatTime(duration * 0.5)}</span>
            <span>{formatTime(duration * 0.75)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Background amplitude bars (Waveform) */}
          <div className="absolute inset-0 pt-6 px-1 flex items-center justify-between gap-[2px] pointer-events-none opacity-80">
            {peaks.map((height, i) => {
              const barProgress = (i / peaks.length) * 100;
              const isPlayed = barProgress <= progressPercent;

              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    height: `${height * 75}%`,
                    backgroundColor: isPlayed ? '#818cf8' : '#334155',
                    opacity: isPlayed ? 0.95 : 0.45,
                  }}
                />
              );
            })}
          </div>

          {/* Identified Track Segments (Colored blocks on timeline) */}
          {segments.map((seg, idx) => {
            const startPct = duration > 0 ? (seg.startTime / duration) * 100 : 0;
            const endPct = duration > 0 ? (seg.endTime / duration) * 100 : 0;
            const widthPct = Math.max(0.8, endPct - startPct);
            const isActive = activeSegmentId === seg.id;

            return (
              <div
                key={seg.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSegment(seg);
                }}
                className={`absolute top-5 bottom-1 rounded-md border transition-all cursor-pointer group z-20 flex flex-col justify-between p-1 overflow-hidden ${
                  isActive
                    ? 'border-white ring-2 ring-indigo-400 bg-indigo-950/50 shadow-lg'
                    : 'border-slate-700/60 hover:border-slate-400 bg-slate-800/30 hover:bg-slate-800/50'
                }`}
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: `${seg.color}22`,
                  borderColor: `${seg.color}99`,
                }}
                title={`${seg.title} (${formatTime(seg.startTime)} - ${formatTime(seg.endTime)})`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-[10px] font-bold truncate max-w-full px-1.5 py-0.5 rounded text-white shadow-sm flex items-center gap-1 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: seg.color }}
                  >
                    <Play className="w-2.5 h-2.5 fill-current shrink-0" />
                    <span className="truncate">#{idx + 1} {seg.title}</span>
                  </span>
                </div>

                <div className="text-[9px] font-mono text-slate-300 bg-slate-900/80 px-1 py-0.5 rounded self-start truncate">
                  {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                </div>
              </div>
            );
          })}

          {/* A-B Selection Range Box (The active clipping area) */}
          {selectionRange && duration > 0 && (
            <div
              className="absolute top-5 bottom-0 border-2 border-dashed border-amber-400 bg-amber-400/15 z-30 pointer-events-none"
              style={{
                left: `${selectionStartPercent}%`,
                width: `${selectionWidthPercent}%`,
              }}
            >
              {/* Range label - clickable to play the selected song */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPlaySelection) {
                    onPlaySelection(selectionRange.start, selectionRange.end);
                  } else {
                    onSeek(selectionRange.start);
                  }
                }}
                className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap cursor-pointer pointer-events-auto flex items-center gap-1 transition-all z-40"
                title="انقر لتشغيل المقطع المحدد الآن"
              >
                <Play className="w-2.5 h-2.5 fill-current shrink-0" />
                <span>المقطع المحدد: {formatTime(selectionRange.start)} ⟷ {formatTime(selectionRange.end)} ({formatTime(selectionRange.end - selectionRange.start)})</span>
              </button>

              {/* Left Handle [A] */}
              <div
                id="selection-handle-a"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingHandle('start');
                }}
                className="absolute -left-2 top-0 bottom-0 w-4 bg-emerald-500/80 hover:bg-emerald-400 cursor-ew-resize pointer-events-auto rounded-r flex items-center justify-center text-[9px] font-bold text-white shadow-lg z-40 transition-colors"
                title={`نقطة البداية A: ${formatTime(selectionRange.start)}`}
              >
                A
              </div>

              {/* Right Handle [B] */}
              <div
                id="selection-handle-b"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingHandle('end');
                }}
                className="absolute -right-2 top-0 bottom-0 w-4 bg-rose-500/80 hover:bg-rose-400 cursor-ew-resize pointer-events-auto rounded-l flex items-center justify-center text-[9px] font-bold text-white shadow-lg z-40 transition-colors"
                title={`نقطة النهاية B: ${formatTime(selectionRange.end)}`}
              >
                B
              </div>
            </div>
          )}

          {/* Playhead (Line indicating current playback position) */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all duration-75"
            style={{ left: `${progressPercent}%` }}
          >
            {/* Playhead Top Knob */}
            <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" />
            <div className="absolute top-1 left-2 bg-red-600 text-white text-[9px] font-mono px-1 rounded shadow whitespace-nowrap">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Hover indicator tooltip */}
          {hoverX !== null && hoverTime !== null && (
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-slate-400/50 border-r border-dashed border-slate-300 pointer-events-none z-30"
              style={{ left: `${hoverX}px` }}
            >
              <div className="absolute bottom-2 left-2 bg-slate-800 text-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
                {formatTime(hoverTime)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Instructions helper */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
            <span>نقطة البداية [A]</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
            <span>نقطة النهاية [B]</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400/40 border border-amber-400 inline-block" />
            <span>نطاق الأغنية المحددة للتصدير/الحفظ</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          انقر فوق المخطط للانتقال، أو اسحب المقابض (A و B) لتحديد نطاق الأغنية بدقة.
        </span>
      </div>
    </div>
  );
};
