/**
 * Comando .cancelar [ID_Pedido] [Motivo]: Cancela un pedido y registra el motivo.
 */
export async function handleCancelar(supabase, context, args) {
    if (args.length < 2) {
        return "⚠️ Uso: .cancelar [ID_Pedido] [Motivo]";
    }

    const orderId = args[0];
    const reason = args.slice(1).join(' ');

    try {
        const { data: order, error: findError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();

        if (!order) return "❌ Pedido no encontrado.";

        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                status: 'CANCELLED', 
                cancel_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        return `✅ Pedido #${orderId} CANCELADO.\nMotivo: ${reason}`;

    } catch (error) {
        console.error('Error en comando .cancelar:', error.message);
        return "⚠️ Error al intentar cancelar el pedido.";
    }
}
