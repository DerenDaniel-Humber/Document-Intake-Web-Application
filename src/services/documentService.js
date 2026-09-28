const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');
const { writeAudit } = require('../utils/audit');
const { AppError } = require('../utils/errors');

const TYPES = ['SIGNED_AGREEMENT', 'IDENTITY_RECORD', 'PROOF_OF_ADDRESS', 'FINANCIAL_STATEMENT'];
const STATUSES = ['RECEIVED', 'VALIDATED', 'QUEUED', 'PROCESSED', 'REJECTED'];
const TRANSITIONS = {
  RECEIVED: ['VALIDATED', 'REJECTED'],
  VALIDATED: ['QUEUED', 'REJECTED'],
  QUEUED: ['PROCESSED', 'REJECTED'],
  PROCESSED: [],
  REJECTED: []
};

const requireText = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new AppError(`${name} is required`);
  return value.trim();
};

const getOrFail = async id => {
  const document = await repository.findById(id);
  if (!document) throw new AppError('Document not found', 404);
  return document;
};

const create = async input => {
  const clientReference = requireText(input.clientReference, 'clientReference');
  const fileName = requireText(input.fileName, 'fileName');
  const content = requireText(input.content, 'content');
  if (!TYPES.includes(input.documentType)) throw new AppError('Invalid documentType');
  const now = new Date().toISOString();
  const document = { id: randomUUID(), clientReference, documentType: input.documentType, fileName, status: 'RECEIVED', rejectionReason: null, createdAt: now, updatedAt: now };
  await repository.writeContent(document.id, content);
  await repository.insert(document);
  await writeAudit('DOCUMENT_CREATED', document.id, { clientReference });
  return document;
};

const list = async filters => {
  const all = await repository.readAll();
  const clientReference = filters.clientReference?.toLowerCase();
  return all.filter(document =>
    (!clientReference || document.clientReference.toLowerCase().includes(clientReference)) &&
    (!filters.documentType || document.documentType === filters.documentType) &&
    (!filters.status || document.status === filters.status)
  );
};

const getContent = async id => ({ id, content: await repository.readContent((await getOrFail(id)).id) });

const updateMetadata = async (id, input) => {
  const current = await getOrFail(id);
  if (current.status === 'PROCESSED' || current.status === 'REJECTED') throw new AppError(`${current.status} documents cannot be modified`, 409);
  if (input.documentType && !TYPES.includes(input.documentType)) throw new AppError('Invalid documentType');
  const updated = {
    ...current,
    clientReference: input.clientReference ? requireText(input.clientReference, 'clientReference') : current.clientReference,
    documentType: input.documentType ?? current.documentType,
    fileName: input.fileName ? requireText(input.fileName, 'fileName') : current.fileName,
    updatedAt: new Date().toISOString()
  };
  if (input.content !== undefined) await repository.writeContent(id, requireText(input.content, 'content'));
  await repository.update(updated);
  await writeAudit('DOCUMENT_UPDATED', id);
  return updated;
};

const updateStatus = async (id, input) => {
  const current = await getOrFail(id);
  const nextStatus = input.status;
  if (!STATUSES.includes(nextStatus)) throw new AppError('Invalid status');
  if (!TRANSITIONS[current.status].includes(nextStatus)) throw new AppError(`Invalid transition from ${current.status} to ${nextStatus}`, 409);
  if (nextStatus === 'REJECTED' && !input.rejectionReason?.trim()) throw new AppError('rejectionReason is required for REJECTED status');
  const updated = { ...current, status: nextStatus, rejectionReason: nextStatus === 'REJECTED' ? input.rejectionReason.trim() : null, updatedAt: new Date().toISOString() };
  await repository.update(updated);
  await writeAudit('STATUS_UPDATED', id, { from: current.status, to: nextStatus });
  return updated;
};

const softDelete = async (id, reason) => {
  requireText(reason, 'reason');
  const current = await getOrFail(id);
  if (current.status === 'PROCESSED') throw new AppError('PROCESSED documents cannot be deleted', 409);
  if (current.status === 'REJECTED') throw new AppError('Document is already rejected', 409);
  return updateStatus(id, { status: 'REJECTED', rejectionReason: reason });
};

const dailyExport = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const documents = await repository.readAll();
  const today = new Date().toISOString().slice(0, 10);
  const todaysDocuments = documents.filter(document => document.createdAt.startsWith(today));
  const byStatus = STATUSES.reduce((result, status) => ({ ...result, [status]: todaysDocuments.filter(document => document.status === status).length }), {});
  const report = { generatedAt: new Date().toISOString(), date: today, totalDocuments: todaysDocuments.length, byStatus, documents: todaysDocuments };
  const fileName = `daily-export-${today}.json`;
  await repository.writeExport(fileName, report);
  await writeAudit('DAILY_EXPORT_GENERATED', null, { fileName });
  return { fileName, ...report };
};

module.exports = { TYPES, STATUSES, create, list, getOrFail, getContent, updateMetadata, updateStatus, softDelete, dailyExport };
