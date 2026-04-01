-- Revisar las políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('products', 'stores', 'instances', 'agents', 'workspaces', 'workspace_members', 'settings', 'chats', 'messages', 'customers', 'sales')
ORDER BY tablename, policyname;