import { useRef, useEffect, useState } from "react";

export const useVideoStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreamActive(true);
        setError(null);
      }
    } catch (err) {
      setError(
        "Failed to access camera. Please ensure camera permissions are granted."
      );
      console.error("Error accessing media devices:", err);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsStreamActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    videoRef,
    streamRef,
    isStreamActive,
    error,
    startStream,
    stopStream,
  };
};
