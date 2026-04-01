-- Revisar si hay alguna tabla sin RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename IN ('products', 'stores', 'instances', 'agents', 'workspaces', 'workspace_members', 'settings', 'chats', 'messages', 'customers', 'sales');