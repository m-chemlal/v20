import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import { config } from './config';
import { getPool } from './db';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import indicatorRoutes from './routes/indicators';
import userRoutes from './routes/users';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  await getPool();

  const app = express();
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/indicators', indicatorRoutes);
  app.use('/api/users', userRoutes);

  if (config.nodeEnv === 'production') {
    const staticPath = path.resolve(__dirname, '..', 'dist', 'public');
    app.use(express.static(staticPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  return app;
}

async function start() {
  const app = await createServer();
  const port = config.port;
  app.listen(port, () => {
    console.log(`ImpactTracker API running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

export type { };
