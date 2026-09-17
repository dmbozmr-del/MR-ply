import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Music,
  Check,
  Sparkles,
  Link as LinkIcon,
  AlignLeft,
  User,
  Disc,
  Folder,
} from 'lucide-react';
import { AudioTrack, TrackSegment, UnifiedSongItem } from '../types';

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: AudioTrack | UnifiedSongItem | TrackSegment | null;
  onSave: (
    id: string,
    updates: {
      title: string;
      artist: string;
      album: string;
      folder?: string;
      coverArt?: string;
      lyrics?: string;
    }
  ) => void;
}

// Curated aesthetic preset cover arts for instant selection
const PRESET_COVERS = [
  {
    id: 'preset-vinyl',
    name: 'أسطوانة فينيل',
    url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-sunset',
    name: 'غروب كلاسيكي',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-acoustic',
    name: 'جيتار وأوتار',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-studio',
    name: 'مايك استوديو',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-piano',
    name: 'بيانو كلاسيك',
    url: 'https://images.unsplash.com/photo-1520523839898-50712128779c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-neon',
    name: 'أضواء نيون',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
  },
];

export const EditSongModal: React.FC<EditSongModalProps> = ({
  isOpen,
  onClose,
  song,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [folder, setFolder] = useState('');
  const [coverArt, setCoverArt] = useState<string | undefined>(undefined);
  const [lyrics, setLyrics] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'cover' | 'lyrics'>('info');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state whenever the selected song changes
  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setAlbum((song as any).album || '');
      setFolder((song as any).folder || '');
      setCoverArt(song.coverArt || undefined);
      setLyrics((song as any).lyrics || '');
      setCustomUrlInput('');
      setShowUrlInput(false);
      setActiveTab('info');
    }
  }, [song]);

  if (!isOpen || !song) return null;

  // Handle local image file upload and resize to keep IndexedDB light
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 600x600 using canvas for great quality & low storage footprint
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCoverArt(dataUrl);
        } else {
          setCoverArt(loadEvt.target?.result as string);
        }
      };
      img.src = loadEvt.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be picked again if desired
    e.target.value = '';
  };

  const handleApplyUrl = () => {
    if (customUrlInput.trim()) {
      setCoverArt(customUrlInput.trim());
      setShowUrlInput(false);
      setCustomUrlInput('');
    }
  };

  const handleRemoveCover = () => {
    setCoverArt(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('يرجى إدخال اسم للأغنية');
      return;
    }

    onSave(song.id, {
      title: title.trim(),
      artist: artist.trim() || 'فنان غير معروف',
      album: album.trim() || 'ألبوم غير معروف',
      folder: folder.trim() || undefined,
      coverArt,
      lyrics: lyrics.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        id="edit-song-modal"
        className="w-full max-w-lg bg-[#18120e] border border-[#38281d] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#2e2117] flex items-center justify-between bg-gradient-to-l from-orange-950/40 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                تعديل تفاصيل الأغنية والغلاف
              </h3>
              <p className="text-xs text-stone-400">
                تغيير اسم الأغنية، الفنان، وإضافة صورة غلاف جميلة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#2e2117] bg-[#140e0b] px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>بيانات الأغنية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cover')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cover'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>صورة الغلاف</span>
            {coverArt && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lyrics')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lyrics'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>الكلمات والملاحظات</span>
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* TAB 1: Song Information */}
          {activeTab === 'info' && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Cover & Quick Preview Header */}
              <div className="p-3 rounded-2xl bg-[#221812] border border-[#3b2a1e] flex items-center gap-3.5">
                {/* Cover Thumbnail */}
                <div
                  onClick={() => setActiveTab('cover')}
                  className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#18110c] border border-orange-500/30 flex items-center justify-center shrink-0 group cursor-pointer shadow-md"
                  title="انقر لتغيير الصورة"
                >
                  {coverArt ? (
                    <img
                      src={coverArt}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-orange-950 to-[#281a12] flex items-center justify-center text-orange-400">
                      <Music className="w-7 h-7" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>

                {/* Preview Info */}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block mb-0.5">
                    معاينة حية في التطبيق
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">
                    {title || 'عنوان الأغنية'}
                  </h4>
                  <p className="text-xs text-stone-400 truncate">
                    {artist || 'اسم الفنان'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('cover')}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-orange-600/20 text-orange-300 hover:bg-orange-600/30 border border-orange-500/30 transition-colors shrink-0 font-bold cursor-pointer"
                >
                  تغيير الصورة
                </button>
              </div>

              {/* Song Title Input */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-orange-400" />
                  <span>اسم الأغنية / التسجيل *</span>
                </label>
                <input
                  id="edit-song-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: موال الصبا، رقصة الربيع، أغنية 1..."
                  required
                  className="w-full bg-[#120d0a] border border-[#3b2a1e] focus:border-orange-500 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Artist Name Input */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>اسم الفنان / المؤدي</span>
                </label>
                <input
                  id="edit-song-artist-input"
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="مثال: فيروز، أم كلثوم، محمد عبده، تسجيل شخصي..."
                  className="w-full bg-[#120d0a] border border-[#3b2a1e] focus:border-orange-500 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Album & Folder Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-orange-400" />
                    <span>اسم الألبوم</span>
                  </label>
                  <input
                    id="edit-song-album-input"
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="مثال: تسجيلات 2026، روائع الزمن الجميل..."
                    className="w-full bg-[#120d0a] border border-[#3b2a1e] focus:border-orange-500 rounded-2xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-orange-400" />
                    <span>المجلد أو التصنيف</span>
                  </label>
                  <input
                    id="edit-song-folder-input"
                    type="text"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="مثال: موسيقى، تسجيلات الهاتف، حفلات..."
                    className="w-full bg-[#120d0a] border border-[#3b2a1e] focus:border-orange-500 rounded-2xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cover Art Management */}
          {activeTab === 'cover' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Big Cover Art Preview & Upload Center */}
              <div className="p-4 rounded-2xl bg-[#221812] border border-[#3b2a1e] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                {/* Big Preview Box */}
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-[#150e0a] border-2 border-orange-500/40 shadow-xl flex items-center justify-center shrink-0 group">
                  {coverArt ? (
                    <img
                      src={coverArt}
                      alt="غلاف الأغنية"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#382012] to-[#1a100a] flex flex-col items-center justify-center text-orange-400 gap-1">
                      <Music className="w-10 h-10" />
                      <span className="text-[10px] text-stone-400">لا توجد صورة</span>
                    </div>
                  )}

                  {/* Quick Upload on Click */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-xs gap-1"
                  >
                    <Upload className="w-5 h-5" />
                    <span>رفع صورة</span>
                  </div>
                </div>

                {/* Cover Controls */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white">
                    {coverArt ? 'صورة الغلاف محددة' : 'اختر صورة غلاف للأغنية'}
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    يمكنك رفع صورة من هاتفك أو جهازك، أو لصق رابط صورة، أو الاختيار من الأغلفة الفنية الجاهزة أدناه.
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    {/* Native File Upload Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-950/40 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع من الجهاز 📱</span>
                    </button>

                    {/* URL Option Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-2 rounded-xl bg-[#2d1f16] hover:bg-[#3d2a1f] text-stone-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-stone-700 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>رابط صورة</span>
                    </button>

                    {/* Remove Cover Button */}
                    {coverArt && (
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-600/30 cursor-pointer"
                        title="إزالة صورة الغلاف والعودة للشعار الافتراضي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>إزالة</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Direct Image URL input if opened */}
              {showUrlInput && (
                <div className="p-3 rounded-2xl bg-[#140e0b] border border-orange-500/30 space-y-2 animate-fadeIn">
                  <label className="text-xs font-bold text-stone-300 block">
                    رابط الصورة المباشر (URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      className="flex-1 bg-[#1e1510] border border-stone-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              )}

              {/* Aesthetic Preset Covers */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>أو اختر من أغلفة الألبومات الجاهزة:</span>
                  </span>
                  <span className="text-[10px] text-stone-500">نقرة واحدة للتطبيق</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_COVERS.map((preset) => {
                    const isSelected = coverArt === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setCoverArt(preset.url)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105 shadow-lg'
                            : 'border-stone-800 hover:border-orange-500/50 hover:scale-102'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[9px] font-bold text-stone-200 truncate w-full">
                            {preset.name}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Lyrics & Notes */}
          {activeTab === 'lyrics' && (
            <div className="space-y-3 animate-fadeIn">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-orange-400" />
                  <span>كلمات الأغنية (تظهر في المشغل الكبير أثناء الاستماع)</span>
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="أدخل كلمات الأغنية هنا بيتاً بيتاً... ستظهر الكلمات في شاشة المشغل الكبير مع إمكانية التمرير وقراءتها أثناء التشغيل."
                  rows={8}
                  className="w-full bg-[#120d0a] border border-[#3b2a1e] focus:border-orange-500 rounded-2xl p-3.5 text-sm text-white focus:outline-none transition-colors leading-relaxed font-sans custom-scrollbar"
                />
              </div>
              <p className="text-[11px] text-stone-400">
                💡 عند إضافة كلمات، ستظهر شارة &quot;الكلمات&quot; بجانب اسم الأغنية مع زر خاص لعرض الكلمات في المشغل.
              </p>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-[#2e2117] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-[#241913] hover:bg-[#30221a] text-stone-300 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-l from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-xl shadow-orange-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
