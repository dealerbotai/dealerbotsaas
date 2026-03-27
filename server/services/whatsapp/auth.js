import { proto, BufferJSON, Curve, generateRegistrationId, generateSignedPreKey } from '@whiskeysockets/baileys';

/**
 * useSupabaseAuth - Dealerbot AI Cloud Auth Store
 * Almacena el estado completo de la sesión de Baileys en Supabase (tabla whatsapp_sessions).
 * Diseñado para entornos sin persistencia local como Render.
 */
export const useSupabaseAuth = async (supabase, sessionId = 'default') => {
    
    const writeData = async (data) => {
        try {
            // Serialización segura con BufferJSON para tipos binarios
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
            console.error(`[WHATSAPP-AUTH] Error de guardado: ${e.message}`);
        }
    };

    const readData = async () => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .select('data')
                .eq('id', sessionId)
                .maybeSingle();

            if (error) throw error;
            return data?.data ? JSON.parse(JSON.stringify(data.data), BufferJSON.reviver) : null;
        } catch (e) {
            console.error(`[WHATSAPP-AUTH] Error de lectura: ${e.message}`);
            return null;
        }
    };

    // 1. Cargamos el estado inicial de la base de datos
    const initialData = await readData();
    
    // 2. Extraemos credenciales (o inicializamos de cero si no existen)
    const creds = initialData?.creds || {
        noiseKey: Curve.generateKeyPair(),
        signedIdentityKey: Curve.generateKeyPair(),
        signedPreKey: generateSignedPreKey(Curve.generateKeyPair(), 1),
        registrationId: generateRegistrationId(),
        advSecretKey: Buffer.alloc(32).toString('base64'),
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSettings: { unarchiveChats: false },
        registered: false,
    };

    // 3. El mapa de "keys" (sessions, pre-keys, etc) se inyecta desde el mismo JSONB
    const keys = initialData?.keys || {};

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
                    // Guardado atómico del estado completo (creds + keys)
                    await writeData({ creds, keys });
                },
            },
        },
        saveCreds: () => writeData({ creds, keys }),
    };
};
