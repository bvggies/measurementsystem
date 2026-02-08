-- Additional schema updates for FitTrack features
-- NOTE: shareable_tokens is now included in schema.sql. These statements are kept
-- for backward compatibility (e.g. existing DBs that ran schema.sql before the merge).
-- New deployments: run schema.sql only.

-- Shareable form tokens table (also in schema.sql)
CREATE TABLE IF NOT EXISTS shareable_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shareable_tokens_token ON shareable_tokens(token);
CREATE INDEX IF NOT EXISTS idx_shareable_tokens_created_by ON shareable_tokens(created_by);

-- System settings (if missing from initial schema)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settings JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update users table to include manager role (already done in main schema)
-- ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('admin', 'manager', 'tailor', 'customer'));

