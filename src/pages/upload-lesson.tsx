import { useState } from "react";

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

    setBusy(true);
    setPct(0);
    setMsg("");

    /* ——— 1 · derive session/lesson ID from cookie ———————————— */
    const cookieId =
      document.cookie.match(/(?:^|;\s*)sessionId=([^;]+)/)?.[1] ?? null;
    const lessonId = cookieId || Date.now().toString(36);

    /* ——— 2 · get signed PUT URL ———————————————— */
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
      setBusy(false);
      setMsg("✗ Failed to obtain upload URL");
      return;
    }
    const { url } = await metaRes.json();

    /* ——— 3 · stream file direct to GCS ——————————————— */
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.upload.onprogress = (ev) =>
        ev.lengthComputable && setPct(Math.round((ev.loaded / ev.total) * 100));
      xhr.onload = () =>
        xhr.status === 200 ? resolve() : reject(new Error("Upload failed"));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    })
      .then(() => setMsg("✓ File uploaded — processing…"))
      .catch((err) => setMsg(`✗ ${err.message}`))
      .finally(() => setBusy(false));
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
          {busy ? `Uploading ${pct}%…` : "Upload"}
        </button>
      </form>

      {msg && <p>{msg}</p>}
    </main>
  );
}
