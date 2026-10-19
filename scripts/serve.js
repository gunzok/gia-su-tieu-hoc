// Máy chủ tĩnh tối giản để xem site và chạy E2E test. Dùng: npm start (mặc định cổng 8080).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function resolveFile(urlPath) {
  const target = join(ROOT, normalize(decodeURIComponent(urlPath)));
  if (!target.startsWith(ROOT)) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) return join(target, 'index.html');
    return target;
  } catch {
    return null;
  }
}

export function startServer(port = 0) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    // /faq không có dấu "/" cuối: chuyển hướng để đường dẫn tương đối ../assets đúng.
    if (pathname === '/faq') {
      res.writeHead(301, { Location: '/faq/' }).end();
      return;
    }
    const file = await resolveFile(pathname);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không tìm thấy');
    }
  });
  return new Promise((done) => {
    server.listen(port, '127.0.0.1', () => done(server));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  await startServer(port);
  console.log(`Đang chạy tại http://127.0.0.1:${port}/faq`);
}
