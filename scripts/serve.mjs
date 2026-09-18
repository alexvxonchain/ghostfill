import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8788);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let file = path.normalize(url.pathname === "/" ? "/index.html" : url.pathname);
    file = path.join(root, file);
    if (!file.startsWith(root)) {
      res.writeHead(403).end("no");
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404).end("missing");
        return;
      }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "text/plain" });
      res.end(buf);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`ghostfill paper desk http://127.0.0.1:${port}`);
  });
