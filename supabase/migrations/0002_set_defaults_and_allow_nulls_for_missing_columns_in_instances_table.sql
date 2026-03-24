ALTER TABLE instances ALTER COLUMN config SET DEFAULT '{}'::jsonb;
ALTER TABLE instances ALTER COLUMN personality SET DEFAULT '';
ALTER TABLE instances ALTER COLUMN agent_id DROP NOT NULL;
ALTER TABLE instances ALTER COLUMN last_connected_at DROP NOT NULL;
ALTER TABLE instances ALTER COLUMN workspace_id DROP NOT NULL;