import React from "react";
import {
  Eye,
  EyeOff,
  Users,
  Smartphone,
  Book,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import type { DetectionEvent } from "../types/proctoring";

interface MonitoringDashboardProps {
  events: DetectionEvent[];
  currentDetections: any[];
  faceState: any;
  sessionDuration: number;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  events,
  currentDetections,
  faceState,
  sessionDuration,
}) => {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "focus_lost":
        return <EyeOff size={16} />;
      case "no_face":
        return <Eye size={16} />;
      case "multiple_faces":
        return <Users size={16} />;
      case "phone_detected":
        return <Smartphone size={16} />;
      case "book_detected":
        return <Book size={16} />;
      case "device_detected":
        return <Monitor size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "phone_detected":
      case "book_detected":
      case "device_detected":
        return "text-rose-600 bg-rose-50";
      case "multiple_faces":
        return "text-orange-600 bg-orange-50";
      case "focus_lost":
      case "no_face":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  const recentEvents = events.slice(-10).reverse();
  const criticalEvents = events.filter((e) =>
    ["phone_detected", "book_detected", "device_detected"].includes(e.type)
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Live Monitoring</h2>
        <div className="text-sm text-gray-600">
          Session: {formatDuration(sessionDuration)}
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Focus Status</p>
              <p
                className={`font-semibold ${
                  faceState.isFocused ? "text-teal-600" : "text-rose-600"
                }`}
              >
                {faceState.isFocused ? "Focused" : "Distracted"}
              </p>
            </div>
            {faceState.isFocused ? (
              <Eye className="text-teal-600" size={20} />
            ) : (
              <EyeOff className="text-rose-600" size={20} />
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Face Count</p>
              <p
                className={`font-semibold ${
                  faceState.faceCount === 1 ? "text-teal-600" : "text-rose-600"
                }`}
              >
                {faceState.faceCount}
              </p>
            </div>
            <Users
              className={
                faceState.faceCount === 1 ? "text-teal-600" : "text-rose-600"
              }
              size={20}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Objects Detected</p>
              <p
                className={`font-semibold ${
                  currentDetections.length === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {currentDetections.length}
              </p>
            </div>
            <AlertTriangle
              className={
                currentDetections.length === 0
                  ? "text-teal-600"
                  : "text-rose-600"
              }
              size={20}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Violations</p>
              <p
                className={`font-semibold ${
                  criticalEvents.length === 0
                    ? "text-teal-600"
                    : "text-rose-600"
                }`}
              >
                {criticalEvents.length}
              </p>
            </div>
            <AlertTriangle
              className={
                criticalEvents.length === 0 ? "text-teal-600" : "text-rose-600"
              }
              size={20}
            />
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Events
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No events recorded yet
            </p>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getEventIcon(event.type)}
                    <span className="font-medium">{event.description}</span>
                  </div>
                  <span className="text-sm">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.duration && (
                  <p className="text-sm mt-1">
                    Duration: {formatDuration(event.duration)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
