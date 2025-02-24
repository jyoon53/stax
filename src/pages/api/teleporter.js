// src/pages/api/teleporter.js
import db from "../../../lib/db";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { userID, chapterID, timestamp } = req.body;
    const sql =
      "INSERT INTO teleporter_logs (userID, chapterID, timestamp) VALUES (?, ?, ?)";
    try {
      const insert = db.prepare(sql);
      const info = insert.run(userID, chapterID, timestamp);
      if (req.io) {
        req.io.emit("teleporterData", req.body);
      }
      return res.status(200).json({
        message: "Data received successfully.",
        log: { id: info.lastInsertRowid, userID, chapterID, timestamp },
      });
    } catch (err) {
      console.error("Error inserting data:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
