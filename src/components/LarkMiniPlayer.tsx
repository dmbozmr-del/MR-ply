import React from 'react';
import { Play, Pause, SkipForward, Music, Disc3 } from 'lucide-react';
import { TrackSegment } from '../types';

interface LarkMiniPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTitle: string;
  currentArtist: string;
  currentCoverArt?: string;
  segments?: TrackSegment[];
  onTogglePlay: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onOpenFullPlayer: () => void;
}

export const LarkMiniPlayer: React.FC<LarkMiniPlayerProps> = ({
  isPlaying,
  currentTime,
  duration,
  currentTitle,
  currentArtist,
  currentCoverArt,
  segments = [],
  onTogglePlay,
  onNext,
  onOpenFullPlayer,
}) => {
  if (!currentTitle) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      id="lark-mini-player-container"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-lg"
      dir="rtl"
    >
      {/* Floating Pill Container (Exact Lark Player Style) */}
      <div
        onClick={onOpenFullPlayer}
        className="relative bg-[#1c1815]/96 hover:bg-[#221e1a] border border-[#332b24] rounded-3xl shadow-2xl backdrop-blur-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
      >
        {/* Subtle Top Micro Progress Indicator with Segment Ticks */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-800/80 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Segment ticks */}
          {duration > 0 &&
            segments.map((seg) => (
              <div
                key={seg.id}
                className="absolute top-0 bottom-0 w-[2px] bg-orange-300 pointer-events-none z-10"
                style={{ right: `${(seg.startTime / duration) * 100}%` }}
                title={seg.title}
              />
            ))}
        </div>

        <div className="px-4 py-2.5 flex items-center justify-between gap-3.5">
          {/* Left Controls (In RTL, playback buttons are on the left like in screenshot!) */}
          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Play/Pause Button */}
            <button
              id="lark-mini-play-btn"
              type="button"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
              )}
            </button>

            {/* Next Track Button (⏩) */}
            <button
              id="lark-mini-next-btn"
              type="button"
              onClick={onNext}
              className="p-2 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="التالي"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* Center Info: Title & Subtitle */}
          <div className="min-w-0 flex-1 text-right">
            <h4 className="text-sm font-bold text-white truncate tracking-wide">
              {currentTitle || '0309_260426'}
            </h4>
            <p className="text-xs text-stone-400 truncate mt-0.5">
              {currentArtist || 'My Recording'}
            </p>
          </div>

          {/* Right: Square Thumbnail (Exact match to screenshot) */}
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-[#2b2520] border border-stone-800 flex items-center justify-center shadow-xs">
            {currentCoverArt ? (
              <img
                src={currentCoverArt}
                alt={currentTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-[#2c2621] flex items-center justify-center text-stone-400">
                <Music className="w-6 h-6 stroke-[1.5]" />
              </div>
            )}

            {/* Subtle Vinyl Rotation indicator when playing */}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-orange-400 animate-[spin_5s_linear_infinite]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
