"use client";

export const generateAIResponse = async (apiKey: string, prompt: string, context: string) => {
  if (!apiKey) throw new Error("No se ha configurado la clave API de Groq");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de ventas experto para una tienda de ecommerce. 
            Tu objetivo es ayudar a los clientes a comprar productos basándote en la siguiente información de la tienda:
            ${context}
            
            Reglas:
            1. Sé amable y profesional.
            2. Si no sabes algo sobre un producto, invita al cliente a esperar a un humano.
            3. Mantén las respuestas cortas y directas para WhatsApp.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error llamando a Groq:", error);
    throw error;
  }
};