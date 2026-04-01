-- Verificar que las políticas se hayan creado correctamente
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;