import * as baileys from '@whiskeysockets/baileys';
const { proto, BufferJSON, initAuthCreds } = baileys;

/**
 * useSupabaseAuthStore - Adaptador de persistencia personalizado para Supabase
 * Requerimiento: id (text), data (jsonb) en la tabla 'whatsapp_sessions'.
 */
export const useSupabaseAuthStore = async (supabase, sessionId = 'default') => {
    
    // Función central de UPSERT para guardar el estado completo en Supabase
    const writeData = async (data) => {
        try {
            // Maneja Buffers correctamente para el almacenamiento JSONB
            const serialized = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
            
            const { error } = await supabase
                .from('whatsapp_sessions')
                .upsert({
                    id: sessionId,
                    data: serialized,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) throw error;
        } catch (e) {
            console.error('[DATABASE-AUTH] Error sincronizando sesión:', e.message);
        }
    };

    // Al iniciar: Consultar la tabla whatsapp_sessions filtrando por el id
    const { data: row } = await supabase
        .from('whatsapp_sessions')
        .select('data')
        .eq('id', sessionId)
        .maybeSingle();

    const existingData = row?.data ? JSON.parse(JSON.stringify(row.data), BufferJSON.reviver) : {};
    
    // Credenciales Baileys (Si no existen, generamos llaves iniciales usando initAuthCreds)
    const creds = existingData.creds || initAuthCreds();

    // Mapa de llaves (pre-keys, sessions, etc) serializado en el mismo JSONB
    const keys = existingData.keys || {};

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const res = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = keys[`${type}-${id}`];
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            res[id] = value;
                        })
                    );
                    return res;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const keyName = `${category}-${id}`;
                            if (value) keys[keyName] = value;
                            else delete keys[keyName];
                        }
                    }
                    // Guardado atómico del estado completo (creds + keys)
                    await writeData({ creds, keys });
                },
            },
        },
        // En el evento creds.update: Realizar un UPSERT en Supabase
        saveCreds: () => writeData({ creds, keys }),
    };
};
