const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const defaultEnv = require('./config/env');
const authenticate = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const enforceHttps = require('./middleware/https');
const createAuthRoutes = require('./routes/authRoutes');
const createProjectRoutes = require('./routes/projectRoutes');
const createTaskRoutes = require('./routes/taskRoutes');
const createUserRoutes = require('./routes/userRoutes');
const StatusEvents = require('./services/statusEvents');

const frontendBuildPath = path.join(__dirname, '..', 'public');

function parseCorsOrigin(origin) {
  if (origin === '*') {
    return true;
  }

  const configuredOrigins = origin.split(',').map((item) => item.trim()).filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    return (requestOrigin, callback) => {
      const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin || '');

      if (!requestOrigin || configuredOrigins.includes(requestOrigin) || isLocalDevOrigin) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    };
  }

  return configuredOrigins;
}

function createApp({ store, env = defaultEnv, statusEvents = new StatusEvents() }) {
  const app = express();

  app.set('trust proxy', 1);
  app.locals.store = store;
  app.locals.statusEvents = statusEvents;

  app.use(enforceHttps(env.forceHttps));
  app.use(helmet());
  app.use(cors({ origin: parseCorsOrigin(env.corsOrigin), credentials: true }));
  app.use(express.json({ limit: '64kb' }));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'task-manager-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    createAuthRoutes(env),
  );
  app.use('/api/users', authenticate(env), createUserRoutes());
  app.use('/api/projects', authenticate(env), createProjectRoutes());
  app.use('/api', authenticate(env), createTaskRoutes());

  if (fs.existsSync(path.join(frontendBuildPath, 'index.html'))) {
    app.use(express.static(frontendBuildPath));
    app.get(/^(?!\/api|\/health).*/, (req, res) => {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
