/**************************************************************************
 * server.js – custom Next.js + Express server with Socket.IO
 * ------------------------------------------------------------------------
 * • Loads `.env.local` **before** any other imports so all libraries see
 *   your environment variables (Firebase, OBS, etc.).
 * • Wraps the Express instance in `http.createServer` to attach Socket.IO.
 * • Adds CORS + JSON body‑parsing middleware for any custom REST routes.
 **************************************************************************/

/* ❶ Load env vars first (must be top‑of‑file) */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" }); // fallback to .env if not found

/* ❷ Now import the rest */
import { createServer } from "http";
import next from "next";
import express from "express";
import cors from "cors";
import { Server as SocketServer } from "socket.io";

/* ❸ Next.js prep */
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  /* ❹ Express + HTTP server */
  const app = express();

  app.use(cors());
  app.use(express.json());

  const httpServer = createServer(app);

  /* ❺ Socket.IO */
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected", socket.id);
    socket.on("disconnect", () =>
      console.log("🔌 Socket disconnected", socket.id)
    );
  });

  /* Make `io` available in any custom route via req.io */
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  /* ❻ Next.js catch‑all routes */
  app.all("*", (req, res) => handle(req, res));

  /* ❼ Start listening */
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () =>
    console.log(`🚀 Server ready → http://localhost:${PORT}`)
  );
});
