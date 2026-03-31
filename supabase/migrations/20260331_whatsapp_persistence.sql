CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id TEXT NOT NULL,
    key_id TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(instance_id, key_id)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_instance ON whatsapp_sessions(instance_id);
