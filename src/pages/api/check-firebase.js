// src/pages/api/check-firebase.js
// -----------------------------------------------------------------------------
// Simple health‑check route to confirm the server can see valid Firebase
// service‑account credentials **without** printing any sensitive data.
//
// GET /api/check-firebase   →   { ok: true, source: "inline" | "file" | "split" }
// -----------------------------------------------------------------------------

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    FIREBASE_SERVICE_ACCOUNT,
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    GOOGLE_APPLICATION_CREDENTIALS,
  } = process.env;

  let ok = false;
  let source = "none";

  // 1) Inline JSON (escaped newlines)
  if (FIREBASE_SERVICE_ACCOUNT) {
    try {
      const json = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
      ok = !!json.private_key && !!json.client_email;
      source = "inline";
    } catch {
      /* fall through */
    }
  }

  // 2) Individual split vars
  if (
    !ok &&
    FIREBASE_PROJECT_ID &&
    FIREBASE_CLIENT_EMAIL &&
    FIREBASE_PRIVATE_KEY
  ) {
    ok = true;
    source = "split";
  }

  // 3) File on disk (Application‑Default Credentials)
  if (!ok && GOOGLE_APPLICATION_CREDENTIALS) {
    ok = true;
    source = "file";
  }

  res.json({ ok, source });
}
