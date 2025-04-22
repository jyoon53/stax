// lib/obs.js ──────────────────────────────────────────────────────────────
// OBS WebSocket helper for obs‑websocket‑js 5.x
// Runs in Node; safe to import from server‑side routes / API handlers.
import OBSWebSocket from "obs-websocket-js";

const ADDRESS = process.env.OBS_ADDRESS || "ws://localhost:4455";
const PASSWORD = process.env.OBS_PASSWORD || "";

/* one global instance that survives Hot‑Reloads -------------------------- */
globalThis.__STAX_OBS__ = globalThis.__STAX_OBS__ || new OBSWebSocket();
const obs = globalThis.__STAX_OBS__;

/* ensure we try to connect only once at a time --------------------------- */
let connectPromise = null;

async function ensureConnected() {
  if (obs.connected) return;

  if (connectPromise) return connectPromise; // another call in flight

  connectPromise = (async () => {
    try {
      await obs.connect(ADDRESS, PASSWORD);
      console.log("✅  OBS WebSocket connected");
    } catch (err) {
      console.error("🚨  OBS connection failed:", err?.message);
      throw new Error("OBS not reachable");
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/* public API ------------------------------------------------------------- */

/**
 * Start recording.
 * @param {string=} sessionId  if provided, the file will be named `${sessionId}.mp4`
 */
export async function start(sessionId) {
  await ensureConnected();

  if (sessionId) {
    await obs.call("SetRecordFilenameFormatting", {
      filenameFormatting: `${sessionId}.mp4`,
    });
  }

  await obs.call("StartRecord");
}

/** Stop recording (only if active). */
export async function stop() {
  await ensureConnected();
  const { outputActive } = await obs.call("GetRecordStatus");
  if (outputActive) await obs.call("StopRecord");
}

/** Current connection / recording state (+ last output file path). */
export async function status() {
  try {
    await ensureConnected();
    const s = await obs.call("GetRecordStatus");
    return { connected: true, recording: s.outputActive, file: s.outputPath };
  } catch {
    return { connected: false, recording: false, file: null };
  }
}

/* optional: expose the raw client for advanced use ---------------------- */
export { obs };
