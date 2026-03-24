-- Enable RLS on the instances table if it isn't already
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "allow_all_select" ON instances;
DROP POLICY IF EXISTS "allow_all_insert" ON instances;
DROP POLICY IF EXISTS "allow_all_update" ON instances;
DROP POLICY IF EXISTS "allow_all_delete" ON instances;

-- Create permissive policies that allow any authenticated user to perform CRUD operations
CREATE POLICY "allow_all_select" ON instances
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_all_insert" ON instances
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "allow_all_update" ON instances
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_delete" ON instances
    FOR DELETE TO authenticated
    USING (true);