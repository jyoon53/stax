// pages/upload-lesson.tsx
import { useState } from "react";

/** 8-char hex – matches the Roblox session-ID format */
const ID_RE = /^[0-9a-f]{8}$/i;

export default function UploadLessonPage() {
  /* form state */
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  /* UI state */
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");

  /* submit → get signed URL → PUT video */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    /* 1️⃣ derive lessonId from filename */
    const lessonId = file.name.replace(/\.[^.]+$/, "").toLowerCase();
    if (!ID_RE.test(lessonId)) {
      setMsg("✗ Filename must be the 8-char sessionId, e.g. 39cd3bfe.mp4");
      return;
    }

    setBusy(true);
    setPct(0);
    setMsg("");

    try {
      /* 2️⃣ ask backend for signed PUT URL */
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
      if (!metaRes.ok) throw new Error("couldn’t obtain upload URL");
      const { url }: { url: string } = await metaRes.json();

      /* 3️⃣ PUT the video straight to Cloud-Storage */
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable)
            setPct(Math.round((ev.loaded / ev.total) * 100));
        };

        xhr.onload = () =>
          xhr.status === 200 ? resolve() : reject(new Error("upload failed"));
        xhr.onerror = () => reject(new Error("network error"));
        xhr.send(file);
      });

      /* ✅ done – worker will slice & publish clips */
      setMsg("✓ File uploaded — processing…");
      setFile(null);
      setTitle("");
      setDesc("");
    } catch (err: unknown) {
      setMsg(`✗ ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setBusy(false);
    }
  }

  /* UI */
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
          rows={3}
          placeholder="Description"
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

      {msg && <p className="pt-2">{msg}</p>}
    </main>
  );
}
