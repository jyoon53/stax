// lib/db.js (ESM version)
import sqlite3 from "sqlite3";

const db = new sqlite3.verbose().Database("./lms.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS teleporter_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userID TEXT,
      chapterID TEXT,
      timestamp TEXT
    )`,
    (err) => {
      if (err) console.error("Error creating table:", err.message);
      else console.log("teleporter_logs table is ready.");
    }
  );
});

export default db;
