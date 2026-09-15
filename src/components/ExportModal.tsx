import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Share2, Code } from 'lucide-react';
import { AudioTrack } from '../types';
import { exportYouTubeTimestamps, exportCueSheet } from '../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: AudioTrack;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, track }) => {
  const [activeTab, setActiveTab] = useState<'timestamps' | 'cue' | 'json'>('timestamps');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const timestampsContent = exportYouTubeTimestamps(track.segments);
  const cueContent = exportCueSheet(track.title, track.artist, track.segments);
  const jsonContent = JSON.stringify(
    {
      trackTitle: track.title,
      artist: track.artist,
      totalDuration: track.duration,
      segments: track.segments,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const getCurrentText = () => {
    switch (activeTab) {
      case 'timestamps':
        return timestampsContent;
      case 'cue':
        return cueContent;
      case 'json':
        return jsonContent;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    let filename = '';
    let mimeType = 'text/plain';
    const text = getCurrentText();

    if (activeTab === 'timestamps') {
      filename = `${track.title}_chapters.txt`;
    } else if (activeTab === 'cue') {
      filename = `${track.title}.cue`;
    } else {
      filename = `${track.title}_tracklist.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">تصدير قائمة الأغاني والفصول</h3>
              <p className="text-xs text-slate-400">اختر الصيغة المناسبة للاستخدام في منصات النشر أو برامج الصوت</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('timestamps')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timestamps'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            فصول يوتيوب (Timestamps)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cue')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cue'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            ملف CUE Sheet للدي جي
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            نسخة احتياطية (JSON)
          </button>
        </div>

        {/* Content Box */}
        <div className="relative mb-4">
          <textarea
            readOnly
            rows={8}
            value={getCurrentText()}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none select-all"
            dir="ltr"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadFile}
            className="text-xs px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            تنزيل كملف
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  تم النسخ للحافظة!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  نسخ النص بالكامل
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
