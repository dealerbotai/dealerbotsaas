import { proto, BufferJSON } from '@whiskeysockets/baileys';

/**
 * useSupabaseAuthStore - Persistencia total en la tabla 'whatsapp_sessions'
 * Cumple con el requerimiento de: id (text), data (jsonb).
 */
export const useSupabaseAuthStore = async (supabase, sessionId = 'default') => {
    
    // Función central de UPSERT para guardar el estado completo en Supabase
    const writeData = async (data) => {
        try {
            // Serializamos el objeto completo manejando Buffers (claves privadas, etc.)
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
            console.error('[AUTH STORE] Error al sincronizar con Supabase:', e.message);
        }
    };

    // Al iniciar: Consultar la tabla whatsapp_sessions filtrando por el id
    const { data: row, error: fetchError } = await supabase
        .from('whatsapp_sessions')
        .select('data')
        .eq('id', sessionId)
        .maybeSingle();

    if (fetchError) {
        console.error('[AUTH STORE] Error crítico al cargar sesión:', fetchError.message);
    }

    // Si existe data: Inyectar las credenciales, si no, crear de cero
    const existingData = row?.data ? JSON.parse(JSON.stringify(row.data), BufferJSON.reviver) : {};
    
    // Credenciales principales de Baileys
    const creds = existingData.creds || {
        noiseKey: proto.KeyPair.create(),
        signedIdentityKey: proto.KeyPair.create(),
        signedPreKey: proto.SignedPreKey.create(proto.KeyPair.create(), 1),
        registrationId: Math.floor(Math.random() * 16384),
        advSecretKey: Buffer.alloc(32).toString('base64'), // Baileys espera a veces base64 o buffer
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSettings: { unarchiveChats: false },
        registered: false,
    };

    // Almacén secundario de llaves (pre-keys, sessions, etc) dentro del mismo JSON
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
                            if (value) {
                                keys[keyName] = value;
                            } else {
                                delete keys[keyName];
                            }
                        }
                    }
                    // Guardado atómico después de actualizar el mapa de llaves
                    await writeData({ creds, keys }); 
                },
            },
        },
        // En el evento creds.update: Realizar un UPSERT en Supabase
        saveCreds: () => writeData({ creds, keys }),
    };
};
