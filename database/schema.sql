-- Tailoring Measurement System Database Schema
-- For Neon Postgres

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'tailor', 'customer')),
    password_hash TEXT NOT NULL,
    branch TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on customer phone and email for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Measurements table
CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    entry_id TEXT UNIQUE NOT NULL,
    units TEXT NOT NULL DEFAULT 'cm' CHECK (units IN ('cm', 'in')),
    -- Top measurements
    across_back NUMERIC(10, 2),
    chest NUMERIC(10, 2),
    sleeve_length NUMERIC(10, 2),
    around_arm NUMERIC(10, 2),
    neck NUMERIC(10, 2),
    top_length NUMERIC(10, 2),
    wrist NUMERIC(10, 2),
    -- Trouser measurements
    trouser_waist NUMERIC(10, 2),
    trouser_thigh NUMERIC(10, 2),
    trouser_knee NUMERIC(10, 2),
    trouser_length NUMERIC(10, 2),
    trouser_bars NUMERIC(10, 2),
    -- Additional info
    additional_info TEXT,
    branch TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_measurements_customer_id ON measurements(customer_id);
CREATE INDEX IF NOT EXISTS idx_measurements_entry_id ON measurements(entry_id);
CREATE INDEX IF NOT EXISTS idx_measurements_created_by ON measurements(created_by);
CREATE INDEX IF NOT EXISTS idx_measurements_branch ON measurements(branch);
CREATE INDEX IF NOT EXISTS idx_measurements_created_at ON measurements(created_at);

-- Measurement history table for audit trail
CREATE TABLE IF NOT EXISTS measurement_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID REFERENCES measurements(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_diff JSONB NOT NULL,
    version INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_measurement_history_measurement_id ON measurement_history(measurement_id);
CREATE INDEX IF NOT EXISTS idx_measurement_history_changed_at ON measurement_history(changed_at);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    fabric TEXT,
    status TEXT NOT NULL DEFAULT 'raw' CHECK (status IN ('raw', 'in-progress', 'ready', 'delivered')),
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_measurement_id ON orders(measurement_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Fittings/Schedule table
CREATE TABLE IF NOT EXISTS fittings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    tailor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    branch TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fittings_scheduled_at ON fittings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_fittings_tailor_id ON fittings(tailor_id);
CREATE INDEX IF NOT EXISTS idx_fittings_branch ON fittings(branch);

-- Imports table for tracking import operations
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    report JSONB,
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_imports_imported_by ON imports(imported_by);
CREATE INDEX IF NOT EXISTS idx_imports_status ON imports(status);

-- Templates table for measurement presets
CREATE TABLE IF NOT EXISTS measurement_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Template fields (same structure as measurements)
    units TEXT DEFAULT 'cm',
    across_back NUMERIC(10, 2),
    chest NUMERIC(10, 2),
    sleeve_length NUMERIC(10, 2),
    around_arm NUMERIC(10, 2),
    neck NUMERIC(10, 2),
    top_length NUMERIC(10, 2),
    wrist NUMERIC(10, 2),
    trouser_waist NUMERIC(10, 2),
    trouser_thigh NUMERIC(10, 2),
    trouser_knee NUMERIC(10, 2),
    trouser_length NUMERIC(10, 2),
    trouser_bars NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table for general system activities
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON measurements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fittings_updated_at BEFORE UPDATE ON fittings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create measurement history entry on update
CREATE OR REPLACE FUNCTION create_measurement_history()
RETURNS TRIGGER AS $$
DECLARE
    diff JSONB;
BEGIN
    -- Create diff of changes
    diff := jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
    );
    
    -- Insert history record
    INSERT INTO measurement_history (measurement_id, changed_by, change_diff, version)
    VALUES (NEW.id, NEW.created_by, diff, NEW.version);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create history on measurement update
CREATE TRIGGER measurement_history_trigger
    AFTER UPDATE ON measurements
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION create_measurement_history();

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settings JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

