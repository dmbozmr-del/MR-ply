import React, { useState } from 'react';
import { Sliders, X, RotateCcw, Volume2, Sparkles, Check } from 'lucide-react';
import { EQUALIZER_PRESETS } from '../utils/sampleData';
import { EqualizerPreset } from '../types';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBands?: (bands: number[], bassBoost: number) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  onApplyBands,
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [activePreset, setActivePreset] = useState<string>('shaabi');
  const [bands, setBands] = useState<number[]>([6, 4, 1, 5, 6]); // Initial Shaabi preset
  const [bassBoost, setBassBoost] = useState<number>(60);
  const [virtualizer, setVirtualizer] = useState<number>(40);

  if (!isOpen) return null;

  const bandLabels = ['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'];
  const bandDescriptions = ['باس عميق', 'إيقاع', 'نطاق متوسط', 'غناء', 'تربل ونقاء'];

  const handleSelectPreset = (preset: EqualizerPreset) => {
    setActivePreset(preset.id);
    setBands([...preset.bands]);
    if (preset.bassBoost !== undefined) {
      setBassBoost(preset.bassBoost);
    }
    if (onApplyBands) {
      onApplyBands(preset.bands, preset.bassBoost || 0);
    }
  };

  const handleBandChange = (index: number, val: number) => {
    const updated = [...bands];
    updated[index] = val;
    setBands(updated);
    setActivePreset('custom');
    if (onApplyBands) {
      onApplyBands(updated, bassBoost);
    }
  };

  const handleReset = () => {
    const flat = [0, 0, 0, 0, 0];
    setBands(flat);
    setBassBoost(0);
    setVirtualizer(0);
    setActivePreset('flat');
    if (onApplyBands) {
      onApplyBands(flat, 0);
    }
  };

  return (
    <div
      id="equalizer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-[#1c1815] border border-orange-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2d2721] flex items-center justify-between bg-[#231e1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                معادل الصوت المتطور
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono">
                  Lark EQ
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                تعديل الترددات، تعزيز الباس والصوت المحيطي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Enable/Disable Toggle */}
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                isEnabled
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              {isEnabled ? 'مُفعّل' : 'معطّل'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presets Chips */}
        <div className="p-4 border-b border-[#2d2721] bg-[#1a1614] overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max pb-1">
            <span className="text-xs text-stone-400 shrink-0 font-medium">الأنماط الجاهزة:</span>
            {EQUALIZER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activePreset === preset.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 font-bold'
                    : 'bg-[#28221c] text-stone-300 hover:bg-[#342c25] border border-stone-800'
                }`}
              >
                {activePreset === preset.id && <Check className="w-3 h-3 stroke-[3]" />}
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5-Band Equalizer Sliders */}
        <div className={`p-6 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-end justify-between gap-2 sm:gap-4 h-52 pb-4">
            {bands.map((gain, index) => (
              <div key={bandLabels[index]} className="flex-1 flex flex-col items-center h-full justify-between">
                <span className="text-[11px] font-mono text-orange-400 font-bold mb-1">
                  {gain > 0 ? `+${gain}` : gain} dB
                </span>

                {/* Vertical Slider Track Container */}
                <div className="relative flex-1 w-8 flex items-center justify-center py-2">
                  {/* Center line (0dB) */}
                  <div className="absolute top-1/2 left-1 right-1 h-[1px] bg-stone-700" />

                  {/* Vertical Range Input */}
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => handleBandChange(index, Number(e.target.value))}
                    className="w-36 h-2 appearance-none bg-stone-800 rounded-lg cursor-pointer accent-orange-500 -rotate-90 origin-center"
                    style={{
                      WebkitAppearance: 'slider-vertical',
                    }}
                  />
                </div>

                <div className="text-center mt-2">
                  <p className="text-xs font-bold text-stone-200">{bandLabels[index]}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">{bandDescriptions[index]}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bass Boost & 3D Reverb Sliders */}
          <div className="mt-6 pt-5 border-t border-[#2d2721] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bass Boost */}
            <div className="bg-[#241e1a] p-3.5 rounded-2xl border border-stone-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  مضخم الباس (Bass Boost)
                </span>
                <span className="font-mono text-orange-400 font-bold">{bassBoost}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={bassBoost}
                onChange={(e) => setBassBoost(Number(e.target.value))}
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* 3D Virtualizer */}
            <div className="bg-[#241e1a] p-3.5 rounded-2xl border border-stone-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-stone-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  الصوت المحيطي (3D Surround)
                </span>
                <span className="font-mono text-amber-400 font-bold">{virtualizer}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={virtualizer}
                onChange={(e) => setVirtualizer(Number(e.target.value))}
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2d2721] bg-[#1e1915] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة ضبط الافتراضي
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg shadow-orange-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            تم وحفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};
