// Simple Node.js server for local development
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle the root path
  let filePath = req.url === "/" ? "index.html" : req.url;

  // Remove query parameters if any
  filePath = filePath.split("?")[0];

  // Get the full path
  const fullPath = path.join(__dirname, filePath);

  // Get the file extension
  const ext = path.extname(fullPath);

  // Set default content type to text/html
  let contentType = MIME_TYPES[ext] || "text/html";

  // Read the file
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // Page not found
        fs.readFile(path.join(__dirname, "404.html"), (err, content) => {
          if (err) {
            res.writeHead(404);
            res.end("404 Not Found");
          } else {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end(content, "utf-8");
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop");
});
