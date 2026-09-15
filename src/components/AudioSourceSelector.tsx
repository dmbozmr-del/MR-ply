import React, { useState, useRef } from 'react';
import { Upload, Music, Link as LinkIcon, Sparkles, Disc, Radio, Check } from 'lucide-react';
import { AudioTrack } from '../types';

interface AudioSourceSelectorProps {
  tracks: AudioTrack[];
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onFileUpload: (file: File) => void;
  onUrlLoad: (url: string, title: string) => void;
}

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  onFileUpload,
  onUrlLoad,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i)) {
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onUrlLoad(urlInput.trim(), urlTitle.trim() || 'ملف صوتي خارجي');
    setUrlInput('');
    setUrlTitle('');
  };

  return (
    <div
      id="audio-source-selector"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl"
    >
      {/* Tab switchers */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            التسجيلات الطويلة الجاهزة (نماذج تجريبية)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            رفع أغنية / تسجيل خاص بك
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            رابط صوتي مباشر
          </button>
        </div>
      </div>

      {/* Tab Content: Presets */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tracks
            .filter((t) => t.fileType === 'sample')
            .map((track) => {
              const isSelected = track.id === activeTrackId;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {track.coverArt ? (
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <Disc className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {track.segments.length} أغاني محددة
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> قيد الاستماع
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 truncate mt-1">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-indigo-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span>اضغط للتبديل والتشغيل</span>
                    <span className="font-mono text-slate-400">
                      {Math.floor(track.duration / 60)}:00 دقيقة
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Tab Content: Upload Local Audio */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/30'
              : 'border-slate-700 bg-slate-950/50 hover:border-slate-500 hover:bg-slate-950/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.webm"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 mb-1">
            اسحب وأفلت الملف الصوتي هنا، أو انقر للاختيار من جهازك
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
            يدعم جميع صيغ الأغاني والتسجيلات الطويلة (MP3, WAV, M4A, FLAC, OGG, AAC) بأي مدة
          </p>
          <span className="inline-block text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl shadow-md transition-colors">
            تصفح الملفات من جهازك
          </span>
        </div>
      )}

      {/* Tab Content: Direct URL */}
      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-3 max-w-xl mx-auto py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عنوان أو اسم الملف الصوتي
            </label>
            <input
              type="text"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              placeholder="مثال: تسجيل حفل مباشر - القاهرة"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              رابط ملف الصوت المباشر (URL) <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/audio/mix.mp3"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            تحميل وتشغيل الرابط
          </button>
        </form>
      )}
    </div>
  );
};
