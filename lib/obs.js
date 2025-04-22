// lib/obs.js
import OBSWebSocket from "obs-websocket-js";

const ADDRESS = process.env.OBS_ADDRESS || "ws://localhost:4455";
const PASSWORD = process.env.OBS_PASSWORD || "";

/* hot‑reload‑safe singleton */
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
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let savedPattern = null;

/* ─────────────── API ───────────────────────────────────────────── */

export async function start(sessionId) {
  await ensureConnected();

  const { outputActive } = await obs.call("GetRecordStatus");
  if (outputActive) return; // already recording

  /* remember user pattern once */
  if (savedPattern === null) {
    const { parameterValue } = await obs.call("GetProfileParameter", {
      parameterCategory: "Output",
      parameterName: "FilenameFormatting",
    });
    savedPattern = parameterValue;
  }

  /* set filename = sessionId */
  await obs.call("SetProfileParameter", {
    parameterCategory: "Output",
    parameterName: "FilenameFormatting",
    parameterValue: sessionId, // literal → produces <id>.mp4
  });

  await obs.call("StartRecord");

  /* wait until active (≤10 s) */
  const t0 = Date.now();
  while (Date.now() - t0 < 10_000) {
    const { outputActive: active } = await obs.call("GetRecordStatus");
    if (active) return;
    await wait(300);
  }
  throw new Error("OBS did not start recording within 10 s");
}

export async function stop() {
  await ensureConnected();
  const { outputActive } = await obs.call("GetRecordStatus");
  if (!outputActive) return;

  await obs.call("StopRecord");

  /* wait until inactive */
  const t0 = Date.now();
  while (Date.now() - t0 < 10_000) {
    const { outputActive: active } = await obs.call("GetRecordStatus");
    if (!active) break;
    await wait(300);
  }

  /* restore pattern */
  if (savedPattern !== null) {
    await obs.call("SetProfileParameter", {
      parameterCategory: "Output",
      parameterName: "FilenameFormatting",
      parameterValue: savedPattern,
    });
    savedPattern = null;
  }
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
