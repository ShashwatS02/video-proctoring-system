import { useEffect, useRef, useState, useCallback } from "react";
import type { DetectionState } from "../types/proctoring";

// This tells TypeScript that "FaceMesh" and "Results" will be available globally
// on the window object, even though we are not importing them directly.
declare const FaceMesh: any;
declare const Results: any;

// Helper to calculate the distance between two points
const euclidianDistance = (p1: any, p2: any) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

// Calculates the Eye Aspect Ratio
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

// Calculates Focus
const calculateFocus = (landmarks: any[]): boolean => {
  if (!landmarks || landmarks.length === 0) return false;
  const nose = landmarks[1],
    leftEye = landmarks[33],
    rightEye = landmarks[263],
    mouthLeft = landmarks[61],
    mouthRight = landmarks[291];
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
  };
  const horizontalDist = Math.abs(eyeCenter.x - nose.x);
  const eyeDist = euclidianDistance(leftEye, rightEye);
  const horizontalRatio = horizontalDist / eyeDist;
  const mouthCenter = {
    x: (mouthLeft.x + mouthRight.x) / 2,
    y: (mouthLeft.y + mouthRight.y) / 2,
  };
  const verticalDist = Math.abs(eyeCenter.y - mouthCenter.y);
  const noseToMouthDist = euclidianDistance(nose, mouthCenter);
  const verticalRatio = noseToMouthDist / verticalDist;
  return horizontalRatio < 0.15 && verticalRatio > 1.2;
};

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

  const detectionLoop = useCallback(async () => {
    if (faceMeshRef.current && videoElement && videoElement.readyState >= 3) {
      await faceMeshRef.current.send({ image: videoElement });
    }
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    }
  }, [videoElement, isActive]);

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
