import { useState } from "react";

export default function UploadLessonPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setBusy(true);
    const body = new FormData();
    body.append("video", file);
    body.append("title", title);
    body.append("description", desc);

    const r = await fetch("/api/upload‑lesson", { method: "POST", body });
    const js = await r.json();

    setBusy(false);
    setMsg(r.ok ? `✓ uploaded – lesson id: ${js.id}` : `✗ ${js.error}`);
  }

  return (
    <main className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Upload new lesson</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          accept="video/mp4"
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

        <button
          className="bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={!file || busy}
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>

      {msg && <p>{msg}</p>}
    </main>
  );
}
