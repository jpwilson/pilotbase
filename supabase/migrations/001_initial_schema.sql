-- Agentic Scheduler MVP Schema
-- Tenant key: operator_id (FSP operatorId)
-- FSP is source of truth for reservations/resources; this DB stores derived artifacts

-- ============================================================
-- SUGGESTIONS — Core work queue
-- ============================================================
CREATE TABLE suggestions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     text NOT NULL,
  type            text NOT NULL CHECK (type IN ('waitlist', 'reschedule', 'discovery', 'next_lesson')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'expired', 'executed', 'failed')),
  priority        integer DEFAULT 0,
  student_id      text,
  student_name    text,
  instructor_id   text,
  instructor_name text,
  aircraft_id     text,
  aircraft_name   text,
  location_id     text,
  activity_type_id text,
  proposed_start  timestamptz,
  proposed_end    timestamptz,
  alternatives    jsonb DEFAULT '[]',
  rationale       text NOT NULL,
  context         jsonb DEFAULT '{}',
  trigger_event   jsonb DEFAULT '{}',
  reviewed_by     text,
  reviewed_at     timestamptz,
  executed_at     timestamptz,
  reservation_id  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggestions_operator_status ON suggestions (operator_id, status);
CREATE INDEX idx_suggestions_operator_type ON suggestions (operator_id, type);
CREATE INDEX idx_suggestions_created_at ON suggestions (created_at DESC);

-- ============================================================
-- AUDIT LOG — Immutable event log
-- ============================================================
CREATE TABLE audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     text NOT NULL,
  event_type      text NOT NULL,
  entity_type     text,
  entity_id       text,
  actor_id        text,
  actor_type      text CHECK (actor_type IN ('system', 'scheduler', 'student', 'instructor')),
  payload         jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_operator ON audit_log (operator_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);

-- ============================================================
-- OPERATOR CONFIG — Per-tenant settings
-- ============================================================
CREATE TABLE operator_config (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id      text UNIQUE NOT NULL,
  priority_weights jsonb DEFAULT '{"timeSinceLastFlight": 0.3, "timeUntilNextFlight": 0.2, "totalFlightHours": 0.1, "enrollmentProgress": 0.2, "waitlistPosition": 0.2}',
  search_window_days integer DEFAULT 7,
  max_alternatives   integer DEFAULT 5,
  notification_prefs jsonb DEFAULT '{"email": true, "sms": false}',
  templates        jsonb DEFAULT '{}',
  feature_flags    jsonb DEFAULT '{"waitlist": true, "reschedule": true, "discovery": true, "nextLesson": true}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATION LOG — Communication records
-- ============================================================
CREATE TABLE notification_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     text NOT NULL,
  suggestion_id   uuid REFERENCES suggestions(id),
  recipient_id    text NOT NULL,
  recipient_type  text NOT NULL CHECK (recipient_type IN ('student', 'instructor', 'prospect')),
  channel         text NOT NULL CHECK (channel IN ('email', 'sms')),
  template_key    text,
  content         text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at         timestamptz,
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_log_operator ON notification_log (operator_id, created_at DESC);
CREATE INDEX idx_notification_log_suggestion ON notification_log (suggestion_id);

-- ============================================================
-- DISCOVERY REQUESTS — Prospect data (FSP may lack fields)
-- ============================================================
CREATE TABLE discovery_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     text NOT NULL,
  prospect_name   text NOT NULL,
  prospect_email  text,
  prospect_phone  text,
  preferred_dates jsonb DEFAULT '[]',
  notes           text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'cancelled')),
  suggestion_id   uuid REFERENCES suggestions(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discovery_requests_operator ON discovery_requests (operator_id, status);

-- ============================================================
-- ROW LEVEL SECURITY — Tenant isolation
-- ============================================================
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_requests ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; app-level policies enforce operator_id matching
-- These policies use the JWT claim 'operator_id' set during auth
CREATE POLICY "Tenant isolation" ON suggestions
  FOR ALL USING (operator_id = current_setting('app.operator_id', true));

CREATE POLICY "Tenant isolation" ON audit_log
  FOR ALL USING (operator_id = current_setting('app.operator_id', true));

CREATE POLICY "Tenant isolation" ON operator_config
  FOR ALL USING (operator_id = current_setting('app.operator_id', true));

CREATE POLICY "Tenant isolation" ON notification_log
  FOR ALL USING (operator_id = current_setting('app.operator_id', true));

CREATE POLICY "Tenant isolation" ON discovery_requests
  FOR ALL USING (operator_id = current_setting('app.operator_id', true));

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON operator_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
