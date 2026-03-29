-- Verificar el estado final del esquema
SELECT 
    'Tables with RLS enabled' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
UNION ALL
SELECT 
    'Tables without RLS enabled' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false;