import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap(): Promise<void> {
  try {
    // Connect to PostgreSQL
    await connectDatabase();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════╗
║       SHIV FURNITURE WORKS — MINI ERP BACKEND           ║
╠══════════════════════════════════════════════════════════╣
║  Server    : http://localhost:${PORT}                       ║
║  API       : http://localhost:${PORT}/api/v1                ║
║  Swagger   : http://localhost:${PORT}/api-docs              ║
║  Health    : http://localhost:${PORT}/health                ║
║  Env       : ${process.env.NODE_ENV || 'development'}                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', { reason: reason?.message, stack: reason?.stack });
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
}

bootstrap();
