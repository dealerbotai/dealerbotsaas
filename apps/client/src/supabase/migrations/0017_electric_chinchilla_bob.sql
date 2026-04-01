-- Revisar las columnas de la tabla products
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND table_schema = 'public';