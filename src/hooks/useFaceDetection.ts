import { useEffect, useRef, useState, useCallback } from "react";
// --- CHANGE 1: Import the entire module ---
import * as mediapipeFaceMesh from "@mediapipe/face_mesh";
import type { DetectionState } from "../types/proctoring";

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

const calculateFocus = (landmarks: any[]): boolean => {
  if (!landmarks || landmarks.length === 0) return false;
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
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
  const isFocused = horizontalRatio < 0.15 && verticalRatio > 1.2;
  return isFocused;
};

const LEFT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144];
const EAR_THRESHOLD = 0.22;
const DROWSINESS_TIME_THRESHOLD = 2000;

export const useFaceDetection = (
  videoElement: HTMLVideoElement | null,
  isActive: boolean
) => {
  const faceMeshRef = useRef<mediapipeFaceMesh.FaceMesh | null>(null);
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

  const onResults = useCallback((results: mediapipeFaceMesh.Results) => {
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
      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;
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
    if (!isActive) return;

    // --- CHANGE 2: Use the new import name here ---
    const faceMesh = new mediapipeFaceMesh.FaceMesh({
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
