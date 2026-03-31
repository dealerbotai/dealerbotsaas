-- Migración para persistencia de WhatsApp en Base de Datos
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
    key_id TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(instance_id, key_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_instance ON whatsapp_sessions(instance_id);
