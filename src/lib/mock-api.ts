import { generateAIResponse } from '@/services/ai';

export interface WhatsAppInstance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_ready';
  botEnabled: boolean;
  lastActive?: string;
  qrCode?: string;
  scope: 'all' | 'groups' | 'specific';
  specificConversations?: string[];
}

export interface ScrapedData {
  url: string;
  products: {
    name: string;
    price: string;
    description: string;
  }[];
  lastScraped: string;
}

export interface GlobalSettings {
  groqApiKey: string;
  ecommerceUrl: string;
  scrapedData?: ScrapedData;
}

// Helper para persistencia local
const STORAGE_KEYS = {
  INSTANCES: 'wa_bot_instances',
  SETTINGS: 'wa_bot_settings'
};

const getStoredData = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const saveStoredData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockApi = {
  getInstances: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getStoredData<WhatsAppInstance[]>(STORAGE_KEYS.INSTANCES, []);
  },

  addInstance: async (name: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const instances = getStoredData<WhatsAppInstance[]>(STORAGE_KEYS.INSTANCES, []);
    const newInstance: WhatsAppInstance = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      status: 'qr_ready',
      botEnabled: false,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-whatsapp-qr-' + Date.now(),
      scope: 'all',
    };
    const updated = [...instances, newInstance];
    saveStoredData(STORAGE_KEYS.INSTANCES, updated);
    return newInstance;
  },

  connectInstance: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const instances = getStoredData<WhatsAppInstance[]>(STORAGE_KEYS.INSTANCES, []);
    const updated = instances.map((inst) =>
      inst.id === id 
        ? { 
            ...inst, 
            status: 'connected', 
            phoneNumber: `+52 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            lastActive: new Date().toISOString()
          } 
        : inst
    );
    saveStoredData(STORAGE_KEYS.INSTANCES, updated);
    return true;
  },

  toggleBot: async (id: string, enabled: boolean) => {
    const instances = getStoredData<WhatsAppInstance[]>(STORAGE_KEYS.INSTANCES, []);
    const updated = instances.map((inst) =>
      inst.id === id ? { ...inst, botEnabled: enabled } : inst
    );
    saveStoredData(STORAGE_KEYS.INSTANCES, updated);
    return true;
  },

  deleteInstance: async (id: string) => {
    const instances = getStoredData<WhatsAppInstance[]>(STORAGE_KEYS.INSTANCES, []);
    const updated = instances.filter((inst) => inst.id !== id);
    saveStoredData(STORAGE_KEYS.INSTANCES, updated);
    return true;
  },

  getSettings: async () => {
    return getStoredData<GlobalSettings>(STORAGE_KEYS.SETTINGS, {
      groqApiKey: '',
      ecommerceUrl: '',
    });
  },

  updateSettings: async (newSettings: Partial<GlobalSettings>) => {
    const current = getStoredData<GlobalSettings>(STORAGE_KEYS.SETTINGS, {
      groqApiKey: '',
      ecommerceUrl: '',
    });
    const updated = { ...current, ...newSettings };
    saveStoredData(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  scrapeUrl: async (url: string): Promise<ScrapedData> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const mockData: ScrapedData = {
      url,
      products: [
        { name: 'Granos de Café Premium', price: '$19.99', description: 'Granos orgánicos de tueste oscuro.' },
        { name: 'Prensa Francesa', price: '$29.99', description: 'Prensa de acero inoxidable para 8 tazas.' },
        { name: 'Molinillo de Café', price: '$45.00', description: 'Molinillo de muelas con 18 ajustes.' },
      ],
      lastScraped: new Date().toISOString(),
    };
    
    const settings = getStoredData<GlobalSettings>(STORAGE_KEYS.SETTINGS, { groqApiKey: '', ecommerceUrl: '' });
    saveStoredData(STORAGE_KEYS.SETTINGS, { ...settings, ecommerceUrl: url, scrapedData: mockData });
    
    return mockData;
  },

  // Nueva función para probar la IA
  testAI: async (message: string) => {
    const settings = getStoredData<GlobalSettings>(STORAGE_KEYS.SETTINGS, { groqApiKey: '', ecommerceUrl: '' });
    if (!settings.groqApiKey) throw new Error("Configura tu clave de Groq primero");
    
    const context = settings.scrapedData 
      ? JSON.stringify(settings.scrapedData.products) 
      : "No hay productos indexados aún.";
      
    return await generateAIResponse(settings.groqApiKey, message, context);
  }
};