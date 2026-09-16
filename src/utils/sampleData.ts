import { AudioTrack, Playlist, EqualizerPreset } from '../types';
import { SEGMENT_PALETTE } from './formatters';

// Optional demo long recording (0309_260426) for quick audio testing if user desires
export const DEMO_RECORDING_TRACK: AudioTrack = {
  id: 'rec-0309-260426',
  title: '0309_260426',
  artist: 'تسجيل صوتي',
  album: 'Quick Share',
  duration: 372, // 06:12
  src: '/audio/demo.mp3',
  fileType: 'sample',
  folder: 'My Recording - Quick Share',
  addedAt: Date.now() - 5000,
  hasLyrics: true,
  lyrics: `تسجيل صوتي: 0309_260426
تم تقسيم هذا المقطع إلى أجزاء داخل الأغنية:
- الجزء 1 (00:00 - 01:25)
- الجزء 2 (01:25 - 02:50)
- الجزء 3 (02:50 - 04:30)
- الجزء 4 (04:30 - 06:12)
يمكنك النقر مباشرة على علامات التقسيم في شريط التقدم للتنقل بين الأجزاء دون فصلها خارج الأغنية.`,
  segments: [
    {
      id: 'seg-rec-1',
      trackId: 'rec-0309-260426',
      title: 'اغنية 1',
      artist: 'تسجيل صوتي',
      album: '0309_260426',
      startTime: 0,
      endTime: 85,
      color: '#f97316',
      tags: ['تسجيل', 'اغنية 1'],
      notes: 'الجزء الأول من التسجيل',
      isFavorite: true,
      createdAt: Date.now() - 4000,
    },
    {
      id: 'seg-rec-2',
      trackId: 'rec-0309-260426',
      title: 'اغنية 2',
      artist: 'تسجيل صوتي',
      album: '0309_260426',
      startTime: 85,
      endTime: 170,
      color: '#fb923c',
      tags: ['تسجيل', 'اغنية 2'],
      notes: 'الجزء الثاني داخل الأغنية',
      isFavorite: false,
      createdAt: Date.now() - 3000,
    },
    {
      id: 'seg-rec-3',
      trackId: 'rec-0309-260426',
      title: 'اغنية 3',
      artist: 'تسجيل صوتي',
      album: '0309_260426',
      startTime: 170,
      endTime: 270,
      color: '#f97316',
      tags: ['تسجيل', 'اغنية 3'],
      isFavorite: false,
      createdAt: Date.now() - 2000,
    },
    {
      id: 'seg-rec-4',
      trackId: 'rec-0309-260426',
      title: 'اغنية 4',
      artist: 'تسجيل صوتي',
      album: '0309_260426',
      startTime: 270,
      endTime: 372,
      color: '#fb923c',
      tags: ['تسجيل', 'اغنية 4'],
      isFavorite: false,
      createdAt: Date.now() - 1000,
    },
  ],
};

// No pre-loaded songs on the app as explicitly requested by user ("ليس اغاني محمله علي التطبيق")
export const SAMPLE_TRACKS: AudioTrack[] = [];

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { id: 'flat', name: 'عادي (افتراضي)', bands: [0, 0, 0, 0, 0], bassBoost: 0 },
  { id: 'tarab', name: 'طرب شرقي', bands: [3, 2, -1, 4, 5], bassBoost: 25 },
  { id: 'shaabi', name: 'شعبي ومهرجانات', bands: [6, 4, 1, 5, 6], bassBoost: 60 },
  { id: 'bass', name: 'مضخم الباس (Bass Boost)', bands: [8, 6, 2, -1, -2], bassBoost: 85 },
  { id: 'vocal', name: 'صوت بشري / بودكاست', bands: [-2, 1, 5, 4, 1], bassBoost: 10 },
  { id: 'pop', name: 'بوب (Pop)', bands: [2, 4, 3, 2, 4], bassBoost: 30 },
];

export const SAMPLE_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-favorites',
    name: 'أغاني مفضلة',
    description: 'قائمة الأغاني والمقاطع المفضلة في تطبيق MR',
    colorGradient: 'from-amber-600 to-orange-600',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    items: [],
  },
];
