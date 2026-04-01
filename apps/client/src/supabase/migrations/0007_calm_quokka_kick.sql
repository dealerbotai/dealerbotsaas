-- Revisar el esquema completo de la base de datos
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('products', 'stores', 'instances', 'agents', 'workspaces', 'workspace_members', 'settings', 'chats', 'messages', 'customers', 'sales')
ORDER BY table_name, ordinal_position;