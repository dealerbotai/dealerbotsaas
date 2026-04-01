-- Rename image_url column to image_base64 to match the code
ALTER TABLE products RENAME COLUMN image_url TO image_base64;