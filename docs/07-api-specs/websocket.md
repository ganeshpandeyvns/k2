# K2 WebSocket API Specification

## Overview

K2 provides a WebSocket API for real-time updates:
- Price updates (crypto and events)
- Order status updates
- Portfolio updates

## Connection

### Endpoint

```
Production: wss://ws.k2.app/v1
Staging:    wss://ws.staging.k2.app/v1
```

### Authentication

Connect with JWT token as query parameter:

```
wss://ws.k2.app/v1?token=<jwt_token>
```

Or send auth message after connection:

```json
{
  "type": "auth",
  "token": "<jwt_token>"
}
```

### Connection Response

```json
{
  "type": "connected",
  "connection_id": "conn_abc123",
  "server_time": "2024-01-15T10:30:00.000Z"
}
```

---

## Message Format

All messages are JSON with this structure:

```json
{
  "type": "<message_type>",
  "channel": "<channel_name>",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Channels

### 1. Prices Channel

Subscribe to real-time price updates.

#### Subscribe

```json
{
  "type": "subscribe",
  "channel": "prices",
  "instruments": ["BTC-USD", "ETH-USD", "KXBTC-24DEC31-B100000"]
}
```

#### Subscribe Response

```json
{
  "type": "subscribed",
  "channel": "prices",
  "instruments": ["BTC-USD", "ETH-USD", "KXBTC-24DEC31-B100000"]
}
```

#### Price Update (Crypto)

```json
{
  "type": "price",
  "channel": "prices",
  "data": {
    "instrument": "BTC-USD",
    "instrument_type": "crypto",
    "price": "64950.00",
    "bid": "64948.00",
    "ask": "64952.00",
    "change_24h": "1250.00",
    "change_24h_percent": "1.96",
    "volume_24h": "12500.50"
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

#### Price Update (Event)

```json
{
  "type": "price",
  "channel": "prices",
  "data": {
    "instrument": "KXBTC-24DEC31-B100000",
    "instrument_type": "event",
    "yes_price": "62",
    "no_price": "38",
    "yes_bid": "61",
    "yes_ask": "63",
    "change_24h": "5",
    "volume_24h": "15420"
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

#### Unsubscribe

```json
{
  "type": "unsubscribe",
  "channel": "prices",
  "instruments": ["BTC-USD"]
}
```

---

### 2. Orders Channel

Subscribe to order status updates (requires authentication).

#### Subscribe

```json
{
  "type": "subscribe",
  "channel": "orders"
}
```

#### Order Update

```json
{
  "type": "order_update",
  "channel": "orders",
  "data": {
    "id": "order_uuid",
    "client_order_id": "client_uuid",
    "status": "filled",
    "filled_quantity": "0.1",
    "avg_fill_price": "64950.00",
    "remaining_quantity": "0",
    "last_fill": {
      "quantity": "0.1",
      "price": "64950.00",
      "fee": "6.50",
      "executed_at": "2024-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

#### Order Status Values

| Status | Description |
|--------|-------------|
| `pending` | Order received, processing |
| `submitted` | Sent to exchange |
| `open` | Working at exchange |
| `partial` | Partially filled |
| `filled` | Fully executed |
| `cancelled` | Cancelled |
| `rejected` | Rejected by exchange or risk |

---

### 3. Portfolio Channel

Subscribe to portfolio updates (requires authentication).

#### Subscribe

```json
{
  "type": "subscribe",
  "channel": "portfolio"
}
```

#### Portfolio Update

Sent when positions or balances change:

```json
{
  "type": "portfolio_update",
  "channel": "portfolio",
  "data": {
    "total_value": "47832.50",
    "total_change_24h": "1247.30",
    "positions_changed": [
      {
        "instrument": "BTC-USD",
        "quantity": "0.6",
        "market_value": "38970.00",
        "unrealized_pnl": "1250.00"
      }
    ],
    "balances_changed": [
      {
        "exchange": "cryptocom",
        "currency": "USD",
        "available": "5432.50"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

---

### 4. Order Book Channel

Subscribe to order book updates for specific instruments.

#### Subscribe

```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "instrument": "BTC-USD",
  "depth": 10
}
```

#### Snapshot (Initial)

```json
{
  "type": "orderbook_snapshot",
  "channel": "orderbook",
  "data": {
    "instrument": "BTC-USD",
    "sequence": 123456,
    "bids": [
      ["64948.00", "1.5"],
      ["64947.00", "2.3"],
      ...
    ],
    "asks": [
      ["64952.00", "0.8"],
      ["64953.00", "1.2"],
      ...
    ]
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

#### Delta Update

```json
{
  "type": "orderbook_update",
  "channel": "orderbook",
  "data": {
    "instrument": "BTC-USD",
    "sequence": 123457,
    "bids": [
      ["64948.00", "1.8"]  // Updated quantity
    ],
    "asks": [
      ["64951.00", "0.5"]  // New level
    ]
  },
  "timestamp": "2024-01-15T10:30:00.150Z"
}
```

**Note:** Quantity of "0" means remove that price level.

---

## Heartbeat

Server sends heartbeat every 30 seconds:

```json
{
  "type": "heartbeat",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Client should respond with pong:

```json
{
  "type": "pong"
}
```

If no pong received within 60 seconds, server may close connection.

---

## Error Messages

```json
{
  "type": "error",
  "code": "INVALID_INSTRUMENT",
  "message": "Instrument XYZ-USD not found",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required for this channel |
| `AUTH_FAILED` | Invalid or expired token |
| `INVALID_MESSAGE` | Malformed message |
| `INVALID_INSTRUMENT` | Unknown instrument |
| `RATE_LIMITED` | Too many subscriptions |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Subscriptions per connection | 100 |
| Messages per second (client) | 10 |
| Connections per user | 5 |

---

## Reconnection

On disconnect, clients should:

1. Wait 1 second
2. Reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
3. Re-authenticate
4. Re-subscribe to all channels

```javascript
// Example reconnection logic
class K2WebSocket {
  constructor(token) {
    this.token = token;
    this.subscriptions = new Set();
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(`wss://ws.k2.app/v1?token=${this.token}`);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000; // Reset on success
      this.resubscribe();
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    };
  }

  resubscribe() {
    for (const sub of this.subscriptions) {
      this.ws.send(JSON.stringify(sub));
    }
  }
}
```

---

## Example: Full Trading Flow

```javascript
// 1. Connect
const ws = new WebSocket('wss://ws.k2.app/v1?token=<jwt>');

// 2. Subscribe to prices and orders
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'prices',
    instruments: ['BTC-USD']
  }));

  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'orders'
  }));
};

// 3. Handle messages
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case 'price':
      updatePriceDisplay(msg.data);
      break;
    case 'order_update':
      updateOrderStatus(msg.data);
      break;
    case 'heartbeat':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
  }
};

// 4. Submit order via REST API
const order = await fetch('/v1/orders', {
  method: 'POST',
  body: JSON.stringify({
    client_order_id: uuid(),
    instrument: 'BTC-USD',
    side: 'buy',
    order_type: 'market',
    quantity: '0.1'
  })
});

// 5. Receive order updates via WebSocket
// { type: 'order_update', data: { status: 'submitted' } }
// { type: 'order_update', data: { status: 'filled', ... } }
```
