// pages/api/trigger-slice.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { lessonId } = req.body || {};
  if (!lessonId) {
    return res.status(400).json({ error: "Missing lessonId" });
  }

  try {
    const sliceRes = await fetch(`${process.env.SLICER_URL}/slice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: lessonId,
        bucket: process.env.CLIP_BUCKET,
      }),
    });
    const text = await sliceRes.text();
    if (!sliceRes.ok) {
      return res.status(sliceRes.status).send(text);
    }
    return res.status(200).json({ status: "ok", detail: text });
  } catch (err) {
    console.error("Trigger-slice error:", err);
    return res.status(500).json({ error: err.message });
  }
}
