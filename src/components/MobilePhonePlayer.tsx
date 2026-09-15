import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Star,
  Plus,
  Music,
  Disc3,
  ChevronDown,
  Sliders,
  Scissors,
  Clock,
  FileText,
  AlignLeft,
  MoreVertical,
  Heart,
  Split,
  Layers,
  Edit2,
  Trash2,
  Check,
  Tag,
  ListMusic,
} from 'lucide-react';
import { TrackSegment } from '../types';
import { formatTime } from '../utils/formatters';
import { AudioVisualizer } from './AudioVisualizer';

interface MobilePhonePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLoopingSegment: boolean;
  isShuffle: boolean;
  currentTitle: string;
  currentArtist: string;
  currentAlbum: string;
  currentCoverArt?: string;
  currentColor?: string;
  currentNotes?: string;
  lyrics?: string;
  hasLyrics?: boolean;
  isFavorite?: boolean;
  sourceContextTitle?: string;
  segments?: TrackSegment[];
  activeSegmentId?: string | null;
  audioElement: HTMLAudioElement | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkipSeconds: (delta: number) => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleFavorite?: () => void;
  onOpenAddToPlaylist?: () => void;
  onOpenEqualizer?: () => void;
  onOpenSlicer?: () => void;
  onSelectSegment?: (segment: TrackSegment) => void;
  onAddSplitHere?: (timestamp: number, title?: string) => void;
  onDeleteSegment?: (segmentId: string) => void;
  onRenameSegment?: (segmentId: string, newTitle: string) => void;
}

export const MobilePhonePlayer: React.FC<MobilePhonePlayerProps> = ({
  isOpen,
  onClose,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isLoopingSegment,
  isShuffle,
  currentTitle,
  currentArtist,
  currentAlbum,
  currentCoverArt,
  currentColor = '#ea580c',
  currentNotes,
  lyrics,
  hasLyrics,
  isFavorite,
  sourceContextTitle,
  segments = [],
  activeSegmentId,
  audioElement,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onSkipSeconds,
  onToggleLoop,
  onToggleShuffle,
  onSetVolume,
  onToggleMute,
  onSetPlaybackRate,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onOpenEqualizer,
  onOpenSlicer,
  onSelectSegment,
  onAddSplitHere,
  onDeleteSegment,
  onRenameSegment,
}) => {
  const [viewMode, setViewMode] = useState<'artwork' | 'lyrics'>('artwork');
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);

  // Split management states
  const [showSegmentsDrawer, setShowSegmentsDrawer] = useState(false);
  const [showQuickSplitModal, setShowQuickSplitModal] = useState(false);
  const [newSplitTitle, setNewSplitTitle] = useState('');
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const optionsMenuRef = useRef<HTMLDivElement | null>(null);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptionsMenu]);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerRemaining !== null && sleepTimerRemaining > 0) {
      sleepTimerRef.current = window.setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev && prev > 1) return prev - 1;
          if (isPlaying) onTogglePlay();
          return null;
        });
      }, 1000);
    } else if (sleepTimerRemaining === 0) {
      if (isPlaying) onTogglePlay();
      setSleepTimerRemaining(null);
    }
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [sleepTimerRemaining, isPlaying, onTogglePlay]);

  const handleSetSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
    setShowSleepMenu(false);
  };

  // Find currently active segment according to currentTime or activeSegmentId
  const sortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => a.startTime - b.startTime);
  }, [segments]);

  const activeSegment = useMemo(() => {
    if (activeSegmentId) {
      const found = sortedSegments.find((s) => s.id === activeSegmentId);
      if (found) return found;
    }
    return (
      sortedSegments.find((s) => currentTime >= s.startTime && currentTime <= s.endTime) ||
      sortedSegments[0] ||
      null
    );
  }, [sortedSegments, activeSegmentId, currentTime]);

  const handleOpenQuickSplit = () => {
    setNewSplitTitle(`اغنية ${sortedSegments.length + 1}`);
    setShowQuickSplitModal(true);
    setShowOptionsMenu(false);
  };

  const handleConfirmSplit = () => {
    if (onAddSplitHere) {
      onAddSplitHere(currentTime, newSplitTitle.trim() || undefined);
    }
    setShowQuickSplitModal(false);
  };

  const handleSaveRename = (segId: string) => {
    if (onRenameSegment && editingTitle.trim()) {
      onRenameSegment(segId, editingTitle.trim());
    }
    setEditingSegmentId(null);
    setEditingTitle('');
  };

  if (!isOpen) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const speeds = [0.8, 1, 1.25, 1.5];

  return (
    <div
      id="mobile-phone-player-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      dir="rtl"
    >
      {/* Phone Body Container (Dark eggplant/purple palette inspired by Lark Player) */}
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#1d121c] border border-[#3b233a] rounded-[2.5rem] shadow-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all text-white select-none max-h-[96vh] overflow-y-auto custom-scrollbar"
        style={{
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 40px ${currentColor}25`,
        }}
      >
        {/* Top Header Row with Notch & Dismiss */}
        <div>
          {/* Top Notch Indicator */}
          <div className="w-20 h-1 bg-stone-700/80 rounded-full mx-auto mb-2 opacity-60" />

          <div className="flex items-center justify-between pb-2 border-b border-[#301c2e]">
            <button
              id="phone-player-minimize-btn"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#2a1727] hover:bg-[#382035] text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
              title="تصغير المشغل"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 block">
                {sourceContextTitle || 'MR Player'}
              </span>
              <h4 className="text-xs font-bold text-stone-200 truncate max-w-[180px]">
                {activeSegment ? `مقطع: ${activeSegment.title}` : 'يتم الآن التشغيل'}
              </h4>
            </div>

            {/* Top Right Action: Divided Songs Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowSegmentsDrawer(true)}
              className="px-2.5 py-1 rounded-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
              title="قائمة الأغاني المقسمة داخل هذا التسجيل"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الأغاني ({sortedSegments.length})</span>
            </button>
          </div>
        </div>

        {/* Center Display: Artwork View OR Lyrics View */}
        {viewMode === 'artwork' ? (
          <div className="my-3 flex flex-col items-center justify-center">
            {/* Artwork Card */}
            <div className="relative group w-52 h-52 sm:w-60 sm:h-60">
              {/* Soft glow behind artwork */}
              <div
                className="absolute -inset-2 rounded-3xl opacity-30 blur-xl transition-all"
                style={{ backgroundColor: currentColor }}
              />

              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-[#251525]">
                {currentCoverArt ? (
                  <img
                    src={currentCoverArt}
                    alt={currentTitle}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  /* MR Music Note Artwork */
                  <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-[#301c30] to-[#1c0f1c] relative overflow-hidden">
                    {/* MR Watermark in background */}
                    <span className="absolute text-6xl font-black text-white/5 tracking-wider select-none pointer-events-none font-sans">
                      MR
                    </span>

                    <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                      <Music
                        className={`w-14 h-14 text-orange-400/90 ${
                          isPlaying ? 'scale-110 transition-transform' : ''
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Audio Visualizer */}
            <div className="mt-2.5 flex items-center justify-center">
              <AudioVisualizer
                audioElement={audioElement}
                isPlaying={isPlaying}
                color={currentColor}
              />
            </div>
          </div>
        ) : (
          /* Lyrics View */
          <div className="my-3 h-60 sm:h-64 overflow-y-auto p-4 bg-[#160c15] border border-[#301c2e] rounded-2xl text-center flex flex-col items-center justify-start space-y-3 custom-scrollbar">
            <div className="text-xs font-bold text-orange-400 mb-1 flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>كلمات: {currentTitle}</span>
            </div>

            {lyrics ? (
              <div className="text-stone-200 leading-relaxed text-sm whitespace-pre-line font-medium px-2 py-1">
                {lyrics}
              </div>
            ) : (
              <div className="my-auto text-stone-500 text-xs py-8">
                <p>لا تتوفر كلمات مكتوبة لهذا التسجيل حالياً</p>
                <p className="text-[11px] text-stone-600 mt-1">
                  يمكنك استخدام ميزة التقسيم لتحديد الأغاني المنفصلة
                </p>
              </div>
            )}
          </div>
        )}

        {/* Title, Artist, 3-Dots Menu & Heart (Exact match with user screenshot) */}
        <div className="mb-2">
          <div className="flex items-center justify-between gap-3">
            {/* Title & Artist on the right (RTL layout) */}
            <div className="min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
                {currentTitle}
              </h3>
              <p className="text-xs text-stone-400 font-medium truncate mt-0.5">
                {currentArtist}
              </p>
            </div>

            {/* Actions on the left: Three Dots & Heart (Just like in screenshot) */}
            <div className="flex items-center gap-1 relative" ref={optionsMenuRef}>
              {/* Three Dots Menu Button */}
              <button
                type="button"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                title="خيارات إضافية"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Heart Button */}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform active:scale-125 ${
                      isFavorite ? 'text-red-500 fill-red-500' : 'text-stone-400'
                    }`}
                  />
                </button>
              )}

              {/* Dropdown Options Menu */}
              {showOptionsMenu && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-[#261526] border border-[#4a264a] rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
                  <button
                    type="button"
                    onClick={handleOpenQuickSplit}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-orange-500/20 text-orange-400 font-bold flex items-center justify-between"
                  >
                    <span>تقسيم هنا ({formatTime(currentTime)})</span>
                    <Split className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSegmentsDrawer(true);
                      setShowOptionsMenu(false);
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 flex items-center justify-between"
                  >
                    <span>قائمة الأغاني المقسمة ({sortedSegments.length})</span>
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {onOpenSlicer && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        onOpenSlicer();
                      }}
                      className="w-full text-right px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 flex items-center justify-between"
                    >
                      <span>استوديو التقطيع الكامل</span>
                      <Scissors className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  )}

                  {onOpenAddToPlaylist && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionsMenu(false);
                        onOpenAddToPlaylist();
                      }}
                      className="w-full text-right px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 flex items-center justify-between"
                    >
                      <span>إضافة لقائمة تشغيل</span>
                      <Plus className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE SEGMENTED PROGRESS TIMELINE (مطابقة تماماً لفكرة وتقسيم الصورة المرفقة) */}
        {/* ========================================================================= */}
        <div className="mb-3 pt-2">
          {/* Active Song Segment Indicator & Quick Split Action Header */}
          <div className="flex items-center justify-between mb-2">
            {/* Active Segment Label (e.g. "اغنية 1" exactly like the screenshot!) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (activeSegment) {
                    if (onSelectSegment) {
                      onSelectSegment(activeSegment);
                    } else {
                      onSeek(activeSegment.startTime);
                    }
                  }
                }}
                className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  activeSegment
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/40 hover:scale-105 active:scale-95'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
                title={activeSegment ? `تشغيل الأغنية المحددة: ${activeSegment.title}` : 'التسجيل كاملاً'}
              >
                <Tag className="w-3 h-3 text-current" />
                <span>{activeSegment ? activeSegment.title : 'التسجيل كاملاً'}</span>
                {activeSegment && <Play className="w-2.5 h-2.5 fill-current mr-0.5" />}
              </button>

              {activeSegment && (
                <span className="text-[10px] text-stone-400 font-mono bg-black/30 px-2 py-0.5 rounded-full border border-stone-800">
                  {formatTime(activeSegment.startTime)} ⟷ {formatTime(activeSegment.endTime)}
                </span>
              )}
            </div>

            {/* Quick Button to Split at the current playback second! */}
            {onAddSplitHere && (
              <button
                type="button"
                onClick={handleOpenQuickSplit}
                className="text-[11px] px-2.5 py-1 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1 shadow-md shadow-orange-900/40 transition-all active:scale-95 cursor-pointer"
                title="تقسيم التسجيل هنا وإضافة علامة أغنية جديدة"
              >
                <Scissors className="w-3 h-3" />
                <span>تقسيم هنا</span>
              </button>
            )}
          </div>

          {/* Interactive Timeline Rail with Orange Divider Ticks */}
          <div className="relative py-2 select-none">
            {/* Invisible Native Input Scrub Slider over the track */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-8 opacity-0 z-20 cursor-pointer"
              title="سحب للتقديم والتأخير"
            />

            {/* Visual Track Rail */}
            <div className="relative h-2 bg-[#2d1b2b] rounded-full overflow-visible">
              {/* Played Progress Bar */}
              <div
                className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 rounded-full transition-[width] duration-75 pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Ticks and Song Labels for each segment (As drawn in the screenshot!) */}
              {duration > 0 &&
                sortedSegments.map((seg, idx) => {
                  const leftPercent = (seg.startTime / duration) * 100;
                  const isActive = activeSegment?.id === seg.id;

                  return (
                    <div
                      key={seg.id}
                      className="absolute top-1/2 -translate-y-1/2 z-10 group"
                      style={{ right: `${leftPercent}%` }}
                    >
                      {/* Vertical Orange Divider Tick (Just like the user's drawing!) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSegment) {
                            onSelectSegment(seg);
                          } else {
                            onSeek(seg.startTime);
                          }
                        }}
                        className={`w-1.5 h-4 -translate-x-1/2 rounded-full cursor-pointer transition-all ${
                          isActive
                            ? 'bg-orange-400 ring-2 ring-orange-500/80 scale-125'
                            : 'bg-orange-500/90 hover:bg-orange-400 hover:scale-125'
                        }`}
                        title={`انتقال إلى: ${seg.title} (${formatTime(seg.startTime)})`}
                      />

                      {/* Song Title Label Floating Above Marker (Like "اغنية 1" in the screenshot!) */}
                      {(isActive || idx === 0 || sortedSegments.length <= 4) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectSegment) {
                              onSelectSegment(seg);
                            } else {
                              onSeek(seg.startTime);
                            }
                          }}
                          className={`absolute bottom-full mb-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer pointer-events-auto z-30 shadow-md flex items-center gap-1 hover:scale-110 active:scale-95 ${
                            isActive
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-2 ring-orange-400'
                              : 'bg-[#291629] text-stone-200 hover:text-white hover:bg-orange-600/80 border border-orange-500/30'
                          }`}
                          title={`تشغيل المقطع المحدد: ${seg.title}`}
                        >
                          <Play className="w-2.5 h-2.5 fill-current shrink-0" />
                          <span>{seg.title}</span>
                        </button>
                      )}
                    </div>
                  );
                })}

              {/* Scrubber Playhead Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-orange-500 pointer-events-none transition-transform active:scale-125"
                style={{ right: `calc(${progressPercent}% - 7px)` }}
              />
            </div>

            {/* Time Labels (e.g. 7:08 and 45:11 exactly as in user screenshot) */}
            <div className="flex justify-between items-center text-[11px] font-mono text-stone-400 mt-2 px-0.5">
              <span className="text-white font-bold">{formatTime(currentTime, true)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Quick-Play Selection Names Chips Row */}
            {sortedSegments.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar no-scrollbar select-none">
                  <span className="text-[10px] text-stone-400 shrink-0 font-medium ml-1">
                    الأغاني المحددة:
                  </span>
                  {sortedSegments.map((seg, idx) => {
                    const isCurrent = activeSegment?.id === seg.id;
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => {
                          if (onSelectSegment) {
                            onSelectSegment(seg);
                          } else {
                            onSeek(seg.startTime);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                          isCurrent
                            ? 'bg-gradient-to-l from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/50 scale-105'
                            : 'bg-[#231522] hover:bg-[#2e1c2c] text-stone-300 hover:text-white border border-stone-800'
                        }`}
                        title={`تشغيل: ${seg.title} (${formatTime(seg.startTime)})`}
                      >
                        <Play className={`w-3 h-3 ${isCurrent ? 'fill-current text-white' : 'text-orange-400'}`} />
                        <span>{seg.title}</span>
                        <span className="text-[10px] font-mono opacity-60 font-normal">
                          {formatTime(seg.endTime - seg.startTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Playback Controls Row (Rewind, Play/Pause, Forward) */}
        <div className="flex items-center justify-between gap-4 mb-2 px-4">
          {/* Skip Back / Previous Song Segment */}
          <button
            type="button"
            onClick={onPrev}
            className="p-3 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="الأغنية أو المقطع السابق"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Large Main Play / Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full bg-white hover:bg-stone-100 text-[#1d121c] flex items-center justify-center shadow-2xl transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-[-2px]" />
            )}
          </button>

          {/* Skip Forward / Next Song Segment */}
          <button
            type="button"
            onClick={onNext}
            className="p-3 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="الأغنية أو المقطع التالي"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>
        </div>

        {/* Bottom Toolbar: Repeat/Queue, Lyrics Pill "الكلمات 💬", Equalizer "🎛️ ON" (Exact screenshot match) */}
        <div className="pt-2 border-t border-[#301c2e] flex items-center justify-between px-2">
          {/* Left: Loop / Repeat Mode */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`p-2.5 rounded-full transition-colors cursor-pointer ${
              isLoopingSegment ? 'text-orange-400 bg-orange-500/20' : 'text-stone-400 hover:text-white'
            }`}
            title={isLoopingSegment ? 'إلغاء التكرار' : 'تكرار المقطع الحالي'}
          >
            <Repeat className="w-5 h-5" />
          </button>

          {/* Center: Lyrics Pill Button "الكلمات 💬" */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'artwork' ? 'lyrics' : 'artwork')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'lyrics'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-[#2a1727] text-stone-300 hover:text-white hover:bg-[#382035]'
            }`}
          >
            <span>الكلمات</span>
            <FileText className="w-3.5 h-3.5" />
          </button>

          {/* Right: Equalizer Button with ON tag */}
          {onOpenEqualizer && (
            <button
              type="button"
              onClick={onOpenEqualizer}
              className="p-2 rounded-xl text-stone-400 hover:text-orange-400 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
              title="فتح معادل الصوت (Equalizer)"
            >
              <Sliders className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-bold text-orange-400 font-mono">ON</span>
            </button>
          )}
        </div>

        {/* Quick Split Modal (انبثاق إضافة فاصل أغنية عند الموضع الحالي) */}
        {showQuickSplitModal && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md rounded-[2.5rem] p-6 flex flex-col justify-center animate-fadeIn">
            <div className="bg-[#241324] border border-orange-500/40 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Split className="w-4 h-4 text-orange-400" />
                  <span>تقسيم التسجيل هنا</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowQuickSplitModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-stone-300 mb-3">
                سيتم وضع علامة تقسيم برتقالية عند الموضع:{' '}
                <strong className="text-orange-400 font-mono font-bold">
                  {formatTime(currentTime, true)}
                </strong>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">اسم الأغنية الجديدة:</label>
                  <input
                    type="text"
                    value={newSplitTitle}
                    onChange={(e) => setNewSplitTitle(e.target.value)}
                    placeholder="مثال: اغنية 2، موال الصبا، رقصة الفرح..."
                    className="w-full bg-[#170a17] border border-stone-700 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmSplit}
                    className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    تأكيد التقسيم
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickSplitModal(false)}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drawer: Divided Songs List inside this long track */}
        {showSegmentsDrawer && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md rounded-[2.5rem] p-5 flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#3b233a] mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-bold text-white">الأغاني المقسمة ({sortedSegments.length})</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSegmentsDrawer(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-stone-400 mb-3">
              انقر على أي أغنية للتشغيل الفوري من بدايتها أو عدّل اسمها وحذفها:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {sortedSegments.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">
                  لم يتم تقسيم هذا التسجيل بعد. انقر زر &quot;تقسيم هنا&quot; لإضافة أغنية.
                </div>
              ) : (
                sortedSegments.map((seg, idx) => {
                  const isCurrent = activeSegment?.id === seg.id;
                  const isEditing = editingSegmentId === seg.id;

                  return (
                    <div
                      key={seg.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-orange-500/20 border-orange-500/50'
                          : 'bg-[#251525] border-[#3b233a] hover:border-stone-700'
                      }`}
                    >
                      {/* Left Play/Select */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectSegment) {
                            onSelectSegment(seg);
                          } else {
                            onSeek(seg.startTime);
                          }
                          setShowSegmentsDrawer(false);
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-orange-500 text-white'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </div>

                        <div className="min-w-0">
                          {isEditing ? (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="bg-black/50 border border-orange-500 rounded px-2 py-0.5 text-xs text-white"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRename(seg.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <h5 className="text-xs font-bold text-white truncate">{seg.title}</h5>
                          )}
                          <span className="text-[10px] text-stone-400 font-mono">
                            {formatTime(seg.startTime)} ⟷ {formatTime(seg.endTime)} (
                            {formatTime(seg.endTime - seg.startTime)})
                          </span>
                        </div>
                      </button>

                      {/* Right actions (Rename & Delete) */}
                      <div className="flex items-center gap-1">
                        {!isEditing && onRenameSegment && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSegmentId(seg.id);
                              setEditingTitle(seg.title);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                            title="تعديل اسم الأغنية"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeleteSegment && (
                          <button
                            type="button"
                            onClick={() => onDeleteSegment(seg.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800"
                            title="حذف هذا التقسيم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#3b233a] mt-2">
              <button
                type="button"
                onClick={handleOpenQuickSplit}
                className="w-full py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة تقسيم جديد عند الموضع الحالي ({formatTime(currentTime)})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
