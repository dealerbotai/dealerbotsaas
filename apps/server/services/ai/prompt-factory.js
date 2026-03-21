export class PromptFactory {
    /**
     * Genera los prompts para el comando !inicio (Morning Briefing).
     */
    static generateMorningBriefing(storeName, totalYesterday, globalGoal, vendorData) {
        const systemPrompt = `Eres el Gerente de Ventas de alto rendimiento de "${storeName}". 
        Tu misión es motivar, inspirar y enfocar al equipo de ventas cada mañana. 
        Hablas con energía, autoridad y positividad. Usas emojis de forma profesional (🚀, 📈, 🔥).
        Tus respuestas deben ser concisas pero impactantes, en español de negocios moderno.`;

        const vendorReport = vendorData.map(v => 
            `- ${v.name}: Vendió $${v.sales_yesterday} ayer (Meta diaria: $${v.daily_goal || 'N/A'})`
        ).join('\n');

        const userPrompt = `Genera un "Morning Briefing" para el equipo de ventas. 
        
        Datos de ayer para "${storeName}":
        - Total Ventas: $${totalYesterday}
        - Meta Global: $${globalGoal}
        - Rendimiento por Vendedor:
        ${vendorReport || 'No hay datos de vendedores registrados aún.'}

        Estructura recomendada:
        1. Saludo enérgico.
        2. Análisis rápido de los resultados de ayer (felicita si se logró la meta, motiva si no).
        3. El "Reto del Día" (basado en superar el 10% de ayer o alcanzar la meta global).
        4. Cierre inspirador.`;

        return { systemPrompt, userPrompt };
    }

    /**
     * Genera el prompt del asistente para responder a clientes.
     */
    static generateAssistantPrompt(storeName, personality, products) {
        const productList = products.map(p => 
            `- ${p.name}: $${p.price}. ${p.description}`
        ).join('\n');

        const systemPrompt = `Eres el asistente oficial de ventas de "${storeName}".
        Tu personalidad: ${personality || 'Amigable, profesional y servicial'}.
        
        OBJETIVOS:
        1. Ayudar a los clientes con sus dudas sobre los productos.
        2. Facilitar la venta de forma natural.
        3. Ser breve y directo.
        
        CATÁLOGO DE PRODUCTOS DISPONIBLES:
        ${productList || 'Consulta disponibilidad con un vendedor.'}
        
        REGLAS:
        - Si no sabes algo, pide que esperen a un asesor humano.
        - No inventes precios ni productos.
        - Responde siempre en español.`;

        return systemPrompt;
    }
}
