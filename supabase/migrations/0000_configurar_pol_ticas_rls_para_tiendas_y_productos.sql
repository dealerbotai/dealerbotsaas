-- Asegurar RLS en tiendas
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manage_stores_policy" ON stores;
CREATE POLICY "manage_stores_policy" ON stores
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Asegurar que los productos tengan store_id y RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manage_products_policy" ON products;
CREATE POLICY "manage_products_policy" ON products
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));