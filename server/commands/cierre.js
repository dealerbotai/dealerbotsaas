import { PromptFactory } from '../services/ai/prompt-factory.js';

/**
 * Comando !cierre: Reporte en tiempo real de ventas completadas hoy.
 */
export async function handleCierre(supabase, context, groqService) {
    const { storeId } = context;

    try {
        const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single();
        
        // Obtener ventas de hoy
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: sales } = await supabase
            .from('orders')
            .select('*')
            .eq('store_id', storeId)
            .gte('created_at', todayStr + 'T00:00:00')
            .eq('status', 'CONFIRMED');

        const stats = {
            total: sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
            botSales: sales?.filter(s => s.bot_closed).reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
            botCount: sales?.filter(s => s.bot_closed).length || 0,
            vendorSales: sales?.filter(s => !s.bot_closed).reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
            vendorCount: sales?.filter(s => !s.bot_closed).length || 0
        };

        const { systemPrompt, userPrompt } = PromptFactory.generateDailyReport(store.name, stats);
        const aiResponse = await groqService(userPrompt, systemPrompt);

        return aiResponse || `📊 Reporte de Hoy: $${stats.total} acumulados.`;

    } catch (error) {
        console.error('Error en comando !cierre:', error.message);
        return "⚠️ Error al generar el reporte de cierre.";
    }
}
