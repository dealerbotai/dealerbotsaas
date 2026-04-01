import axios from 'axios';
import { logger } from '../../utils/logger.js';

export async function groqChat(supabase, instanceId, userPrompt, systemPrompt) {
    try {
        // 1. Obtener API Key y Workspace
        const { data: instance } = await supabase
            .from('instances')
            .select('workspace_id')
            .eq('id', instanceId)
            .maybeSingle();

        const workspaceId = instance?.workspace_id;

        const { data: settings } = await supabase
            .from('settings')
            .select('groq_api_key_encrypted, ai_model')
            .eq('workspace_id', workspaceId)
            .maybeSingle();

        const apiKey = settings?.groq_api_key_encrypted || process.env.GROQ_API_KEY;
        const model = settings?.ai_model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

        if (!apiKey) {
            throw new Error('No se encontró la API Key de Groq');
        }

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1024
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const reply = response.data.choices[0].message.content;

        // 2. Registrar Uso de Tokens
        const usage = response.data.usage;
        if (usage && workspaceId) {
            await supabase.from('token_usage').insert({
                workspace_id: workspaceId,
                instance_id: instanceId,
                provider: 'groq',
                model: model,
                input_tokens: usage.prompt_tokens || 0,
                output_tokens: usage.completion_tokens || 0,
                total_tokens: usage.total_tokens || (usage.prompt_tokens + usage.completion_tokens)
            });
        }

        return reply;
    } catch (error) {
        logger.error('GROQ', `Error en la solicitud a la IA: ${error.message}`);
        return "Lo siento, tuve un problema al procesar tu mensaje.";
    }
}
