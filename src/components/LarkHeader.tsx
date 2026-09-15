import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sliders,
  ArrowUpDown,
  Video,
  Music,
  ListMusic,
  Folder,
  Scissors,
  Smartphone,
  Check,
  X,
  Sparkles,
  Plus,
} from 'lucide-react';
import { SortField, SortOrder } from '../types';

interface LarkHeaderProps {
  activeTab: 'songs' | 'playlists' | 'folders' | 'slicer' | 'videos';
  onTabChange: (tab: 'songs' | 'playlists' | 'folders' | 'slicer' | 'videos') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  onOpenEqualizer: () => void;
  onOpenPhonePlayer: () => void;
  onOpenImporter?: () => void;
  tracksCount: number;
  playlistsCount: number;
}

export const LarkHeader: React.FC<LarkHeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange,
  onOpenEqualizer,
  onOpenPhonePlayer,
  onOpenImporter,
  tracksCount,
  playlistsCount,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'title', label: 'العنوان' },
    { field: 'artist', label: 'الفنان' },
    { field: 'album', label: 'الألبوم' },
    { field: 'duration', label: 'المدة الزمنية' },
    { field: 'addedAt', label: 'تاريخ الإضافة' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#161311]/95 backdrop-blur-md border-b border-[#28221c]" dir="rtl">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-3">
        {/* Right side: MR Mascot & Brand Name */}
        <div className="flex items-center gap-2.5">
          {/* MR Monogram Badge */}
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 p-0.5 shadow-lg shadow-orange-600/30 flex items-center justify-center shrink-0 group">
            <div className="w-full h-full bg-[#1c1511] rounded-[14px] flex items-center justify-center relative overflow-hidden border border-orange-500/20">
              {/* MR letters */}
              <span className="text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-tr from-orange-400 to-amber-300 font-sans">
                MR
              </span>
              {/* Mini glowing equalizer bar */}
              <div className="absolute bottom-1 flex items-end gap-0.5 h-1.5 opacity-80">
                <div className="w-0.5 h-1 bg-orange-400 rounded-full" />
                <div className="w-0.5 h-1.5 bg-amber-400 rounded-full" />
                <div className="w-0.5 h-0.5 bg-orange-500 rounded-full" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white font-sans">
                MR
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold hidden xs:inline-block">
                هاتف
              </span>
            </div>
            <p className="text-[10px] text-stone-400 hidden sm:block">
              مشغل الصوتيات والتسجيلات وتقسيم النغمات
            </p>
          </div>
        </div>

        {/* Left side: Header Tool Icons (Equalizer, Sort, Search, + Phone Import) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Direct Phone Audio Importer Button */}
          {onOpenImporter && (
            <button
              type="button"
              onClick={onOpenImporter}
              className="flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow-md shadow-orange-600/30 active:scale-95 cursor-pointer"
              title="إضافة أغانٍ أو تسجيلات من الهاتف"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">إضافة من الهاتف</span>
              <Smartphone className="w-3 h-3 xs:hidden" />
            </button>
          )}

          {/* Equalizer Icon Button */}
          <button
            id="lark-header-eq-btn"
            type="button"
            onClick={onOpenEqualizer}
            className="w-9 h-9 rounded-full bg-[#26201a] hover:bg-[#342b23] text-stone-300 hover:text-orange-400 flex items-center justify-center transition-colors cursor-pointer border border-stone-800/80"
            title="معادل الصوت والمؤثرات (Equalizer)"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Sort Menu Button */}
          <div className="relative" ref={sortMenuRef}>
            <button
              id="lark-header-sort-btn"
              type="button"
              onClick={() => setIsSortMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                isSortMenuOpen
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-[#26201a] hover:bg-[#342b23] text-stone-300 border-stone-800/80'
              }`}
              title="فرز وترتيب الأغاني"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Sort Dropdown Popup */}
            {isSortMenuOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-[#1f1a16] border border-stone-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn text-xs">
                <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 border-b border-stone-800">
                  ترتيب القائمة حسب:
                </div>

                <div className="py-1 space-y-0.5">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => {
                        onSortChange(opt.field, sortOrder);
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-right transition-colors cursor-pointer ${
                        sortField === opt.field
                          ? 'bg-orange-500/20 text-orange-400 font-bold'
                          : 'text-stone-300 hover:bg-[#2c241e]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortField === opt.field && <Check className="w-3.5 h-3.5 text-orange-400" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-stone-800 pt-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange(sortField, sortOrder === 'asc' ? 'desc' : 'asc');
                      setIsSortMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#28211b] hover:bg-[#342b23] text-stone-200 text-center font-medium transition-colors"
                  >
                    تبديل: {sortOrder === 'asc' ? 'تصاعدي (أ ⟵ ي)' : 'تنازلي (ي ⟵ أ)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Icon Toggle Button */}
          <button
            id="lark-header-search-btn"
            type="button"
            onClick={handleToggleSearch}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
              isSearchOpen || searchQuery
                ? 'bg-orange-600 text-white border-orange-500'
                : 'bg-[#26201a] hover:bg-[#342b23] text-stone-300 border-stone-800/80'
            }`}
            title="بحث فوري في الأغاني"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Phone Player Shortcut */}
          <button
            type="button"
            onClick={onOpenPhonePlayer}
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 font-bold transition-all cursor-pointer mr-1"
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-400" />
            <span>مشغل الهاتف</span>
          </button>
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {isSearchOpen && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2.5 animate-fadeIn">
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن اسم الأغنية، الفنان، الألبوم، أو الكلمات..."
              className="w-full bg-[#241e19] border border-orange-500/40 focus:border-orange-500 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <Search className="absolute right-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute left-3 w-5 h-5 rounded-full bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Pills Navigation (Identical to Lark Player Screenshot) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {/* 1. الفيديوهات (Videos) */}
          <button
            id="tab-videos"
            type="button"
            onClick={() => onTabChange('videos')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'videos'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 font-bold shadow-md shadow-orange-500/25'
                : 'bg-[#221c17] text-stone-300 border-stone-800 hover:bg-[#2e261f]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>الفيديوهات</span>
          </button>

          {/* 2. الأغاني (Songs) - ACTIVE in screenshot */}
          <button
            id="tab-songs"
            type="button"
            onClick={() => onTabChange('songs')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'songs'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 font-bold shadow-md shadow-orange-500/25'
                : 'bg-[#221c17] text-stone-300 border-stone-800 hover:bg-[#2e261f]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>الأغاني</span>
            <span className="text-[10px] opacity-80">({tracksCount})</span>
          </button>

          {/* 3. قوائم التشغيل (Playlists) */}
          <button
            id="tab-playlists"
            type="button"
            onClick={() => onTabChange('playlists')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'playlists'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 font-bold shadow-md shadow-orange-500/25'
                : 'bg-[#221c17] text-stone-300 border-stone-800 hover:bg-[#2e261f]'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>قوائم التشغيل</span>
            <span className="text-[10px] opacity-80">({playlistsCount})</span>
          </button>

          {/* 4. مجلدات (Folders) */}
          <button
            id="tab-folders"
            type="button"
            onClick={() => onTabChange('folders')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'folders'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 font-bold shadow-md shadow-orange-500/25'
                : 'bg-[#221c17] text-stone-300 border-stone-800 hover:bg-[#2e261f]'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>مجلدات</span>
          </button>

          {/* 5. استوديو التقطيع / النغمات (Ringtone Maker / Slicer) */}
          <button
            id="tab-slicer"
            type="button"
            onClick={() => onTabChange('slicer')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTab === 'slicer'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 font-bold shadow-md shadow-orange-500/25'
                : 'bg-[#221c17] text-stone-300 border-stone-800 hover:bg-[#2e261f]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>صانع النغمات والتقطيع</span>
          </button>
        </div>
      </div>
    </header>
  );
};
