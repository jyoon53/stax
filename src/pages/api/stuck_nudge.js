// scripts/stuck_nudge.js
import cron from "node-cron";
import { db } from "../../../lib/firebaseAdmin.js";
import fetch from "node-fetch";

const TOAST_ENDPOINT = "http://localhost:3000/api/stuck-toast"; // implement tiny route

cron.schedule("*/30 * * * * *", async () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  const snap = await db
    .collection("roomEvents")
    .where("timestampServer", "<=", fiveMinutesAgo)
    .where("eventType", "==", "enter")
    .get();

  snap.forEach(async (doc) => {
    const { roomID, playerName } = doc.data();
    await fetch(TOAST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomID, playerName }),
    });
  });
});

console.log("🕑  Stuck‑nudge cron running (checks every 30 s)...");
