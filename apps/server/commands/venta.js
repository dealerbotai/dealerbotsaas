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

        // Obtener workspace_id de la instancia
        const { data: instanceData } = await supabase
            .from('instances')
            .select('workspace_id')
            .eq('id', instanceId)
            .single();
            
        if (!instanceData) throw new Error('Instancia no encontrada');

        // 2. Registrar en la Base de Datos con atribución
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id: storeId,
                instance_id: instanceId,
                channel_id: channelId,
                workspace_id: instanceData.workspace_id,
                total_amount: amount,
                metadata: { concept: concept },
                delivery_data: deliveryData,
                status: 'PENDING_DELIVERY',
                bot_closed: false
            })
            .select('id')
            .single();

        if (orderError) throw orderError;

        // Intentar vincular el producto si existe una coincidencia aproximada
        const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('workspace_id', instanceData.workspace_id)
            .ilike('name', `%${concept.split(' ')[0]}%`)
            .limit(1);

        if (products && products.length > 0) {
            await supabase.from('order_items').insert({
                order_id: newOrder.id,
                product_id: products[0].id,
                quantity: 1,
                unit_price: amount
            });
        }

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
