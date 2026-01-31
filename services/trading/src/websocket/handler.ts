// ============================================================================
// WebSocket Handler - Real-time updates
// ============================================================================

import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WsMessage,
  WsSubscribeMessage,
  Quote,
  Order,
} from '@k2/types';

interface ClientState {
  userId: string;
  authenticated: boolean;
  subscriptions: {
    prices: Set<string>;
    orders: boolean;
    portfolio: boolean;
    orderbook: Map<string, number>; // instrument -> depth
  };
}

const clients = new Map<WebSocket, ClientState>();

export async function wsHandler(
  connection: { socket: WebSocket },
  request: FastifyRequest
) {
  const { socket } = connection;
  const { orderManager, marketDataAggregator, logger } = request.server;

  // Initialize client state
  const state: ClientState = {
    userId: '',
    authenticated: false,
    subscriptions: {
      prices: new Set(),
      orders: false,
      portfolio: false,
      orderbook: new Map(),
    },
  };

  clients.set(socket, state);

  // Check for token in query string
  const url = new URL(request.url, `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  if (token) {
    try {
      const decoded = await request.server.jwt.verify(token);
      state.userId = (decoded as any).id || 'dev-user-001';
      state.authenticated = true;
    } catch {
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        state.userId = 'dev-user-001';
        state.authenticated = true;
      }
    }
  } else if (process.env.NODE_ENV === 'development') {
    state.userId = 'dev-user-001';
    state.authenticated = true;
  }

  // Send connected message
  send(socket, {
    type: 'connected',
    data: {
      connectionId: Math.random().toString(36).substring(7),
      authenticated: state.authenticated,
    },
    timestamp: new Date().toISOString(),
  });

  logger.info({ userId: state.userId }, 'WebSocket client connected');

  // Set up order update listener
  if (state.authenticated) {
    orderManager.onOrderUpdate(state.userId, (order: Order) => {
      if (state.subscriptions.orders) {
        send(socket, {
          type: 'order_update',
          channel: 'orders',
          data: {
            id: order.id,
            clientOrderId: order.clientOrderId,
            status: order.status,
            filledQuantity: order.filledQuantity,
            avgFillPrice: order.avgFillPrice,
            remainingQuantity: order.remainingQuantity,
            lastFill: order.fills[order.fills.length - 1],
          },
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  // Handle messages
  socket.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString()) as WsMessage;
      await handleMessage(socket, state, message, request);
    } catch (error) {
      logger.error({ error }, 'WebSocket message error');
      send(socket, {
        type: 'error',
        data: {
          code: 'INVALID_MESSAGE',
          message: 'Failed to parse message',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle close
  socket.on('close', () => {
    // Cleanup subscriptions
    for (const instrument of state.subscriptions.prices) {
      marketDataAggregator.unsubscribe(instrument, socket);
    }

    if (state.authenticated) {
      orderManager.offOrderUpdate(state.userId);
    }

    clients.delete(socket);
    logger.info({ userId: state.userId }, 'WebSocket client disconnected');
  });

  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    if (socket.readyState === socket.OPEN) {
      send(socket, {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      });
    }
  }, 30000);

  socket.on('close', () => clearInterval(heartbeatInterval));
}

async function handleMessage(
  socket: WebSocket,
  state: ClientState,
  message: WsMessage,
  request: FastifyRequest
) {
  const { marketDataAggregator, logger } = request.server;

  switch (message.type) {
    case 'auth': {
      const { token } = message.data as { token: string };
      try {
        const decoded = await request.server.jwt.verify(token);
        state.userId = (decoded as any).id;
        state.authenticated = true;
        send(socket, {
          type: 'auth',
          data: { success: true },
          timestamp: new Date().toISOString(),
        });
      } catch {
        send(socket, {
          type: 'error',
          data: {
            code: 'AUTH_FAILED',
            message: 'Invalid token',
          },
          timestamp: new Date().toISOString(),
        });
      }
      break;
    }

    case 'subscribe': {
      const sub = message as unknown as WsSubscribeMessage;

      switch (sub.channel) {
        case 'prices': {
          const instruments = sub.instruments || [];
          for (const instrument of instruments) {
            state.subscriptions.prices.add(instrument);
            marketDataAggregator.subscribe(instrument, (quote: Quote) => {
              send(socket, {
                type: 'price',
                channel: 'prices',
                data: quote,
                timestamp: new Date().toISOString(),
              });
            }, socket);
          }
          send(socket, {
            type: 'subscribed',
            channel: 'prices',
            data: { instruments },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'orders': {
          if (!state.authenticated) {
            send(socket, {
              type: 'error',
              data: {
                code: 'AUTH_REQUIRED',
                message: 'Authentication required for orders channel',
              },
              timestamp: new Date().toISOString(),
            });
            return;
          }
          state.subscriptions.orders = true;
          send(socket, {
            type: 'subscribed',
            channel: 'orders',
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'portfolio': {
          if (!state.authenticated) {
            send(socket, {
              type: 'error',
              data: {
                code: 'AUTH_REQUIRED',
                message: 'Authentication required for portfolio channel',
              },
              timestamp: new Date().toISOString(),
            });
            return;
          }
          state.subscriptions.portfolio = true;
          send(socket, {
            type: 'subscribed',
            channel: 'portfolio',
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'orderbook': {
          const instrument = sub.instrument;
          const depth = sub.depth || 10;
          if (instrument) {
            state.subscriptions.orderbook.set(instrument, depth);
            // Would set up orderbook streaming here
            send(socket, {
              type: 'subscribed',
              channel: 'orderbook',
              data: { instrument, depth },
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }
      }
      break;
    }

    case 'unsubscribe': {
      const sub = message as unknown as WsSubscribeMessage;

      switch (sub.channel) {
        case 'prices': {
          const instruments = sub.instruments || [];
          for (const instrument of instruments) {
            state.subscriptions.prices.delete(instrument);
            marketDataAggregator.unsubscribe(instrument, socket);
          }
          send(socket, {
            type: 'unsubscribed',
            channel: 'prices',
            data: { instruments },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'orders': {
          state.subscriptions.orders = false;
          send(socket, {
            type: 'unsubscribed',
            channel: 'orders',
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'portfolio': {
          state.subscriptions.portfolio = false;
          send(socket, {
            type: 'unsubscribed',
            channel: 'portfolio',
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'orderbook': {
          const instrument = sub.instrument;
          if (instrument) {
            state.subscriptions.orderbook.delete(instrument);
            send(socket, {
              type: 'unsubscribed',
              channel: 'orderbook',
              data: { instrument },
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }
      }
      break;
    }

    case 'pong': {
      // Client responded to heartbeat, all good
      break;
    }

    default: {
      send(socket, {
        type: 'error',
        data: {
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: `Unknown message type: ${message.type}`,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

function send(socket: WebSocket, message: WsMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
