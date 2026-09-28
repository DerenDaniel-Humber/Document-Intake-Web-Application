const $ = selector => document.querySelector(selector);
const api = async (path, options = {}) => {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Request failed');
  return payload.data;
};
const toast = message => { $('#toast').textContent = message; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2400); };
const shortId = id => `${id.slice(0, 8)}…`;
const nextStatus = { RECEIVED: 'VALIDATED', VALIDATED: 'QUEUED', QUEUED: 'PROCESSED' };

const loadDocuments = async () => {
  try {
    const params = new URLSearchParams();
    if ($('#clientFilter').value) params.set('clientReference', $('#clientFilter').value);
    if ($('#typeFilter').value) params.set('documentType', $('#typeFilter').value);
    if ($('#statusFilter').value) params.set('status', $('#statusFilter').value);
    const documents = await api(`/api/documents?${params}`);
    $('#count').textContent = `${documents.length} document${documents.length === 1 ? '' : 's'}`;
    $('#documentRows').innerHTML = documents.map(document => `<tr><td title="${document.id}">${shortId(document.id)}</td><td>${document.clientReference}</td><td>${document.documentType.replaceAll('_', ' ')}</td><td><span class="status">${document.status}</span></td><td>${new Date(document.createdAt).toLocaleString()}</td><td><button class="small" data-action="view" data-id="${document.id}">Content</button>${nextStatus[document.status] ? `<button class="small" data-action="advance" data-id="${document.id}" data-status="${nextStatus[document.status]}">→ ${nextStatus[document.status]}</button>` : ''}${!['PROCESSED','REJECTED'].includes(document.status) ? `<button class="small" data-action="edit" data-id="${document.id}">Edit</button><button class="small danger" data-action="delete" data-id="${document.id}">Delete</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6">No documents found.</td></tr>';
  } catch (error) { toast(error.message); }
};

$('#documentForm').addEventListener('submit', async event => {
  event.preventDefault();
  try { await api('/api/documents', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); event.target.reset(); toast('Document registered'); await loadDocuments(); } catch (error) { toast(error.message); }
});

$('#documentRows').addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  const { action, id, status } = button.dataset;
  try {
    if (action === 'view') { const result = await api(`/api/documents/${id}/content`); $('#modalTitle').textContent = `Content · ${shortId(id)}`; $('#modalContent').textContent = result.content; $('#modal').showModal(); }
    if (action === 'advance') { await api(`/api/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast(`Status updated to ${status}`); await loadDocuments(); }
    if (action === 'edit') { const document = await api(`/api/documents/${id}`); const clientReference = prompt('Client reference:', document.clientReference); if (clientReference) { const fileName = prompt('File name:', document.fileName); await api(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify({ clientReference, fileName: fileName || document.fileName }) }); toast('Metadata updated'); await loadDocuments(); } }
    if (action === 'delete') { const reason = prompt('Enter rejection/deletion reason:'); if (reason) { await api(`/api/documents/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }); toast('Document logically deleted'); await loadDocuments(); } }
  } catch (error) { toast(error.message); }
});

$('#exportButton').addEventListener('click', async () => { try { toast('Generating report asynchronously…'); const report = await api('/api/exports/daily'); $('#modalTitle').textContent = 'Daily Export Summary'; $('#modalContent').textContent = JSON.stringify(report, null, 2); $('#modal').showModal(); } catch (error) { toast(error.message); } });
$('#closeModal').addEventListener('click', () => $('#modal').close());
['#clientFilter','#typeFilter','#statusFilter'].forEach(selector => $(selector).addEventListener('input', loadDocuments));
loadDocuments();
