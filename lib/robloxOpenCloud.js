// lib/robloxOpenCloud.js  (restore if you deleted it)
import fetch from "node-fetch";

export async function sendRobloxMessage(topic, payload) {
  const { ROBLOX_API_KEY, ROBLOX_UNIVERSE_ID } = process.env;
  if (!ROBLOX_API_KEY || !ROBLOX_UNIVERSE_ID) {
    throw new Error("Missing ROBLOX secrets");
  }

  const url =
    `https://apis.roblox.com/messaging-service/v1/universes/` +
    `${ROBLOX_UNIVERSE_ID}/topics/${encodeURIComponent(topic)}`;

  const body = JSON.stringify({
    message: typeof payload === "string" ? payload : JSON.stringify(payload),
  });

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": ROBLOX_API_KEY,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!r.ok) throw new Error(`OpenCloud ${r.status}: ${await r.text()}`);
}
