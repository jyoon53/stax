import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";

const socket = io();

export default function InstructorDashboard() {
  const [data, setData] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [status, setStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    socket.on("teleporterData", (incomingData) => {
      setData(incomingData);
    });
  }, []);

  const startRecording = async () => {
    setStatus("Starting recording...");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
      });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
      });
      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        setRecordedBlob(blob);
        setStatus("Recording complete. Ready to upload.");
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      setStatus("Recording in progress...");
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("Error starting recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setStatus("Recording stopped.");
    }
  };

  const uploadRecording = async () => {
    if (!recordedBlob) return;
    setStatus("Uploading recording...");
    const formData = new FormData();
    formData.append("video", recordedBlob, "lessonRecording.webm");
    try {
      const response = await fetch("/api/upload-recording", {
        method: "POST",
        body: formData,
      });
      const plan = await response.json();
      setStatus("Lesson plan generated!");
      // Process lesson plan as needed.
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("Upload error.");
    }
  };

  return (
    <div className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Class & Lecture Creation
        </h2>
        <div className="mb-4">
          <button
            onClick={recording ? stopRecording : startRecording}
            className="bg-red-600 hover:bg-red-700 transition duration-300 text-white py-2 px-4 rounded"
          >
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
          {recordedBlob && (
            <div className="mt-4">
              <video
                controls
                src={URL.createObjectURL(recordedBlob)}
                className="w-full max-w-md border rounded"
              />
              <button
                onClick={uploadRecording}
                className="mt-2 bg-red-600 hover:bg-red-700 transition duration-300 text-white py-2 px-4 rounded"
              >
                Upload Recording & Generate Lesson Plan
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Course Organizing Tools</h2>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-lg">
            Manage your courses, schedule lectures, and track student
            attendance.
          </p>
          <Link href="/course-management">
            <span className="text-red-600 hover:underline cursor-pointer">
              Go to Course Management
            </span>
          </Link>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Calendar</h2>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-lg">
            View upcoming lectures, meetings, and class schedules.
          </p>
          <Link href="/calendar">
            <span className="text-red-600 hover:underline cursor-pointer">
              View Calendar
            </span>
          </Link>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Course Roster Management
        </h2>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-lg">
            Manage your class rosters, invite collaborators, and track student
            progress.
          </p>
          <Link href="/roster-management">
            <span className="text-red-600 hover:underline cursor-pointer">
              Manage Roster
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
