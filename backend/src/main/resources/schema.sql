-- Users
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         VARCHAR(500),
    amount              DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(3) DEFAULT 'CAD',
    billing_cycle       VARCHAR(20) NOT NULL, -- MONTHLY, YEARLY, WEEKLY
    next_billing_date   DATE NOT NULL,
    cancellation_date   DATE,
    is_active           BOOLEAN DEFAULT TRUE,
    category            VARCHAR(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription price history (for price creep tracking)
CREATE TABLE IF NOT EXISTS subscription_price_history (
    id                  BIGSERIAL PRIMARY KEY,
    subscription_id     BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    old_amount          DECIMAL(10,2) NOT NULL,
    new_amount          DECIMAL(10,2) NOT NULL,
    detected_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id     BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
    type                VARCHAR(50) NOT NULL, -- PRICE_INCREASE, CANCELLATION_REMINDER, RENEWAL_UPCOMING
    message             TEXT NOT NULL,
    is_read             BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plaid connections
CREATE TABLE IF NOT EXISTS plaid_connections (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token        VARCHAR(500) NOT NULL,
    item_id             VARCHAR(255) NOT NULL,
    institution_name    VARCHAR(255),
    connected_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

