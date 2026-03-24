const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' }); // Usar el .env de la raíz donde encontré la clave

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://mnlqbmpbyybsfxtjjalb.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHFibXBieXlic2Z4dGpqYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjI3NzIsImV4cCI6MjA4ODkzODc3Mn0.yq9_PFpCapgL0bFCsu5X8JEZMNdaImD7nCAl5OsYTL0";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAIResponse() {
  console.log("--- PRUEBA DE IA (SIMULACIÓN) ---");
  
  try {
    // 1. Obtener Settings
    const { data: settings } = await supabase.from('settings').select('*').maybeSingle();
    const apiKey = settings.groq_api_key;
    const context = JSON.stringify(settings.scraped_data?.products || []);

    if (!apiKey) throw new Error("API Key no encontrada en DB");

    console.log("📤 Enviando pregunta a Groq: '¿Qué productos tienes?'");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de ventas experto. Contexto: ${context}`
          },
          { role: "user", content: "¿Qué productos tienes?" }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      console.log("\n✅ ¡ÉXITO! Respuesta de la IA:");
      console.log(`🤖 "${data.choices[0].message.content}"`);
    } else {
      console.log("\n❌ Error en la respuesta de Groq:", JSON.stringify(data));
    }
  } catch (e) {
    console.error("\n❌ Error en la prueba:", e.message);
  }
}

testAIResponse();
