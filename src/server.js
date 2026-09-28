const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const repository = require('./repositories/documentRepository');
const { routeApi } = require('./routes/apiRouter');
const { sendJson } = require('./utils/http');

const publicDir = path.join(__dirname, '../public');
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const serveStatic = async (res, pathname) => {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.resolve(publicDir, relative);
  if (!filePath.startsWith(publicDir)) return false;
  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] ?? 'application/octet-stream' });
    res.end(content);
    return true;
  } catch { return false; }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const handled = await routeApi(req, res, url);
      if (handled === false) sendJson(res, 404, { error: 'API endpoint not found' });
      return;
    }
    if (!await serveStatic(res, url.pathname)) sendJson(res, 404, { error: 'Resource not found' });
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.statusCode ?? 500, { error: error.message ?? 'Internal server error' });
  }
});

const PORT = process.env.PORT ?? 3000;
repository.initialize().then(() => server.listen(PORT, () => console.log(`Document Intake App: http://localhost:${PORT}`)));
