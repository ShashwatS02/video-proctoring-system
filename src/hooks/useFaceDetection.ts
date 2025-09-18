import { useEffect, useRef, useState, useCallback } from "react";
import type { DetectionState } from "../types/proctoring";

// This tells TypeScript that "FaceMesh" and "Results" are loaded globally from the script in index.html
declare const FaceMesh: any;
declare const Results: any;

const euclidianDistance = (p1: any, p2: any) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

const calculateEAR = (eyeLandmarks: any[]) => {
  const p1 = eyeLandmarks[0],
    p2 = eyeLandmarks[1],
    p3 = eyeLandmarks[2],
    p4 = eyeLandmarks[3],
    p5 = eyeLandmarks[4],
    p6 = eyeLandmarks[5];
  const verticalDist = euclidianDistance(p2, p6) + euclidianDistance(p3, p5);
  const horizontalDist = euclidianDistance(p1, p4);
  return verticalDist / (2.0 * horizontalDist);
};

// --- START: NEW STABLE FOCUS CALCULATION ---
const calculateFocus = (landmarks: any[]): boolean => {
  if (!landmarks || landmarks.length === 0) return false;

  const rightTemple = landmarks[234];
  const leftTemple = landmarks[454];
  const noseTip = landmarks[4];

  if (!rightTemple || !leftTemple || !noseTip) return true;

  const templeDist = Math.abs(leftTemple.x - rightTemple.x);
  if (templeDist < 0.1) return true; // Avoid division by zero

  const midPointX = (leftTemple.x + rightTemple.x) / 2;
  const noseDistFromCenter = Math.abs(midPointX - noseTip.x);

  // Ratio of how far the nose is from the center, relative to temple distance
  const focusRatio = noseDistFromCenter / templeDist;

  // If the nose has moved more than 20% of the way towards a temple,
  // we consider the user "not focused". This is a stable threshold.
  const FOCUS_THRESHOLD = 0.2;

  return focusRatio < FOCUS_THRESHOLD;
};
// --- END: NEW STABLE FOCUS CALCULATION ---

const LEFT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144];
const EAR_THRESHOLD = 0.22;
const DROWSINESS_TIME_THRESHOLD = 2000;

export const useFaceDetection = (
  videoElement: HTMLVideoElement | null,
  isActive: boolean
) => {
  const faceMeshRef = useRef<any | null>(null);
  const animationFrameRef = useRef<number>();
  const drowsinessStartRef = useRef<number | null>(null);

  const [detectionState, setDetectionState] = useState<DetectionState>({
    isFocused: true,
    isDrowsy: false,
    faceCount: 0,
    lastFaceDetected: Date.now(),
    focusLostStart: null,
    noFaceStart: null,
  });

  const onResults = useCallback((results: any) => {
    const now = Date.now();
    const faceCount = results.multiFaceLandmarks
      ? results.multiFaceLandmarks.length
      : 0;
    let isFocused = true;
    let isDrowsy = false;
    if (faceCount === 1) {
      const landmarks = results.multiFaceLandmarks[0];

      // Use the new, stable focus function
      isFocused = calculateFocus(landmarks);

      const leftEye = LEFT_EYE_LANDMARKS.map((i) => landmarks[i]);
      const rightEye = RIGHT_EYE_LANDMARKS.map((i) => landmarks[i]);
      const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2.0;
      if (avgEAR < EAR_THRESHOLD) {
        if (!drowsinessStartRef.current) {
          drowsinessStartRef.current = now;
        } else if (
          now - drowsinessStartRef.current >
          DROWSINESS_TIME_THRESHOLD
        ) {
          isDrowsy = true;
        }
      } else {
        drowsinessStartRef.current = null;
        isDrowsy = false;
      }
    } else {
      isFocused = false;
    }
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
    if (isActive && !faceMeshRef.current) {
      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
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
    }
  }, [isActive, onResults]);

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
