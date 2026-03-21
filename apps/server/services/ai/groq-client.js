import axios from 'axios';
import { logger } from '../../utils/logger.js';

export async function groqChat(supabase, instanceId, userPrompt, systemPrompt) {
    try {
        // Obtener API Key de la base de datos (encriptada o directa)
        const { data: settings } = await supabase
            .from('settings')
            .select('groq_api_key_encrypted')
            .maybeSingle();

        const apiKey = settings?.groq_api_key_encrypted || process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('No se encontró la API Key de Groq');
        }

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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

        return response.data.choices[0].message.content;
    } catch (error) {
        logger.error('GROQ', `Error en la solicitud a la IA: ${error.message}`);
        return "Lo siento, tuve un problema al procesar tu mensaje.";
    }
}
