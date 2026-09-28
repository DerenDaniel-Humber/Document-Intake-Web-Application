const sendJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
};

const readJsonBody = (req, limit = 1_000_000) => new Promise((resolve, reject) => {
  let raw = '';
  let size = 0;
  req.setEncoding('utf8');
  req.on('data', chunk => {
    size += Buffer.byteLength(chunk);
    if (size > limit) {
      const error = new Error('Request body is too large');
      error.statusCode = 413;
      reject(error);
      req.destroy();
      return;
    }
    raw += chunk;
  });
  req.on('end', () => {
    try {
      resolve(raw ? JSON.parse(raw) : {});
    } catch {
      const error = new Error('Request body must contain valid JSON');
      error.statusCode = 400;
      reject(error);
    }
  });
  req.on('error', reject);
});

module.exports = { sendJson, readJsonBody };
