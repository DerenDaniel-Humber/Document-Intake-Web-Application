const service = require('../services/documentService');
const { sendJson, readJsonBody } = require('../utils/http');

const create = async (req, res) => sendJson(res, 201, { data: await service.create(await readJsonBody(req)) });
const list = async (req, res, url) => sendJson(res, 200, { data: await service.list(Object.fromEntries(url.searchParams)) });
const getOne = async (req, res, id) => sendJson(res, 200, { data: await service.getOrFail(id) });
const getContent = async (req, res, id) => sendJson(res, 200, { data: await service.getContent(id) });
const update = async (req, res, id) => sendJson(res, 200, { data: await service.updateMetadata(id, await readJsonBody(req)) });
const updateStatus = async (req, res, id) => sendJson(res, 200, { data: await service.updateStatus(id, await readJsonBody(req)) });
const remove = async (req, res, id) => sendJson(res, 200, { message: 'Document logically deleted', data: await service.softDelete(id, (await readJsonBody(req)).reason) });
const exportDaily = async (req, res) => sendJson(res, 200, { data: await service.dailyExport() });

module.exports = { create, list, getOne, getContent, update, updateStatus, remove, exportDaily };
