require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const passport = require("passport");
const path = require("path");
const { glob } = require("glob");
const { DataBaseConnections } = require("./src/Config/DataBaseConnections");
const { sessionMiddleware } = require("./src/middleware/sessionMiddleware");
const {
  authenticationSetup,
} = require("./src/authentication/authenticationSetup");
const { isAuthenticated } = require("./src/middleware/authMiddleware");
const { fileTailHandlers } = require("./src/services/fileTailHandlers");

// const LOG_PATTERN = process.env.LOG_PATTERN || "logs/**/.log";

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.BASE_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// MongoDB Connection
DataBaseConnections();

app.use(sessionMiddleware);

app.use(express.json());
app.use(express.static("public"));
// set up authentication of users by git hub or google
authenticationSetup(app);
// API Routes
app.get("/api/files", isAuthenticated, async (req, res) => {
  try {
    const pattern = req.query.pattern || "**/*";
    const directory = req.query.directory || ".";
    const searchPath = path.join(directory, pattern);

    const files = await glob(searchPath, {
      ignore: ["node_modules/**", ".git/**"],
      nodir: true,
    });
    res.json({ files });
  } catch (error) {
    console.error("Error searching files:", error);
    res.status(500).json({ error: "Error searching files" });
  }
});

// Socket.IO Configuration
// Wrap session middleware for Socket.IO
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

// Authentication middleware for Socket.IO
io.use((socket, next) => {
  if (socket.request.user) {
    next();
  } else {
    next(new Error("Unauthorized"));
  }
});

// Tails files here
fileTailHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
