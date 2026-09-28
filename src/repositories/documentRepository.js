const fs = require('node:fs/promises');
const path = require('node:path');

const dataDir = path.join(__dirname, '../../data');
const metadataPath = path.join(dataDir, 'documents.json');
const contentDir = path.join(dataDir, 'content');
const exportDir = path.join(dataDir, 'exports');

const initialize = async () => {
  await Promise.all([
    fs.mkdir(contentDir, { recursive: true }),
    fs.mkdir(exportDir, { recursive: true })
  ]);
  try { await fs.access(metadataPath); } catch { await fs.writeFile(metadataPath, '[]', 'utf8'); }
};

const readAll = async () => JSON.parse(await fs.readFile(metadataPath, 'utf8'));
const saveAll = async documents => fs.writeFile(metadataPath, JSON.stringify(documents, null, 2), 'utf8');
const findById = async id => (await readAll()).find(document => document.id === id);

const insert = async document => {
  const documents = await readAll();
  await saveAll([...documents, document]);
  return document;
};

const update = async updatedDocument => {
  const documents = await readAll();
  await saveAll(documents.map(document => document.id === updatedDocument.id ? updatedDocument : document));
  return updatedDocument;
};

const writeContent = async (id, content) => fs.writeFile(path.join(contentDir, `${id}.txt`), content, 'utf8');
const readContent = async id => fs.readFile(path.join(contentDir, `${id}.txt`), 'utf8');
const writeExport = async (fileName, report) => fs.writeFile(path.join(exportDir, fileName), JSON.stringify(report, null, 2), 'utf8');

module.exports = { initialize, readAll, findById, insert, update, writeContent, readContent, writeExport };
