import { TrackSegment } from '../types';

export function formatTime(seconds: number, includeMs = false): string {
  if (isNaN(seconds) || seconds < 0) return includeMs ? '00:00.0' : '00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);

  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');

  let result = '';
  if (hrs > 0) {
    const formattedHrs = String(hrs).padStart(2, '0');
    result = `${formattedHrs}:${formattedMins}:${formattedSecs}`;
  } else {
    result = `${formattedMins}:${formattedSecs}`;
  }

  if (includeMs) {
    result += `.${ms}`;
  }

  return result;
}

export function parseTimeToSeconds(input: string): number | null {
  const clean = input.trim();
  if (!clean) return null;

  // matches "hh:mm:ss", "mm:ss", with optional ".xxx"
  const parts = clean.split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return null;
    return mins * 60 + secs;
  } else if (parts.length === 3) {
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2]);
    if (isNaN(hrs) || isNaN(mins) || isNaN(secs)) return null;
    return hrs * 3600 + mins * 60 + secs;
  } else if (parts.length === 1) {
    const val = parseFloat(parts[0]);
    return isNaN(val) ? null : val;
  }
  return null;
}

export const SEGMENT_PALETTE = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#84cc16', // Lime
];

export function getSegmentColor(index: number): string {
  return SEGMENT_PALETTE[index % SEGMENT_PALETTE.length];
}

export function exportYouTubeTimestamps(segments: TrackSegment[]): string {
  const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);
  return sorted
    .map(
      (s) =>
        `${formatTime(s.startTime)} ${s.title}${s.artist ? ' - ' + s.artist : ''}`
    )
    .join('\n');
}

export function exportCueSheet(title: string, artist: string, segments: TrackSegment[]): string {
  const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);
  let cue = `TITLE "${title}"\nPERFORMER "${artist || 'Various Artists'}"\nFILE "mix.mp3" MP3\n`;

  sorted.forEach((seg, idx) => {
    const trackNum = String(idx + 1).padStart(2, '0');
    const mins = Math.floor(seg.startTime / 60);
    const secs = Math.floor(seg.startTime % 60);
    const frames = Math.floor(((seg.startTime % 1) * 75)); // 75 frames per second in CUE standard
    const cueTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;

    cue += `  TRACK ${trackNum} AUDIO\n`;
    cue += `    TITLE "${seg.title}"\n`;
    cue += `    PERFORMER "${seg.artist || artist || 'Unknown'}"\n`;
    cue += `    INDEX 01 ${cueTime}\n`;
  });

  return cue;
}

export function parseTimestampsText(
  text: string,
  totalDuration: number,
  trackId: string
): TrackSegment[] {
  const lines = text.split('\n');
  const tempItems: { time: number; title: string; artist: string }[] = [];

  // Match lines like:
  // 03:45 Song Title - Artist
  // [03:45] Song Title
  // 1:20:30 Song Title
  // Track 1 (03:45) Title
  const timeRegex = /(?:\[|\()?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.\d+)?(?:\]|\))?/;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const match = trimmed.match(timeRegex);
    if (match) {
      const fullTimeStr = match[0].replace(/[\[\]\(\)]/g, '');
      const seconds = parseTimeToSeconds(fullTimeStr);
      if (seconds !== null) {
        // Remove the time string from line
        let remaining = trimmed.replace(match[0], '').replace(/^[\s\-–—:]+/, '').trim();
        let title = remaining;
        let artist = '';

        if (remaining.includes(' - ')) {
          const parts = remaining.split(' - ');
          title = parts[0].trim();
          artist = parts.slice(1).join(' - ').trim();
        } else if (remaining.includes(' – ')) {
          const parts = remaining.split(' – ');
          title = parts[0].trim();
          artist = parts.slice(1).join(' – ').trim();
        }

        if (!title) {
          title = `أغنية في ${fullTimeStr}`;
        }

        tempItems.push({
          time: seconds,
          title,
          artist,
        });
      }
    }
  });

  // Sort by start time
  tempItems.sort((a, b) => a.time - b.time);

  // Generate segments with calculated end times
  return tempItems.map((item, idx) => {
    const startTime = item.time;
    const nextTime = idx < tempItems.length - 1 ? tempItems[idx + 1].time : totalDuration || startTime + 180;
    const endTime = Math.max(startTime + 1, Math.min(nextTime, totalDuration || nextTime));

    return {
      id: `seg-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      trackId,
      title: item.title,
      artist: item.artist,
      startTime,
      endTime,
      color: getSegmentColor(idx),
      createdAt: Date.now(),
    };
  });
}
