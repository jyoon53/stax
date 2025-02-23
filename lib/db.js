// lib/db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./lms.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create the teleporter_logs table if it doesn't exist
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

module.exports = db;
