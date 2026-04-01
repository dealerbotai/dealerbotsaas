import { groqChat } from './groq-client.js';
import { geminiChat } from './gemini-client.js';

export async function getAIResponse(supabase, instanceId, userPrompt, systemPrompt) {
    try {
        // Obtener la configuración del workspace para ver qué proveedor usar
        const { data: instance } = await supabase
            .from('instances')
            .select('workspace_id')
            .eq('id', instanceId)
            .maybeSingle();

        if (!instance) return await groqChat(supabase, instanceId, userPrompt, systemPrompt);

        const { data: settings } = await supabase
            .from('settings')
            .select('ai_provider, ai_model')
            .eq('workspace_id', instance.workspace_id)
            .maybeSingle();

        const provider = settings?.ai_provider || 'groq';

        if (provider === 'gemini') {
            return await geminiChat(supabase, instanceId, userPrompt, systemPrompt);
        } else {
            return await groqChat(supabase, instanceId, userPrompt, systemPrompt);
        }
    } catch (error) {
        // Fallback a Groq si algo falla en la detección
        return await groqChat(supabase, instanceId, userPrompt, systemPrompt);
    }
}
