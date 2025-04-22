// lib/obs.js ──────────────────────────────────────────────────────────────
import OBSWebSocket from "obs-websocket-js";

const ADDRESS = process.env.OBS_ADDRESS || "ws://localhost:4455";
const PASSWORD = process.env.OBS_PASSWORD || "";

/* hot‑reload‑safe singleton --------------------------------------------- */
globalThis.__STAX_OBS__ = globalThis.__STAX_OBS__ || new OBSWebSocket();
const obs = globalThis.__STAX_OBS__;

let connectPromise = null;
async function ensureConnected() {
  if (obs.connected) return;
  if (connectPromise) return connectPromise;

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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* keep the user’s preferred pattern so we can restore it ---------------- */
let savedPattern = null;

/* ───────────────────────────── API ───────────────────────────────────── */

/**
 * Start recording and make the file name exactly <sessionId>.mp4.
 * Works on Simple *and* Advanced output modes via SetProfileParameter.
 */
export async function start(sessionId) {
  await ensureConnected();

  const { outputActive } = await obs.call("GetRecordStatus");
  if (outputActive) return; // already recording

  /* 1️⃣  fetch and stash the current pattern -------------------------- */
  if (savedPattern === null) {
    const { parameterValue } = await obs.call("GetProfileParameter", {
      parameterCategory: "Output", // Simple mode uses "SimpleOutput"
      parameterName: "FilenameFormatting",
    });
    savedPattern = parameterValue; // may be undefined → fine
  }

  /* 2️⃣  set pattern to literal sessionId ----------------------------- */
  if (sessionId) {
    await obs.call("SetProfileParameter", {
      // :contentReference[oaicite:0]{index=0}
      parameterCategory: "Output",
      parameterName: "FilenameFormatting",
      parameterValue: sessionId, // no %‑tokens, no extension
    });
  }

  /* 3️⃣  start recording ---------------------------------------------- */
  await obs.call("StartRecord");

  /* 4️⃣  wait until active (≤10 s) ------------------------------------ */
  const t0 = Date.now();
  while (Date.now() - t0 < 10_000) {
    const { outputActive: activeNow } = await obs.call("GetRecordStatus");
    if (activeNow) return;
    await wait(300);
  }
  throw new Error("OBS did not report recording within 10 s.");
}

/**
 * Stop recording and restore the user’s original filename pattern.
 */
export async function stop() {
  await ensureConnected();
  const { outputActive } = await obs.call("GetRecordStatus");
  if (!outputActive) return;

  await obs.call("StopRecord");

  /* wait until OBS finalises file (≤10 s) ----------------------------- */
  const t0 = Date.now();
  while (Date.now() - t0 < 10_000) {
    const { outputActive: activeNow } = await obs.call("GetRecordStatus");
    if (!activeNow) break;
    await wait(300);
  }

  /* restore pattern so manual recordings behave normally -------------- */
  if (savedPattern !== null) {
    await obs.call("SetProfileParameter", {
      parameterCategory: "Output",
      parameterName: "FilenameFormatting",
      parameterValue: savedPattern,
    });
    savedPattern = null;
  }
}

/**
 * Helper: { connected, recording, file }
 */
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
