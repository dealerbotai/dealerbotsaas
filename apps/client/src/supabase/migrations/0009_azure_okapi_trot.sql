-- Revisar las tablas existentes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN ('products', 'stores', 'instances', 'agents', 'workspaces', 'workspace_members', 'settings', 'chats', 'messages', 'customers', 'sales')
ORDER BY table_name;