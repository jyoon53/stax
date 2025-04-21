// src/pages/api/obs-status.js
import { status } from "../../../lib/obs.js";

/**
 * GET /api/obs-status
 * → { connected, recording, file }
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const s = await status(); // { connected, recording, file }
    res.json(s);
  } catch (err) {
    console.error("❌ /obs-status error:", err);
    res
      .status(500)
      .json({ connected: false, recording: false, error: err.message });
  }
}
