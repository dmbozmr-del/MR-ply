import React, { useState } from 'react';
import { Video, Play, X, Clock, Eye, Sparkles, Upload } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  resolution: string;
  views: string;
  thumbnail: string;
  videoUrl: string;
}

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'ميدلي شرقي وتقاسيم عود أندلسية مباشرة من المسرح الكبير',
    artist: 'فرقة التراث والأوتار الشرقية',
    duration: '06:45',
    resolution: '1080p Full HD',
    views: '1.2M مشاهدة',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'vid-2',
    title: 'عزف صولو قانون وإيقاعات حية (صولوهات طربية)',
    artist: 'عازف القانون الرئيسي',
    duration: '04:20',
    resolution: 'HD 720p',
    views: '840K مشاهدة',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'vid-3',
    title: 'جلسة لو-فاي بيانو هادئة مع مؤثرات المطر وضوء النيون',
    artist: 'Chill Beats Studio',
    duration: '12:30',
    resolution: '4K Ultra HD',
    views: '2.5M مشاهدة',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'vid-4',
    title: 'مهرجان وميكس حفلات إلكترونية حماسية لايف',
    artist: 'DJ Nova Live Festival',
    duration: '08:15',
    resolution: '1080p 60fps',
    views: '530K مشاهدة',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
];

export const LarkVideoView: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  return (
    <div className="space-y-4 pb-24" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#1f1915] rounded-2xl border border-stone-800">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-orange-400" />
            <span>مشغل ومكتبة الفيديوهات (Lark Video Player)</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            شاهد كليبات الحفلات والأغاني المصورة بجودة عالية مع دعم المشاهدة العائمة
          </p>
        </div>

        <label className="text-xs px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5 text-orange-400" />
          <span>فتح فيديو من الهاتف</span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setActiveVideo({
                  id: `custom-${Date.now()}`,
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  artist: 'فيديو محلي من هاتفك',
                  duration: 'مخصص',
                  resolution: 'Local',
                  views: 'ملف محلي',
                  thumbnail:
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
                  videoUrl: url,
                });
              }
            }}
          />
        </label>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {SAMPLE_VIDEOS.map((vid) => (
          <div
            key={vid.id}
            onClick={() => setActiveVideo(vid)}
            className="bg-[#1c1714] border border-stone-800/80 hover:border-orange-500/40 rounded-2xl overflow-hidden group cursor-pointer transition-all hover:-translate-y-0.5 shadow-md flex flex-col"
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
              <img
                src={vid.thumbnail}
                alt={vid.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-orange-600/90 group-hover:bg-orange-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <span className="text-[10px] font-mono bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded-md text-white font-bold">
                  {vid.duration}
                </span>
                <span className="text-[10px] bg-orange-500/80 px-1.5 py-0.5 rounded-md text-white font-semibold">
                  {vid.resolution}
                </span>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <h4 className="text-sm font-bold text-white group-hover:text-orange-400 line-clamp-2 leading-snug">
                {vid.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-stone-400 mt-2">
                <span>{vid.artist}</span>
                <span className="text-[11px] text-stone-500">{vid.views}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl bg-[#181412] border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-[#201a16]">
              <div className="min-w-0 flex-1 pl-3">
                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                  {activeVideo.title}
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">{activeVideo.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Native Video Player */}
            <div className="aspect-video w-full bg-black">
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
