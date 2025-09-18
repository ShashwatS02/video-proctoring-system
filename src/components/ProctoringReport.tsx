import React from "react";
import {
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { InterviewSession } from "../types/proctoring";

interface ProctoringReportProps {
  session: InterviewSession;
  onDownloadPDF: () => void;
  onDownloadCSV: () => void;
}

export const ProctoringReport: React.FC<ProctoringReportProps> = ({
  session,
  onDownloadPDF,
  onDownloadCSV,
}) => {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const duration = session.endTime
    ? new Date(session.endTime).getTime() -
      new Date(session.startTime).getTime()
    : 0;

  const eventStats = {
    focusLost: session.events.filter((e) => e.type === "focus_lost").length,
    noFace: session.events.filter((e) => e.type === "no_face").length,
    multipleFaces: session.events.filter((e) => e.type === "multiple_faces")
      .length,
    phoneDetected: session.events.filter((e) => e.type === "phone_detected")
      .length,
    booksDetected: session.events.filter((e) => e.type === "book_detected")
      .length,
    devicesDetected: session.events.filter((e) => e.type === "device_detected")
      .length,
    drowsinessDetected: session.events.filter(
      (e) => e.type === "drowsiness_detected"
    ).length,
    audioDetected: session.events.filter((e) => e.type === "audio_detected")
      .length,
  };

  const totalViolations = Object.values(eventStats).reduce(
    (sum, count) => sum + count,
    0
  );

  const getIntegrityLevel = (score: number) => {
    if (score >= 90)
      return { level: "Excellent", color: "text-teal-600", icon: CheckCircle };
    if (score >= 75)
      return { level: "Good", color: "text-indigo-600", icon: CheckCircle };
    if (score >= 60)
      return { level: "Fair", color: "text-amber-600", icon: AlertTriangle };
    return { level: "Poor", color: "text-rose-600", icon: XCircle };
  };

  const integrity = getIntegrityLevel(session.integrityScore);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="text-indigo-600" size={24} />
          <h2 className="text-2xl font-bold text-slate-900">
            Proctoring Report
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onDownloadPDF}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>PDF</span>
          </button>
          <button
            onClick={onDownloadCSV}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-700 mb-2">Candidate</h3>
          <p className="text-lg font-semibold">{session.candidateName}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-700 mb-2">Duration</h3>
          <p className="text-lg font-semibold">{formatDuration(duration)}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-700 mb-2">Total Violations</h3>
          <p
            className={`text-lg font-semibold ${
              totalViolations === 0 ? "text-teal-600" : "text-rose-600"
            }`}
          >
            {totalViolations}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-700 mb-2">Integrity Score</h3>
          <div className="flex items-center space-x-2">
            <integrity.icon className={integrity.color} size={20} />
            <span className={`text-lg font-semibold ${integrity.color}`}>
              {session.integrityScore}/100
            </span>
          </div>
          <p className={`text-sm ${integrity.color}`}>{integrity.level}</p>
        </div>
      </div>

      {/* --- START: THIS IS THE MISSING CODE --- */}
      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-slate-800">
            Focus & Environment
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Focus Lost Events</span>
              <span
                className={`font-semibold ${
                  eventStats.focusLost === 0 ? "text-teal-600" : "text-rose-600"
                }`}
              >
                {eventStats.focusLost}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Drowsiness Detected</span>
              <span
                className={`font-semibold ${
                  eventStats.drowsinessDetected === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {eventStats.drowsinessDetected}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">No Face Detected</span>
              <span
                className={`font-semibold ${
                  eventStats.noFace === 0 ? "text-teal-600" : "text-rose-600"
                }`}
              >
                {eventStats.noFace}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Multiple Faces</span>
              <span
                className={`font-semibold ${
                  eventStats.multipleFaces === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {eventStats.multipleFaces}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Background Noise</span>
              <span
                className={`font-semibold ${
                  eventStats.audioDetected === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {eventStats.audioDetected}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 text-slate-800">
            Object Detection
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Phone Detected</span>
              <span
                className={`font-semibold ${
                  eventStats.phoneDetected === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {eventStats.phoneDetected}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Books/Notes Detected</span>
              <span
                className={`font-semibold ${
                  eventStats.booksDetected === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {eventStats.booksDetected}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Other Devices</span>
              <span
                className={`font-semibold ${
                  eventStats.devicesDetected === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {eventStats.devicesDetected}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          Event Timeline
        </h3>
        <div className="max-h-64 overflow-y-auto border rounded-lg">
          {session.events.length === 0 ? (
            <p className="text-center text-slate-500 py-4">
              No events recorded
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                    Event
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {session.events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {format(new Date(event.timestamp), "HH:mm:ss")}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {event.description}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-600">
                      {event.duration ? formatDuration(event.duration) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* --- END: THIS IS THE MISSING CODE --- */}
    </div>
  );
};
