import { useState, useCallback } from "react";
import { Shield, StopCircle } from "lucide-react";
import { SessionSetup } from "./components/SessionSetup";
import { VideoFeed } from "./components/VideoFeed";
import { MonitoringDashboard } from "./components/MonitoringDashboard";
import { ProctoringReport } from "./components/ProctoringReport";
import { generatePDFReport, generateCSVReport } from "./utils/reportGenerator";
import type {
  DetectionEvent,
  InterviewSession,
  DetectionState,
  ObjectDetection,
} from "./types/proctoring";
import { supabase } from "./supabaseConfig";

function App() {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(
    null
  );
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [currentDetections, setCurrentDetections] = useState<ObjectDetection[]>(
    []
  );
  const [faceState, setFaceState] = useState<DetectionState>({
    isFocused: true,
    isDrowsy: false,
    faceCount: 0,
    lastFaceDetected: Date.now(),
    focusLostStart: null,
    noFaceStart: null,
  });

  const [eventCooldowns, setEventCooldowns] = useState<{
    [key: string]: number;
  }>({});

  const calculateIntegrityScore = (events: DetectionEvent[]): number => {
    let score = 100;
    const deductions = {
      phone_detected: 15,
      book_detected: 10,
      device_detected: 10,
      multiple_faces: 8,
      focus_lost: 5,
      no_face: 5,
      drowsiness_detected: 7,
      audio_detected: 5,
    };
    events.forEach((event) => {
      const deduction = deductions[event.type as keyof typeof deductions] || 2;
      score -= deduction;
    });
    return Math.max(0, score);
  };

  const addEvent = (
    type: DetectionEvent["type"],
    description: string,
    duration?: number,
    confidence?: number
  ) => {
    const event: DetectionEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      type,
      timestamp: Date.now(),
      duration,
      confidence,
      description,
    };
    setEvents((prev) => [...prev, event]);
  };

  const handleDetectionUpdate = useCallback(
    (detections: ObjectDetection[], detectionState: DetectionState) => {
      setCurrentDetections(detections);
      setFaceState(detectionState);
      if (!isSessionActive) return;
      const now = Date.now();
      const COOLDOWN_PERIOD = 20000;

      if (!detectionState.isFocused && detectionState.focusLostStart) {
        if (now - detectionState.focusLostStart > 5000) {
          const lastEventTime = eventCooldowns["focus_lost"] || 0;
          if (now - lastEventTime > COOLDOWN_PERIOD) {
            addEvent("focus_lost", "Candidate lost focus");
            setEventCooldowns((prev) => ({ ...prev, focus_lost: now }));
          }
        }
      }

      if (detectionState.faceCount === 0 && detectionState.noFaceStart) {
        if (now - detectionState.noFaceStart > 10000) {
          const lastEventTime = eventCooldowns["no_face"] || 0;
          if (now - lastEventTime > COOLDOWN_PERIOD) {
            addEvent("no_face", "No face detected");
            setEventCooldowns((prev) => ({ ...prev, no_face: now }));
          }
        }
      }

      if (detectionState.faceCount > 1) {
        const lastEventTime = eventCooldowns["multiple_faces"] || 0;
        if (now - lastEventTime > COOLDOWN_PERIOD) {
          addEvent(
            "multiple_faces",
            `Multiple faces detected (${detectionState.faceCount} faces)`
          );
          setEventCooldowns((prev) => ({ ...prev, multiple_faces: now }));
        }
      }

      if (detectionState.isDrowsy) {
        const lastEventTime = eventCooldowns["drowsiness_detected"] || 0;
        if (now - lastEventTime > COOLDOWN_PERIOD) {
          addEvent("drowsiness_detected", "Candidate appears drowsy");
          setEventCooldowns((prev) => ({ ...prev, drowsiness_detected: now }));
        }
      }

      detections.forEach((detection) => {
        if (detection.confidence > 0.7) {
          const eventType = detection.class.toLowerCase().includes("phone")
            ? "phone_detected"
            : detection.class.toLowerCase().includes("book")
            ? "book_detected"
            : "device_detected";
          const lastEventTime = eventCooldowns[eventType] || 0;
          if (now - lastEventTime > COOLDOWN_PERIOD) {
            addEvent(
              eventType,
              `${detection.class} detected`,
              undefined,
              detection.confidence
            );
            setEventCooldowns((prev) => ({ ...prev, [eventType]: now }));
          }
        }
      });
    },
    [isSessionActive, eventCooldowns]
  );

  const handleAudioUpdate = useCallback(
    (isLoud: boolean) => {
      if (!isSessionActive || !isLoud) return;
      const now = Date.now();
      const COOLDOWN_PERIOD = 20000;
      const lastEventTime = eventCooldowns["audio_detected"] || 0;
      if (now - lastEventTime > COOLDOWN_PERIOD) {
        addEvent("audio_detected", "Loud background noise detected");
        setEventCooldowns((prev) => ({ ...prev, audio_detected: now }));
      }
    },
    [isSessionActive, eventCooldowns]
  );

  const startSession = (candidateName: string) => {
    const session: InterviewSession = {
      id: `session-${Date.now()}`,
      candidateName,
      startTime: new Date().toISOString(),
      events: [],
      integrityScore: 100,
    };
    setCurrentSession(session);
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setEvents([]);
  };

  const endSession = async () => {
    if (currentSession) {
      const endTime = Date.now();
      const integrityScore = calculateIntegrityScore(events);
      const finalSessionData = {
        ...currentSession,
        startTime: new Date(currentSession.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        events,
        integrityScore,
      };
      setCurrentSession(finalSessionData);
      try {
        const { error } = await supabase
          .from("interviewSessions")
          .insert(finalSessionData);
        if (error) throw error;
        console.log("Session report saved to Supabase!");
      } catch (e) {
        console.error("Error saving session to Supabase: ", e);
        alert("Could not save the session report to the database.");
      }
    }
    setIsSessionActive(false);
  };

  const handleDownloadPDF = () => {
    if (currentSession) {
      generatePDFReport(currentSession);
    }
  };

  const handleDownloadCSV = () => {
    if (currentSession) {
      generateCSVReport(currentSession);
    }
  };

  const sessionDuration = isSessionActive ? Date.now() - sessionStartTime : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="text-indigo-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Video Proctoring System
                </h1>
                <p className="text-slate-600">
                  Focus & Object Detection for Interviews
                </p>
              </div>
            </div>
            {isSessionActive && (
              <button
                onClick={endSession}
                className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors flex items-center space-x-2"
              >
                <StopCircle size={20} />
                <span>End Session</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentSession ? (
          <SessionSetup onStartSession={startSession} />
        ) : (
          <div className="space-y-8">
            {isSessionActive && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-slate-900">
                        Interview Video Feed
                      </h2>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600">
                          Recording
                        </span>
                      </div>
                    </div>
                    <VideoFeed
                      isMonitoring={isSessionActive}
                      sessionId={currentSession.id}
                      onDetectionUpdate={handleDetectionUpdate}
                      onAudioUpdate={handleAudioUpdate}
                    />
                  </div>
                </div>
                <div>
                  <MonitoringDashboard
                    events={events}
                    currentDetections={currentDetections}
                    faceState={faceState}
                    sessionDuration={sessionDuration}
                  />
                </div>
              </div>
            )}
            {!isSessionActive && currentSession.endTime && (
              <ProctoringReport
                session={currentSession}
                onDownloadPDF={handleDownloadPDF}
                onDownloadCSV={handleDownloadCSV}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
