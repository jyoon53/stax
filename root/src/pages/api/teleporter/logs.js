// src/pages/api/teleporter/logs.js
import db from "../../../../../lib/db";

export default function handler(req, res) {
  if (req.method === "GET") {
    try {
      const rows = db
        .prepare("SELECT * FROM teleporter_logs ORDER BY id DESC")
        .all();
      return res.status(200).json(rows);
    } catch (err) {
      console.error("Error fetching logs:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
