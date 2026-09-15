/**
 * Utility for client-side audio slicing and lossless WAV file export
 */

// Encode an AudioBuffer into standard 16-bit PCM WAV format
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // SubChunk1Size (16 for PCM)
  setUint16(1);          // AudioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2);              // BlockAlign
  setUint16(16);                         // BitsPerSample

  // data sub-chunk
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // SubChunk2Size

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      // Convert to 16-bit PCM
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

// Slice audio from audio URL or File buffer and export as WAV
export async function extractAndDownloadSegment(
  audioSrc: string,
  startTime: number,
  endTime: number,
  title: string
): Promise<void> {
  const duration = Math.max(0.1, endTime - startTime);

  // Fetch audio data
  const response = await fetch(audioSrc);
  const arrayBuffer = await response.arrayBuffer();

  // Create AudioContext to decode
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const fullBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = fullBuffer.sampleRate;
  const startOffset = Math.floor(Math.max(0, startTime) * sampleRate);
  const endOffset = Math.floor(Math.min(fullBuffer.duration, endTime) * sampleRate);
  const frameCount = Math.max(1, endOffset - startOffset);

  // Render sliced segment using OfflineAudioContext
  const offlineCtx = new OfflineAudioContext(
    fullBuffer.numberOfChannels,
    frameCount,
    sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = fullBuffer;
  source.connect(offlineCtx.destination);
  source.start(0, startTime, duration);

  const slicedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(slicedBuffer);

  // Download blob
  const downloadUrl = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = downloadUrl;
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'audio-track';
  a.download = `${safeTitle}.wav`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

// Extract waveform peaks for smooth visual waveform display
export async function generateWaveformPeaks(
  audioSrc: string,
  samplesCount = 120
): Promise<number[]> {
  try {
    const response = await fetch(audioSrc);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer);

    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samplesCount);
    const peaks: number[] = [];

    for (let i = 0; i < samplesCount; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j += 10) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      const avg = sum / (blockSize / 10);
      peaks.push(Math.min(1, Math.max(0.08, avg * 3.5)));
    }

    return peaks;
  } catch {
    // Return pseudo-random harmonic peaks fallback if decoding fails
    return Array.from({ length: samplesCount }, (_, i) => {
      const v = Math.sin(i * 0.15) * 0.3 + Math.cos(i * 0.08) * 0.25 + 0.45;
      return Math.max(0.12, Math.min(0.95, v + Math.random() * 0.1));
    });
  }
}
