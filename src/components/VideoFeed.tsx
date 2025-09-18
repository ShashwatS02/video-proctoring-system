import React, { useEffect, useRef } from "react";
import { Camera, CameraOff } from "lucide-react";
import { useVideoStream } from "../hooks/useVideoStream";
import { useObjectDetection } from "../hooks/useObjectDetection";
import { useFaceDetection } from "../hooks/useFaceDetection";
import { supabase } from "../supabaseConfig";
import { useAudioDetection } from "../hooks/useAudioDetection";

interface VideoFeedProps {
  isMonitoring: boolean;
  sessionId: string;
  onDetectionUpdate: (detections: any[], faceState: any) => void;
  onAudioUpdate: (isLoud: boolean) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  isMonitoring,
  sessionId,
  onDetectionUpdate,
  onAudioUpdate,
}) => {
  const {
    videoRef,
    streamRef,
    isStreamActive,
    error,
    startStream,
    stopStream,
  } = useVideoStream();
  const { detections } = useObjectDetection(videoRef.current, isMonitoring);
  const { detectionState } = useFaceDetection(videoRef.current, isMonitoring);
  const { isLoud } = useAudioDetection(streamRef.current, isMonitoring);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // This useEffect handles the entire recording process
  useEffect(() => {
    if (isMonitoring && streamRef.current) {
      // This block starts the recording
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // This is the onstop logic that uploads the final video
      mediaRecorderRef.current.onstop = async () => {
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const filePath = `public/${sessionId}.webm`;

        try {
          const { error } = await supabase.storage
            .from("session_videos")
            .upload(filePath, videoBlob);

          if (error) throw error;

          console.log("Video uploaded successfully to Supabase!");
        } catch (uploadError) {
          console.error("Video upload failed:", uploadError);
        }
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      console.log("Recording started...");
    } else if (!isMonitoring && mediaRecorderRef.current) {
      // This block stops the recording
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        console.log("Recording stopped.");
      }
    }
  }, [isMonitoring, streamRef, sessionId]);

  useEffect(() => {
    onDetectionUpdate(detections, detectionState);
  }, [detections, detectionState, onDetectionUpdate]);

  useEffect(() => {
    if (isMonitoring && !isStreamActive) {
      startStream();
    } else if (!isMonitoring && isStreamActive) {
      stopStream();
    }
  }, [isMonitoring, isStreamActive, startStream, stopStream]);

  useEffect(() => {
    if (isLoud) {
      onAudioUpdate(true);
    }
  }, [isLoud, onAudioUpdate]);

  return (
    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
      <div className="aspect-video">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <CameraOff size={48} className="mb-4 text-rose-400" />
            <p className="text-center px-4">{error}</p>
            <button
              onClick={startStream}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Camera Access
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {!isStreamActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="text-center text-white">
                  <Camera size={48} className="mx-auto mb-4 text-slate-400" />
                  <p>Camera not active</p>
                </div>
              </div>
            )}

            {/* Detection Overlays */}
            {isMonitoring && detections.length > 0 && (
              <div className="absolute top-4 left-4">
                {detections.map((detection, index) => (
                  <div
                    key={index}
                    className="bg-rose-600 text-white px-2 py-1 rounded text-sm mb-1"
                  >
                    {detection.class} ({Math.round(detection.confidence * 100)}
                    %)
                  </div>
                ))}
              </div>
            )}

            {/* Focus Status */}
            {isMonitoring && (
              <div className="absolute top-4 right-4">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    detectionState.isFocused
                      ? "bg-teal-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {detectionState.faceCount === 0
                    ? "No Face"
                    : detectionState.faceCount > 1
                    ? "Multiple Faces"
                    : detectionState.isFocused
                    ? "Focused"
                    : "Not Focused"}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
