import { obs } from "../../../obs-controller/obs_controller.js";

export default async function handler(req, res) {
  try {
    if (!obs.connected) {
      // dev‑mode hot‑reload drops the socket – reconnect quickly
      await obs.connect(
        process.env.OBS_ADDRESS || "ws://localhost:4455",
        process.env.OBS_PASSWORD || ""
      );
    }

    const { outputActive } = await obs.call("GetRecordStatus");
    res.json({ recording: outputActive });
  } catch (e) {
    console.error(e);
    res.status(500).json({ recording: false, error: String(e) });
  }
}
