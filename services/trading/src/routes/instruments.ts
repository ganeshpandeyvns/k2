// ============================================================================
// Instrument Routes
// ============================================================================

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const GetInstrumentsQuerySchema = z.object({
  type: z.enum(['crypto', 'event']).optional(),
  exchange: z.enum(['cryptocom', 'kalshi']).optional(),
  search: z.string().optional(),
});

export const instrumentRoutes: FastifyPluginAsync = async (fastify) => {
  const { exchangeRouter, marketDataAggregator, logger } = fastify;

  // Get all instruments
  fastify.get('/', async (request) => {
    const query = GetInstrumentsQuerySchema.parse(request.query);

    let instruments = await exchangeRouter.getAllInstruments();

    // Filter by type
    if (query.type) {
      instruments = instruments.filter((i) => i.type === query.type);
    }

    // Filter by exchange
    if (query.exchange) {
      instruments = instruments.filter((i) => i.exchange === query.exchange);
    }

    // Search filter
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      instruments = instruments.filter(
        (i) =>
          i.id.toLowerCase().includes(searchLower) ||
          i.displayName.toLowerCase().includes(searchLower) ||
          i.baseAsset.toLowerCase().includes(searchLower)
      );
    }

    return {
      success: true,
      data: instruments,
      timestamp: new Date().toISOString(),
    };
  });

  // Get crypto instruments
  fastify.get('/crypto', async (request) => {
    const instruments = await exchangeRouter.getInstruments('cryptocom');

    return {
      success: true,
      data: instruments,
      timestamp: new Date().toISOString(),
    };
  });

  // Get event instruments
  fastify.get('/events', async (request) => {
    const instruments = await exchangeRouter.getInstruments('kalshi');

    return {
      success: true,
      data: instruments,
      timestamp: new Date().toISOString(),
    };
  });

  // Get single instrument
  fastify.get('/:instrumentId', async (request, reply) => {
    const { instrumentId } = request.params as { instrumentId: string };

    const instruments = await exchangeRouter.getAllInstruments();
    const instrument = instruments.find((i) => i.id === instrumentId);

    if (!instrument) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: 'INSTRUMENT_NOT_FOUND',
          message: 'Instrument not found',
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: instrument,
      timestamp: new Date().toISOString(),
    };
  });

  // Get quote for instrument
  fastify.get('/:instrumentId/quote', async (request, reply) => {
    const { instrumentId } = request.params as { instrumentId: string };

    try {
      // Determine exchange from instrument ID
      const exchange = instrumentId.startsWith('KX') ? 'kalshi' : 'cryptocom';
      const quote = await exchangeRouter.getQuote(exchange, instrumentId);

      return {
        success: true,
        data: quote,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: 'QUOTE_NOT_FOUND',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Get order book for instrument
  fastify.get('/:instrumentId/orderbook', async (request, reply) => {
    const { instrumentId } = request.params as { instrumentId: string };
    const { depth } = request.query as { depth?: string };

    try {
      const exchange = instrumentId.startsWith('KX') ? 'kalshi' : 'cryptocom';
      const orderBook = await exchangeRouter.getOrderBook(
        exchange,
        instrumentId,
        depth ? parseInt(depth, 10) : 10
      );

      return {
        success: true,
        data: orderBook,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: 'ORDERBOOK_NOT_FOUND',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Get quotes for multiple instruments (batch)
  fastify.post('/quotes', async (request) => {
    const { instruments } = request.body as { instruments: string[] };

    const quotes = await Promise.all(
      instruments.map(async (instrumentId) => {
        try {
          const exchange = instrumentId.startsWith('KX') ? 'kalshi' : 'cryptocom';
          return await exchangeRouter.getQuote(exchange, instrumentId);
        } catch {
          return null;
        }
      })
    );

    return {
      success: true,
      data: quotes.filter(Boolean),
      timestamp: new Date().toISOString(),
    };
  });

  // Get popular/trending instruments
  fastify.get('/popular', async (request) => {
    // In production, this would be based on actual trading volume
    const allInstruments = await exchangeRouter.getAllInstruments();

    // Return top 10 (mock popularity)
    const popular = allInstruments.slice(0, 10);

    return {
      success: true,
      data: popular,
      timestamp: new Date().toISOString(),
    };
  });

  // Get instruments by category (for events)
  fastify.get('/events/category/:category', async (request, reply) => {
    const { category } = request.params as { category: string };

    const instruments = await exchangeRouter.getInstruments('kalshi');
    const filtered = instruments.filter(
      (i) => i.metadata?.category?.toLowerCase() === category.toLowerCase()
    );

    return {
      success: true,
      data: filtered,
      timestamp: new Date().toISOString(),
    };
  });
};
