// src/pages/dashboard.jsx
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io();

export default function dashboard() {
  const [data, setData] = useState(null);
  const [lessonPlan, setLessonPlan] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState([]);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    socket.on("teleporterData", (incomingData) => {
      setData(incomingData);
    });
  }, []);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch("/api/teleporter/logs");
        const logsData = await response.json();
        setLogs(logsData);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    }
    fetchLogs();
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
      setLessonPlan(plan);
      setStatus("Lesson plan generated!");
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("Upload error.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
      {/* Real-Time Teleporter Data */}
      <section className="mb-8 p-4 bg-gray-50 border rounded">
        <h3 className="text-xl font-semibold mb-2">
          Real-Time Teleporter Data
        </h3>
        {data ? (
          <pre className="bg-white p-2 rounded border text-gray-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p>No teleporter data received yet.</p>
        )}
      </section>

      {/* Recording Section */}
      <section className="mb-8 p-4 bg-red-50 border rounded">
        <h3 className="text-xl font-semibold mb-2">Lesson Recording</h3>
        <p className="mb-2 text-sm text-gray-600">{status}</p>
        {recording ? (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 transition duration-300 text-white py-2 px-4 rounded"
          >
            Stop Recording
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="bg-red-600 hover:bg-red-700 transition duration-300 text-white py-2 px-4 rounded"
          >
            Start Recording
          </button>
        )}
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
              Upload Recording
            </button>
          </div>
        )}
      </section>

      {/* Lesson Plan Section */}
      {lessonPlan && (
        <section className="p-4 bg-red-50 border rounded">
          <h3 className="text-xl font-semibold mb-2">Lesson Plan</h3>
          <ul className="list-disc ml-6">
            {lessonPlan.chapters.map((chapter, index) => (
              <li key={index}>
                {chapter.title}:{" "}
                <Link href={chapter.clipUrl}>
                  <span className="text-red-600 hover:underline cursor-pointer">
                    {chapter.clipUrl}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Historical Logs Section */}
      <section className="mt-8 p-4 bg-gray-50 border rounded">
        <h3 className="text-xl font-semibold mb-2">
          Historical Teleporter Logs
        </h3>
        {logs.length ? (
          <ul className="list-disc ml-6">
            {logs.map((log) => (
              <li key={log.id}>
                {log.timestamp}: {log.userID} in {log.chapterID}
              </li>
            ))}
          </ul>
        ) : (
          <p>No logs available.</p>
        )}
      </section>
    </div>
  );
}
