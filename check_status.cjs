const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || "https://mnlqbmpbyybsfxtjjalb.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHFibXBieXlic2Z4dGpqYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjI3NzIsImV4cCI6MjA4ODkzODc3Mn0.yq9_PFpCapgL0bFCsu5X8JEZMNdaImD7nCAl5OsYTL0";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
  console.log("--- AUDITORÍA DE CONFIGURACIÓN ---");

  // 1. Comprobar Instancias
  const { data: instances, error: instError } = await supabase.from('instances').select('name, bot_enabled, status');
  if (instError) {
    console.error("❌ Error al leer instancias:", instError.message);
  } else {
    console.log(`\n1. INSTANCIAS (${instances.length}):`);
    instances.forEach(i => {
      const statusIcon = i.bot_enabled ? "✅ ACTIVO" : "❌ DESACTIVADO";
      console.log(`   - [${i.name}]: Bot está ${statusIcon} (Estado: ${i.status})`);
    });
    if (instances.length === 0) console.log("   ⚠️ No hay instancias creadas.");
  }

  // 2 y 3. Comprobar Settings (API Key y Scraped Data)
  const { data: settings, error: settError } = await supabase.from('settings').select('*').maybeSingle();
  if (settError) {
    console.error("\n❌ Error al leer configuración:", settError.message);
  } else if (!settings) {
    console.log("\n⚠️ No se encontró ninguna configuración global en la tabla 'settings'.");
  } else {
    console.log("\n2. CONFIGURACIÓN GLOBAL:");
    const keyStatus = settings.groq_api_key ? "✅ Configurada" : "❌ NO CONFIGURADA";
    console.log(`   - API Key de Groq: ${keyStatus}`);

    console.log("\n3. DATOS DE PRODUCTOS (Scraping):");
    if (settings.scraped_data && settings.scraped_data.products && settings.scraped_data.products.length > 0) {
      console.log(`   - ✅ Encontrados ${settings.scraped_data.products.length} productos escaneados.`);
      console.log(`   - URL origen: ${settings.ecommerce_url || 'No especificada'}`);
    } else {
      console.log("   - ❌ No hay datos de productos. El bot no tendrá contexto para responder.");
    }
  }
}

checkConfig();
