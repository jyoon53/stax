import { db } from "../../lib/firebaseAdmin"; // if you need Firestore auth
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const { lessonId } = req.body;
  if (!lessonId) return res.status(400).json({ error: "Missing lessonId" });

  // Optionally re-seed obsT0 if you like:
  // await db.doc(`sessions/${lessonId}`).set({ obsT0: FieldValue.serverTimestamp() }, { merge: true });

  // Call slicer
  try {
    const sliceRes = await fetch(`${process.env.SLICER_URL}/slice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: lessonId,
        bucket: process.env.CLIP_BUCKET,
      }),
    });
    const payload = await sliceRes.text();
    return res.status(sliceRes.status).send(payload);
  } catch (e) {
    console.error("Trigger-slice error:", e);
    return res.status(500).json({ error: e.message });
  }
}
