import React, { useState } from "react";
import { Play, User } from "lucide-react";

interface SessionSetupProps {
  onStartSession: (candidateName: string) => void;
}

export const SessionSetup: React.FC<SessionSetupProps> = ({
  onStartSession,
}) => {
  const [candidateName, setCandidateName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateName.trim()) {
      onStartSession(candidateName.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="text-indigo-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Start Interview Session
        </h2>
        <p className="text-slate-600">
          Enter candidate details to begin proctoring
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="candidateName"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Candidate Name
          </label>
          <input
            type="text"
            id="candidateName"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            placeholder="Enter candidate's full name"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!candidateName.trim()}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Play size={20} />
          <span>Start Interview</span>
        </button>
      </form>

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h3 className="font-medium text-slate-900 mb-2">
          Monitoring Features:
        </h3>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Focus and attention tracking</li>
          <li>• Object detection for unauthorized items</li>
          <li>• Multiple face detection</li>
          <li>• Real-time alerts and logging</li>
          <li>• Comprehensive integrity reporting</li>
        </ul>
      </div>
    </div>
  );
};
