-- ==========================================
-- FIX RLS POLICIES FOR DEALERBOT AI
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 1. WORKSPACES
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
CREATE POLICY "Users can view their own workspaces" ON workspaces
    FOR SELECT USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 2. WORKSPACE_MEMBERS
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;
CREATE POLICY "Users can view their own memberships" ON workspace_members
    FOR SELECT USING (user_id = auth.uid());

-- 3. INSTANCES
DROP POLICY IF EXISTS "Users can manage their own instances" ON instances;
CREATE POLICY "Users can manage their own instances" ON instances
    FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 4. SETTINGS
DROP POLICY IF EXISTS "Users can manage their own settings" ON settings;
CREATE POLICY "Users can manage their own settings" ON settings
    FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 5. FLOWS
DROP POLICY IF EXISTS "Users can manage their own flows" ON flows;
CREATE POLICY "Users can manage their own flows" ON flows
    FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 6. AGENTS
DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
CREATE POLICY "Users can manage their own agents" ON agents
    FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 7. CHATS (The one causing the error)
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
CREATE POLICY "Users can view their own chats" ON chats
    FOR SELECT USING (instance_id IN (SELECT id FROM instances WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "System can manage chats" ON chats;
CREATE POLICY "System can manage chats" ON chats
    FOR ALL USING (true) WITH CHECK (true); 
-- Note: Service Role bypasses RLS, but if using Anon key, this policy allows all. 
-- For production, restrict 'System can manage chats' to specific roles if not using Service Role.

-- 8. MESSAGES
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (chat_id IN (SELECT id FROM chats WHERE instance_id IN (SELECT id FROM instances WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));

DROP POLICY IF EXISTS "System can manage messages" ON messages;
CREATE POLICY "System can manage messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);
