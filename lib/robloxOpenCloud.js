// lib/robloxOpenCloud.js
// -----------------------------------------------------------------------------
// Thin helper for Roblox Open Cloud Messaging Service.
//
// Usage:
//   await sendRobloxMessage("lms-session", { sessionId: "abc123" });
//
// Requires two env vars:
//
//   ROBLOX_API_KEY       – Open Cloud API key with "Message Write" scope
//   ROBLOX_UNIVERSE_ID   – Numeric universe ID of the experience
//
// Node 18+ ships a global fetch; if you’re on an older runtime, keep
// the `node-fetch` import below (it’s a tiny polyfill).
// -----------------------------------------------------------------------------

import fetch from "node-fetch"; // comment out if on Node 18+

export async function sendRobloxMessage(topic, payload) {
  const { ROBLOX_API_KEY, ROBLOX_UNIVERSE_ID } = process.env;

  if (!ROBLOX_API_KEY || !ROBLOX_UNIVERSE_ID) {
    throw new Error(
      "ROBLOX_API_KEY or ROBLOX_UNIVERSE_ID env var is missing. " +
        "Set them in .env.local or your hosting provider’s secret store."
    );
  }

  const url =
    `https://apis.roblox.com/messaging-service/v1/universes/` +
    `${ROBLOX_UNIVERSE_ID}/topics/${encodeURIComponent(topic)}`;

  const body = JSON.stringify({
    message: typeof payload === "string" ? payload : JSON.stringify(payload),
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": ROBLOX_API_KEY,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Open Cloud POST ${res.status}: ${txt}`);
  }
}
