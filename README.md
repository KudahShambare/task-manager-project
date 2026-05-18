# Task Management SaaS Platform

Cloud task-management platform for small teams. It includes JWT authentication, Admin/Member RBAC, project membership, task assignment, task status tracking, PostgreSQL persistence, a React frontend, tests, OpenAPI documentation, and a CI/CD workflow.

## Deliverables

- Architecture and design report: [docs/architecture-and-design.md](docs/architecture-and-design.md)
- OpenAPI 3.0 contract: [docs/openapi.yaml](docs/openapi.yaml)
- Database schema: [backend/express-server/db/schema.sql](backend/express-server/db/schema.sql)
- CI/CD pipeline: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)
- Coverage summary: [docs/coverage-summary.md](docs/coverage-summary.md)

## Backend

```bash
cd backend/express-server
cp .env.example .env
npm install
npm test
npm run coverage
npm start
```

The API runs on `http://localhost:3000` by default. Required production configuration is supplied through environment variables; no production secrets are hardcoded.

## Frontend

```bash
cd frontend/cloud-task-manager
cp .env.example .env
npm install
npm run dev
```

The frontend expects `VITE_API_BASE_URL`, defaulting to `http://localhost:3000/api`.

## Core API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{projectId}`
- `PUT /api/projects/{projectId}`
- `DELETE /api/projects/{projectId}`
- `POST /api/projects/{projectId}/members`
- `GET /api/projects/{projectId}/tasks`
- `POST /api/projects/{projectId}/tasks`
- `GET /api/tasks/{taskId}`
- `PUT /api/tasks/{taskId}`
- `DELETE /api/tasks/{taskId}`
- `GET /api/tasks/{taskId}/status`
- `GET /api/tasks/{taskId}/status/stream`

## Deployment

Provision a PaaS Node.js app and a managed PostgreSQL database, set the variables from `.env.example`, apply `backend/express-server/db/schema.sql`, and configure the GitHub secrets `HEROKU_API_KEY`, `HEROKU_APP_NAME`, and `HEROKU_EMAIL` for automatic deployment on merges to `main`.
