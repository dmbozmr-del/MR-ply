// IndexedDB helper for persistently storing user phone audio files, recordings, and metadata
import { AudioTrack } from '../types';

const DB_NAME = 'MR_Phone_Audio_DB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

interface StoredTrackRecord {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  fileType: 'upload' | 'sample' | 'url';
  folder?: string;
  blob?: Blob;
  addedAt: number;
  segments: any[];
  waveform?: number[];
  lyrics?: string;
  hasLyrics?: boolean;
  coverArt?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save or update a track with its audio Blob in phone's IndexedDB
 */
export async function savePhoneTrack(track: AudioTrack, fileBlob?: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // If fileBlob is provided or originalFile is present
    const blobToSave = fileBlob || track.originalFile;

    const record: StoredTrackRecord = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      fileType: track.fileType,
      folder: track.folder,
      addedAt: track.addedAt || Date.now(),
      segments: track.segments || [],
      waveform: track.waveform,
      lyrics: track.lyrics,
      hasLyrics: track.hasLyrics,
      coverArt: track.coverArt,
    };

    if (blobToSave) {
      record.blob = blobToSave;
    }

    await new Promise<void>((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save track to IndexedDB', err);
  }
}

/**
 * Load all phone audio tracks stored in IndexedDB
 */
export async function loadPhoneTracks(): Promise<AudioTrack[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const records: StoredTrackRecord[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const tracks: AudioTrack[] = records.map((rec) => {
      let src = '';
      if (rec.blob) {
        src = URL.createObjectURL(rec.blob);
      } else if (rec.fileType === 'sample') {
        src = '/audio/demo.mp3';
      }

      return {
        id: rec.id,
        title: rec.title,
        artist: rec.artist,
        album: rec.album,
        duration: rec.duration,
        fileType: rec.fileType,
        folder: rec.folder,
        src,
        originalFile: rec.blob ? (new File([rec.blob], `${rec.title}.mp3`, { type: rec.blob.type })) : undefined,
        addedAt: rec.addedAt,
        segments: rec.segments || [],
        waveform: rec.waveform,
        lyrics: rec.lyrics,
        hasLyrics: rec.hasLyrics,
        coverArt: rec.coverArt,
      };
    });

    // Filter out tracks where blob might be missing if it was an upload
    return tracks.filter((t) => Boolean(t.src));
  } catch (err) {
    console.warn('Could not load tracks from IndexedDB', err);
    return [];
  }
}

/**
 * Update metadata (title, artist, album, coverArt, lyrics, folder) of a stored track without altering its audio blob
 */
export async function updatePhoneTrackMetadata(
  trackId: string,
  updates: Partial<StoredTrackRecord>
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const existing: StoredTrackRecord | undefined = await new Promise((resolve, reject) => {
      const req = store.get(trackId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (existing) {
      const merged = { ...existing, ...updates };
      await new Promise<void>((resolve, reject) => {
        const req = store.put(merged);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  } catch (err) {
    console.warn('Could not update track metadata in IndexedDB', err);
  }
}

/**
 * Delete a track from IndexedDB
 */
export async function deletePhoneTrack(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete track from IndexedDB', err);
  }
}

/**
 * Clear all stored tracks
 */
export async function clearAllPhoneTracks(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not clear IndexedDB', err);
  }
}
