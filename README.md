# Document Intake Web Application

**Course:** Modern Web Technologies  
**Lab:** Lab 2 – Design and Implementation of a Document Intake Web Application  
**Student:** Deren Daniel Karabillioglu

## Overview

This full-stack application registers and tracks business documents through a controlled processing lifecycle. It uses only Core Node.js on the backend and standard HTML, CSS, and JavaScript on the frontend. Metadata is stored in JSON, document content is stored in separate text files, and important actions are recorded in an audit log.

## Run the Application

Requirements: Node.js 18 or newer. No npm packages are required.

```bash
node src/server.js
```

Open `http://localhost:3000` in a browser. Stop the server with `Ctrl+C`.

## REST Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/documents` | Create a document |
| GET | `/api/documents` | List documents; supports `clientReference`, `documentType`, and `status` query filters |
| GET | `/api/documents/{id}` | Retrieve one document's metadata |
| GET | `/api/documents/{id}/content` | Retrieve stored document content |
| PUT | `/api/documents/{id}` | Update metadata and optionally replace content |
| PATCH | `/api/documents/{id}/status` | Move a document to the next valid status |
| DELETE | `/api/documents/{id}` | Logically delete by setting status to REJECTED |
| GET | `/api/exports/daily` | Generate and store a daily JSON report |

All API responses use JSON and appropriate HTTP status codes.

## Workflow Rules

The normal lifecycle is `RECEIVED → VALIDATED → QUEUED → PROCESSED`. A document can move to `REJECTED` before it is processed. A rejected document requires a reason. Processed and rejected documents are final and cannot be modified. DELETE performs a logical deletion; it does not remove stored data.

## Architecture

- **Routing:** `src/routes/apiRouter.js` maps HTTP methods and URLs.
- **Controllers:** `src/controllers/documentController.js` handles HTTP input and output.
- **Services:** `src/services/documentService.js` applies validation and business/workflow rules.
- **Repository:** `src/repositories/documentRepository.js` performs persistent file operations.
- **Utilities:** `src/utils` contains body parsing, JSON responses, errors, and audit logging.
- **Frontend:** `public` communicates with the backend only through REST API calls.

## Asynchronous and Non-Blocking Behavior

Every file operation uses the Promise-based `node:fs/promises` API and is awaited with `async`/`await`; synchronous file APIs are not used. Incoming JSON bodies are collected through the request stream's `data`, `end`, and `error` events. Structured `try/catch` handling in the server turns errors into JSON responses. The daily export endpoint includes a delayed Promise before its asynchronous file work. The delay does not block Node.js's event loop, so other requests can be processed while the report is being generated.

## Modern ECMAScript Features

- **Arrow functions:** route, controller, service, repository, and frontend functions.
- **Destructuring:** imports and `button.dataset` in `public/app.js`.
- **Spread operator:** immutable document creation and updates in the service/repository.
- **Template literals:** file paths, messages, endpoint URLs, table rows, and audit entries.
- **Optional chaining:** filter and rejection reason validation in the service.
- **Nullish coalescing:** server port, host, MIME fallback, and error status fallback.
- **Functional array methods:** `map`, `filter`, `find`, and `reduce` for records and reports.

## File-System Persistence

- `data/documents.json`: document metadata
- `data/content/{id}.txt`: individual document content
- `data/audit.log`: timestamped major actions (created automatically)
- `data/exports/daily-export-YYYY-MM-DD.json`: generated reports

## Microservice Reflection

A microservice is a small, independently deployable application focused on one business capability and accessed through a defined API. This Document Intake application could be packaged in a container and deployed as an independent Document Service behind an API gateway. Its storage could be mounted as a persistent volume or replaced by cloud object storage and a database without changing clients that use the REST contract.

Two services in a larger system could be an **Identity Verification Service**, which validates identity documents with an external provider, and a **Notification Service**, which informs staff or clients when processing status changes. A scalability benefit is that the document service can be replicated independently when intake traffic increases, without scaling unrelated parts of the system.
