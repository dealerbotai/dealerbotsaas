import { decrypt } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';

/**
 * Groq Service: Cliente centralizado que recibe la API Key por parámetro.
 * Registra el consumo de tokens para el monitoreo de la tienda.
 */
export async function groqChat(supabase, storeId, apiKey, userPrompt, systemPrompt) {
    if (!apiKey) {
        return { error: 'CONFIG_INCOMPLETE', message: '⚠️ Configuración incompleta: Por favor, ingresa tu API Key en el panel de control para habilitar los comandos de IA.' };
    }

    try {
        const groqModel = process.env.GROQ_MODEL || "llama3-70b-8192";

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${apiKey}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                model: groqModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.1, // Baja temperatura para normalización de datos
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const err = await response.json();
            logger.error('GROQ', 'API Error:', err);
            return null;
        }

        const data = await response.json();
        
        // Registrar consumo de tokens
        if (data.usage) {
            logger.info('GROQ', `Respuesta generada (${data.usage.total_tokens} tokens)`);
            await supabase.from('token_usage').insert({
                store_id: storeId,
                model_name: groqModel,
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens
            });
        }

        return { content: data.choices?.[0]?.message?.content || null };

    } catch (error) {
        logger.error('GROQ', 'Error crítico en servicio:', error);
        return null;
    }
}
