const fs = require('node:fs/promises');
const path = require('node:path');

const auditPath = path.join(__dirname, '../../data/audit.log');

const writeAudit = async (action, documentId, details = {}) => {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), action, documentId, ...details });
  await fs.appendFile(auditPath, `${entry}\n`, 'utf8');
};

module.exports = { writeAudit };
