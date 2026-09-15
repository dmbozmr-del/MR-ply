export interface TrackSegment {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  color: string;     // hex or tailwind color for timeline display
  tags?: string[];
  notes?: string;
  isFavorite?: boolean;
  folder?: string;
  hasLyrics?: boolean;
  lyrics?: string;
  createdAt: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  src: string;
  fileType: 'sample' | 'upload' | 'url';
  originalFile?: File;
  waveform?: number[];
  coverArt?: string;
  folder?: string;
  hasLyrics?: boolean;
  lyrics?: string;
  segments: TrackSegment[];
  addedAt: number;
}

export interface SelectionRange {
  start: number;
  end: number;
}

export interface AudioPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  activeSegmentId: string | null;
  isLoopingSegment: boolean;
}

export interface PlaylistItem {
  id: string;
  trackId: string;
  segmentId?: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  startTime: number;
  endTime?: number;
  src: string;
  coverArt?: string;
  color?: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  colorGradient?: string;
  createdAt: number;
  updatedAt: number;
  items: PlaylistItem[];
}

export type SortField = 'title' | 'artist' | 'album' | 'duration' | 'addedAt';
export type SortOrder = 'asc' | 'desc';

export interface UnifiedSongItem {
  id: string;
  type: 'segment' | 'fullTrack';
  trackId: string;
  segmentId?: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  startTime: number;
  endTime: number;
  src: string;
  coverArt?: string;
  color?: string;
  tags?: string[];
  notes?: string;
  folder?: string;
  hasLyrics?: boolean;
  lyrics?: string;
  isFavorite?: boolean;
  addedAt: number;
}

export interface EqualizerBand {
  frequency: number; // Hz
  gain: number;      // -12 to +12 dB
  label: string;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  bands: number[]; // 5 gain values in dB (-12 to +12)
  bassBoost?: number; // 0 to 100
}
