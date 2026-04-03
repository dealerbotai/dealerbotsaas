# Reporte de Suficiencia y Pruebas del Sistema (Vitest) 🧪

Hemos configurado **Vitest** exitosamente a lo largo de los diferentes espacios de trabajo (workspaces de pnpm) para Dealerbot AI. Se establecieron las pruebas de **"suficiencia de ejecución"** (Execution Sufficiency), asegurando que el corredor de pruebas entienda la estructura, el código NodeJS, JSX, y los componentes de UI.

## 🛠 Qué se construyó

1. **Configuración de Back-end (Server)**:
   - Creado `apps/server/vitest.config.js` (Entorno Node).
   - Añadida prueba base: `server.spec.js` validando la viabilidad de NodeJS e integrando tareas `.todo` que documentan qué hace falta por asegurar.
2. **Configuración de Front-end (Client)**:
   - Creado `apps/client/vitest.config.js` con soporte para React, SWC, y JS-DOM (`environment: 'jsdom'`).
   - Integración de API estándar de Testing: `@testing-library/jest-dom/vitest`.
   - Creado inicializador global `apps/client/src/test/setup.js` (Limpia el DOM tras cada prueba).
   - Añadida prueba de suficiencia DOM: `App.test.jsx`.

## 📌 Estado de Ejecución
Con el entorno actual, al correr `pnpm test` en el _client_ o _server_, el entorno probará que las compilaciones y validaciones primarias **son viables** y el código subyacente puede evaluarse individualmente en el CI o en local sin problemas de sintaxis.

---

## 🚦 Qué Faltaría Implementar y ¿Cómo Hacerlo?

Estas son las áreas que la suite de pruebas necesita para pasar de *Suficiencia de Ejecución* a una *Completa Cobertura del Sistema*:

### 1. Pruebas de Back-end (Server)

**Lo que falta:**
- Comprobar que los Worker Threads (`baileys-worker.js`) inicializan de forma aislada.
- Probar las rutas API principales (ej. `/api/import-products`, `/api/billing/*`, Webhooks).
- Comprobar que los límites de planes (`checkPlanLimits`) restringen el acceso correctamente.

**Cómo hacerlo:**
1. **Refactorización del Listener**: Actualmente `apps/server/index.js` invoca `httpServer.listen(...)` al final del archivo. Para facilitar el test de Express con `supertest`, necesitas desacoplar esto:
   ```javascript
   // index.js
   export { app, io };
   
   // server.js (Un nuevo archivo para la ejecución real)
   import { app } from './index.js';
   app.listen(PORT, () => { ... });
   ```
2. **Uso de `supertest`**: Podrás simular las peticiones sin abrir el puerto real:
   ```javascript
   import request from 'supertest';
   import { app } from '../index.js';

   it('validates health endpoint', async () => {
     const res = await request(app).get('/health');
     expect(res.statusCode).toBe(200);
   });
   ```
3. **Mocks de Supabase**: Usar las utilidades de mockeo de vitest en tus tests para evadir base de datos de producción:
   ```javascript
   import { vi } from 'vitest';
   vi.mock('@supabase/supabase-js', () => ({
     createClient: () => ({ from: vi.fn(), select: vi.fn() })
   }));
   ```

### 2. Pruebas de Front-end (Client Componentes/Estado)

**Lo que falta:**
- Probar la interacción de Modales (Por ejemplo, generar QR falso en Vinculación).
- Probar Providers de UI (Theme, Toast, Sonner).
- Probar el flujo de TanStack Query mockeado.

**Cómo hacerlo:**
1. **Wrapper Universal**: Usa la función `render` personalizada para rodear tus componentes de sus Contextos (BrowserRouter, QueryClientProvider):
   ```javascript
   import { render } from '@testing-library/react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { BrowserRouter } from 'react-router-dom';

   const queryClient = new QueryClient();

   export function renderWithProviders(ui) {
     return render(
       <QueryClientProvider client={queryClient}>
         <BrowserRouter>{ui}</BrowserRouter>
       </QueryClientProvider>
     );
   }
   ```
2. **Utilizar MSW (Mock Service Worker)**: Para simular al backend, intercepta las llamadas tipo Fetch o WebSockets en lugar de depender que el Back-end se esté ejecutando durante la prueba del Front-end.

## Próximos Pasos 🚀
El sistema posee la infraestructura inicial necesaria probada con Vitest. Para crecer en las áreas identificadas, recomendamos adoptar el modelo TDD (Test-Driven Development) abordando cada uno de los `.todos` generados en los archivos `server.spec.js` y `App.test.jsx`.
