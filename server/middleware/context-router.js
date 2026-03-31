/**
 * Context Router: Identifica a qué Tienda y Canal de Control pertenece un mensaje.
 * Solo permite comandos en canales registrados (is_active: true).
 */
export async function getMessageContext(supabase, instanceId, jid) {
    try {
        const isGroup = jid.endsWith('@g.us');

        // 1. Buscar si el chat es un Canal de Control registrado
        const { data: channel } = await supabase
            .from('control_channels')
            .select('*, instance:instances(store_id)')
            .eq('instance_id', instanceId)
            .eq('external_id', jid)
            .maybeSingle();

        if (channel) {
            return {
                type: 'CONTROL_CHANNEL',
                isAuthorized: channel.is_active,
                storeId: channel.instance.store_id,
                channelId: channel.id,
                channelName: channel.name,
                instanceId: instanceId
            };
        }

        // 2. Si es grupo pero no está registrado, no es un canal autorizado
        if (isGroup) {
            return { type: 'UNAUTHORIZED_GROUP', isAuthorized: false };
        }

        // 3. Si no es grupo, es un Chat de Cliente (WhatsApp Directo)
        const { data: instance } = await supabase
            .from('instances')
            .select('store_id, bot_mode')
            .eq('id', instanceId)
            .single();

        return {
            type: 'CUSTOMER_CHAT',
            isAuthorized: true, // Los chats directos siempre se procesan por el bot
            storeId: instance.store_id,
            botMode: instance.bot_mode,
            instanceId: instanceId
        };
    } catch (error) {
        console.error('Error in context-router:', error.message);
        return null;
    }
}
