// 极简静态文件服务器 —— 用于托管 `next build` 静态导出产物 (out/)。
// 零外部依赖，仅用 Node 内置 http/fs/path，便于在任意沙箱环境稳定启动。
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "out");
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";

    // 防目录穿越
    const safePath = path
      .normalize(path.join(ROOT, urlPath))
      .replace(/^(\.\.[/\\])+/, "");
    if (!safePath.startsWith(ROOT)) return send(res, 403, "Forbidden");

    fs.stat(safePath, (err, stat) => {
      if (!err && stat.isFile()) {
        const ext = path.extname(safePath).toLowerCase();
        const type = MIME[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": type });
        fs.createReadStream(safePath).pipe(res);
        return;
      }
      // 找不到文件时回退到 index.html（SPA 兜底）
      const fallback = path.join(ROOT, "index.html");
      fs.readFile(fallback, (e2, buf) => {
        if (e2) return send(res, 404, "Not Found");
        send(res, 200, buf, "text/html; charset=utf-8");
      });
    });
  } catch (e) {
    send(res, 500, "Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Static server listening on http://${HOST}:${PORT} (root: ${ROOT})`);
});
