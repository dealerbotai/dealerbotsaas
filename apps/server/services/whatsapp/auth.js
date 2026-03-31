import { BufferJSON, proto, initAuthCreds } from '@whiskeysockets/baileys';

/**
 * Custom Auth State para Baileys usando Supabase (Stateless Persistence)
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} instanceId
 */
export const useSupabaseAuthState = async (supabase, instanceId) => {
    
    const writeData = async (data, type, keyId) => {
        try {
            const { error } = await supabase
                .from('whatsapp_auth_states')
                .upsert({
                    instance_id: instanceId,
                    type: type,
                    key_id: keyId,
                    data: JSON.parse(JSON.stringify(data, BufferJSON.replacer))
                }, { onConflict: 'instance_id,type,key_id' });
            
            if (error) throw error;
        } catch (error) {
            console.error(`[AUTH] Error guardando ${type}/${keyId}:`, error.message);
        }
    };

    const readData = async (type, keyId) => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_auth_states')
                .select('data')
                .eq('instance_id', instanceId)
                .eq('type', type)
                .eq('key_id', keyId)
                .maybeSingle();

            if (error) throw error;
            return data ? JSON.parse(JSON.stringify(data.data), BufferJSON.reviver) : null;
        } catch (e) {
            console.error(`[AUTH] Error leyendo ${type}/${keyId}:`, e.message);
            return null;
        }
    };

    const removeData = async (type, keyId) => {
        try {
            const { error } = await supabase
                .from('whatsapp_auth_states')
                .delete()
                .eq('instance_id', instanceId)
                .eq('type', type)
                .eq('key_id', keyId);
            
            if (error) throw error;
        } catch (error) {
            console.error(`[AUTH] Error eliminando ${type}/${keyId}:`, error.message);
        }
    };

    // Cargar credenciales base o inicializar nuevas
    const creds = await readData('creds', 'initial-creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(type, id);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            if (value) {
                                tasks.push(writeData(value, category, id));
                            } else {
                                tasks.push(removeData(category, id));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds', 'initial-creds')
    };
};
