import { useState } from "react";

export default function UploadLessonPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0); // 0 – 100 %
  const [msg, setMsg] = useState("");

  /* -------------- form submit ----------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setBusy(true);
    setPct(0);
    setMsg("");

    const fd = new FormData();
    fd.append("video", file);
    fd.append("title", title);
    fd.append("description", desc);

    /* XMLHttpRequest so we can read upload.onprogress */
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload-lesson"); // ASCII hyphen ✅

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setPct(Math.round((ev.loaded / ev.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const js = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) {
            setMsg(`✓ Uploaded – lesson id: ${js.id}`);
            resolve();
          } else {
            reject(new Error(js.error || `HTTP ${xhr.status}`));
          }
        } catch (err) {
          reject(err);
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(fd);
    })
      .catch((err) => setMsg(`✗ ${err.message}`))
      .finally(() => setBusy(false));
  }

  /* -------------- UI --------------------------------------------------- */
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

        {/* progress bar */}
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
