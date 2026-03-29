ALTER TABLE products ADD COLUMN image_base64 TEXT;
ALTER TABLE products RENAME COLUMN image_url TO image_base64;