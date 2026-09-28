const controller = require('../controllers/documentController');

const routeApi = async (req, res, url) => {
  const segments = url.pathname.split('/').filter(Boolean);
  if (req.method === 'POST' && url.pathname === '/api/documents') return controller.create(req, res);
  if (req.method === 'GET' && url.pathname === '/api/documents') return controller.list(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/exports/daily') return controller.exportDaily(req, res);
  if (segments[0] === 'api' && segments[1] === 'documents' && segments[2]) {
    const id = segments[2];
    if (req.method === 'GET' && segments[3] === 'content') return controller.getContent(req, res, id);
    if (req.method === 'PATCH' && segments[3] === 'status') return controller.updateStatus(req, res, id);
    if (req.method === 'GET' && segments.length === 3) return controller.getOne(req, res, id);
    if (req.method === 'PUT' && segments.length === 3) return controller.update(req, res, id);
    if (req.method === 'DELETE' && segments.length === 3) return controller.remove(req, res, id);
  }
  return false;
};

module.exports = { routeApi };
