// server.js
const { createServer } = require("http");
const next = require("next");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.use(cors());
  server.use(express.json());

  // Create HTTP server and attach Express
  const httpServer = createServer(server);

  // Set up Socket.IO for real-time communication
  const io = new Server(httpServer, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Make io accessible in API routes via req.io
  server.use((req, res, nextMiddleware) => {
    req.io = io;
    nextMiddleware();
  });

  // Handle all Next.js requests
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
