-- K2 Trading Platform - Database Initialization
-- This script runs on first container creation

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS trading;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT ALL ON SCHEMA trading TO k2;
GRANT ALL ON SCHEMA auth TO k2;
GRANT ALL ON SCHEMA audit TO k2;

-- Users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    phone_number VARCHAR(50),
    kyc_status VARCHAR(20) DEFAULT 'none',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);

-- Exchange connections (OAuth tokens)
CREATE TABLE IF NOT EXISTS auth.exchange_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange VARCHAR(20) NOT NULL, -- 'cryptocom' or 'kalshi'
    status VARCHAR(20) DEFAULT 'active',
    access_token_encrypted BYTEA,
    refresh_token_encrypted BYTEA,
    token_expires_at TIMESTAMPTZ,
    permissions TEXT[],
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    UNIQUE(user_id, exchange)
);

CREATE INDEX idx_exchange_connections_user_id ON auth.exchange_connections(user_id);

-- Orders table
CREATE TABLE IF NOT EXISTS trading.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_order_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    instrument VARCHAR(50) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    remaining_quantity DECIMAL(20, 8),
    price DECIMAL(20, 8),
    avg_fill_price DECIMAL(20, 8),
    time_in_force VARCHAR(10) DEFAULT 'gtc',
    fees DECIMAL(20, 8) DEFAULT 0,
    fee_currency VARCHAR(10) DEFAULT 'USD',
    external_order_id VARCHAR(100),
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON trading.orders(user_id);
CREATE INDEX idx_orders_status ON trading.orders(status);
CREATE INDEX idx_orders_instrument ON trading.orders(instrument);
CREATE INDEX idx_orders_created_at ON trading.orders(created_at DESC);
CREATE INDEX idx_orders_user_status ON trading.orders(user_id, status);

-- Fills table
CREATE TABLE IF NOT EXISTS trading.fills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trading.orders(id),
    price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    fee_currency VARCHAR(10) DEFAULT 'USD',
    side VARCHAR(10) NOT NULL,
    external_trade_id VARCHAR(100),
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fills_order_id ON trading.fills(order_id);
CREATE INDEX idx_fills_executed_at ON trading.fills(executed_at DESC);

-- Watchlists table
CREATE TABLE IF NOT EXISTS trading.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    instruments TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user_id ON trading.watchlists(user_id);

-- Price alerts table
CREATE TABLE IF NOT EXISTS trading.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instrument VARCHAR(50) NOT NULL,
    condition VARCHAR(20) NOT NULL,
    target_price DECIMAL(20, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_alerts_user_id ON trading.price_alerts(user_id);
CREATE INDEX idx_price_alerts_status ON trading.price_alerts(status);
CREATE INDEX idx_price_alerts_instrument ON trading.price_alerts(instrument);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit.logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit.logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit.logs(created_at DESC);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON trading.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON trading.watchlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user for development
INSERT INTO auth.users (id, email, display_name, kyc_status)
VALUES (
    'dev-user-001'::UUID,
    'dev@k2.app',
    'Development User',
    'verified'
) ON CONFLICT (id) DO NOTHING;

-- Insert default watchlist for test user
INSERT INTO trading.watchlists (user_id, name, instruments, is_default)
VALUES (
    'dev-user-001'::UUID,
    'Favorites',
    ARRAY['BTC-USD', 'ETH-USD', 'SOL-USD', 'KXBTC-25DEC31-B100000'],
    true
) ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA trading IS 'Trading related tables (orders, fills, positions)';
COMMENT ON SCHEMA auth IS 'Authentication and user management';
COMMENT ON SCHEMA audit IS 'Audit logging for compliance';
