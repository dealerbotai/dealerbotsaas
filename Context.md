\# Contexto del Proyecto: WhatsApp Bot (Baileys)



\## Stack Tecnológico

\- \*\*Runtime:\*\* Node.js (TypeScript/JavaScript).

\- \*\*Librería Principal:\*\* `@whiskeysockets/baileys` (Versión Multi-Device).

\- \*\*Base de Datos:\*\* Supabase (PostgreSQL) para persistencia de estados y logs.

\- \*\*Arquitectura:\*\* Event-Driven, orientada a WebSockets.



\## Reglas de Desarrollo (Strict Policy)

1\. \*\*No Browser:\*\* Está terminantemente prohibido el uso de Puppeteer, Playwright o Selenium. Todo debe ser via Socket binario.

2\. \*\*Autenticación:\*\* Utilizar siempre `useMultiFileAuthState` para la persistencia de sesión en la carpeta `./auth\_info`.

3\. \*\*Manejo de Eventos:\*\* - Escuchar `connection.update` para gestionar reconexiones y visualización de QR en terminal.

&#x20;  - Escuchar `messages.upsert` para el procesamiento de mensajes entrantes.

&#x20;  - Escuchar `creds.update` para guardar credenciales automáticamente.

4\. \*\*Seguridad Informática:\*\* No hardcodear credenciales de Supabase o API Keys; usar variables de entorno (.env).



\## Preferencias de Código

\- Código limpio, modular y tipado (si se usa TS).

\- Priorizar el rendimiento y bajo consumo de RAM (Headless).

\- Formato de respuesta: Solo bloques de código funcionales y explicaciones concisas.

