// ============================================================================
// Order Routes
// ============================================================================

import { FastifyPluginAsync } from 'fastify';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import type { CreateOrderRequest, OrderSide, OrderType, TimeInForce } from '@k2/types';

// Request validation schemas
const CreateOrderSchema = z.object({
  instrument: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
  quantity: z.string().regex(/^\d+\.?\d*$/),
  price: z.string().regex(/^\d+\.?\d*$/).optional(),
  timeInForce: z.enum(['gtc', 'ioc', 'fok', 'day']).optional(),
  eventSide: z.enum(['yes', 'no']).optional(),
});

const CancelOrderSchema = z.object({
  orderId: z.string().uuid(),
});

const GetOrdersQuerySchema = z.object({
  status: z.string().optional(),
  instrument: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  const { orderManager, logger } = fastify;

  // Create order
  fastify.post('/', async (request, reply) => {
    const user = (request as any).user;
    const body = CreateOrderSchema.parse(request.body);

    const orderRequest: CreateOrderRequest = {
      clientOrderId: uuid(),
      instrument: body.instrument,
      side: body.side as OrderSide,
      type: body.type as OrderType,
      quantity: body.quantity,
      price: body.price,
      timeInForce: body.timeInForce as TimeInForce,
      eventSide: body.eventSide as any,
    };

    try {
      const response = await orderManager.createOrder(user.id, orderRequest);

      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to create order');

      reply.status(400);
      return {
        success: false,
        error: {
          code: error.code || 'ORDER_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Cancel order
  fastify.delete('/:orderId', async (request, reply) => {
    const user = (request as any).user;
    const { orderId } = request.params as { orderId: string };

    try {
      const response = await orderManager.cancelOrder(user.id, { orderId });

      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error({ error, userId: user.id, orderId }, 'Failed to cancel order');

      reply.status(error.code === 'ORDER_NOT_FOUND' ? 404 : 400);
      return {
        success: false,
        error: {
          code: error.code || 'CANCEL_FAILED',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Get single order
  fastify.get('/:orderId', async (request, reply) => {
    const user = (request as any).user;
    const { orderId } = request.params as { orderId: string };

    const order = orderManager.getOrder(user.id, orderId);

    if (!order) {
      reply.status(404);
      return {
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    };
  });

  // Get orders (list)
  fastify.get('/', async (request) => {
    const user = (request as any).user;
    const query = GetOrdersQuerySchema.parse(request.query);

    const statusFilter = query.status?.split(',') as any;

    const orders = orderManager.getOrders(user.id, {
      status: statusFilter,
      instrument: query.instrument,
      limit: query.limit,
    });

    return {
      success: true,
      data: orders,
      pagination: {
        page: 1,
        pageSize: orders.length,
        total: orders.length,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    };
  });

  // Get open orders
  fastify.get('/open', async (request) => {
    const user = (request as any).user;

    const orders = orderManager.getOrders(user.id, {
      status: ['pending', 'submitted', 'open', 'partial'],
    });

    return {
      success: true,
      data: orders,
      timestamp: new Date().toISOString(),
    };
  });

  // Get order history
  fastify.get('/history', async (request) => {
    const user = (request as any).user;
    const query = GetOrdersQuerySchema.parse(request.query);

    const orders = orderManager.getOrders(user.id, {
      status: ['filled', 'cancelled', 'rejected', 'expired'],
      limit: query.limit || 50,
    });

    return {
      success: true,
      data: orders,
      pagination: {
        page: 1,
        pageSize: orders.length,
        total: orders.length,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    };
  });
};
