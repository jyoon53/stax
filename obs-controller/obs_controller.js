/*  OBS controller ‑ single shared instance  */
import OBSWebSocket from "obs-websocket-js";

/* ───── config ───────────────────────────── */
const OBS_ADDRESS = process.env.OBS_ADDRESS || "ws://localhost:4455";
const OBS_PASSWORD = process.env.OBS_PASSWORD || "";

/* ───── singleton ────────────────────────── */
export const obs = new OBSWebSocket();

/* quick connect helper (idempotent) */
async function connect() {
  if (obs.connected) return;
  await obs.connect(OBS_ADDRESS, OBS_PASSWORD);
}

/* ensure we always use the same connection everywhere */
export async function startRecording() {
  try {
    await connect();
    await obs.call("StartRecord");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function stopRecording() {
  try {
    await connect(); // reconnect in dev hot‑reload
    const { outputActive } = await obs.call("GetRecordStatus");
    if (outputActive) await obs.call("StopRecord");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
