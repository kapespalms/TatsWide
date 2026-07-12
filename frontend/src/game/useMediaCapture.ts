import { useCallback, useEffect, useRef, useState } from 'react';

export interface MediaCaptureState {
  stream: MediaStream | null;
  active: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activate: () => Promise<MediaStream | null>;
  stop: () => void;
}

export function useMediaCapture(): MediaCaptureState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setActive(false);
  }, [stream]);

  const activate = useCallback(async () => {
    if (stream) return stream;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true },
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      setActive(true);
      setError(null);
      return mediaStream;
    } catch (captureError) {
      const message = captureError instanceof Error ? captureError.message : 'Camera/mic access denied';
      setError(message);
      setActive(false);
      return null;
    }
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.muted = true;
    void video.play().catch(() => setError('Unable to start webcam preview.'));
  }, [stream]);

  useEffect(() => () => stop(), [stop]);

  return { stream, active, error, videoRef, activate, stop };
}
