-- Crear políticas adecuadas para la tabla products
CREATE POLICY "products_select_policy" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_policy" ON products FOR INSERT WITH CHECK (workspace_id = (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "products_update_policy" ON products FOR UPDATE USING (workspace_id = (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1));
CREATE POLICY "products_delete_policy" ON products FOR DELETE USING (workspace_id = (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1));