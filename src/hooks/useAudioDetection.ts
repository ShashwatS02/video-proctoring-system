import { useState, useEffect, useRef } from "react";

// This threshold determines what volume is considered "loud". Range is 0-255.
const VOLUME_THRESHOLD = 50;

export const useAudioDetection = (
  mediaStream: MediaStream | null,
  isActive: boolean
) => {
  const [isLoud, setIsLoud] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const analyseAudio = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate the average volume
      const average =
        dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

      setIsLoud(average > VOLUME_THRESHOLD);
    }

    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(analyseAudio);
    }
  };

  useEffect(() => {
    if (isActive && mediaStream && mediaStream.getAudioTracks().length > 0) {
      // Start audio analysis
      const audioContext = new AudioContext();
      analyserRef.current = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);

      source.connect(analyserRef.current);
      audioContextRef.current = audioContext;

      analyseAudio();
    } else {
      // Stop audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
      setIsLoud(false);
    }

    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, [isActive, mediaStream]);

  return { isLoud };
};
