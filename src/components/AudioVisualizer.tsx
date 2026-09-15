import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  isPlaying,
  color = '#6366f1',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Set up AudioContext and AnalyserNode on first play interaction
    const initAudioContext = () => {
      if (audioCtxRef.current) return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // smooth 32 bins
        analyser.smoothingTimeConstant = 0.8;

        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceNodeRef.current = source;
      } catch (e) {
        // May fail if CORS prevents MediaElementSource or already connected
        console.warn('AudioContext visualization fallback', e);
      }
    };

    const handlePlay = () => {
      initAudioContext();
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    audioElement.addEventListener('play', handlePlay);
    return () => {
      audioElement.removeEventListener('play', handlePlay);
    };
  }, [audioElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = 24;
    const dataArray = new Uint8Array(bars);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else if (isPlaying) {
        // Simulated fallback wave if MediaElementSource was blocked by CORS
        const now = Date.now() / 200;
        for (let i = 0; i < bars; i++) {
          const fakeVal = Math.sin(now + i * 0.4) * 40 + Math.cos(now * 1.5 + i * 0.2) * 30 + 70;
          dataArray[i] = Math.max(10, Math.min(240, fakeVal));
        }
      } else {
        // Idle gentle waveform
        for (let i = 0; i < bars; i++) {
          dataArray[i] = 12 + Math.sin(i * 0.5) * 6;
        }
      }

      const barWidth = (canvas.width / bars) - 2;
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.max(3, (dataArray[i] / 255) * canvas.height * 0.95);
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#818cf8');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={36}
      className="rounded-md opacity-90 transition-opacity"
      title="موجات الصوت التفاعلية"
    />
  );
};
