/* ─── ❶ LOAD .env.local BEFORE _any_ other import ───────────────────────── */
import { config as loadEnv } from "dotenv"; // <‑‑ this line must be FIRST
loadEnv({ path: ".env.local" });
// (If you want to be explicit:  import 'dotenv/config?path=.env.local';)

/* ─── rest of your original server.js ───────────────────────────────────── */
import { createServer } from "http";
import next from "next";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.use(cors());
  server.use(express.json());

  const httpServer = createServer(server);

  const io = new Server(httpServer, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("disconnect", () => console.log("User disconnected:", socket.id));
  });

  server.use((req, res, next) => {
    req.io = io;
    next();
  });

  server.all("*", (req, res) => handle(req, res));

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
  );
});
