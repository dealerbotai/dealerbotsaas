import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cleanup - Limpia rastros de Puppeteer y archivos obsoletos
 */
const foldersToClean = [
  'node_modules',
  'package-lock.json',
  '.wwebjs_auth',
  '.wwebjs_cache',
  'auth_info_baileys'
];

console.log('🧹 [CLEANUP] Iniciando limpieza profunda...');

foldersToClean.forEach(folder => {
  const p = path.join(__dirname, folder);
  if (fs.existsSync(p)) {
    try {
      console.log(`🗑️  Eliminando: ${folder}`);
      fs.rmSync(p, { recursive: true, force: true });
    } catch (e) {
      console.error(`❌ Error eliminando ${folder}: ${e.message}`);
    }
  }
});

console.log('✅ [CLEANUP] Finalizada. Listo para instalación limpia.');
