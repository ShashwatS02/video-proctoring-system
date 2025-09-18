import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import type { ObjectDetection } from "../types/proctoring";

export const useObjectDetection = (
  videoElement: HTMLVideoElement | null,
  isActive: boolean
) => {
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<ObjectDetection[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const animationFrameRef = useRef<number>();

  const loadModel = async () => {
    try {
      await tf.ready();
      const model = await cocoSsd.load();
      modelRef.current = model;
      setIsModelLoaded(true);
    } catch (error) {
      console.error("Failed to load object detection model:", error);
    }
  };

  const detectObjects = useCallback(async () => {
    if (!modelRef.current || !videoElement || !isActive) return;

    // Check if video element has loaded and has valid dimensions
    if (
      videoElement.readyState < 2 ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0
    ) {
      // Video not ready, try again on next frame
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(detectObjects);
      }
      return;
    }

    try {
      const predictions = await modelRef.current.detect(videoElement);

      const relevantObjects = predictions.filter((prediction) => {
        const relevantClasses = [
          "cell phone",
          "book",
          "laptop",
          "keyboard",
          "mouse",
          "remote",
        ];
        return relevantClasses.some((cls) =>
          prediction.class.toLowerCase().includes(cls)
        );
      });

      const objectDetections: ObjectDetection[] = relevantObjects.map(
        (prediction) => ({
          class: prediction.class,
          confidence: prediction.score,
          bbox: prediction.bbox,
        })
      );

      setDetections(objectDetections);

      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(detectObjects);
      }
    } catch (error) {
      console.error("Object detection error:", error);
    }
  }, [videoElement, isActive]);

  useEffect(() => {
    loadModel();
  }, []);

  useEffect(() => {
    if (isModelLoaded && videoElement && isActive) {
      detectObjects();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detectObjects, isModelLoaded, videoElement, isActive]);

  return { detections, isModelLoaded };
};
