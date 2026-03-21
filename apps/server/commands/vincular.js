/**
 * Comando .vincular_canal [Nombre_Sucursal]: Vincula un grupo de WhatsApp a una tienda.
 */
export async function handleVincular(supabase, instanceId, jid, args) {
    const nombreSucursal = args.join(' ');
    if (!nombreSucursal) return "⚠️ Uso: .vincular_canal [Nombre_Sucursal]";

    try {
        // 1. Obtener la tienda asociada a la instancia
        const { data: instance, error: instError } = await supabase
            .from('instances')
            .select('store_id')
            .eq('id', instanceId)
            .single();

        if (instError || !instance.store_id) {
            return "❌ Error: Esta instancia no tiene una tienda asignada.";
        }

        // 2. Registrar o actualizar el Canal de Control
        const { data, error } = await supabase
            .from('control_channels')
            .upsert({
                instance_id: instanceId,
                external_id: jid,
                name: nombreSucursal,
                is_active: true
            }, { onConflict: 'instance_id,external_id' })
            .select()
            .single();

        if (error) throw error;

        return `✅ ¡CANAL VINCULADO! 🛡️\n\nEste grupo ahora es el Canal de Control oficial para: *${nombreSucursal}*.\n\nComandos habilitados:\n- .venta\n- .inicio\n- .cierre\n- .cancelar`;
        
    } catch (error) {
        console.error('Error en vincular_canal:', error.message);
        return "⚠️ Error crítico al intentar vincular el canal.";
    }
}
