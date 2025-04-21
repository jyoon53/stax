// lib/obs.js  – for obs‑websocket‑js 5.x
// -----------------------------------------------------------------------------
import OBSWebSocket from "obs-websocket-js";

const ADDRESS = process.env.OBS_ADDRESS || "ws://localhost:4455";
const PASSWORD = process.env.OBS_PASSWORD || "";

/* keep one instance across hot‑reloads ------------------------------------- */
globalThis.__STAX_OBS__ = globalThis.__STAX_OBS__ || new OBSWebSocket();
const obs = globalThis.__STAX_OBS__;

let connectPromise = null; // ensures only one connect() runs at a time

async function ensureConnected() {
  if (obs.connected) return; // OPEN

  if (connectPromise) {
    /* another request is already trying → just wait for it */
    return connectPromise;
  }

  /* first request here → actually connect */
  connectPromise = (async () => {
    try {
      await obs.connect(ADDRESS, PASSWORD); // 5.x positional form
      console.log("✅  OBS WebSocket connected");
    } catch (err) {
      console.error("🚨  OBS connection failed:", err.message);
      throw new Error("OBS not reachable");
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/* public helpers ----------------------------------------------------------- */
export async function start() {
  await ensureConnected();
  await obs.call("StartRecord");
}

export async function stop() {
  await ensureConnected();
  const { outputActive } = await obs.call("GetRecordStatus");
  if (outputActive) await obs.call("StopRecord");
}

export async function status() {
  try {
    await ensureConnected();
    const s = await obs.call("GetRecordStatus");
    return { connected: true, recording: s.outputActive, file: s.outputPath };
  } catch {
    return { connected: false, recording: false, file: null };
  }
}

export { obs };
