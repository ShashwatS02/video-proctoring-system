import jsPDF from "jspdf";
import type { InterviewSession } from "../types/proctoring";

export const generatePDFReport = async (session: InterviewSession) => {
  const pdf = new jsPDF();
  const margin = 20;

  // Title
  pdf.setFontSize(20);
  pdf.text("Proctoring Report", margin, 30);

  // Session Info
  pdf.setFontSize(12);
  const startY = 50;
  pdf.text(`Candidate: ${session.candidateName}`, margin, startY);
  pdf.text(
    `Start Time: ${new Date(session.startTime).toLocaleString()}`,
    margin,
    startY + 10
  );

  if (session.endTime) {
    pdf.text(
      `End Time: ${new Date(session.endTime).toLocaleString()}`,
      margin,
      startY + 20
    );
    const duration =
      new Date(session.endTime).getTime() -
      new Date(session.startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    pdf.text(
      `Duration: ${minutes}:${seconds.toString().padStart(2, "0")}`,
      margin,
      startY + 30
    );
  }

  pdf.text(
    `Integrity Score: ${session.integrityScore}/100`,
    margin,
    startY + 40
  );

  // --- START: THIS IS THE MISSING CODE ---
  // Event Statistics
  pdf.setFontSize(14);
  pdf.text("Event Summary:", margin, startY + 60);

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

  const eventLabels = [
    `Focus Lost: ${eventStats.focusLost}`,
    `Drowsiness Detected: ${eventStats.drowsinessDetected}`,
    `No Face Detected: ${eventStats.noFace}`,
    `Multiple Faces: ${eventStats.multipleFaces}`,
    `Background Noise: ${eventStats.audioDetected}`,
    `Phone Detected: ${eventStats.phoneDetected}`,
    `Books/Notes Detected: ${eventStats.booksDetected}`,
    `Other Devices: ${eventStats.devicesDetected}`,
  ];

  pdf.setFontSize(10);
  eventLabels.forEach((label, index) => {
    pdf.text(label, margin, startY + 75 + index * 8);
  });

  // Event Timeline
  if (session.events.length > 0) {
    const timelineStartY = startY + 75 + eventLabels.length * 8 + 10;
    pdf.setFontSize(14);
    pdf.text("Event Timeline:", margin, timelineStartY);

    pdf.setFontSize(8);
    const tableY = timelineStartY + 15;

    session.events.slice(0, 20).forEach((event, index) => {
      const y = tableY + index * 8;
      if (y > pdf.internal.pageSize.getHeight() - 20) return; // Avoid page overflow

      const time = new Date(event.timestamp).toLocaleTimeString();
      pdf.text(time, margin, y);
      pdf.text(event.description, margin + 30, y);

      if (event.duration) {
        const durationStr = Math.floor(event.duration / 1000);
        pdf.text(`${durationStr}s`, margin + 120, y);
      }
    });
  }
  // --- END: THIS IS THE MISSING CODE ---

  pdf.save(
    `proctoring-report-${session.candidateName.replace(/\s+/g, "-")}.pdf`
  );
};

export const generateCSVReport = (session: InterviewSession) => {
  const durationMs = session.endTime
    ? new Date(session.endTime).getTime() -
      new Date(session.startTime).getTime()
    : 0;

  const csvData = [
    [
      "Candidate Name",
      "Start Time",
      "End Time",
      "Duration (ms)",
      "Integrity Score",
      "Total Events",
    ],
    [
      session.candidateName,
      session.startTime,
      session.endTime || "",
      durationMs.toString(),
      session.integrityScore.toString(),
      session.events.length.toString(),
    ],
    [],
    ["Event Timeline"],
    ["Timestamp", "Type", "Description", "Duration (ms)", "Confidence"],
    ...session.events.map((event) => [
      new Date(event.timestamp).toISOString(),
      event.type,
      event.description,
      event.duration?.toString() || "",
      event.confidence?.toString() || "",
    ]),
  ];

  const csvContent = csvData
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `proctoring-report-${session.candidateName.replace(/\s+/g, "-")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
