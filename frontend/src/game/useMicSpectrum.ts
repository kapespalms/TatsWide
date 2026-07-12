import { useEffect, useRef, useState } from 'react';

export interface MicSpectrumSnapshot {
  volume: number;
  bins: Uint8Array;
}

function createFrequencyBuffer(size: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new ArrayBuffer(size)) as Uint8Array<ArrayBuffer>;
}

export function useMicSpectrum(stream: MediaStream | null): MicSpectrumSnapshot {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [snapshot, setSnapshot] = useState<MicSpectrumSnapshot>({ volume: 0, bins: new Uint8Array(0) });

  useEffect(() => {
    if (!stream) {
      analyserRef.current = null;
      dataArrayRef.current = null;
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setSnapshot({ volume: 0, bins: new Uint8Array(0) });
      return;
    }

    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = analyser;
    dataArrayRef.current = createFrequencyBuffer(analyser.frequencyBinCount);
    void audioCtx.resume();

    return () => {
      source.disconnect();
      void audioCtx.close();
      analyserRef.current = null;
      dataArrayRef.current = null;
      audioCtxRef.current = null;
    };
  }, [stream]);

  useEffect(() => {
    let frameId = 0;
    const tick = () => {
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let total = 0;
        for (let i = 0; i < dataArray.length; i++) total += dataArray[i];
        setSnapshot({ volume: total / dataArray.length, bins: Uint8Array.from(dataArray) });
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [stream]);

  return snapshot;
}
