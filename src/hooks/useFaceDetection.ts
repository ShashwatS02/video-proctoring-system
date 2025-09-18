import { useEffect, useRef, useState, useCallback } from "react";
import { FaceMesh, Results } from "@mediapipe/face_mesh";
import type { DetectionState } from "../types/proctoring";

// --- START: New EAR Calculation Logic ---

// Helper to calculate the distance between two points
const euclidianDistance = (p1: any, p2: any) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

// Calculates the Eye Aspect Ratio for a single eye's landmarks
const calculateEAR = (eyeLandmarks: any[]) => {
  const p1 = eyeLandmarks[0];
  const p2 = eyeLandmarks[1];
  const p3 = eyeLandmarks[2];
  const p4 = eyeLandmarks[3];
  const p5 = eyeLandmarks[4];
  const p6 = eyeLandmarks[5];

  const verticalDist = euclidianDistance(p2, p6) + euclidianDistance(p3, p5);
  const horizontalDist = euclidianDistance(p1, p4);

  const ear = verticalDist / (2.0 * horizontalDist);
  return ear;
};

// These are the specific landmark indices for eyes from MediaPipe
const LEFT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144];

// Thresholds for drowsiness detection
const EAR_THRESHOLD = 0.22; // If EAR is below this, the eye is considered closed
const DROWSINESS_TIME_THRESHOLD = 2000; // 2 seconds of closed eyes triggers drowsiness

// --- END: New EAR Calculation Logic ---

// This function remains unchanged
const calculateFocus = (landmarks: any[]): number => {
  if (!landmarks || landmarks.length === 0) return 0;
  // const p1 = landmarks[1];
  // const p2 = landmarks[152];
  const p3 = landmarks[234];
  const p4 = landmarks[454];
  const midPointX = (p3.x + p4.x) / 2;
  const noseX = landmarks[4].x;
  const focusScore = 1 - (2 * Math.abs(midPointX - noseX)) / (p4.x - p3.x);
  return isNaN(focusScore) ? 1 : focusScore;
};

export const useFaceDetection = (
  videoElement: HTMLVideoElement | null,
  isActive: boolean
) => {
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const animationFrameRef = useRef<number>();
  // New ref to track when drowsiness (eye closure) starts
  const drowsinessStartRef = useRef<number | null>(null);

  const [detectionState, setDetectionState] = useState<DetectionState>({
    isFocused: true,
    isDrowsy: false, // Add isDrowsy to the initial state
    faceCount: 0,
    lastFaceDetected: Date.now(),
    focusLostStart: null,
    noFaceStart: null,
  });

  const onResults = useCallback((results: Results) => {
    const now = Date.now();
    const faceCount = results.multiFaceLandmarks
      ? results.multiFaceLandmarks.length
      : 0;

    let isFocused = true;
    let isDrowsy = false;

    if (faceCount === 1) {
      const landmarks = results.multiFaceLandmarks[0];

      // Focus calculation (unchanged)
      const focusScore = calculateFocus(landmarks);
      if (focusScore < 0.6) {
        isFocused = false;
      }

      // --- START: Drowsiness Detection Logic ---
      const leftEye = LEFT_EYE_LANDMARKS.map((i) => landmarks[i]);
      const rightEye = RIGHT_EYE_LANDMARKS.map((i) => landmarks[i]);

      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      // Check if eyes are closed
      if (avgEAR < EAR_THRESHOLD) {
        if (!drowsinessStartRef.current) {
          // If eyes just closed, start the timer
          drowsinessStartRef.current = now;
        } else if (
          now - drowsinessStartRef.current >
          DROWSINESS_TIME_THRESHOLD
        ) {
          // If eyes have been closed long enough, set drowsy flag
          isDrowsy = true;
        }
      } else {
        // If eyes are open, reset the timer
        drowsinessStartRef.current = null;
        isDrowsy = false;
      }
      // --- END: Drowsiness Detection Logic ---
    } else if (faceCount !== 1) {
      isFocused = false;
    }

    // Update the main detection state with all flags
    setDetectionState((prev) => ({
      ...prev,
      faceCount,
      isFocused,
      isDrowsy,
      lastFaceDetected: faceCount > 0 ? now : prev.lastFaceDetected,
      noFaceStart:
        faceCount === 0 && !prev.noFaceStart
          ? now
          : faceCount > 0
          ? null
          : prev.noFaceStart,
      focusLostStart:
        !isFocused && !prev.focusLostStart
          ? now
          : isFocused
          ? null
          : prev.focusLostStart,
    }));
  }, []);

  const detectionLoop = useCallback(async () => {
    if (faceMeshRef.current && videoElement && videoElement.readyState >= 3) {
      await faceMeshRef.current.send({ image: videoElement });
    }
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    }
  }, [videoElement, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(onResults);
    faceMeshRef.current = faceMesh;

    return () => {
      faceMesh.close();
      faceMeshRef.current = null;
    };
  }, [onResults, isActive]);

  useEffect(() => {
    if (isActive && videoElement) {
      detectionLoop();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, videoElement, detectionLoop]);

  return { detectionState };
};
