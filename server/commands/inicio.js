import { PromptFactory } from '../services/ai/prompt-factory.js';

/**
 * Comando !inicio: Genera el Morning Briefing y motiva a los vendedores.
 */
export async function handleInicio(supabase, context, groqService) {
    const { storeId, channelId } = context;

    try {
        // 1. Obtener la Tienda
        const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single();
        
        // 2. Obtener los vendedores asignados a este canal de control
        const { data: vendors } = await supabase
            .from('vendors')
            .select('*, channel_vendors!inner(channel_id)')
            .eq('channel_vendors.channel_id', channelId);

        // 3. Obtener ventas de ayer para la tienda
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: sales } = await supabase
            .from('orders')
            .select('*')
            .eq('store_id', storeId)
            .gte('created_at', yesterdayStr + 'T00:00:00')
            .lte('created_at', yesterdayStr + 'T23:59:59')
            .eq('status', 'CONFIRMED');

        const yesterdayTotal = sales?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
        const globalGoal = vendors?.reduce((sum, v) => sum + Number(v.daily_goal), 0) || 1000; // Meta por defecto

        // 4. Mapear ventas individuales para el prompt
        const vendorData = vendors?.map(v => ({
            ...v,
            sales_yesterday: sales?.filter(s => s.vendor_id === v.id)
                .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
        }));

        // 5. Generar reporte con Groq
        const { systemPrompt, userPrompt } = PromptFactory.generateMorningBriefing(
            store.name,
            yesterdayTotal,
            globalGoal,
            vendorData || []
        );

        const aiResponse = await groqService(userPrompt, systemPrompt);
        return aiResponse || "¡Buenos días equipo! Vamos por todo hoy. 🚀";

    } catch (error) {
        console.error('Error en comando !inicio:', error.message);
        return "⚠️ Error al generar el Morning Briefing.";
    }
}
