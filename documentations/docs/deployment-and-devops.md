# Deliverable 4: Deployment and DevOps

## Q8. PaaS Deployment

The application is deployed to Heroku, a Platform as a Service provider. Heroku runs the Express application as a web process using the backend `Procfile`. The Express server also serves the production React frontend from `backend/express-server/public`, so users can access the full system from one public URL.

Live application URL:

```text
https://task-manager-api-taku-6c6ee0f9ed3d.herokuapp.com
```

Health check endpoint:

```text
https://task-manager-api-taku-6c6ee0f9ed3d.herokuapp.com/health
```

Verified response:

```json
{
  "status": "ok",
  "service": "task-manager-api"
}
```

The database is hosted using Heroku Postgres Essential-0 and is attached to the Heroku app as a managed backing service.

### Environment Variables

The application follows twelve-factor configuration principles by storing runtime configuration in Heroku Config Vars instead of hardcoding credentials in source code.

Production config variables used:

```text
DATABASE_URL
DB_SSL
NODE_ENV
JWT_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_TTL
CORS_ORIGIN
FRONTEND_URL
FORCE_HTTPS
```

Sensitive values such as `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are stored only in Heroku Config Vars and must not be committed to GitHub or pasted into the report.

### Deployment Commands Used

The backend was deployed from the existing Git repository by adding the Heroku remote and pushing the backend folder as the Heroku app source.

```bash
heroku git:remote -a task-manager-api-taku
git subtree push --prefix backend/express-server heroku HEAD:main
```

After deployment, the database schema was applied with a one-off Heroku process:

```bash
heroku run "npm run db:apply" -a task-manager-api-taku
```

The protected API routes were also verified. For example, calling `/api/projects` without a token returns `401 Unauthorized`, showing that authentication is enforced in production.

## Q9. CI/CD Pipeline

GitHub Actions is configured in `.github/workflows/ci-cd.yml`.

The pipeline:

- Runs on every push and pull request.
- Installs backend dependencies with `npm ci`.
- Runs the backend Jest test suite with coverage using `npm run coverage`.
- Uploads the backend coverage report as a workflow artifact.
- Installs frontend dependencies with `npm ci`.
- Builds the production frontend with `npm run build`.
- Deploys the backend to Heroku only on pushes to the `main` branch after backend and frontend jobs pass.

Deployment is blocked if either the backend tests or frontend build fail, because the deploy job uses `needs: [backend, frontend]`. The deploy job runs only when code is pushed or merged into `main`.

Required GitHub repository secrets for automatic deployment:

```text
HEROKU_API_KEY
HEROKU_APP_NAME
HEROKU_EMAIL
```

For this project, `HEROKU_APP_NAME` should be set to:

```text
task-manager-api-taku
```

## Q10. Security Hardening Evidence

The backend implements the following security controls:

- HTTPS enforcement in production through the `FORCE_HTTPS` setting and reverse proxy-aware middleware.
- Security headers using Helmet.js.
- Rate limiting on authentication routes using `express-rate-limit`.
- Input validation using `express-validator`.
- CORS configuration using the `CORS_ORIGIN` environment variable.
- SQL injection prevention by using parameterised PostgreSQL queries with the `pg` library.
- JWT-based authentication with separate access and refresh secrets.
- Public registration creates `MEMBER` accounts only; admin accounts are created through a trusted admin seed command.
