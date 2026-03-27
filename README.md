# DealerBot AI - Centro de Administración Multi-Agente de WhatsApp

DealerBot AI es una plataforma empresarial avanzada para la automatización de WhatsApp, combinando inteligencia artificial (Groq Llama 3) con un motor de flujos deterministas basado en palabras clave. Diseñado para escalar, utiliza una arquitectura multi-hilo (Worker Threads) para manejar múltiples instancias de WhatsApp de forma aislada y segura.

## 🚀 Características Principales

- **Arquitectura Multi-Hilo**: Cada instancia de WhatsApp corre en su propio proceso (Worker Thread), garantizando estabilidad e independencia total.
- **Sistema de Agentes IA**: Crea agentes con personalidades únicas (Masculino, Femenino, etc.) y modos de comportamiento (Prompt libre, Cualidades predefinidas o Flujos lógicos).
- **Visual Flow Builder**: Constructor de automatizaciones estilo n8n para respuestas rápidas, condiciones lógicas y acciones de IA.
- **IA Híbrida**: Combina la potencia de Groq (Llama 3.3 70B) con flujos deterministas para optimizar costos y velocidad.
- **Escáner de Ecommerce**: Capacidad de leer catálogos de sitios web para entrenar al bot automáticamente con tus productos.
- **Multi-Tenancy (Workspaces)**: Soporte para múltiples espacios de trabajo, permitiendo separar clientes o departamentos.
- **Seguridad Bancaria**: Claves API encriptadas con AES-256 (local y en base de datos).

***

## 🛠️ Requisitos Previos

- **Node.js**: v18 o superior.
- **Supabase**: Proyecto configurado con las tablas necesarias.
- **Groq API Key**: Para el motor de inteligencia artificial de alta velocidad.

***

## ⚙️ Configuración del Entorno

### 1. Variables de Envío (`.env`)

Crea un archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
SUPABASE_URL=tu_url_de_supabase (backend)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase (backend)

# Inteligencia Artificial
GROQ_API_KEY=tu_api_key_de_groq

# Seguridad
ENCRYPTION_KEY=una_clave_de_32_caracteres_aleatorios (AES-256)

# Servidor
PORT=3001
```

### 2. Configuración de la Base de Datos

Utiliza el archivo `supabase_setup.sql` incluido en la raíz para configurar todas las tablas necesarias, incluyendo:
- `workspaces` y `workspace_members`
- `instances` (Instancias de WhatsApp)
- `agents` (Personalidades IA)
- `flows` (Automatizaciones Visuales)
- `chats` y `messages` (Historial normalizado)
- `settings` (Configuración global)

***

## 🏃 Cómo Ejecutar el Sistema

### 1. Instalación de Dependencias

Desde la raíz del proyecto:
```bash
npm install
cd server
npm install
cd ..
```

### 2. Iniciar el Backend (Servidor Nexus)

```bash
cd server
node index.js
```

### 3. Iniciar el Frontend (Interfaz Aurora)

En una nueva terminal, desde la raíz:
```bash
npm run dev
```

***

## 📖 Guía de Operación

1. **Dashboard**: Monitorea el estado del servidor, latencia de IA y métricas de mensajes en tiempo real.
2. **Vincular WhatsApp**: Escanea el código QR generado para cada instancia. El sistema soporta múltiples cuentas simultáneas.
3. **Agentes IA**: Define quién responde. Puedes crear un agente "Vendedor Estrella" con cualidades como "Persuasivo" y "Profesional".
4. **Flujos Lógicos**: Usa el constructor visual para definir respuestas automáticas a palabras clave (ej: "precio", "envío") y ahorrar tokens de IA.
5. **Configuración & Scraping**: Ingresa la URL de tu tienda y deja que el bot aprenda sobre tus productos en segundos.

***

## 🔄 Arquitectura de Estados

| Estado         | Descripción                                          |
| :------------- | :--------------------------------------------------- |
| `connecting`   | Iniciando worker y cargando Puppeteer.               |
| `qr_ready`     | QR generado y listo para ser escaneado en la UI.     |
| `connected`    | Sesión activa y funcional.                           |
| `expired`      | Sesión cerrada o fallo de autenticación.             |
| `disconnected` | El worker se ha detenido.                            |

***

## 🧪 Pruebas y Diagnóstico

El sistema incluye una herramienta de diagnóstico de conectividad (Plan B) que valida periódicamente el estado de la sesión y permite realizar pruebas de auto-envío desde la UI.

© 2026 DealerBot AI - Inteligencia de Ventas y Logística para WhatsApp.
