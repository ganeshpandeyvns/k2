// ============================================================================
// Portfolio Routes
// ============================================================================

import { FastifyPluginAsync } from 'fastify';
import type { Portfolio, Balance, Position } from '@k2/types';
import Decimal from 'decimal.js';

export const portfolioRoutes: FastifyPluginAsync = async (fastify) => {
  const { exchangeRouter, logger } = fastify;

  // Get full portfolio
  fastify.get('/', async (request) => {
    const user = (request as any).user;

    try {
      // Fetch from all exchanges in parallel
      const [balances, positions] = await Promise.all([
        exchangeRouter.getAllBalances(),
        exchangeRouter.getAllPositions(),
      ]);

      // Calculate portfolio totals
      const totalValue = positions.reduce(
        (sum, p) => sum.plus(new Decimal(p.marketValue)),
        new Decimal(0)
      );

      const totalCost = positions.reduce(
        (sum, p) => sum.plus(new Decimal(p.avgCost).times(new Decimal(p.quantity))),
        new Decimal(0)
      );

      const totalPnl = positions.reduce(
        (sum, p) => sum.plus(new Decimal(p.unrealizedPnl)),
        new Decimal(0)
      );

      // Add cash balances to total
      const cashValue = balances
        .filter((b) => b.currency === 'USD')
        .reduce((sum, b) => sum.plus(new Decimal(b.total)), new Decimal(0));

      const portfolio: Portfolio = {
        userId: user.id,
        totalValue: totalValue.plus(cashValue).toFixed(2),
        totalCost: totalCost.toFixed(2),
        totalPnl: totalPnl.toFixed(2),
        totalPnlPercent: totalCost.isZero()
          ? '0'
          : totalPnl.div(totalCost).times(100).toFixed(2),
        lastUpdated: new Date().toISOString(),
        positions,
        balances,
      };

      return {
        success: true,
        data: portfolio,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to fetch portfolio');
      throw error;
    }
  });

  // Get balances only
  fastify.get('/balances', async (request) => {
    const user = (request as any).user;

    const balances = await exchangeRouter.getAllBalances();

    return {
      success: true,
      data: balances,
      timestamp: new Date().toISOString(),
    };
  });

  // Get balances for specific exchange
  fastify.get('/balances/:exchange', async (request, reply) => {
    const user = (request as any).user;
    const { exchange } = request.params as { exchange: 'cryptocom' | 'kalshi' };

    try {
      const balances = await exchangeRouter.getBalances(exchange);

      return {
        success: true,
        data: balances,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: 'EXCHANGE_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Get positions only
  fastify.get('/positions', async (request) => {
    const user = (request as any).user;

    const positions = await exchangeRouter.getAllPositions();

    return {
      success: true,
      data: positions,
      timestamp: new Date().toISOString(),
    };
  });

  // Get positions for specific exchange
  fastify.get('/positions/:exchange', async (request, reply) => {
    const user = (request as any).user;
    const { exchange } = request.params as { exchange: 'cryptocom' | 'kalshi' };

    try {
      const positions = await exchangeRouter.getPositions(exchange);

      return {
        success: true,
        data: positions,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      reply.status(400);
      return {
        success: false,
        error: {
          code: 'EXCHANGE_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Get position for specific instrument
  fastify.get('/positions/instrument/:instrument', async (request, reply) => {
    const user = (request as any).user;
    const { instrument } = request.params as { instrument: string };

    const allPositions = await exchangeRouter.getAllPositions();
    const position = allPositions.find((p) => p.instrument === instrument);

    if (!position) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: 'POSITION_NOT_FOUND',
          message: 'No position found for this instrument',
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: position,
      timestamp: new Date().toISOString(),
    };
  });

  // Get P&L summary
  fastify.get('/pnl', async (request) => {
    const user = (request as any).user;

    const positions = await exchangeRouter.getAllPositions();

    const totalUnrealizedPnl = positions.reduce(
      (sum, p) => sum.plus(new Decimal(p.unrealizedPnl)),
      new Decimal(0)
    );

    const totalRealizedPnl = positions.reduce(
      (sum, p) => sum.plus(new Decimal(p.realizedPnl)),
      new Decimal(0)
    );

    // Group by exchange
    const byExchange = positions.reduce(
      (acc, p) => {
        if (!acc[p.exchange]) {
          acc[p.exchange] = { unrealized: new Decimal(0), realized: new Decimal(0) };
        }
        acc[p.exchange].unrealized = acc[p.exchange].unrealized.plus(p.unrealizedPnl);
        acc[p.exchange].realized = acc[p.exchange].realized.plus(p.realizedPnl);
        return acc;
      },
      {} as Record<string, { unrealized: Decimal; realized: Decimal }>
    );

    return {
      success: true,
      data: {
        total: {
          unrealizedPnl: totalUnrealizedPnl.toFixed(2),
          realizedPnl: totalRealizedPnl.toFixed(2),
          totalPnl: totalUnrealizedPnl.plus(totalRealizedPnl).toFixed(2),
        },
        byExchange: Object.entries(byExchange).map(([exchange, pnl]) => ({
          exchange,
          unrealizedPnl: pnl.unrealized.toFixed(2),
          realizedPnl: pnl.realized.toFixed(2),
        })),
        byPosition: positions.map((p) => ({
          instrument: p.instrument,
          exchange: p.exchange,
          unrealizedPnl: p.unrealizedPnl,
          unrealizedPnlPercent: p.unrealizedPnlPercent,
          realizedPnl: p.realizedPnl,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  });

  // Get exchange connection status
  fastify.get('/status', async (request) => {
    const user = (request as any).user;

    const status = exchangeRouter.getConnectionStatus();

    return {
      success: true,
      data: {
        exchanges: Object.entries(status).map(([exchange, connected]) => ({
          exchange,
          connected,
          lastSync: new Date().toISOString(), // Would be tracked per connection in production
        })),
      },
      timestamp: new Date().toISOString(),
    };
  });
};
