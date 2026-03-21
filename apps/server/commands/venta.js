/**
 * Comando !venta [Monto] [Concepto] | [Datos de Entrega]
 * Ejemplo: !venta 1500 Kit de Herramientas | Calle Falsa 123, Col. Centro, CP 37000. Contacto: Juan Pérez 555-1234.
 */
export async function handleVenta(supabase, context, body, jid) {
    const { storeId, channelId, instanceId } = context;

    try {
        // 1. Validar la estructura del comando (Monto Concepto | Datos)
        if (!body.includes('|')) {
            return "⚠️ Estructura incorrecta.\n\nUso: !venta [Monto] [Concepto] | [Datos de Entrega]\n\n" +
                   "💡 Ejemplo: !venta 1500 Kit de Herramientas | Calle Falsa 123, Col. Centro, CP 37000. Contacto: Juan Pérez 555-1234.";
        }

        const [orderPart, deliveryData] = body.slice(6).split('|').map(s => s.trim());
        const orderParts = orderPart.split(' ');
        
        const amount = Number(orderParts[0]);
        const concept = orderParts.slice(1).join(' ');

        if (isNaN(amount) || !concept || !deliveryData) {
            return "❌ Datos incompletos.\nPor favor, ingresa el monto, concepto y los datos de entrega correctamente.";
        }

        // 2. Registrar en la Base de Datos con atribución
        // (Nota: Aquí podrías buscar al vendor_id mediante el JID de quien envía el mensaje, 
        // pero para este ejemplo lo marcaremos como una venta manual de canal)
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id: storeId,
                instance_id: instanceId,
                channel_id: channelId,
                total_amount: amount,
                metadata: { concept: concept },
                delivery_data: deliveryData, // Aquí se guardarán los datos normalizados por IA
                status: 'PENDING_DELIVERY', // NUEVO: Estatus de logística
                bot_closed: false
            })
            .select('id')
            .single();

        if (orderError) throw orderError;

        // 3. Generar Template de Confirmación para el Equipo
        return `✅ VENTA REGISTRADA 🚀\n\n` +
               `📍 Sucursal: *${context.channelName}*\n` +
               `🆔 Pedido: #${newOrder.id.split('-')[0].toUpperCase()}\n` +
               `💰 Monto: $${amount}\n` +
               `📦 Concepto: ${concept}\n\n` +
               `🚛 *DATOS DE ENTREGA:*\n${deliveryData}\n\n` +
               `¡Gran trabajo equipo de ${context.channelName}! Lista para logística. 🔥`;

    } catch (error) {
        console.error('Error en comando !venta:', error.message);
        return "⚠️ Error crítico al registrar la venta. Inténtalo de nuevo.";
    }
}
