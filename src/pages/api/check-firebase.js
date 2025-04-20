// src/pages/api/check-firebase.js
export default function handler(req, res) {
  try {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const ok = !!svcJson && !!JSON.parse(svcJson).private_key;

    /*  👇 This is what you watch for in your terminal running
          `npm run dev` ( NOT in the browser console )               */
    console.log(
      "🔑 raw>",
      JSON.stringify(process.env.FIREBASE_SERVICE_ACCOUNT)
    );
    console.log("🔑 FIREBASE_SERVICE_ACCOUNT has private_key?", ok);

    res.status(200).json({ ok });
  } catch (e) {
    console.error("❌ JSON parse failed:", e);
    res.status(500).json({ error: e.message });
  }
}
