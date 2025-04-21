// pages/upload-lesson.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function UploadLesson() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  /* -------- handle form submit ----------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setErr("Title is required.");
      return;
    }

    setSaving(true);
    setErr("");
    setUploadPct(0);

    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", desc.trim());
      if (file) fd.append("video", file);

      /* custom fetch to recalc progress ---------------------------- */
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload-lesson");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setUploadPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(xhr.responseText || "Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fd);
      });

      router.push("/instructor-dashboard");
    } catch (error) {
      console.error(error);
      setErr(error.message || "Upload failed");
      setSaving(false);
    }
  }

  return (
    <section className="p-8 text-black max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Lesson</h1>

      {err && (
        <p className="text-red-600 mb-4">
          <strong>Error:</strong> {err}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Title*</span>
          <input
            type="text"
            className="w-full border rounded p-2 mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Description</span>
          <textarea
            className="w-full border rounded p-2 mt-1"
            rows={4}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Master video (optional)</span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </label>

        {saving && (
          <div className="w-full bg-gray-300 h-2 rounded">
            <div
              className="h-2 bg-green-500 rounded"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          {saving ? "Uploading…" : "Create Lesson"}
        </button>
      </form>
    </section>
  );
}
