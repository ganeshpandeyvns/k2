// ============================================================================
// K2 Trading Service - Main Entry Point
// ============================================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { pino } from 'pino';
import { orderRoutes } from './routes/orders.js';
import { portfolioRoutes } from './routes/portfolio.js';
import { instrumentRoutes } from './routes/instruments.js';
import { wsHandler } from './websocket/handler.js';
import { OrderManager } from './core/order-manager.js';
import { RiskEngine } from './core/risk-engine.js';
import { ExchangeRouter } from './core/exchange-router.js';
import { MockCryptoComAdapter } from './adapters/mock-cryptocom.js';
import { MockKalshiAdapter } from './adapters/mock-kalshi.js';
import { MarketDataAggregator } from './core/market-data-aggregator.js';
import { Redis } from 'ioredis';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://k2:k2pass@localhost:5432/k2',
};

async function main() {
  // Initialize Redis
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  await redis.connect().catch((err) => {
    logger.warn('Redis connection failed, using in-memory fallback:', err.message);
  });

  // Initialize exchange adapters (mock mode)
  const cryptoComAdapter = new MockCryptoComAdapter(logger);
  const kalshiAdapter = new MockKalshiAdapter(logger);

  // Initialize core trading components
  const exchangeRouter = new ExchangeRouter(
    { cryptocom: cryptoComAdapter, kalshi: kalshiAdapter },
    logger
  );

  const riskEngine = new RiskEngine(logger);
  const orderManager = new OrderManager(exchangeRouter, riskEngine, redis, logger);
  const marketDataAggregator = new MarketDataAggregator(
    { cryptocom: cryptoComAdapter, kalshi: kalshiAdapter },
    redis,
    logger
  );

  // Start market data aggregation
  await marketDataAggregator.start();

  // Initialize Fastify
  const app = Fastify({
    logger: false, // We use our own logger
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: config.jwtSecret,
  });

  await app.register(websocket, {
    options: { maxPayload: 1048576 }, // 1MB
  });

  // Decorate with dependencies
  app.decorate('orderManager', orderManager);
  app.decorate('riskEngine', riskEngine);
  app.decorate('exchangeRouter', exchangeRouter);
  app.decorate('marketDataAggregator', marketDataAggregator);
  app.decorate('redis', redis);
  app.decorate('logger', logger);

  // Health check
  app.get('/health', async () => ({
    status: 'healthy',
    service: 'trading',
    timestamp: new Date().toISOString(),
  }));

  // Register routes
  await app.register(orderRoutes, { prefix: '/v1/orders' });
  await app.register(portfolioRoutes, { prefix: '/v1/portfolio' });
  await app.register(instrumentRoutes, { prefix: '/v1/instruments' });

  // WebSocket handler
  app.get('/ws', { websocket: true }, wsHandler);

  // Authentication hook for protected routes
  app.addHook('onRequest', async (request, reply) => {
    // Skip auth for health check and public endpoints
    if (request.url === '/health' || request.url.startsWith('/v1/instruments')) {
      return;
    }

    try {
      await request.jwtVerify();
    } catch (err) {
      // For development, allow unauthenticated access with a mock user
      if (process.env.NODE_ENV === 'development') {
        (request as any).user = {
          id: 'dev-user-001',
          email: 'dev@k2.app',
        };
        return;
      }
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error, url: request.url }, 'Request error');
    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down trading service...');
    await marketDataAggregator.stop();
    await redis.quit();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Start server
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Trading service running on http://${config.host}:${config.port}`);
    logger.info('Exchange adapters: Crypto.com (mock), Kalshi (mock)');
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    orderManager: OrderManager;
    riskEngine: RiskEngine;
    exchangeRouter: ExchangeRouter;
    marketDataAggregator: MarketDataAggregator;
    redis: Redis;
    logger: pino.Logger;
  }
}
