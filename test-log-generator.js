const fs = require("fs");
const path = require("path");

const MAX_LOG_SIZE = 2 * 1024; // 20MB
const LOG_DIR = path.join(__dirname, "logs");
const LOG_LEVELS = ["INFO", "WARNING", "ERROR", "DEBUG"];

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

const messages = [
  "User logged in",
  "Database connection established",
  "Request processed",
  "Cache updated",
  "File processed",
  "API call completed",
  () => `Memory usage: ${Math.floor(Math.random() * 100)}%`,
  () => `Response time: ${Math.floor(Math.random() * 1000)}ms`,
];

// Generate a log entry
function generateLogEntry() {
  const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
  const timestamp = new Date().toISOString();
  const rawMessage = messages[Math.floor(Math.random() * messages.length)];
  const message = typeof rawMessage === "function" ? rawMessage() : rawMessage;
  return {
    level,
    entry: `${timestamp} [${level}] ${message}\n`,
  };
}

// Write log to the correct file
function writeLog(level, logEntry) {
  const filePath = path.join(LOG_DIR, `${level.toLowerCase()}.log`);
  fs.stat(filePath, (err, stats) => {
    if (err && err.code !== "ENOENT") {
      return console.error(`Error reading log file size for ${filePath}:`, err);
    }

    const fileSize = stats?.size || 0;
    const writeMode = fileSize >= MAX_LOG_SIZE ? "w" : "a";

    fs.writeFile(filePath, logEntry, { flag: writeMode }, (writeErr) => {
      if (writeErr) {
        console.error(`Failed to write ${level} log:`, writeErr);
      }
    });
  });
}

// Start logging
console.log("Starting log generator...");
console.log("Press Ctrl+C to stop.");

setInterval(() => {
  const { level, entry } = generateLogEntry();
  writeLog(level, entry);
  console.log("Log entry added:", entry.trim());
}, 1000);
