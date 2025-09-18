export interface DetectionEvent {
  id: string;
  type:
    | "focus_lost"
    | "no_face"
    | "multiple_faces"
    | "phone_detected"
    | "book_detected"
    | "device_detected"
    | "drowsiness_detected"
    | "audio_detected";
  timestamp: number;
  duration?: number;
  confidence?: number;
  description: string;
}

export interface InterviewSession {
  id: string;
  candidateName: string;
  startTime: string; // <-- Corrected to string
  endTime?: string; // <-- Corrected to string
  events: DetectionEvent[];
  integrityScore: number;
}

export interface DetectionState {
  isFocused: boolean;
  isDrowsy: boolean;
  faceCount: number;
  lastFaceDetected: number;
  focusLostStart: number | null;
  noFaceStart: number | null;
}

export interface ObjectDetection {
  class: string;
  confidence: number;
  bbox: number[];
}
