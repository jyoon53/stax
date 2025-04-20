// src/pages/api/processRoomVideo.js
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";
import { db } from "../../lib/firebaseAdmin.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Form parse error" });

    const lessonId = fields.lessonId ?? "draft";
    const rawLogs = JSON.parse(fields.roomLogs || "[]");
    const file = files.video;
    if (!file) return res.status(400).json({ error: "No video file" });

    try {
      /* 1️⃣  fetch obsT0 from Firestore */
      const snap = await db.collection("sessions").doc(lessonId).get();
      const obsT0 = snap.data()?.obsT0?.toMillis?.() ?? null;
      if (!obsT0) throw new Error("obsT0 missing for session " + lessonId);

      /* 2️⃣  convert absolute → seconds into video */
      rawLogs.forEach(
        (ev) => (ev.timestampRel = (ev.timestamp - obsT0) / 1000)
      );

      /* 3️⃣  build multipart for the Python service */
      const boundary = "----BoundaryForPython";
      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="roomLogs"\r\n\r\n${JSON.stringify(
            rawLogs
          )}\r\n--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${
            file.originalFilename
          }"\r\nContent-Type: application/octet-stream\r\n\r\n`
        ),
        fs.readFileSync(file.filepath),
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      /* 4️⃣  send to FastAPI micro‑service */
      const py = await fetch("http://localhost:8000/clip-room-video", {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });
      const data = await py.json();
      if (!data.success) throw new Error(data.error);

      return res.json(data);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: String(e) });
    } finally {
      fs.unlink(file.filepath, () => {});
    }
  });
}
