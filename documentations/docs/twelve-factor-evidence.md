# Twelve-Factor App Evidence

## Overview

The Task Management SaaS Platform follows key Twelve-Factor App principles for cloud-native deployment. The backend is designed as a stateless Node.js/Express web process, uses PostgreSQL as an attached backing service, reads configuration from environment variables, and can be deployed to a PaaS provider using the supplied `Procfile` and GitHub Actions workflow.

## Principle Mapping

| Twelve-Factor Principle | Project Evidence | Implementation Detail |
| --- | --- | --- |
| Codebase | Single Git repository | The backend, frontend, documentation, tests, and CI/CD workflow are versioned together in Git. |
| Dependencies | `package.json` and `package-lock.json` | Backend and frontend dependencies are explicitly declared and installed with `npm install` or `npm ci`. |
| Config | `.env.example` and `process.env` | Secrets and environment-specific values such as `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, and `FORCE_HTTPS` are not hardcoded. |
| Backing Services | PostgreSQL via `DATABASE_URL` | The database is treated as an attached service. Local and production databases can be changed by updating the environment variable. |
| Build, Release, Run | npm scripts and GitHub Actions | The frontend is built with `npm run build`, backend tests run with `npm test`, and deployment runs after successful CI checks. |
| Processes | Stateless Express API | Authentication uses JWTs and the web process does not depend on local server memory for long-term application state. Persistent data is stored in PostgreSQL. |
| Port Binding | `PORT` environment variable | The backend binds to `process.env.PORT`, which is required by PaaS providers such as Heroku, Render, or Azure App Service. |
| Concurrency | Web process model | The API can be scaled horizontally by running more web process instances behind the PaaS router. |
| Disposability | Fast startup and externalized state | The application starts with `node index.js`; state survives restarts because it is stored in PostgreSQL. |
| Dev/Prod Parity | Same runtime pattern | Development and production both use Node.js, Express, npm scripts, and PostgreSQL-compatible connection strings. |
| Logs | Standard output | Runtime messages use `console.log` and `console.error`, allowing PaaS log collectors to capture application logs. |
| Admin Processes | One-off scripts | Database reset and admin user creation are run as one-off commands using `npm run db:reset` and `npm run admin:create`. |

## Improvements Added

- Added `NODE_ENV` and `PORT` to `backend/express-server/.env.example` so deployment configuration is explicit.
- Added admin seed variables to `.env.example` so admin creation is handled through environment configuration instead of public registration.
- Public registration always creates `MEMBER` accounts, while trusted admin creation is handled by `npm run admin:create`.
- The backend already enforces HTTPS in production, applies security headers with Helmet, rate-limits authentication routes, validates input, and uses parameterised PostgreSQL queries.

## Report Wording

The application follows Twelve-Factor App principles by storing configuration in environment variables, declaring dependencies in package manifests, treating PostgreSQL as an attached backing service, binding the API to the `PORT` environment variable, running as a stateless Express web process, and using GitHub Actions for build/test/deployment. Secrets such as `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, and admin seed credentials are not hardcoded and are supplied through `.env` locally or PaaS environment variables in production.
