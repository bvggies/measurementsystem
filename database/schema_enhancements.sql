-- Measurement & Tailoring Enhancements + Customer Experience + Security + Workflow
-- Run after schema.sql. Safe to run multiple times (IF NOT EXISTS / DO blocks).

-- ========== MEASUREMENT TEMPLATES (shirt, suit, dress, pants, regional) ==========
ALTER TABLE measurement_templates ADD COLUMN IF NOT EXISTS template_type TEXT CHECK (template_type IN ('shirt', 'suit', 'dress', 'pants', 'jacket', 'coat', 'custom'));
ALTER TABLE measurement_templates ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE measurement_templates ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_measurement_templates_type ON measurement_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_measurement_templates_region ON measurement_templates(region);

-- ========== MEASUREMENT PROFILES (versions: wedding, weight change, seasonal) ==========
CREATE TABLE IF NOT EXISTS measurement_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    profile_type TEXT CHECK (profile_type IN ('default', 'wedding', 'weight_change', 'seasonal', 'custom')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_measurement_profiles_customer ON measurement_profiles(customer_id);

-- ========== MEASUREMENTS: fit preference, profile (FK), template (FK), approval status ==========
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS fit_preference TEXT CHECK (fit_preference IN ('slim', 'regular', 'loose', 'custom'));
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES measurement_profiles(id) ON DELETE SET NULL;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES measurement_templates(id) ON DELETE SET NULL;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending_approval', 'approved', 'rejected'));
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS submitted_by_customer_at TIMESTAMP;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT false;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_measurements_profile_id ON measurements(profile_id);
CREATE INDEX IF NOT EXISTS idx_measurements_approval_status ON measurements(approval_status);

-- ========== AUTO-VALIDATION RULES ==========
CREATE TABLE IF NOT EXISTS validation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rule_key TEXT UNIQUE NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('impossible', 'unlikely', 'warning')),
    expression TEXT,
    field_a TEXT,
    field_b TEXT,
    operator TEXT,
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO validation_rules (name, rule_key, description, rule_type, field_a, field_b, operator, message_template, is_active)
VALUES
  ('Waist less than thigh', 'waist_lt_thigh', 'Waist should not be less than thigh', 'impossible', 'trouser_waist', 'trouser_thigh', '>=', 'Waist ({{a}}) cannot be less than thigh ({{b}})', true),
  ('Sleeve longer than top', 'sleeve_gt_top', 'Sleeve length vs top length check', 'unlikely', 'sleeve_length', 'top_length', '<=', 'Sleeve length ({{a}}) is unusually longer than top length ({{b}})', true),
  ('Neck vs chest sanity', 'neck_reasonable', 'Neck measurement vs chest', 'warning', 'neck', 'chest', '<=', 'Neck ({{a}}) is larger than chest ({{b}}); please verify', true)
ON CONFLICT (rule_key) DO NOTHING;

-- ========== CUSTOMER CONSENT TRACKING ==========
CREATE TABLE IF NOT EXISTS customer_consent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_consent_logs_customer ON customer_consent_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_granted_at ON customer_consent_logs(granted_at);

-- ========== GRANULAR PERMISSIONS ==========
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'approve', 'export')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource_type, action)
);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role);
INSERT INTO permissions (role, resource_type, action) VALUES
  ('admin', 'measurement', 'view'), ('admin', 'measurement', 'create'), ('admin', 'measurement', 'edit'), ('admin', 'measurement', 'delete'), ('admin', 'measurement', 'approve'), ('admin', 'measurement', 'export'),
  ('admin', 'customer', 'view'), ('admin', 'customer', 'create'), ('admin', 'customer', 'edit'), ('admin', 'customer', 'delete'), ('admin', 'customer', 'export'),
  ('manager', 'measurement', 'view'), ('manager', 'measurement', 'create'), ('manager', 'measurement', 'edit'), ('manager', 'measurement', 'approve'), ('manager', 'measurement', 'export'),
  ('manager', 'customer', 'view'), ('manager', 'customer', 'create'), ('manager', 'customer', 'edit'), ('manager', 'customer', 'export'),
  ('tailor', 'measurement', 'view'), ('tailor', 'measurement', 'create'), ('tailor', 'measurement', 'edit'), ('tailor', 'measurement', 'export'),
  ('tailor', 'customer', 'view'), ('tailor', 'customer', 'create'), ('tailor', 'customer', 'edit'),
  ('customer', 'measurement', 'view'), ('customer', 'measurement', 'create')
ON CONFLICT (role, resource_type, action) DO NOTHING;

-- ========== MEASUREMENT REMINDERS ==========
CREATE TABLE IF NOT EXISTS measurement_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('periodic', 'expiry', 'remeasure')),
    due_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'snoozed', 'cancelled')),
    channel TEXT CHECK (channel IN ('email', 'whatsapp', 'push', 'in_app')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reminders_customer ON measurement_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_at ON measurement_reminders(due_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON measurement_reminders(status);

-- ========== MULTI-PROFILE (one account, multiple people) ==========
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    relation TEXT CHECK (relation IN ('self', 'family', 'staff', 'model', 'other')),
    label TEXT,
    can_edit BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer ON customer_profiles(customer_id);

-- ========== APPROVAL WORKFLOW (customer self-entry → tailor approve) ==========
CREATE TABLE IF NOT EXISTS measurement_approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_approval_requests_measurement ON measurement_approval_requests(measurement_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON measurement_approval_requests(status);

-- ========== TASK ASSIGNMENTS ==========
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('remeasure', 'verify', 'approve', 'follow_up')),
    resource_type TEXT NOT NULL,
    resource_id UUID,
    due_at TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON task_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON task_assignments(due_at);

-- ========== MEASUREMENT EXPIRY RULES ==========
CREATE TABLE IF NOT EXISTS measurement_expiry_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    days_since_created INTEGER,
    days_since_updated INTEGER,
    action TEXT CHECK (action IN ('mark_expired', 'remind_only')),
    is_active BOOLEAN DEFAULT true,
    branch TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== GARMENT OUTCOME FEEDBACK ==========
CREATE TABLE IF NOT EXISTS garment_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    garment_type TEXT,
    fit_feedback TEXT CHECK (fit_feedback IN ('too_tight', 'slightly_tight', 'perfect', 'slightly_loose', 'too_loose')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_garment_feedback_measurement ON garment_feedback(measurement_id);

-- ========== SLA TRACKING ==========
CREATE TABLE IF NOT EXISTS sla_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sla_logs_measurement ON sla_logs(measurement_id);
CREATE INDEX IF NOT EXISTS idx_sla_logs_started_at ON sla_logs(started_at);

-- ========== BACKUP LOGS (cloud backup tracking) ==========
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'export')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    path_or_url TEXT,
    error_message TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_started_at ON backup_logs(started_at);

-- ========== REPORT DEFINITIONS (custom reports builder) ==========
CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== IN-APP NOTIFICATIONS (change notifications) ==========
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('measurement_updated', 'measurement_approved', 'measurement_rejected', 'task_assigned', 'reminder', 'approval_request')),
    title TEXT NOT NULL,
    body TEXT,
    resource_type TEXT,
    resource_id UUID,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Ensure audit_logs has ip_address and user_agent (already in main schema)
-- No change needed.

-- Trigger for measurement_profiles updated_at
CREATE TRIGGER update_measurement_profiles_updated_at BEFORE UPDATE ON measurement_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
