-- ==========================================
-- DEALERBOT AI - FULL DATABASE SCHEMA SETUP
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. WORKSPACES (Multi-tenancy support)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 4. INSTANCES (WhatsApp Accounts)
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- Optional, for backward compatibility
  name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected',
  bot_enabled BOOLEAN DEFAULT false,
  scope TEXT DEFAULT 'all', -- 'all', 'groups', 'specific'
  personality TEXT,
  agent_id UUID, -- References agents(id) after agents table is created
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SETTINGS (Global configuration and Scraper data)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id), -- Optional, for backward compatibility
  groq_api_key TEXT, -- Encriptada
  groq_api_key_encrypted TEXT,
  ecommerce_url TEXT,
  scraped_data JSONB,
  global_personality TEXT,
  total_messages INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. FLOWS (Automation Flows)
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- Optional, for backward compatibility
  name TEXT NOT NULL,
  definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AGENTS (AI Personalities)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'masculino',
  personality_mode TEXT DEFAULT 'prompt', -- 'prompt', 'qualities', 'flow'
  prompt_text TEXT,
  selected_qualities TEXT[],
  flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add reference in instances table now that agents table exists
ALTER TABLE instances ADD CONSTRAINT fk_instances_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- 8. CHATS (Active Conversations)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- WhatsApp WID (e.g., '123456789@c.us')
  customer_name TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instance_id, external_id)
);

-- 9. MESSAGES (Individual message logs)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_name TEXT,
  content TEXT,
  from_me BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'text', -- 'text', 'image', 'bot', 'system'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2),
  description TEXT,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- 11. DELIVERY PERSONNEL
CREATE TABLE IF NOT EXISTS delivery_personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT,
  status TEXT DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. SALES / CLOSINGS
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  items JSONB DEFAULT '[]',
  bot_closure BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. CHAT_LOGS (Legacy)
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  type TEXT, -- 'msg', 'bot', 'system'
  sender_name TEXT,
  text TEXT,
  from_me BOOLEAN,
  contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies
CREATE POLICY "Allow members access to workspaces" ON workspaces FOR ALL USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to workspace_members" ON workspace_members FOR ALL USING (user_id = auth.uid() OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to instances" ON instances FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to settings" ON settings FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to flows" ON flows FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to agents" ON agents FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to chats" ON chats FOR ALL USING (instance_id IN (SELECT id FROM instances WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));
CREATE POLICY "Allow members access to messages" ON messages FOR ALL USING (chat_id IN (SELECT id FROM chats WHERE instance_id IN (SELECT id FROM instances WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Allow members access to products" ON products FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to delivery_personnel" ON delivery_personnel FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members access to sales" ON sales FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- System policies for backend
CREATE POLICY "System can manage all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "System can manage all sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "System can manage all messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "System can manage all chats" ON chats FOR ALL USING (true) WITH CHECK (true);
