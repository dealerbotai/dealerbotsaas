import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const foldersToClean = [
  'node_modules',
  'package-lock.json',
  '.wwebjs_auth',
  '.wwebjs_cache',
  '.baileys_auth_*' // Los que coincidan
];

console.log('🧹 Dealerbot AI - Limpieza de Entorno (Puppeteer -> Baileys)');

foldersToClean.forEach(pattern => {
  if (pattern.includes('*')) {
    const dir = __dirname;
    const files = fs.readdirSync(dir);
    const regex = new RegExp(pattern.replace('*', '.*'));
    files.forEach(file => {
      if (regex.test(file)) {
        const fullPath = path.join(dir, file);
        console.log(`Eliminando ${file}...`);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    });
  } else {
    const fullPath = path.join(__dirname, pattern);
    if (fs.existsSync(fullPath)) {
      console.log(`Eliminando ${pattern}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
});

console.log('✨ Limpieza completa. Ahora corre: npm install && npm run dev');
