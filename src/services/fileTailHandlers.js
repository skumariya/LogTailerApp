const fs = require("fs");
const Tail = require("tail").Tail;

const fileTailHandlers = (io) => {
  // Active tail processes
  const activeTails = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("startTail", async ({ filePath, lines }) => {
      try {
        if (!fs.existsSync(filePath)) {
          socket.emit("error", { message: `File not found: ${filePath}` });
          return;
        }

        // Stop existing tail if any
        const existingTail = activeTails.get(socket.id + filePath);
        if (existingTail) {
          existingTail.unwatch();
          activeTails.delete(socket.id + filePath);
        }

        // Send initial lines using tail command
        const { exec } = require("child_process");
        exec(`tail -n ${lines || 10} "${filePath}"`, (error, stdout) => {
          if (error) {
            socket.emit("error", {
              message: `Error reading file: ${error.message}`,
            });
            return;
          }
          socket.emit("data", { filePath, data: stdout });
        });

        // Start tailing the file
        const tail = new Tail(filePath, {
          follow: true,
          logger: console,
          useWatchFile: true,
          flushAtStart: false,
          encoding: "utf-8",
        });

        tail.on("line", (data) => {
          socket.emit("data", { filePath, data });
        });

        tail.on("error", (error) => {
          socket.emit("error", { filePath, error: error.message });
        });

        activeTails.set(socket.id + filePath, tail);
      } catch (error) {
        console.error("Error starting tail:", error);
        socket.emit("error", {
          message: `Error starting tail: ${error.message}`,
        });
      }
    });

    socket.on("stopTail", ({ filePath }) => {
      const tail = activeTails.get(socket.id + filePath);
      if (tail) {
        tail.unwatch();
        activeTails.delete(socket.id + filePath);
      }
    });

    socket.on("disconnect", () => {
      // Clean up all tails for this socket
      for (const [key, tail] of activeTails.entries()) {
        if (key.startsWith(socket.id)) {
          tail.unwatch();
          activeTails.delete(key);
        }
      }
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = {
  fileTailHandlers,
};
