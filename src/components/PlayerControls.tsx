import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { TrackSegment } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLoopingSegment: boolean;
  activeSegment: TrackSegment | null;
  audioElement: HTMLAudioElement | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipSeconds: (delta: number) => void;
  onPrevSegment: () => void;
  onNextSegment: () => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleLoopSegment: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isLoopingSegment,
  activeSegment,
  audioElement,
  onTogglePlay,
  onSeek,
  onSkipSeconds,
  onPrevSegment,
  onNextSegment,
  onSetVolume,
  onToggleMute,
  onSetPlaybackRate,
  onToggleLoopSegment,
}) => {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      id="main-player-controls"
      className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md"
    >
      {/* Active Track / Sub-segment banner */}
      {activeSegment && (
        <div className="mb-4 px-3.5 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: activeSegment.color }}
            />
            <span className="text-slate-300">يتم الآن تشغيل الأغنية المحددة:</span>
            <span className="font-bold text-white truncate">{activeSegment.title}</span>
            {activeSegment.artist && (
              <span className="text-indigo-300 truncate">({activeSegment.artist})</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400 font-mono text-[11px]">
              {formatTime(activeSegment.startTime)} ⟷ {formatTime(activeSegment.endTime)}
            </span>
            {isLoopingSegment && (
              <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <Repeat className="w-2.5 h-2.5" /> تكرار المقطع
              </span>
            )}
          </div>
        </div>
      )}

      {/* Scrubber Progress Slider */}
      <div className="mb-4">
        <div className="relative flex items-center group">
          <input
            id="audio-scrub-slider"
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            title="شريط التقديم والتأخير"
          />
        </div>
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 mt-1.5 px-0.5">
          <span className="font-medium text-slate-200">{formatTime(currentTime, true)}</span>
          <span className="text-slate-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Buttons & Actions row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Visualizer & active snippet */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
          <AudioVisualizer
            audioElement={audioElement}
            isPlaying={isPlaying}
            color={activeSegment?.color || '#6366f1'}
          />
          <div className="hidden lg:block text-right">
            <div className="text-[11px] text-slate-400">حالة الصوت</div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {isPlaying ? 'قيد التشغيل' : 'متوقف مؤقتاً'}
            </div>
          </div>
        </div>

        {/* Center: Primary Playback controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prev identified segment */}
          <button
            id="prev-segment-btn"
            type="button"
            onClick={onPrevSegment}
            className="p-2 sm:p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="الأغنية السابقة"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Jump -10s */}
          <button
            id="rewind-10s-btn"
            type="button"
            onClick={() => onSkipSeconds(-10)}
            className="p-2 sm:p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center relative"
            title="تراجع 10 ثواني"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[8px] absolute font-bold font-mono">10</span>
          </button>

          {/* Main Play / Pause Button */}
          <button
            id="main-play-pause-btn"
            type="button"
            onClick={onTogglePlay}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت (المسافة)' : 'تشغيل (المسافة)'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-[-1px]" />
            )}
          </button>

          {/* Jump +10s */}
          <button
            id="forward-10s-btn"
            type="button"
            onClick={() => onSkipSeconds(10)}
            className="p-2 sm:p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center relative"
            title="تقديم 10 ثواني"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-[8px] absolute font-bold font-mono">10</span>
          </button>

          {/* Next identified segment */}
          <button
            id="next-segment-btn"
            type="button"
            onClick={onNextSegment}
            className="p-2 sm:p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="الأغنية التالية"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Loop / Repeat Segment Toggle */}
          <button
            id="toggle-loop-segment-btn"
            type="button"
            onClick={onToggleLoopSegment}
            className={`p-2 sm:p-2.5 rounded-full transition-colors cursor-pointer ${
              isLoopingSegment
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="تكرار المقطع / الأغنية الحالية باستمرار (A-B Loop)"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Volume & Speed Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60">
            {speeds.map((rate) => (
              <button
                key={rate}
                id={`speed-${rate}x-btn`}
                type="button"
                onClick={() => onSetPlaybackRate(rate)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`سرعة التشغيل ${rate}x`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 bg-slate-800/70 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            <button
              id="volume-mute-btn"
              type="button"
              onClick={onToggleMute}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
              title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title="مستوى الصوت"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
