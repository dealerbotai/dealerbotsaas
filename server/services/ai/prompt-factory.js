/**
 * Prompt Factory: Generador de prompts creativos para Groq.
 * Diseñado para reportes motivacionales e informes de ventas.
 */
export const PromptFactory = {
    /**
     * Prompt para el Comando !inicio: Genera resúmenes y mensajes motivacionales.
     */
    generateMorningBriefing: (storeName, yesterdaySales, goal, vendors) => {
        const vendorList = vendors.map(v => 
            `- @${v.phone || v.name}: Vendió $${v.sales_yesterday || 0} (Meta diaria: $${v.daily_goal})`
        ).join('\n');

        const systemPrompt = `Eres el asistente de gestión de ventas de ${storeName}. 
Tu objetivo es motivar al equipo de vendedores de forma individual y enérgica. 
Usa un lenguaje profesional pero cercano, con muchos emojis y menciones con @. 
Destaca los logros de ayer y recuerda la meta del equipo.`;

        const userPrompt = `REPORTE DE VENTAS DE AYER:
Total Ventas Ayer: $${yesterdaySales}
Meta Global: $${goal}

RENDIMIENTO INDIVIDUAL:
${vendorList}

INSTRUCCIÓN:
1. Redacta un mensaje que comience saludando al equipo.
2. Resume el rendimiento global de ayer vs la meta.
3. Menciona a cada vendedor con @ y dale un mensaje motivacional PERSONALIZADO basado en sus ventas vs su meta diaria.
4. Termina con un grito de guerra para hoy.
5. El mensaje debe ser impactante y visualmente ordenado.`;

        return { systemPrompt, userPrompt };
    },

    /**
     * Prompt para Normalización de Direcciones: Extrae datos estructurados de una dirección.
     */
    generateAddressNormalization: (rawAddress) => {
        const systemPrompt = `Eres un experto en logística y geocodificación.
Tu tarea es extraer datos estructurados de una dirección de entrega en formato JSON.
Si faltan datos críticos (Calle, Ciudad o Teléfono), responde pidiendo la información faltante.`;

        const userPrompt = `DIRECCIÓN RAW:
"${rawAddress}"

INSTRUCCIÓN:
Extrae los siguientes campos en formato JSON: calle, numero, ciudad, cp, telefono, referencias.
Si la información es insuficiente para una entrega segura, responde con un mensaje amigable solicitando los datos faltantes.`;

        return { systemPrompt, userPrompt };
    }
};
