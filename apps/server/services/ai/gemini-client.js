import axios from 'axios';
import { logger } from '../../utils/logger.js';

export async function geminiChat(supabase, instanceId, userPrompt, systemPrompt) {
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
            .select('gemini_api_key_encrypted, ai_model')
            .eq('workspace_id', workspaceId)
            .maybeSingle();

        const apiKey = settings?.gemini_api_key_encrypted || process.env.GEMINI_API_KEY;
        const model = settings?.ai_model || 'gemini-1.5-flash';

        if (!apiKey) {
            throw new Error('No se encontró la API Key de Gemini');
        }

        // 2. Formatear para Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUsuario: ${userPrompt}` }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024
            }
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const reply = response.data.candidates[0].content.parts[0].text;
        
        // 3. Registrar Uso de Tokens (Si existe en la respuesta de Google)
        const usage = response.data.usageMetadata;
        if (usage && workspaceId) {
            await supabase.from('token_usage').insert({
                workspace_id: workspaceId,
                instance_id: instanceId,
                provider: 'gemini',
                model: model,
                input_tokens: usage.promptTokenCount || 0,
                output_tokens: usage.candidatesTokenCount || 0,
                total_tokens: usage.totalTokenCount || usage.promptTokenCount + usage.candidatesTokenCount
            });
        }

        return reply;
    } catch (error) {
        logger.error('GEMINI', `Error en la solicitud a la IA: ${error.message}`);
        if (error.response?.data) {
            logger.error('GEMINI_DETAIL', JSON.stringify(error.response.data));
        }
        return "Lo siento, tuve un problema al procesar tu mensaje con Gemini.";
    }
}
