import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { globalLimiter } from './common/middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './common/middleware/error.middleware';
import { logger } from './config/logger';
import apiRoutes from './routes';
import { registerProcurementListeners } from './modules/procurement/procurement.service';

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// REQUEST PARSING
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================================
// LOGGING (HTTP)
// ============================================================
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
    skip: () => process.env.NODE_ENV === 'test',
  }),
);

// ============================================================
// PROCUREMENT AUTOMATION (event-driven listeners)
// ============================================================
registerProcurementListeners();

// ============================================================
// RATE LIMITING
// ============================================================
app.use('/api/', globalLimiter);

// ============================================================
// API DOCUMENTATION
// ============================================================
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Shiv Furniture ERP — API Docs',
  }),
);

// Expose raw OpenAPI spec
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Shiv Furniture Works ERP',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/v1', apiRoutes);

// ============================================================
// ERROR HANDLING (must be last)
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
