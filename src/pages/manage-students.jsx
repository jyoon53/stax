// pages/manage-students.js
import { useEffect, useState } from "react";
import Link from "next/link";

/* --------------------------------------------
   Helper to interact with the students API
   -------------------------------------------- */
async function mutateRoster(lessonId, student, method) {
  const res = await fetch("/api/lesson-students", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, student }),
  });
  if (!res.ok) throw new Error(await res.text());
}

/* --------------------------------------------
   Main page component
   -------------------------------------------- */
export default function ManageStudents() {
  const [lessons, setLessons] = useState([]);
  const [selected, setSelected] = useState("");
  const [newStudent, setNewStudent] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  /* fetch instructor lessons on mount */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetch("/api/lessons").then((r) => r.json());
        setLessons(data);
        if (data[0]) setSelected(data[0].id);
      } catch {
        setErr("Unable to load lessons.");
      }
    })();
  }, []);

  const currentLesson = lessons.find((l) => l.id === selected);

  /* -------- add student ------------------------------------------ */
  async function addStudent(e) {
    e.preventDefault();
    if (!newStudent.trim()) return;

    setSaving(true);
    try {
      await mutateRoster(selected, newStudent.trim(), "POST");
      setLessons((ls) =>
        ls.map((l) =>
          l.id === selected
            ? { ...l, students: [...(l.students || []), newStudent.trim()] }
            : l
        )
      );
      setNewStudent("");
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  /* -------- remove student --------------------------------------- */
  async function removeStudent(user) {
    setSaving(true);
    try {
      await mutateRoster(selected, user, "DELETE");
      setLessons((ls) =>
        ls.map((l) =>
          l.id === selected
            ? { ...l, students: (l.students || []).filter((s) => s !== user) }
            : l
        )
      );
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  /* -------- UI --------------------------------------------------- */
  return (
    <section className="p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">Manage Students</h1>

      {err && (
        <p className="text-red-600 mb-4">
          <strong>Error:</strong> {err}
        </p>
      )}

      {/* lesson selector */}
      <label className="block mb-4">
        <span className="mr-2 font-semibold">Lesson:</span>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </label>

      {/* add form */}
      <form onSubmit={addStudent} className="flex items-center mb-6">
        <input
          type="text"
          placeholder="Roblox username"
          value={newStudent}
          onChange={(e) => setNewStudent(e.target.value)}
          className="border rounded p-2 flex-1 mr-4"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>

      {/* roster list */}
      <h2 className="text-xl font-semibold mb-2">Current roster</h2>
      {(!currentLesson?.students || currentLesson.students.length === 0) && (
        <p>No students enrolled yet.</p>
      )}
      <ul className="space-y-2">
        {currentLesson?.students?.map((s) => (
          <li
            key={s}
            className="flex justify-between items-center border rounded px-4 py-2"
          >
            <span>{s}</span>
            <button
              onClick={() => removeStudent(s)}
              disabled={saving}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* optional link back */}
      <Link
        href="/instructor-dashboard"
        className="text-blue-600 underline mt-8 inline-block"
      >
        ← Back to dashboard
      </Link>
    </section>
  );
}
