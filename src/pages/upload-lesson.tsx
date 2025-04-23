// pages/upload-lesson.tsx
import { useState } from "react";

/* 8-char hex – same format your Roblox session IDs use */
const ID_RE = /^[0-9a-f]{8}$/i;

export default function UploadLessonPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    // 1) derive session ID from the filename
    const lessonId = file.name.replace(/\.[^.]+$/, "").toLowerCase();
    if (!ID_RE.test(lessonId)) {
      setMsg("✗ File name must be the 8-char sessionId, e.g. 39cd3bfe.mp4");
      return;
    }

    setBusy(true);
    setPct(0);
    setMsg("");

    // 2) get a signed PUT URL
    const metaRes = await fetch("/api/gcs-signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        contentType: file.type || "video/mp4",
        title,
        description: desc,
      }),
    });
    if (!metaRes.ok) {
      setMsg("✗ Failed to obtain upload URL");
      setBusy(false);
      return;
    }
    const { url } = await metaRes.json();

    // 3) PUT the file to Cloud Storage
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setPct(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    })
      .then(() => {
        // once the upload is in, we'll let the backend event trigger do its work
        setMsg("✓ File uploaded — processing…");
      })
      .catch((err) => {
        setMsg(`✗ ${err.message}`);
      })
      .finally(() => {
        setBusy(false);
      });
  }

  return (
    <main className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Upload new lesson</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <input
          className="border p-2 w-full"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Description"
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        {busy && (
          <div className="w-full bg-gray-200 h-3 rounded">
            <div
              className="h-3 bg-blue-600 rounded transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        <button
          className="bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={!file || busy}
        >
          {busy ? `Uploading ${pct}%…` : "Upload"}
        </button>
      </form>

      {msg && <p>{msg}</p>}
    </main>
  );
}
