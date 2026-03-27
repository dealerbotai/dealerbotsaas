-- ==========================================
-- ADD PRODUCTS, DELIVERY AND SALES TABLES
-- ==========================================

-- 1. PRODUCTS TABLE
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
  UNIQUE(workspace_id, name) -- Prevent duplicates in the same workspace
);

-- 2. DELIVERY PERSONNEL TABLE
CREATE TABLE IF NOT EXISTS delivery_personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT,
  status TEXT DEFAULT 'available', -- 'available', 'busy', 'offline'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SALES / CLOSINGS TABLE
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'delivered', 'cancelled'
  items JSONB DEFAULT '[]', -- List of products/quantities
  bot_closure BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own products" ON products;
CREATE POLICY "Users can manage their own products" ON products
    FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own delivery personnel" ON delivery_personnel;
CREATE POLICY "Users can manage their own delivery personnel" ON delivery_personnel
    FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own sales" ON sales;
CREATE POLICY "Users can manage their own sales" ON sales
    FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Also allow system (Service Role) to manage these tables
DROP POLICY IF EXISTS "System can manage products" ON products;
CREATE POLICY "System can manage products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "System can manage delivery personnel" ON delivery_personnel;
CREATE POLICY "System can manage delivery personnel" ON delivery_personnel FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "System can manage sales" ON sales;
CREATE POLICY "System can manage sales" ON sales FOR ALL USING (true) WITH CHECK (true);
