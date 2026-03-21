# Sistema de Gestión de Bots de WhatsApp (AI Sales Assistant)

Este proyecto es una plataforma avanzada para la gestión de múltiples instancias de WhatsApp automatizadas con Inteligencia Artificial. Está diseñado para ayudar a tiendas de ecommerce a automatizar sus ventas y atención al cliente mediante el uso de modelos de lenguaje de alto rendimiento (Groq AI) y un escáner de productos integrado.

## 🚀 Funcionalidades Principales

- **Gestión Multi-Instancia**: Conecta y administra múltiples cuentas de WhatsApp desde un solo panel centralizado.
- **Vinculación por QR**: Proceso de conexión nativo mediante escaneo de código QR, similar a WhatsApp Web.
- **Integración con Groq AI**: Utiliza la API de Groq para obtener respuestas ultra rápidas y naturales, entrenadas específicamente para ventas.
- **Escáner de Ecommerce**: Herramienta integrada que extrae automáticamente productos, precios y descripciones de cualquier URL de tienda para alimentar la base de conocimientos del bot.
- **Control de Alcance**: Configura si el bot debe responder en chats individuales, grupos o conversaciones específicas.
- **Panel de Estadísticas**: Visualiza el estado de tus instancias, bots activos y volumen de mensajes procesados.
- **Diseño Premium**: Interfaz moderna, responsiva y optimizada para una experiencia de usuario fluida tanto en escritorio como en móviles.

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 con TypeScript.
- **Estilos**: Tailwind CSS para un diseño moderno y adaptable.
- **Componentes**: shadcn/ui (basado en Radix UI) para una interfaz consistente y accesible.
- **Iconografía**: Lucide React.
- **Animaciones**: Framer Motion para transiciones suaves.
- **Estado y Datos**: React Query para la gestión de datos y Hooks personalizados para la lógica de negocio.

## 📋 Guía de Operación

Para poner el sistema en funcionamiento, sigue estos pasos dentro de la aplicación:

### 1. Configuración de la IA
Dirígete a la sección de **Configuración** y en la pestaña **General**:
- Introduce tu **Clave API de Groq**. Esta clave es necesaria para que el bot pueda procesar el lenguaje natural y responder a los clientes.

### 2. Entrenamiento del Bot (Escáner)
En la misma sección de **Configuración**, ve a la pestaña **Escáner**:
- Introduce la URL de tu tienda online (ej. `https://tu-tienda.com`).
- Haz clic en **Iniciar Escaneo**. El sistema indexará tus productos para que el bot sepa qué estás vendiendo y a qué precio.

### 3. Vinculación de WhatsApp
Vuelve al **Panel de Control**:
- Haz clic en **Añadir Nueva Instancia**.
- Dale un nombre (ej. "Ventas México").
- Escanea el código QR generado con tu aplicación de WhatsApp (Dispositivos vinculados > Vincular un dispositivo).

### 4. Activación
Una vez vinculada la instancia:
- Activa el interruptor de **Estado del Bot** en la tarjeta de la instancia.
- ¡Listo! Tu bot comenzará a responder automáticamente a las consultas de tus clientes basándose en la información de tu tienda.

## 📂 Estructura del Proyecto

- `src/pages/`: Contiene las vistas principales (Dashboard, Configuración, Detalles).
- `src/components/`: Componentes reutilizables divididos por funcionalidad (layout, whatsapp, settings).
- `src/hooks/`: Lógica personalizada para la gestión de instancias y datos.
- `src/lib/`: Utilidades y simulaciones de API.