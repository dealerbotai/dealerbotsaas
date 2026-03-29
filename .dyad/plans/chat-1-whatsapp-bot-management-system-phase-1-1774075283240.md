---
title: "WhatsApp Bot Management System - Phase 1"
summary: "Build a React-based dashboard to manage multiple WhatsApp accounts with AI bots (Groq) for ecommerce sales, including QR code linking and ecommerce URL scraping configuration."
chatId: "1"
createdAt: "2026-03-21T06:41:23.239Z"
updatedAt: "2026-03-21T06:41:23.239Z"
---

## Overview
Implement Phase 1 of a WhatsApp management system that allows users to manage multiple WhatsApp accounts, each with an AI-powered bot (using Groq) to close ecommerce sales. The system will include a dashboard for account management, QR code linking, and bot configuration (including ecommerce URL scraping).

## UI/UX Design
- **Dashboard**: A grid of cards representing each WhatsApp instance. Each card shows the connection status, bot status (ON/OFF), and quick actions.
- **Instance Management**: A modal or side panel to add a new instance via QR code.
- **Global Settings**: A dedicated section to configure the Groq API Key and the Ecommerce URL.
- **Scraping Interface**: A text input for the URL with a "Scrape" button and a preview of the ingested data (products, prices, etc.).
- **Bot Configuration**: Per-instance or global settings for bot scope (All, Groups, Specific conversations).
- **Visual Style**: Modern, clean, and professional using a "Dark & Modern" or "Vibrant & Professional" theme with rounded corners and subtle animations.

## Considerations
- **WhatsApp Connection**: `whatsapp-web.js` requires a Node.js backend. Since this is a React frontend, I will simulate the backend interactions (API calls) and provide the structure for the backend logic.
- **Scraping**: Real-time scraping of random ecommerce URLs is complex due to different site structures. I'll implement a "Scraper" UI that simulates the data extraction and allows for manual refinement.
- **Groq Integration**: The bot logic will be designed to use Groq's API to process messages based on the scraped context.
- **State Management**: Use React state (or a simple store) to manage the list of instances and their configurations.

## Technical Approach
- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui.
- **Icons**: Lucide-react.
- **Animations**: Framer Motion.
- **Routing**: React Router for navigating between Dashboard, Settings, and Instance details.
- **Mock Backend**: I'll create a mock API layer to simulate the WhatsApp session management and scraping process.

## Implementation Steps

### 1. Project Setup & Layout
- Create the main layout with a sidebar for navigation.
- Set up the routing for Dashboard, Settings, and Instances.

### 2. Dashboard & Instance Management
- Build the `WhatsAppInstanceCard` component.
- Implement the "Add Instance" flow with a QR code placeholder.
- Add toggles for Bot ON/OFF and connection status indicators.

### 3. Global Settings & Scraping
- Create the `Settings` page.
- Implement the Groq API Key input.
- Build the `EcommerceScraper` component with URL input and data preview.

### 4. Bot Configuration & Scope
- Add settings for bot scope (All, Groups, Specific).
- Implement a way to select specific conversations/groups for the bot.

### 5. Mock API & Logic
- Create a `useWhatsApp` hook to manage the state of instances.
- Simulate the "Scraping" process and "Bot Response" logic.

## Code Changes

### New Components
- `src/components/layout/Sidebar.tsx`: Main navigation.
- `src/components/whatsapp/InstanceCard.tsx`: Individual WhatsApp account card.
- `src/components/whatsapp/QRCodeModal.tsx`: Modal for linking new accounts.
- `src/components/settings/ScraperSection.tsx`: Ecommerce URL scraping UI.
- `src/components/settings/GroqConfig.tsx`: Groq API configuration.

### Pages
- `src/pages/Dashboard.tsx`: Overview of all instances.
- `src/pages/Settings.tsx`: Global configuration.
- `src/pages/InstanceDetails.tsx`: Detailed view and logs for a specific instance.

### Utils/Hooks
- `src/hooks/use-whatsapp-instances.ts`: Custom hook for managing instances.
- `src/lib/mock-api.ts`: Simulated backend responses.

## Testing Strategy
- Verify that new instances can be "added" (simulated).
- Ensure the Bot ON/OFF toggle updates the state correctly.
- Test the "Scraping" UI with different URLs (simulated).
- Validate that the Groq API Key and other settings are saved.
- Check responsiveness on mobile and desktop.
