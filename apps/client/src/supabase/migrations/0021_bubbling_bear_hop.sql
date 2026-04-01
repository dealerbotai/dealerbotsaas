-- Verificar el estado final de las políticas RLS
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN 'User-specific'
        WHEN qual LIKE '%true%' THEN 'Public'
        ELSE 'Other'
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('products', 'stores', 'instances', 'agents', 'workspaces', 'workspace_members', 'settings', 'chats', 'messages', 'customers', 'sales')
ORDER BY tablename, policyname;