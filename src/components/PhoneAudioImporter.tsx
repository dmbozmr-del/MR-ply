import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Upload,
  FolderPlus,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  X,
  CheckCircle,
  FileAudio,
  Sparkles,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { AudioTrack } from '../types';
import { formatTime } from '../utils/formatters';

interface PhoneAudioImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTracks: (files: File[], folderName?: string) => Promise<void>;
  onAddRecordedTrack: (audioBlob: Blob, title: string, duration: number) => Promise<void>;
  onLoadDemoSample?: () => void;
}

export const PhoneAudioImporter: React.FC<PhoneAudioImporterProps> = ({
  isOpen,
  onClose,
  onImportTracks,
  onAddRecordedTrack,
  onLoadDemoSample,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'folder' | 'record'>('files');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [isRecordingPlaying, setIsRecordingPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  // Handle files selection
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files) as File[];
    setIsProcessing(true);
    setProcessingStatus(`جارِ استيراد ${fileList.length} ملف صوتي من الهاتف...`);
    try {
      await onImportTracks(fileList);
      onClose();
    } catch (err) {
      console.error('Error importing files', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Handle folder selection
  const handleFolderSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const allFiles = Array.from(e.target.files) as (File & { webkitRelativePath?: string })[];
    const audioFiles = allFiles.filter((f) =>
      f.type.startsWith('audio/') ||
      f.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|opus|amr|webm|wma)$/i)
    );

    if (audioFiles.length === 0) {
      alert('لم يتم العثور على ملفات صوتية في هذا المجلد');
      return;
    }

    const firstFileRelativePath = allFiles[0]?.webkitRelativePath;
    const folderName = firstFileRelativePath
      ? firstFileRelativePath.split('/')[0]
      : 'مجلد الهاتف';

    setIsProcessing(true);
    setProcessingStatus(`جارِ إضافة ${audioFiles.length} ملف صوتي من مجلد "${folderName}"...`);
    try {
      await onImportTracks(audioFiles, folderName);
      onClose();
    } catch (err) {
      console.error('Error importing folder', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Start voice recording with phone mic
  const handleStartRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);

        // Stop all audio tracks from stream
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingTitle(`تسجيل MR_${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}`);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error', err);
      alert('يرجى السماح بالوصول إلى المايكروفون لبدء التسجيل من الهاتف.');
    }
  };

  // Stop voice recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Save recorded track to MR
  const handleSaveRecording = async () => {
    if (!recordedBlob) return;
    setIsProcessing(true);
    setProcessingStatus('جارِ حفظ التسجيل في تطبيق MR...');
    try {
      await onAddRecordedTrack(
        recordedBlob,
        recordingTitle.trim() || `تسجيل صوتي ${formatTime(recordingTime)}`,
        recordingTime || 10
      );
      onClose();
    } catch (err) {
      console.error('Error saving recording', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <div
      id="phone-audio-importer-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-[#1d1612] border border-[#382b22] rounded-3xl shadow-2xl p-5 sm:p-6 text-white relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#30251d]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-600/30">
              MR
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>إضافة أغانٍ وتسجيلات</span>
                <Smartphone className="w-4 h-4 text-orange-400" />
              </h3>
              <p className="text-[11px] text-stone-400">
                اختر الملفات من ذاكرة هاتفك للتشغيل والتقسيم
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a2018] hover:bg-[#382b21] text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#140f0c] rounded-2xl my-4 border border-[#2b2018]">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'files'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>ملفات الهاتف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('folder')}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'folder'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>مجلد كامل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'record'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>تسجيل مايك</span>
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === 'files' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                اختر أغانيك أو تسجيلاتك من الهاتف
              </h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                يدعم صيغ MP3، M4A، WAV، AAC، FLAC، وتسجيلات الهاتف الصوتية (يمكنك تحديد عدة ملفات دفعة واحدة).
              </p>
            </div>

            {/* Hidden Input for multiple files */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.opus,.flac,.amr,.webm,.wma"
              onChange={handleFilesSelected}
              className="hidden"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>فتح متصفح ملفات الهاتف 📱</span>
            </button>
          </div>
        )}

        {activeTab === 'folder' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <FolderPlus className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                استيراد مجلد موسيقى كامل
              </h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                اختر مجلد (مثل مجلد Downloads أو Music أو Recordings) وسيقوم MR باستيراد كافة الملفات الصوتية داخله فوراً.
              </p>
            </div>

            {/* Hidden Input for directory */}
            <input
              ref={folderInputRef}
              type="file"
              // @ts-ignore
              webkitdirectory="true"
              directory="true"
              multiple
              onChange={handleFolderSelected}
              className="hidden"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => folderInputRef.current?.click()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>اختيار مجلد من الهاتف 📁</span>
            </button>
          </div>
        )}

        {activeTab === 'record' && (
          <div className="py-2 space-y-4 text-center">
            {!recordedBlob ? (
              <div className="space-y-4 py-2">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
                    isRecording
                      ? 'bg-red-500/20 text-red-500 border-2 border-red-500 animate-pulse scale-110'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}
                >
                  <Mic className="w-9 h-9" />
                </div>

                <div>
                  <div className="text-2xl font-mono font-bold text-white mb-1">
                    {formatTime(recordingTime, true)}
                  </div>
                  <p className="text-xs text-stone-400">
                    {isRecording ? 'جارِ التسجيل من مايكروفون الهاتف...' : 'انقر على الزر أدناه لبدء التسجيل'}
                  </p>
                </div>

                {isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>إيقاف التسجيل وحفظه</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    <span>بدء تسجيل صوتي جديد 🎙️</span>
                  </button>
                )}
              </div>
            ) : (
              /* Recorded Preview & Save */
              <div className="space-y-3 py-1 text-right">
                <div className="bg-[#150f0c] p-3 rounded-2xl border border-[#30251d]">
                  <div className="text-xs text-stone-400 mb-1">عنوان التسجيل:</div>
                  <input
                    type="text"
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    className="w-full bg-[#201712] border border-stone-700 focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2">
                    <span>المدة: {formatTime(recordingTime)}</span>
                    <span className="text-emerald-400 font-bold">جاهز للإضافة إلى MR</span>
                  </div>
                </div>

                {recordedUrl && (
                  <audio
                    ref={recordedAudioRef}
                    src={recordedUrl}
                    controls
                    className="w-full h-9 rounded-xl"
                  />
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleSaveRecording}
                    className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    إضافة إلى قائمة الأغاني في MR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecordedBlob(null);
                      setRecordedUrl(null);
                      setRecordingTime(0);
                    }}
                    className="px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors cursor-pointer"
                  >
                    إعادة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-3 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span>{processingStatus}</span>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#30251d] text-center text-[10px] text-stone-500">
          تطبيق MR يحفظ ملفاتك وتقسيماتك بأمان على ذاكرة هاتفك بدون الحاجة للاتصال بالإنترنت.
        </div>
      </div>
    </div>
  );
};
