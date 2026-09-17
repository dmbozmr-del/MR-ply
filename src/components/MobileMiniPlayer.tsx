import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  ChevronUp,
  Disc3,
  Music,
} from 'lucide-react';

interface MobileMiniPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTitle: string;
  currentArtist: string;
  currentCoverArt?: string;
  currentColor?: string;
  onTogglePlay: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onOpenFullPlayer: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  isPlaying,
  currentTime,
  duration,
  currentTitle,
  currentArtist,
  currentCoverArt,
  currentColor = '#ea580c',
  onTogglePlay,
  onNext,
  onOpenFullPlayer,
}) => {
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      id="mobile-mini-player-bar"
      onClick={onOpenFullPlayer}
      className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl bg-[#1a120e]/95 hover:bg-[#231913] border border-[#3c2a1d] rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
      dir="rtl"
    >
      {/* Top micro progress line */}
      <div className="w-full h-1 bg-[#281c14]">
        <div
          className="h-full bg-orange-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-3">
        {/* Left: Thumbnail & Song titles */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#3b2a1e] bg-[#120d09] flex items-center justify-center">
            {currentCoverArt ? (
              <img
                src={currentCoverArt}
                alt={currentTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: currentColor }}
              >
                <Music className="w-5 h-5" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-white animate-[spin_4s_linear_infinite]" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {currentTitle || 'لا يوجد ملف قيد التشغيل'}
            </h4>
            <p className="text-[11px] text-orange-300/80 truncate">
              {currentArtist || 'اختر أغنية للاستماع'}
            </p>
          </div>
        </div>

        {/* Right: Quick Controls & Expand Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Play/Pause */}
          <button
            id="mini-player-play-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay(e);
            }}
            className="w-9 h-9 rounded-full bg-gradient-to-l from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-600/30 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-[-1px]" />
            )}
          </button>

          {/* Next */}
          <button
            id="mini-player-next-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext(e);
            }}
            className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="التالي"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Expand to Phone View icon */}
          <button
            id="mini-player-expand-btn"
            type="button"
            onClick={onOpenFullPlayer}
            className="p-2 rounded-full bg-[#271b14] hover:bg-[#34241b] text-orange-400 transition-colors cursor-pointer border border-[#443022]"
            title="فتح مشغل الهاتف الكامل"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
