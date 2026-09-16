import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Music,
  Scissors,
  Bookmark,
  Sparkles,
  HelpCircle,
  Volume2,
  ListMusic,
  Disc3,
  Search,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Info,
  Radio,
  Plus,
} from 'lucide-react';
import {
  AudioTrack,
  TrackSegment,
  SelectionRange,
  Playlist,
  PlaylistItem,
  UnifiedSongItem,
} from './types';
import { DEMO_RECORDING_TRACK, SAMPLE_TRACKS, SAMPLE_PLAYLISTS } from './utils/sampleData';
import { WaveformTimeline } from './components/WaveformTimeline';
import { PlayerControls } from './components/PlayerControls';
import { SegmentManager } from './components/SegmentManager';
import { TrackList } from './components/TrackList';
import { AudioSourceSelector } from './components/AudioSourceSelector';
import { ExportModal } from './components/ExportModal';
import { AdvancedSearch } from './components/AdvancedSearch';
import { PlaylistManager } from './components/PlaylistManager';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { MobilePhonePlayer } from './components/MobilePhonePlayer';
import { MobileMiniPlayer } from './components/MobileMiniPlayer';
import { LarkHeader } from './components/LarkHeader';
import { LarkSongList } from './components/LarkSongList';
import { LarkFolderView } from './components/LarkFolderView';
import { LarkVideoView } from './components/LarkVideoView';
import { LarkMiniPlayer } from './components/LarkMiniPlayer';
import { EqualizerModal } from './components/EqualizerModal';
import { PhoneAudioImporter } from './components/PhoneAudioImporter';
import { savePhoneTrack, loadPhoneTracks } from './utils/phoneAudioStorage';
import { extractAndDownloadSegment, generateWaveformPeaks } from './utils/audioExporter';
import { formatTime } from './utils/formatters';
import { SortField, SortOrder } from './types';

const STORAGE_KEY = 'mr_player_tracks_v1';
const PLAYLISTS_STORAGE_KEY = 'mr_player_playlists_v1';

type AppTab = 'songs' | 'playlists' | 'folders' | 'slicer' | 'videos';

export default function App() {
  // Navigation Tabs state - default to 'songs'
  const [activeTab, setActiveTab] = useState<AppTab>('songs');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isImporterOpen, setIsImporterOpen] = useState<boolean>(false);

  // All tracks state - empty by default (no preloaded songs)
  const [tracks, setTracks] = useState<AudioTrack[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    return SAMPLE_TRACKS; // []
  });

  // Custom Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading playlists from localStorage', e);
    }
    return SAMPLE_PLAYLISTS;
  });

  // Load persistently stored phone tracks from IndexedDB on startup
  useEffect(() => {
    loadPhoneTracks().then((phoneTracks) => {
      if (phoneTracks && phoneTracks.length > 0) {
        setTracks((prev) => {
          const prevMap = new Map<string, AudioTrack>(prev.map((t) => [t.id, t]));
          // Merge with fresh object URLs created by loadPhoneTracks()
          const mergedPhoneTracks = phoneTracks.map((pt) => {
            const existing = prevMap.get(pt.id);
            if (existing) {
              return {
                ...existing,
                src: pt.src, // CRITICAL: Use fresh valid Blob URL
                originalFile: pt.originalFile || existing.originalFile,
                segments:
                  existing.segments && existing.segments.length > 0
                    ? existing.segments
                    : pt.segments,
              };
            }
            return pt;
          });

          // Keep non-phone tracks (e.g. sample demo or URL tracks)
          const phoneIdSet = new Set(phoneTracks.map((p) => p.id));
          const nonPhoneTracks = prev.filter(
            (t) => !phoneIdSet.has(t.id) && t.fileType !== 'upload'
          );

          return [...mergedPhoneTracks, ...nonPhoneTracks];
        });
        setActiveTrackId((prev) => prev || phoneTracks[0].id);
      }
    });
  }, []);

  const [activeTrackId, setActiveTrackId] = useState<string>(() => {
    return tracks[0]?.id || '';
  });

  // Current active track object (can be null if user hasn't added songs yet)
  const currentTrack: AudioTrack | null =
    tracks.find((t) => t.id === activeTrackId) || tracks[0] || null;

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(currentTrack?.duration || 0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [isLoopingSegment, setIsLoopingSegment] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  // Active playlist queue for continuous or shuffle playback
  const [activePlaylistQueue, setActivePlaylistQueue] = useState<{
    playlistId: string;
    playlistName: string;
    items: PlaylistItem[];
    currentIndex: number;
  } | null>(null);

  // Selection range for segment creation in Slicer [A -> B]
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(() => ({
    start: 0,
    end: currentTrack ? Math.min(180, currentTrack.duration || 180) : 0,
  }));

  // Segment currently being edited in Slicer
  const [editingSegment, setEditingSegment] = useState<TrackSegment | null>(null);

  // Waveform peaks cache
  const [waveformPeaks, setWaveformPeaks] = useState<number[] | undefined>(currentTrack?.waveform);

  // Modals & UI flags
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isPhonePlayerOpen, setIsPhonePlayerOpen] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<
    UnifiedSongItem | TrackSegment | AudioTrack | null
  >(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewStopTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Save changes to localStorage whenever tracks change
  useEffect(() => {
    try {
      const storableTracks = tracks.map((t) => {
        const { originalFile, ...rest } = t;
        return rest;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storableTracks));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [tracks]);

  // Save changes to localStorage whenever playlists change
  useEffect(() => {
    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Playlists save error', e);
    }
  }, [playlists]);

  // Load waveform peaks when active track changes
  useEffect(() => {
    if (!currentTrack) {
      setWaveformPeaks(undefined);
      setDuration(0);
      return;
    }
    setDuration(currentTrack.duration || 0);
    if (currentTrack.waveform && currentTrack.waveform.length > 0) {
      setWaveformPeaks(currentTrack.waveform);
    } else if (currentTrack.src) {
      generateWaveformPeaks(currentTrack.src)
        .then((peaks) => {
          setWaveformPeaks(peaks);
          setTracks((prev) =>
            prev.map((t) => (t.id === currentTrack.id ? { ...t, waveform: peaks } : t))
          );
        })
        .catch(() => {
          setWaveformPeaks(undefined);
        });
    }
  }, [currentTrack?.id, currentTrack?.src]);

  // Handle active track change
  const handleSelectTrack = (trackId: string) => {
    if (trackId === activeTrackId) return;
    const target = tracks.find((t) => t.id === trackId);
    if (!target) return;

    setActiveTrackId(trackId);
    setActiveSegmentId(null);
    setActivePlaylistQueue(null);
    setCurrentTime(0);
    setDuration(target.duration);
    setSelectionRange({
      start: 0,
      end: Math.min(180, target.duration || 180),
    });

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = target.src;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      setIsPlaying(false);
    }
  };

  // Synchronize audio element settings
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Play next queue item helper
  const playQueueIndex = useCallback(
    (queue: { playlistId: string; playlistName: string; items: PlaylistItem[]; currentIndex: number }, index: number) => {
      if (index < 0 || index >= queue.items.length) return;
      const item = queue.items[index];
      const targetTrack = tracks.find((t) => t.id === item.trackId);
      if (!targetTrack) return;

      setActivePlaylistQueue({ ...queue, currentIndex: index });

      if (targetTrack.id !== activeTrackId) {
        setActiveTrackId(targetTrack.id);
      }
      setActiveSegmentId(item.segmentId || null);

      if (audioRef.current) {
        if (audioRef.current.src !== targetTrack.src) {
          audioRef.current.src = targetTrack.src;
          audioRef.current.load();
        }
        audioRef.current.currentTime = item.startTime || 0;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      setCurrentTime(item.startTime || 0);
      setDuration(targetTrack.duration);
      if (item.endTime) {
        setSelectionRange({ start: item.startTime, end: item.endTime });
      }
      showToast(`تشغيل: ${item.title}`);
    },
    [tracks, activeTrackId, showToast]
  );

  // Navigate forward (Next item / segment / track)
  const handleNext = useCallback(() => {
    if (activePlaylistQueue && activePlaylistQueue.items.length > 0) {
      let nextIndex = activePlaylistQueue.currentIndex + 1;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * activePlaylistQueue.items.length);
      } else if (nextIndex >= activePlaylistQueue.items.length) {
        nextIndex = 0;
      }
      playQueueIndex(activePlaylistQueue, nextIndex);
      return;
    }

    // Otherwise next segment in current track
    const segs = currentTrack?.segments || [];
    if (segs.length > 0) {
      const currentIndex = segs.findIndex((s) => s.id === activeSegmentId);
      const nextIndex = currentIndex < segs.length - 1 ? currentIndex + 1 : 0;
      const nextSeg = segs[nextIndex];
      setActiveSegmentId(nextSeg.id);
      setSelectionRange({ start: nextSeg.startTime, end: nextSeg.endTime });
      if (audioRef.current) {
        audioRef.current.currentTime = nextSeg.startTime;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      showToast(`تشغيل: ${nextSeg.title}`);
    }
  }, [activePlaylistQueue, isShuffle, playQueueIndex, currentTrack?.segments, activeSegmentId, showToast]);

  // Navigate backward (Previous item / segment)
  const handlePrev = useCallback(() => {
    if (activePlaylistQueue && activePlaylistQueue.items.length > 0) {
      let prevIndex = activePlaylistQueue.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = activePlaylistQueue.items.length - 1;
      }
      playQueueIndex(activePlaylistQueue, prevIndex);
      return;
    }

    const segs = currentTrack?.segments || [];
    if (segs.length > 0) {
      const currentIndex = segs.findIndex((s) => s.id === activeSegmentId);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : segs.length - 1;
      const prevSeg = segs[prevIndex];
      setActiveSegmentId(prevSeg.id);
      setSelectionRange({ start: prevSeg.startTime, end: prevSeg.endTime });
      if (audioRef.current) {
        audioRef.current.currentTime = prevSeg.startTime;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      showToast(`تشغيل: ${prevSeg.title}`);
    }
  }, [activePlaylistQueue, playQueueIndex, currentTrack?.segments, activeSegmentId, showToast]);

  // HTMLAudioElement event handlers
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    // If an active segment or playlist item with bounds is being played
    if (activeSegmentId && currentTrack) {
      const activeSeg = currentTrack.segments.find((s) => s.id === activeSegmentId);
      if (activeSeg) {
        if (time >= activeSeg.endTime) {
          if (isLoopingSegment) {
            audioRef.current.currentTime = activeSeg.startTime;
          } else if (activePlaylistQueue) {
            // Auto advance to next song in the playlist!
            handleNext();
          } else {
            audioRef.current.pause();
            setIsPlaying(false);
            setActiveSegmentId(null);
          }
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (dur && !isNaN(dur) && isFinite(dur)) {
      setDuration(dur);
      if (currentTrack) {
        setTracks((prev) =>
          prev.map((t) => (t.id === currentTrack.id ? { ...t, duration: dur } : t))
        );
      }
    }
  };

  const handleEnded = () => {
    if (activePlaylistQueue) {
      handleNext();
    } else {
      setIsPlaying(false);
      setActiveSegmentId(null);
    }
  };

  // Playback toggles
  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error', err);
          showToast('انقر لبدء تشغيل الصوت');
        });
    }
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(duration, time));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleSkipSeconds = (delta: number) => {
    handleSeek(currentTime + delta);
  };

  // Play a specific identified song/segment
  const handlePlaySegment = (segment: TrackSegment, toggleIfPlaying: boolean = false) => {
    if (!audioRef.current) return;

    if (toggleIfPlaying && activeSegmentId === segment.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setActivePlaylistQueue(null);
      setActiveSegmentId(segment.id);
      setSelectionRange({ start: segment.startTime, end: segment.endTime });
      audioRef.current.currentTime = segment.startTime;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error', err);
        });
      showToast(`تشغيل: ${segment.title}`);
    }
  };

  // Play from Unified Search (Full track or Segment)
  const handlePlayUnifiedSong = (song: UnifiedSongItem) => {
    const targetTrack = tracks.find((t) => t.id === song.trackId);
    if (!targetTrack) return;

    setActivePlaylistQueue(null);

    const isDifferentTrack = targetTrack.id !== activeTrackId;
    if (isDifferentTrack) {
      setActiveTrackId(targetTrack.id);
    }

    const startPos = Math.max(0, song.startTime || 0);
    setCurrentTime(startPos);
    if (targetTrack.duration) {
      setDuration(targetTrack.duration);
    }

    if (song.type === 'segment' && song.segmentId) {
      setActiveSegmentId(song.segmentId);
      setSelectionRange({ start: song.startTime, end: song.endTime });
    } else {
      setActiveSegmentId(null);
    }

    if (audioRef.current) {
      const audio = audioRef.current;

      const performPlay = () => {
        try {
          audio.currentTime = startPos;
        } catch {
          // ignore seek error if not seekable yet
        }
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback error', err);
            setIsPlaying(false);
            showToast('انقر لبدء تشغيل الصوت (سياسة المتصفح)');
          });
      };

      if (audio.src !== targetTrack.src) {
        audio.src = targetTrack.src;
        if (audio.readyState >= 1) {
          performPlay();
        } else {
          const onLoaded = () => {
            performPlay();
            audio.removeEventListener('loadedmetadata', onLoaded);
          };
          audio.addEventListener('loadedmetadata', onLoaded);
          audio.load();
        }
      } else {
        performPlay();
      }
    }

    showToast(`تشغيل: ${song.title}`);
  };

  // Play from custom playlist
  const handlePlayPlaylistItem = (playlist: Playlist, item: PlaylistItem) => {
    const itemIndex = playlist.items.findIndex((i) => i.id === item.id);
    const queue = {
      playlistId: playlist.id,
      playlistName: playlist.name,
      items: playlist.items,
      currentIndex: itemIndex >= 0 ? itemIndex : 0,
    };
    playQueueIndex(queue, queue.currentIndex);
  };

  const handlePlayAllPlaylist = (playlist: Playlist, shuffle: boolean = false) => {
    if (playlist.items.length === 0) return;
    setIsShuffle(shuffle);

    let items = [...playlist.items];
    if (shuffle) {
      items = items.sort(() => Math.random() - 0.5);
    }

    const queue = {
      playlistId: playlist.id,
      playlistName: playlist.name,
      items,
      currentIndex: 0,
    };
    playQueueIndex(queue, 0);
    showToast(shuffle ? `تشغيل عشوائي: ${playlist.name}` : `تشغيل قائمة: ${playlist.name}`);
  };

  // Previews from SegmentManager
  const handlePreviewSelection = (start: number, end: number) => {
    if (!audioRef.current) return;
    if (previewStopTimeoutRef.current) {
      clearTimeout(previewStopTimeoutRef.current);
    }

    audioRef.current.currentTime = start;
    audioRef.current.play().then(() => setIsPlaying(true));

    const durationMs = Math.max(500, (end - start) * 1000);
    previewStopTimeoutRef.current = window.setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }, durationMs);

    showToast(`معاينة المقطع: ${formatTime(start)} ⟷ ${formatTime(end)}`);
  };

  const handlePreviewTransition = (type: 'start' | 'end') => {
    if (!selectionRange || !audioRef.current) return;
    if (previewStopTimeoutRef.current) {
      clearTimeout(previewStopTimeoutRef.current);
    }

    const { start, end } = selectionRange;
    let playStart = start;
    let length = 5;

    if (type === 'start') {
      playStart = start;
      length = Math.min(5, Math.max(1, end - start));
    } else {
      playStart = Math.max(start, end - 5);
      length = Math.min(5, Math.max(1, end - playStart));
    }

    audioRef.current.currentTime = playStart;
    audioRef.current.play().then(() => setIsPlaying(true));

    previewStopTimeoutRef.current = window.setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }, length * 1000);

    showToast(type === 'start' ? 'استماع لأول 5 ثوانٍ من الأغنية' : 'استماع لآخر 5 ثوانٍ من الأغنية');
  };

  // Set Point A / Set Point B helpers
  const handleSetPointA = (time: number) => {
    const currentEnd = selectionRange?.end ?? Math.min(duration, time + 180);
    const newEnd = Math.max(time + 0.5, currentEnd);
    setSelectionRange({ start: time, end: newEnd });
    showToast(`تم تعيين بداية الأغنية [A] عند ${formatTime(time)}`);
  };

  const handleSetPointB = (time: number) => {
    const currentStart = selectionRange?.start ?? Math.max(0, time - 180);
    const newStart = Math.min(time - 0.5, currentStart);
    setSelectionRange({ start: newStart, end: time });
    showToast(`تم تعيين نهاية الأغنية [B] عند ${formatTime(time)}`);
  };

  // Save new identified segment
  const handleSaveSegment = (newSegData: Omit<TrackSegment, 'id' | 'createdAt'>) => {
    if (!currentTrack) return;
    const trackDuration = audioRef.current?.duration || duration || currentTrack.duration || 0;
    const safeStart = Math.max(0, newSegData.startTime);
    let safeEnd = newSegData.endTime;

    if (trackDuration > 0) {
      if (safeStart >= trackDuration) {
        showToast('لا يمكن حفظ مقطع خارج مدة الأغنية الصوتية');
        return;
      }
      safeEnd = Math.min(trackDuration, Math.max(safeStart + 0.5, safeEnd));
    }

    const newSeg: TrackSegment = {
      ...newSegData,
      startTime: safeStart,
      endTime: safeEnd,
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === currentTrack.id) {
          const updated = [...t.segments, newSeg].sort((a, b) => a.startTime - b.startTime);
          const updatedTrack = { ...t, segments: updated };
          savePhoneTrack(updatedTrack).catch(() => {});
          return updatedTrack;
        }
        return t;
      })
    );

    showToast(`تم حفظ المقطع "${newSeg.title}" داخل الأغنية بنجاح`);
  };

  // Batch import segments
  const handleBatchImportSegments = (newSegments: TrackSegment[]) => {
    if (!currentTrack) return;
    const trackDuration = audioRef.current?.duration || duration || currentTrack.duration || 0;

    // Filter and clamp strictly within track boundaries
    const safeSegments = newSegments
      .filter((s) => trackDuration <= 0 || s.startTime < trackDuration)
      .map((s) => ({
        ...s,
        startTime: Math.max(0, s.startTime),
        endTime: trackDuration > 0 ? Math.min(trackDuration, s.endTime) : s.endTime,
      }));

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === currentTrack.id) {
          const combined = [...t.segments, ...safeSegments].sort(
            (a, b) => a.startTime - b.startTime
          );
          const updatedTrack = { ...t, segments: combined };
          savePhoneTrack(updatedTrack).catch(() => {});
          return updatedTrack;
        }
        return t;
      })
    );
    showToast(`تمت إضافة ${safeSegments.length} أجزاء داخل الأغنية بنجاح!`);
  };

  // Edit segment: load it into selection editor with full edit controls
  const handleEditSegment = (segment: TrackSegment, parentTrack?: AudioTrack | UnifiedSongItem) => {
    if (parentTrack && parentTrack.id !== currentTrack?.id) {
      setActiveTrackId(parentTrack.id);
    }
    setEditingSegment(segment);
    setSelectionRange({ start: segment.startTime, end: segment.endTime });
    handleSeek(segment.startTime);
    setActiveTab('slicer');
    showToast(`تم فتح أداة تعديل التحديد للمقطع "${segment.title}"`);
  };

  // Update existing segment
  const handleUpdateSegment = (updatedSegment: TrackSegment) => {
    if (!currentTrack) return;
    const trackDuration = audioRef.current?.duration || duration || currentTrack.duration || 0;
    const safeStart = Math.max(0, updatedSegment.startTime);
    let safeEnd = updatedSegment.endTime;

    if (trackDuration > 0) {
      if (safeStart >= trackDuration) {
        showToast('لا يمكن تعديل مقطع ليكون خارج مدة الأغنية الصوتية');
        return;
      }
      safeEnd = Math.min(trackDuration, Math.max(safeStart + 0.5, safeEnd));
    }

    const finalSeg: TrackSegment = {
      ...updatedSegment,
      startTime: safeStart,
      endTime: safeEnd,
    };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === currentTrack.id) {
          const updated = t.segments
            .map((s) => (s.id === finalSeg.id ? finalSeg : s))
            .sort((a, b) => a.startTime - b.startTime);
          const updatedTrack = { ...t, segments: updated };
          savePhoneTrack(updatedTrack).catch(() => {});
          return updatedTrack;
        }
        return t;
      })
    );

    setEditingSegment(null);
    showToast(`تم تحديث المقطع "${finalSeg.title}" بنجاح!`);
  };

  // Delete segment
  const handleDeleteSegment = (id: string) => {
    if (!currentTrack) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === currentTrack.id) {
          const updated = t.segments.filter((s) => s.id !== id);
          const updatedTrack = { ...t, segments: updated };
          savePhoneTrack(updatedTrack).catch(() => {});
          return updatedTrack;
        }
        return t;
      })
    );
    if (activeSegmentId === id) {
      setActiveSegmentId(null);
    }
    showToast('تم حذف المقطع من الأغنية');
  };

  // Add instant split marker from the timeline (e.g. at currentTime)
  const handleAddSplitPoint = (timestamp: number, title?: string) => {
    if (!currentTrack) return;
    const trackDuration = audioRef.current?.duration || duration || currentTrack.duration || 0;

    if (trackDuration <= 0) {
      showToast('يرجى الانتظار حتى تحميل الملف الصوتي أولاً لمعرفة مدته');
      return;
    }

    const time = Math.round(timestamp * 10) / 10;
    // Strictly prevent splitting outside the song
    if (time <= 1 || time >= trackDuration - 1) {
      showToast('لا يمكن التقسيم خارج حدود الأغنية (يجب أن يكون التقسيم داخل الأغنية)');
      return;
    }

    const currentSegments = [...currentTrack.segments].sort((a, b) => a.startTime - b.startTime);

    if (currentSegments.length === 0) {
      // Create first two segments within song
      const seg1: TrackSegment = {
        id: `seg-${Date.now()}-1`,
        trackId: currentTrack.id,
        title: 'اغنية 1',
        artist: currentTrack.artist,
        album: currentTrack.album || currentTrack.title,
        startTime: 0,
        endTime: time,
        color: '#f97316',
        createdAt: Date.now(),
      };
      const seg2: TrackSegment = {
        id: `seg-${Date.now()}-2`,
        trackId: currentTrack.id,
        title: title || 'اغنية 2',
        artist: currentTrack.artist,
        album: currentTrack.album || currentTrack.title,
        startTime: time,
        endTime: trackDuration,
        color: '#fb923c',
        createdAt: Date.now() + 1,
      };
      setTracks((prev) =>
        prev.map((t) => {
          if (t.id === currentTrack.id) {
            const updatedTrack = { ...t, segments: [seg1, seg2] };
            savePhoneTrack(updatedTrack).catch(() => {});
            return updatedTrack;
          }
          return t;
        })
      );
      setActiveSegmentId(seg2.id);
      showToast(`تم تقسيم التسجيل: "اغنية 1" و "${seg2.title}" داخل الأغنية`);
      return;
    }

    // Check if splitting an existing segment
    const segIndex = currentSegments.findIndex((s) => time > s.startTime && time < s.endTime);
    if (segIndex !== -1) {
      const target = currentSegments[segIndex];
      const newTitle = title || `اغنية ${currentSegments.length + 1}`;
      const updatedTarget: TrackSegment = {
        ...target,
        endTime: time,
      };
      const newSeg: TrackSegment = {
        id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trackId: currentTrack.id,
        title: newTitle,
        artist: target.artist || currentTrack.artist,
        album: target.album || currentTrack.album || currentTrack.title,
        startTime: time,
        endTime: target.endTime,
        color: '#ea580c',
        createdAt: Date.now(),
      };

      const newSegmentsList = [
        ...currentSegments.slice(0, segIndex),
        updatedTarget,
        newSeg,
        ...currentSegments.slice(segIndex + 1),
      ].sort((a, b) => a.startTime - b.startTime);

      setTracks((prev) =>
        prev.map((t) => {
          if (t.id === currentTrack.id) {
            const updatedTrack = { ...t, segments: newSegmentsList };
            savePhoneTrack(updatedTrack).catch(() => {});
            return updatedTrack;
          }
          return t;
        })
      );
      setActiveSegmentId(newSeg.id);
      showToast(`تمت إضافة علامة "${newTitle}" داخل الأغنية عند ${formatTime(time)}`);
    } else {
      const newTitle = title || `اغنية ${currentSegments.length + 1}`;
      const newSeg: TrackSegment = {
        id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trackId: currentTrack.id,
        title: newTitle,
        artist: currentTrack.artist,
        album: currentTrack.album || currentTrack.title,
        startTime: time,
        endTime: trackDuration,
        color: '#ea580c',
        createdAt: Date.now(),
      };
      setTracks((prev) =>
        prev.map((t) => {
          if (t.id === currentTrack.id) {
            const updatedList = [...t.segments, newSeg].sort((a, b) => a.startTime - b.startTime);
            const updatedTrack = { ...t, segments: updatedList };
            savePhoneTrack(updatedTrack).catch(() => {});
            return updatedTrack;
          }
          return t;
        })
      );
      setActiveSegmentId(newSeg.id);
      showToast(`تمت إضافة "${newTitle}" داخل الأغنية عند ${formatTime(time)}`);
    }
  };

  // Rename a segment
  const handleRenameSegment = (segmentId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === currentTrack.id) {
          return {
            ...t,
            segments: t.segments.map((s) =>
              s.id === segmentId ? { ...s, title: newTitle.trim() } : s
            ),
          };
        }
        return t;
      })
    );
    showToast(`تم تغيير الاسم إلى: "${newTitle.trim()}"`);
  };

  // Favorite segment toggle
  const handleToggleFavorite = (trackId: string, segmentId?: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          if (segmentId) {
            return {
              ...t,
              segments: t.segments.map((s) =>
                s.id === segmentId ? { ...s, isFavorite: !s.isFavorite } : s
              ),
            };
          }
        }
        return t;
      })
    );
  };

  // Extract and download sliced WAV file
  const handleDownloadSegment = async (segment: TrackSegment, parent?: AudioTrack) => {
    const src = parent?.src || currentTrack.src;
    setIsDownloading(true);
    showToast(`جارِ تقطيع وتحضير ملف "${segment.title}.wav"...`);
    try {
      await extractAndDownloadSegment(src, segment.startTime, segment.endTime, segment.title);
      showToast(`تم تنزيل الأغنية بنجاح!`);
    } catch (err) {
      console.error('Audio slice download error', err);
      showToast('تعذر تقطيع الملف الصوتي تلقائياً. تأكد من سلامة المصدر.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDirectSegment = async (start: number, end: number, title: string) => {
    setIsDownloading(true);
    showToast(`جارِ تقطيع وتحضير ملف "${title}.wav"...`);
    try {
      await extractAndDownloadSegment(currentTrack.src, start, end, title);
      showToast(`تم تنزيل المقطع الصوتي بنجاح!`);
    } catch (err) {
      console.error('Audio slice download error', err);
      showToast('حدث خطأ أثناء تقطيع الملف.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Upload local file handler (with persistence in IndexedDB)
  const handleFileUpload = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const audioDuration = await new Promise<number>((resolve) => {
      const tempAudio = new Audio(objectUrl);
      tempAudio.onloadedmetadata = () => {
        resolve(Math.round(tempAudio.duration) || 180);
      };
      tempAudio.onerror = () => {
        resolve(180);
      };
    });

    const newTrack: AudioTrack = {
      id: `phone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'ملف صوتي من هاتفي',
      album: 'صوتيات الهاتف',
      duration: audioDuration,
      src: objectUrl,
      fileType: 'upload',
      folder: 'صوتيات الهاتف',
      originalFile: file,
      addedAt: Date.now(),
      segments: [],
    };

    await savePhoneTrack(newTrack, file);

    setTracks((prev) => [newTrack, ...prev]);
    setActiveTrackId(newTrack.id);
    setActiveSegmentId(null);
    setActivePlaylistQueue(null);
    setCurrentTime(0);
    setDuration(newTrack.duration);
    setSelectionRange({ start: 0, end: Math.min(180, newTrack.duration) });

    if (audioRef.current) {
      audioRef.current.src = objectUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    showToast(`تم حفظ وتشغيل: ${file.name}`);
  };

  // Multi-file import handler from phone (files, folders, albums)
  const handleImportPhoneFiles = async (files: File[], folderName?: string) => {
    const importedTracks: AudioTrack[] = [];

    for (const file of files) {
      const objectUrl = URL.createObjectURL(file);
      const audioDuration = await new Promise<number>((resolve) => {
        const tempAudio = new Audio(objectUrl);
        tempAudio.onloadedmetadata = () => {
          resolve(Math.round(tempAudio.duration) || 180);
        };
        tempAudio.onerror = () => {
          resolve(180);
        };
      });

      const title = file.name.replace(/\.[^/.]+$/, '');
      const derivedFolder =
        folderName ||
        (file.webkitRelativePath ? file.webkitRelativePath.split('/')[0] : 'صوتيات الهاتف');

      const track: AudioTrack = {
        id: `phone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        artist: 'ملف صوتي من هاتفي',
        album: derivedFolder,
        duration: audioDuration,
        src: objectUrl,
        fileType: 'upload',
        folder: derivedFolder,
        originalFile: file,
        addedAt: Date.now(),
        segments: [],
      };

      await savePhoneTrack(track, file);
      importedTracks.push(track);
    }

    if (importedTracks.length > 0) {
      setTracks((prev) => [...importedTracks, ...prev]);
      setActiveTrackId(importedTracks[0].id);
      setActiveSegmentId(null);
      setActivePlaylistQueue(null);
      setCurrentTime(0);
      setDuration(importedTracks[0].duration);
      setSelectionRange({
        start: 0,
        end: Math.min(180, importedTracks[0].duration),
      });

      if (audioRef.current) {
        audioRef.current.src = importedTracks[0].src;
        audioRef.current.load();
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }

      showToast(`تم استيراد وحفظ ${importedTracks.length} ملف صوتي من الهاتف بنجاح!`);
    }
  };

  // Add recorded track from microphone
  const handleAddRecordedTrack = async (audioBlob: Blob, title: string, recDuration: number) => {
    const objectUrl = URL.createObjectURL(audioBlob);
    const track: AudioTrack = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      artist: 'تسجيل ميكروفون الهاتف',
      album: 'تسجيلات MR',
      duration: Math.max(1, Math.round(recDuration)),
      src: objectUrl,
      fileType: 'upload',
      folder: 'تسجيلات الهاتف',
      addedAt: Date.now(),
      segments: [],
    };

    await savePhoneTrack(track, audioBlob);
    setTracks((prev) => [track, ...prev]);
    setActiveTrackId(track.id);
    setActiveSegmentId(null);
    setActivePlaylistQueue(null);
    setCurrentTime(0);
    setDuration(track.duration);

    if (audioRef.current) {
      audioRef.current.src = objectUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    showToast(`تم حفظ التسجيل "${title}" في هاتفك!`);
  };

  // Optional demo track loader if user wants to test audio output
  const handleLoadDemoSample = () => {
    const exists = tracks.some((t) => t.id === DEMO_RECORDING_TRACK.id);
    if (!exists) {
      setTracks((prev) => [DEMO_RECORDING_TRACK, ...prev]);
    }
    setActiveTrackId(DEMO_RECORDING_TRACK.id);
    setActiveSegmentId(null);
    setActivePlaylistQueue(null);
    setCurrentTime(0);
    setDuration(DEMO_RECORDING_TRACK.duration);

    if (audioRef.current) {
      audioRef.current.src = DEMO_RECORDING_TRACK.src;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    showToast('تم تحميل التسجيل التجريبي (0309_260426) للاختبار!');
  };

  // Remote URL load handler
  const handleUrlLoad = (url: string, title: string) => {
    const newTrack: AudioTrack = {
      id: `url-${Date.now()}`,
      title,
      artist: 'رابط خارجي',
      album: 'تسجيلات عبر الويب',
      duration: 300,
      src: url,
      fileType: 'url',
      addedAt: Date.now(),
      segments: [],
    };

    setTracks((prev) => [newTrack, ...prev]);
    setActiveTrackId(newTrack.id);
    setActiveSegmentId(null);
    setActivePlaylistQueue(null);
    setCurrentTime(0);
    setSelectionRange({ start: 0, end: 180 });

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
      setIsPlaying(false);
    }

    showToast(`تم تحميل الرابط الصوتي بنجاح`);
  };

  // Playlist management handlers
  const handleCreatePlaylist = (name: string, description?: string, colorGradient?: string) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      colorGradient: colorGradient || 'from-indigo-600 to-purple-800',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [],
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    showToast(`تم إنشاء قائمة "${name}" بنجاح!`);
  };

  const handleRenamePlaylist = (playlistId: string, newName: string, newDesc?: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, name: newName, description: newDesc, updatedAt: Date.now() }
          : p
      )
    );
    showToast('تم تعديل اسم القائمة بنجاح');
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (activePlaylistQueue?.playlistId === playlistId) {
      setActivePlaylistQueue(null);
    }
    showToast('تم حذف قائمة التشغيل');
  };

  const handleAddToPlaylist = (
    playlistId: string,
    itemPayload: Omit<PlaylistItem, 'id' | 'addedAt'>
  ) => {
    const newItem: PlaylistItem = {
      ...itemPayload,
      id: `pli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: Date.now(),
    };

    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, items: [...p.items, newItem] } : p))
    );
    showToast(`تمت إضافة "${itemPayload.title}" إلى القائمة!`);
  };

  const handleCreatePlaylistAndAdd = (
    name: string,
    itemPayload: Omit<PlaylistItem, 'id' | 'addedAt'>
  ) => {
    const newItem: PlaylistItem = {
      ...itemPayload,
      id: `pli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: Date.now(),
    };
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      colorGradient: 'from-indigo-600 to-pink-700',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [newItem],
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    showToast(`تم إنشاء قائمة "${name}" وإضافة الأغنية إليها!`);
  };

  const handleRemoveItemFromPlaylist = (playlistId: string, itemId: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, items: p.items.filter((it) => it.id !== itemId) } : p
      )
    );
    showToast('تمت إزالة الأغنية من القائمة');
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkipSeconds(-5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkipSeconds(5);
      } else if (e.key === 'a' || e.key === 'A' || e.key === '[') {
        e.preventDefault();
        handleSetPointA(currentTime);
      } else if (e.key === 'b' || e.key === 'B' || e.key === ']') {
        e.preventDefault();
        handleSetPointB(currentTime);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLoopingSegment((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, isPlaying]);

  const activeSegment = currentTrack
    ? currentTrack.segments.find((s) => s.id === activeSegmentId) || null
    : null;

  // Unified songs library: Each song represents its track, containing its segments internally
  const allSongs: UnifiedSongItem[] = useMemo(() => {
    return tracks.map((track) => {
      const segs = track.segments || [];
      return {
        id: `track-${track.id}`,
        type: 'fullTrack',
        trackId: track.id,
        title: track.title,
        artist: track.artist || 'فنان غير محدد',
        album: track.album || track.title,
        duration: track.duration || 180,
        startTime: 0,
        endTime: track.duration || 180,
        src: track.src,
        coverArt: track.coverArt,
        folder: track.folder,
        hasLyrics: track.hasLyrics || !!track.lyrics,
        lyrics: track.lyrics,
        tags: segs.length > 0 ? [`${segs.length} أجزاء مقسمة`] : ['تسجيل كامل'],
        isFavorite: false,
        addedAt: track.addedAt,
        segmentsCount: segs.length,
        segments: segs,
      };
    });
  }, [tracks]);

  // Filter and sort songs based on LarkHeader controls
  const filteredAndSortedSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = allSongs.filter((song) => {
      if (!q) return true;
      const matchBasic =
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q) ||
        (song.folder && song.folder.toLowerCase().includes(q)) ||
        (song.lyrics && song.lyrics.toLowerCase().includes(q)) ||
        (song.tags && song.tags.some((t) => t.toLowerCase().includes(q)));

      const matchSegments = song.segments?.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
      );

      return matchBasic || Boolean(matchSegments);
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'ar', { sensitivity: 'base' });
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist, 'ar', { sensitivity: 'base' });
          break;
        case 'album':
          comparison = a.album.localeCompare(b.album, 'ar', { sensitivity: 'base' });
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'addedAt':
          comparison = (a.addedAt || 0) - (b.addedAt || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allSongs, searchQuery, sortField, sortOrder]);

  // Open slicer directly for a song/segment to create ringtones or trim
  const handleOpenSlicerForSong = (song: UnifiedSongItem) => {
    const targetTrack = tracks.find((t) => t.id === song.trackId);
    if (targetTrack) {
      setActiveTrackId(targetTrack.id);
      if (song.segmentId) {
        setActiveSegmentId(song.segmentId);
        setSelectionRange({ start: song.startTime, end: song.endTime });
      } else {
        setActiveSegmentId(null);
        setSelectionRange({ start: 0, end: Math.min(180, targetTrack.duration || 180) });
      }
    }
    setActiveTab('slicer');
    showToast(`استوديو التقطيع: ${song.title}`);
  };

  // Play folder items sequentially
  const handlePlayFolderAll = (folderSongs: UnifiedSongItem[]) => {
    if (folderSongs.length === 0) return;
    const items: PlaylistItem[] = folderSongs.map((s, idx) => ({
      id: `folder-item-${idx}-${s.id}`,
      trackId: s.trackId,
      segmentId: s.segmentId,
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: s.duration,
      startTime: s.startTime,
      endTime: s.endTime,
      src: s.src,
      coverArt: s.coverArt,
      addedAt: Date.now(),
    }));

    const queue = {
      playlistId: 'folder-queue',
      playlistName: folderSongs[0]?.folder || 'تشغيل المجلد',
      items,
      currentIndex: 0,
    };
    playQueueIndex(queue, 0);
    showToast(`تشغيل الكل من: ${folderSongs[0]?.folder || 'المجلد'}`);
  };

  // Play all songs
  const handlePlayAllSongs = (shuffle: boolean = false) => {
    if (filteredAndSortedSongs.length === 0) return;
    let songsToPlay = [...filteredAndSortedSongs];
    if (shuffle) {
      songsToPlay = songsToPlay.sort(() => Math.random() - 0.5);
    }
    const items: PlaylistItem[] = songsToPlay.map((s, idx) => ({
      id: `queue-${idx}-${s.id}`,
      trackId: s.trackId,
      segmentId: s.segmentId,
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: s.duration,
      startTime: s.startTime,
      endTime: s.endTime,
      src: s.src,
      coverArt: s.coverArt,
      addedAt: Date.now(),
    }));

    const queue = {
      playlistId: 'all-songs-queue',
      playlistName: shuffle ? 'تشغيل عشوائي' : 'تشغيل كل الأغاني',
      items,
      currentIndex: 0,
    };
    playQueueIndex(queue, 0);
  };

  // Active playing entity meta for Phone Player and Mini Player
  const currentDisplayTitle =
    activePlaylistQueue && activePlaylistQueue.items[activePlaylistQueue.currentIndex]
      ? activePlaylistQueue.items[activePlaylistQueue.currentIndex].title
      : activeSegment
      ? activeSegment.title
      : currentTrack?.title || '';

  const currentDisplayArtist =
    activePlaylistQueue && activePlaylistQueue.items[activePlaylistQueue.currentIndex]
      ? activePlaylistQueue.items[activePlaylistQueue.currentIndex].artist
      : activeSegment
      ? activeSegment.artist || currentTrack?.artist || ''
      : currentTrack?.artist || '';

  const currentDisplayAlbum =
    activePlaylistQueue && activePlaylistQueue.items[activePlaylistQueue.currentIndex]
      ? activePlaylistQueue.items[activePlaylistQueue.currentIndex].album || currentTrack?.album || currentTrack?.title || ''
      : activeSegment
      ? activeSegment.album || currentTrack?.album || currentTrack?.title || ''
      : currentTrack?.album || currentTrack?.title || '';

  const currentDisplayCover = currentTrack?.coverArt;
  const currentDisplayColor = activeSegment?.color || '#ea580c';
  const currentDisplayNotes = activeSegment?.notes;
  const currentDisplayIsFavorite = activeSegment?.isFavorite;

  const currentActiveSong = allSongs.find((s) =>
    activeSegmentId ? s.segmentId === activeSegmentId : s.trackId === activeTrackId
  );
  const currentLyrics = currentActiveSong?.lyrics || currentTrack?.lyrics;
  const currentHasLyrics = currentActiveSong?.hasLyrics || currentTrack?.hasLyrics;

  const sourceContextTitle = activePlaylistQueue
    ? `قائمة: ${activePlaylistQueue.playlistName}`
    : activeSegment
    ? 'مقطع محدد'
    : currentTrack
    ? 'تسجيل كامل'
    : 'MR Player';

  // Mobile background audio & phone lockscreen integration (MediaSession API)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentDisplayTitle || 'MR Player',
        artist: currentDisplayArtist || 'هاتفي المحمول',
        album: currentDisplayAlbum || 'MR',
        artwork: currentDisplayCover
          ? [{ src: currentDisplayCover, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', handleTogglePlay);
      navigator.mediaSession.setActionHandler('pause', handleTogglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) handleSeek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => handleSkipSeconds(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => handleSkipSeconds(10));
    } catch (err) {
      console.warn('MediaSession handler setup', err);
    }
  }, [
    currentDisplayTitle,
    currentDisplayArtist,
    currentDisplayAlbum,
    currentDisplayCover,
    isPlaying,
    currentTrack,
    handleTogglePlay,
    handlePrev,
    handleNext,
  ]);

  return (
    <div className="min-h-screen bg-[#14100e] text-stone-100 flex flex-col selection:bg-orange-500 selection:text-white pb-32 md:pb-24">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.src || ''}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          showToast('تعذر تشغيل الملف الصوتي. يرجى اختيار ملف صالح');
        }}
      />

      {/* Lark Player Top Navigation & Header */}
      <LarkHeader
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
          showToast(`تم الفرز حسب: ${field === 'title' ? 'العنوان' : field === 'artist' ? 'الفنان' : field === 'album' ? 'الألبوم' : 'المدة'}`);
        }}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenPhonePlayer={() => setIsPhonePlayerOpen(true)}
        onOpenImporter={() => setIsImporterOpen(true)}
        tracksCount={filteredAndSortedSongs.length}
        playlistsCount={playlists.length}
      />

      {/* Main App Workspace */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 flex-1 w-full space-y-5">
        {/* VIEW 1: All Songs List (مطابقة تماماً لـ Lark Player) */}
        {activeTab === 'songs' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Quick Action Bar (Play All / Shuffle All / Add Local Track) */}
            <div className="flex items-center justify-between gap-3 p-3 bg-[#1d1714] border border-stone-800 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePlayAllSongs(false)}
                  disabled={filteredAndSortedSongs.length === 0}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-orange-950/40"
                >
                  <Disc3 className="w-3.5 h-3.5 animate-[spin_6s_linear_infinite]" />
                  <span>تشغيل الكل ({filteredAndSortedSongs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlayAllSongs(true)}
                  disabled={filteredAndSortedSongs.length === 0}
                  className="text-xs px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>خلط عشوائي</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImporterOpen(true)}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-orange-600/90 hover:bg-orange-600 text-white border border-orange-500/40 flex items-center gap-1.5 cursor-pointer transition-colors font-medium shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>استيراد صوتيات من هاتفي</span>
                </button>
              </div>
            </div>

            {/* Song List Component */}
            <LarkSongList
              songs={filteredAndSortedSongs}
              activeSongId={
                activeSegmentId ? `seg-${activeSegmentId}` : `track-${activeTrackId}`
              }
              isPlaying={isPlaying}
              onPlaySong={handlePlayUnifiedSong}
              onToggleFavorite={handleToggleFavorite}
              onOpenAddToPlaylist={(song) => setSongToAddToPlaylist(song)}
              onOpenSlicerForSong={handleOpenSlicerForSong}
              onDownloadSegment={(seg, parent) => handleDownloadSegment(seg, parent)}
              onEditSegment={(seg, parentSong) => handleEditSegment(seg, parentSong)}
              onOpenImporter={() => setIsImporterOpen(true)}
              onLoadDemoSample={handleLoadDemoSample}
            />
          </div>
        )}

        {/* VIEW 2: Folders View (المجلدات كالهاتف المحمول) */}
        {activeTab === 'folders' && (
          <div className="space-y-4 animate-fadeIn">
            <LarkFolderView
              songs={allSongs}
              activeSongId={
                activeSegmentId ? `seg-${activeSegmentId}` : `track-${activeTrackId}`
              }
              isPlaying={isPlaying}
              onPlaySong={handlePlayUnifiedSong}
              onPlayFolderAll={handlePlayFolderAll}
              onOpenImporter={() => setIsImporterOpen(true)}
            />
          </div>
        )}

        {/* VIEW 3: Custom Playlists (قوائم التشغيل المخصصة) */}
        {activeTab === 'playlists' && (
          <div className="space-y-4 animate-fadeIn">
            <PlaylistManager
              playlists={playlists}
              activePlaylistItemId={
                activePlaylistQueue && activePlaylistQueue.items[activePlaylistQueue.currentIndex]
                  ? activePlaylistQueue.items[activePlaylistQueue.currentIndex].id
                  : null
              }
              isPlaying={isPlaying}
              onCreatePlaylist={handleCreatePlaylist}
              onRenamePlaylist={handleRenamePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onRemoveItemFromPlaylist={handleRemoveItemFromPlaylist}
              onPlayPlaylistItem={handlePlayPlaylistItem}
              onPlayAll={handlePlayAllPlaylist}
            />
          </div>
        )}

        {/* VIEW 4: Music Videos (كليبات الفيديوهات) */}
        {activeTab === 'videos' && (
          <div className="space-y-4 animate-fadeIn">
            <LarkVideoView />
          </div>
        )}

        {/* VIEW 5: Track Slicer & Ringtone Maker Studio (استوديو التقطيع وتحديد الأغاني الطويلة) */}
        {activeTab === 'slicer' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Audio Source / Presets Selector */}
            <AudioSourceSelector
              tracks={tracks}
              activeTrackId={activeTrackId}
              onSelectTrack={handleSelectTrack}
              onFileUpload={handleFileUpload}
              onUrlLoad={handleUrlLoad}
            />

            {!currentTrack ? (
              <div className="bg-[#1c1815] border border-stone-800 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-950/40 border border-orange-800/40 text-orange-400 flex items-center justify-center mx-auto">
                  <Scissors className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">لا يوجد ملف صوتي محدد للتقطيع حالياً</h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    تطبيق MR يتيح لك تقطيع الأغاني الصوتية الطويلة والتسجيلات المخزنة على هاتفك إلى مقاطع منفصلة وتسميتها وحفظها.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImporterOpen(true)}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-950/50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>استيراد ملف صوتي من الهاتف</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoSample}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-2 cursor-pointer border border-stone-700"
                  >
                    <Disc3 className="w-4 h-4 text-orange-400" />
                    <span>تحميل نموذج تجريبي للاختبار</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Currently Playing Long File Info Card */}
                <div className="bg-[#1c1815] border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {currentTrack.coverArt ? (
                      <img
                        src={currentTrack.coverArt}
                        alt={currentTrack.title}
                        className="w-14 h-14 rounded-xl object-cover border border-stone-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-orange-900/30 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                        <Music className="w-7 h-7" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-white truncate">
                          {currentTrack.title}
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                          {currentTrack.fileType === 'sample' ? 'نموذج تجريبي' : 'ملف خاص'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {currentTrack.artist} • الألبوم: {currentTrack.album || currentTrack.title} •
                        المدة:{' '}
                        <span className="font-mono text-orange-300 font-bold">
                          {formatTime(duration)}
                        </span>{' '}
                        • الأغاني المحددة:{' '}
                        <span className="font-bold text-emerald-400">
                          {currentTrack.segments.length}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSongToAddToPlaylist(currentTrack)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-400" />
                      إضافة التسجيل لقائمة تشغيل
                    </button>
                    <span className="text-xs text-stone-400 font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-stone-800">
                      الموضع: <strong className="text-orange-400">{formatTime(currentTime, true)}</strong>
                    </span>
                  </div>
                </div>

                {/* Visual Waveform Timeline & Chapters */}
                <WaveformTimeline
                  duration={duration}
                  currentTime={currentTime}
                  segments={currentTrack.segments}
                  activeSegmentId={activeSegmentId}
                  selectionRange={selectionRange}
                  waveformPeaks={waveformPeaks}
                  onSeek={handleSeek}
                  onSelectSegment={handlePlaySegment}
                  onSetSelectionRange={setSelectionRange}
                  onSetPointA={handleSetPointA}
                  onSetPointB={handleSetPointB}
                  onPlaySelection={handlePreviewSelection}
                />

                {/* Main Audio Player Controls */}
                <PlayerControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  volume={volume}
                  isMuted={isMuted}
                  playbackRate={playbackRate}
                  isLoopingSegment={isLoopingSegment}
                  activeSegment={activeSegment}
                  audioElement={audioRef.current}
                  onTogglePlay={handleTogglePlay}
                  onSeek={handleSeek}
                  onSkipSeconds={handleSkipSeconds}
                  onPrevSegment={handlePrev}
                  onNextSegment={handleNext}
                  onSetVolume={setVolume}
                  onToggleMute={() => setIsMuted((m) => !m)}
                  onSetPlaybackRate={setPlaybackRate}
                  onToggleLoopSegment={() => setIsLoopingSegment((loop) => !loop)}
                />

                {/* Two-Column Grid: Left: Slicer / Segment Manager | Right: TrackList */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Slicer & Range Manager (Left / Primary) */}
                  <div className="lg:col-span-6 space-y-4">
                    <SegmentManager
                      currentTime={currentTime}
                      duration={duration}
                      selectionRange={selectionRange}
                      segmentsCount={currentTrack.segments.length}
                      activeTrackTitle={currentTrack.title}
                      editingSegment={editingSegment}
                      onCancelEdit={() => setEditingSegment(null)}
                      onUpdateSegment={handleUpdateSegment}
                      onSetSelectionRange={setSelectionRange}
                      onPreviewSelection={handlePreviewSelection}
                      onPreviewTransition={handlePreviewTransition}
                      onSaveSegment={handleSaveSegment}
                      onDownloadDirectSegment={handleDownloadDirectSegment}
                      onBatchImportSegments={handleBatchImportSegments}
                      trackId={currentTrack.id}
                      isDownloading={isDownloading}
                    />
                  </div>

                  {/* Identified Tracks List (Right) */}
                  <div className="lg:col-span-6 space-y-4">
                    <TrackList
                      segments={currentTrack.segments}
                      activeSegmentId={activeSegmentId}
                      isPlaying={isPlaying}
                      isLoopingSegment={isLoopingSegment}
                      trackTitle={currentTrack.title}
                      artistTitle={currentTrack.artist}
                      onPlaySegment={handlePlaySegment}
                      onToggleLoopSegment={() => setIsLoopingSegment((l) => !l)}
                      onEditSegment={handleEditSegment}
                      onDeleteSegment={handleDeleteSegment}
                      onToggleFavorite={(segId) => handleToggleFavorite(currentTrack.id, segId)}
                      onDownloadSegment={(seg) => handleDownloadSegment(seg, currentTrack)}
                      onOpenExportModal={() => setIsExportModalOpen(true)}
                      onOpenAddToPlaylist={(seg) => setSongToAddToPlaylist(seg)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Quick Phone Audio Import Button */}
      <button
        type="button"
        onClick={() => setIsImporterOpen(true)}
        className="fixed bottom-24 right-4 md:right-8 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-xl shadow-orange-950/60 border border-orange-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="استيراد من الهاتف"
      >
        <Plus className="w-4 h-4 text-white" />
        <span className="hidden sm:inline">صوتيات الهاتف</span>
        <span className="sm:hidden">استيراد</span>
      </button>

      {/* Lark Floating Mini-Player Pill at Bottom */}
      <LarkMiniPlayer
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        currentTitle={currentDisplayTitle}
        currentArtist={currentDisplayArtist}
        currentCoverArt={currentDisplayCover}
        segments={currentTrack?.segments || []}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onOpenFullPlayer={() => setIsPhonePlayerOpen(true)}
      />

      {/* Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
      />

      {/* Full Mobile Music Player Modal (Lark Style with timeline segments, lyrics, equalizer) */}
      <MobilePhonePlayer
        isOpen={isPhonePlayerOpen}
        onClose={() => setIsPhonePlayerOpen(false)}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackRate={playbackRate}
        isLoopingSegment={isLoopingSegment}
        isShuffle={isShuffle}
        currentTitle={currentDisplayTitle}
        currentArtist={currentDisplayArtist}
        currentAlbum={currentDisplayAlbum}
        currentCoverArt={currentDisplayCover}
        currentColor={currentDisplayColor}
        currentNotes={currentDisplayNotes}
        lyrics={currentLyrics}
        hasLyrics={currentHasLyrics}
        isFavorite={currentDisplayIsFavorite}
        sourceContextTitle={sourceContextTitle}
        segments={currentTrack?.segments || []}
        activeSegmentId={activeSegmentId}
        audioElement={audioRef.current}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onPrev={handlePrev}
        onNext={handleNext}
        onSkipSeconds={handleSkipSeconds}
        onToggleLoop={() => setIsLoopingSegment((loop) => !loop)}
        onToggleShuffle={() => setIsShuffle((s) => !s)}
        onSetVolume={setVolume}
        onToggleMute={() => setIsMuted((m) => !m)}
        onSetPlaybackRate={setPlaybackRate}
        onSelectSegment={handlePlaySegment}
        onAddSplitHere={handleAddSplitPoint}
        onDeleteSegment={handleDeleteSegment}
        onRenameSegment={handleRenameSegment}
        onToggleFavorite={() => {
          if (activeSegment && currentTrack) {
            handleToggleFavorite(currentTrack.id, activeSegment.id);
          }
        }}
        onOpenAddToPlaylist={() => {
          if (activeSegment) {
            setSongToAddToPlaylist(activeSegment);
          } else if (currentTrack) {
            setSongToAddToPlaylist(currentTrack);
          }
        }}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSlicer={() => {
          setIsPhonePlayerOpen(false);
          setActiveTab('slicer');
        }}
      />

      {/* Phone Audio Importer Modal */}
      <PhoneAudioImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportTracks={handleImportPhoneFiles}
        onAddRecordedTrack={handleAddRecordedTrack}
        onLoadDemoSample={handleLoadDemoSample}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={!!songToAddToPlaylist}
        onClose={() => setSongToAddToPlaylist(null)}
        playlists={playlists}
        songToAdd={songToAddToPlaylist}
        onAddToPlaylist={handleAddToPlaylist}
        onCreatePlaylistAndAdd={handleCreatePlaylistAndAdd}
      />

      {/* Export Modal */}
      {isExportModalOpen && currentTrack && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          track={currentTrack}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                اختصارات لوحة المفاتيح
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                إغلاق
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">تشغيل / إيقاف مؤقت</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-indigo-300">
                  المسافة (Space)
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">تعيين نقطة البداية [A] عند موضعك</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-emerald-400">
                  A أو [
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">تعيين نقطة النهاية [B] عند موضعك</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-rose-400">
                  B أو ]
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">تقديم 5 ثواني</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-300">
                  السهم الأيسر ←
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-300">تأخير 5 ثواني</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-300">
                  السهم الأيمن →
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-300">تفعيل / إيقاف تكرار المقطع (Loop)</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-indigo-300">
                  L
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-fadeIn">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
