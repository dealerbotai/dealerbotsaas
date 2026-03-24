# Nexus Aurora - Centro de Administración Multi-Agente de WhatsApp

Nexus Aurora es una plataforma empresarial avanzada para la automatización de WhatsApp, combinando inteligencia artificial (Groq Llama 3) con un motor de flujos deterministas basado en palabras clave. Diseñado para escalar, utiliza una arquitectura multi-hilo (Worker Threads) para manejar múltiples instancias de WhatsApp de forma aislada y segura.no hubo pruebas? 

## 🚀 Características Principales

- **Arquitectura Multi-Hilo**: Cada instancia de WhatsApp corre en su propio proceso (Worker Thread), garantizando estabilidad.
- **IA Híbrida**: Combina la potencia de Groq (Llama 3.3 70B) con flujos de respuesta rápida basados en palabras clave.
- **Seguridad Bancaria**: Claves API encriptadas con AES-256 antes de ser almacenadas en la base de datos.
- **Visual Flow Builder**: Constructor de automatizaciones para respuestas instantáneas.
- **Escaneo de Ecommerce**: Capacidad de leer catálogos de sitios web para entrenar al bot automáticamente.

***

## 🛠️ Requisitos Previos

- **Node.js**: v18 o superior.
- **Supabase**: Una cuenta activa y un proyecto creado.
- **Groq API Key**: Para el motor de inteligencia artificial.

***

## ⚙️ Configuración del Entorno

### 1. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto y configura las siguientes variables:

```env
# Supabase (Frontend & Backend)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase (solo para el servidor)

# Inteligencia Artificial
GROQ_API_KEY=tu_api_key_de_groq

# Seguridad
ENCRYPTION_KEY=una_clave_de_32_caracteres_aleatorios (AES-256)

# Servidor
PORT=3001
```

### 2. Configuración de la Base de Datos (Supabase SQL)

Ejecuta el siguiente script en el Editor SQL de tu panel de Supabase para preparar las tablas necesarias:

```sql
-- Tabla de Instancias de WhatsApp
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected',
  bot_enabled BOOLEAN DEFAULT false,
  scope TEXT DEFAULT 'all',
  personality TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Configuración Global y Scraper
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  groq_api_key TEXT, -- Se almacenará encriptada
  ecommerce_url TEXT,
  scraped_data JSONB,
  personality TEXT,
  total_messages INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Logs de Chat
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  type TEXT, -- 'msg' o 'bot'
  sender_name TEXT,
  text TEXT,
  from_me BOOLEAN,
  contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Flujos de Automatización
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

***

## 🏃 Cómo Ejecutar el Sistema

### 1. Instalación de dependencias

Desde la raíz del proyecto:

```bash
npm install
```

### 2. Iniciar el Servidor (Backend)

Navega a la carpeta del servidor e inicia el proceso:

```bash
cd server
npm install
node index.js
```

### 3. Iniciar la Interfaz (Frontend)

En una nueva terminal, desde la raíz del proyecto:

```bash
npm run dev
```

***

## 📖 Guía de Operación

1. **Login**: Accede con tu cuenta de Supabase.
2. **Vincular WhatsApp**: Ve al Panel de Control, haz clic en "Añadir Nueva Instancia" y escanea el código QR con tu teléfono.
3. **Configurar IA**: En "Configuración", añade tu API Key de Groq (se encriptará automáticamente) y la URL de tu tienda si deseas que el bot aprenda tus productos.
4. **Crear Flujos**: En "Flujos IA", define palabras clave disparadoras (ej: "hola", "precio") y sus respuestas automáticas para ahorrar tokens de IA.
5. **Monitoreo**: Supervisa los mensajes en tiempo real desde los detalles de cada instancia.

***

## 🔄 Flujo de Estados de Instancia

El sistema gestiona los siguientes estados para cada instancia de WhatsApp:

| Estado         | Descripción                                          | Transición                                          |
| :------------- | :--------------------------------------------------- | :-------------------------------------------------- |
| `connecting`   | Iniciando worker y cargando Puppeteer.               | Automático al iniciar instancia.                    |
| `qr_ready`     | QR generado y listo para ser escaneado.              | Se muestra el modal de QR en UI.                    |
| `connected`    | Sesión activa y funcional.                           | Tras escaneo exitoso o carga de sesión persistente. |
| `expired`      | Sesión cerrada, fallo de auth o diagnóstico fallido. | Requiere re-vinculación manual del usuario.         |
| `disconnected` | El worker se ha detenido o ha fallado críticamente.  | Puede intentar reinicio automático o manual.        |

**Mecanismo de Sincronización:**

- **Socket.io**: Notificaciones push inmediatas para cambios de estado (QR, Ready, Expired).
- **Heartbeat (15s)**: El frontend valida el estado contra la base de datos cada 15 segundos para garantizar consistencia.

***

## 🧪 Pruebas

Para ejecutar la suite de pruebas unitarias y de cobertura:

```bash
npm test
npm run test:coverage
```

***

© 2026 Nexus Aurora - Sistema de Gestión Inteligente de Logística y Ventas.
