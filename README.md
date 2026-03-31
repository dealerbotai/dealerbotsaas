# SalesBot - WhatsApp AI Sales Engine 🚀

SalesBot es una plataforma de automatización de ventas que integra la potencia de modelos de lenguaje (IA) con WhatsApp para gestionar catálogos, pedidos y atención al cliente de forma totalmente autónoma y ultrarrápida.

## 🏗️ Arquitectura (Monorepo)

Este proyecto utiliza una estructura de monorepo gestionada con **pnpm workspaces**:

- **`apps/client`**: Frontend administrativo desarrollado con React, Vite, TailwindCSS y Shadcn UI.
- **`apps/server`**: Backend de alto rendimiento en Node.js utilizando `@whiskeysockets/baileys` para una conexión binaria nativa con WhatsApp (Zero-Browser Policy).
- **`apps/landing`**: (Próximamente) Landing page de ventas de alta conversión.
- **`auth_info_baileys`**: Almacenamiento persistente de sesiones de WhatsApp (fuera del servidor para evitar reinicios).

## 🚀 Inicio Rápido

### Requisitos Previos
- [pnpm](https://pnpm.io/) instalado globalmente.
- Node.js v20 o superior.

### Instalación
```bash
pnpm install
```

### Ejecución en Desarrollo
Para lanzar el frontend y el backend simultáneamente:
```bash
pnpm run dev:all
```

## 🛠️ Funcionalidades Clave

- **Conexión Binaria Nativa**: Cero dependencia de navegadores (Puppeteer/Selenium), lo que reduce el consumo de RAM en un 90%.
- **Importación Masiva CSV**: Carga tu catálogo de productos en segundos.
- **IA Multimodal (Groq)**: Respuestas en milisegundos utilizando modelos Llama 3 de alto rendimiento.
- **WhatsApp Web Integrado**: Interfaz tipo WhatsApp oficial para intervención humana en tiempo real.
- **Comandos de Control**: Gestión de tienda mediante comandos con prefijo `.` (ej: `.inicio`, `.venta`, `.cierre`).

## 🔐 Seguridad
- **Zero-Browser Policy**: Sin motores de renderizado expuestos.
- **Persistencia Local**: Sesiones multi-dispositivo cifradas localmente.
- **Supabase**: Gestión de base de datos y autenticación segura.

---
Desarrollado con ❤️ para escalar tu negocio.
