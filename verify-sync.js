#!/usr/bin/env node
/**
 * Check that a finished MP4 lines‑up with the Roblox room‑event log.
 *
 * Usage:
 *   node verify-sync <sessionId> /abs/path/video.mp4 [--frames]
 *
 *   • <sessionId>  – the 8‑char id the LMS generated for this run
 *   • --frames     – also dump JPEGs at every timestamp into ./frames/
 */
import { readFileSync, mkdirSync } from "fs";
import { join, resolve, basename } from "path";
import admin from "firebase-admin";
import ffmpeg from "fluent-ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";

// ───────────────────────── config ──────────────────────────────
const SA = JSON.parse(
  readFileSync(resolve(process.cwd(), "keys/roblox-lms-sa.json"), "utf8")
);
admin.initializeApp({ credential: admin.credential.cert(SA) });
const db = admin.firestore();
ffmpeg.setFfprobePath(ffprobe.path);

// ─────────────────────── CLI arguments ─────────────────────────
const [, , sessionId, videoPath, opt] = process.argv;
if (!sessionId || !videoPath) {
  console.error(
    "Usage: node verify-sync <sessionId> /abs/path/video.mp4 [--frames]"
  );
  process.exit(1);
}
const wantFrames = opt === "--frames";
const framesDir = join("frames", basename(videoPath).replace(/\.\w+$/, ""));
if (wantFrames) mkdirSync(framesDir, { recursive: true });

// ───────── 1) pull obsT0 and roomEvents from Firestore ─────────
const sessSnap = await db.collection("sessions").doc(sessionId).get();
const obsT0 = sessSnap.data()?.obsT0?.toMillis?.() ?? sessSnap.data()?.obsT0;
if (!obsT0) throw new Error(`obsT0 missing in sessions/${sessionId}`);

const evSnap = await db
  .collection("sessions")
  .doc(sessionId)
  .collection("roomEvents")
  .get();

const events = evSnap.docs
  .map((d) => d.data())
  .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

if (events.length === 0)
  throw new Error(`No roomEvents under sessions/${sessionId}`);

// ───────── 2) compute seconds‑into‑video ───────────────────────
events.forEach((e) => {
  e.tRel = ((e.timestamp ?? 0) - obsT0) / 1000;
});

// ───────── 3) pretty‑print table  ──────────────────────────────
console.table(
  events.map((e) => ({
    sec: e.tRel.toFixed(2).padStart(8),
    type: (e.eventType || "").padEnd(6),
    room: e.roomID ?? "-",
  }))
);

// ───────── 4) optional JPEG extraction  ────────────────────────
if (wantFrames) {
  for (const e of events) {
    const out = join(framesDir, `${e.eventType}-${e.tRel.toFixed(2)}.jpg`);
    await new Promise((res, rej) =>
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [e.tRel],
          filename: out,
          folder: framesDir,
          size: "640x?",
        })
        .on("end", res)
        .on("error", rej)
    );
    console.log("✓ frame", out);
  }
}

console.log("\nDone ✔ – review numbers (and frames/) to confirm sync");
process.exit(0);
