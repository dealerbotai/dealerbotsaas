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

const MOCK_INSTANCES: WhatsAppInstance[] = [
  {
    id: '1',
    name: 'Bot de Ventas - Principal',
    phoneNumber: '+1234567890',
    status: 'connected',
    botEnabled: true,
    lastActive: new Date().toISOString(),
    scope: 'all',
  },
  {
    id: '2',
    name: 'Bot de Soporte - Grupos',
    phoneNumber: '+0987654321',
    status: 'disconnected',
    botEnabled: false,
    scope: 'groups',
  },
];

let instances = [...MOCK_INSTANCES];
let settings: GlobalSettings = {
  groqApiKey: '',
  ecommerceUrl: '',
};

export const mockApi = {
  getInstances: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...instances];
  },
  addInstance: async (name: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newInstance: WhatsAppInstance = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      status: 'qr_ready',
      botEnabled: false,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-whatsapp-qr',
      scope: 'all',
    };
    instances.push(newInstance);
    return newInstance;
  },
  toggleBot: async (id: string, enabled: boolean) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    instances = instances.map((inst) =>
      inst.id === id ? { ...inst, botEnabled: enabled } : inst
    );
    return true;
  },
  deleteInstance: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    instances = instances.filter((inst) => inst.id !== id);
    return true;
  },
  getSettings: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...settings };
  },
  updateSettings: async (newSettings: Partial<GlobalSettings>) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    settings = { ...settings, ...newSettings };
    return settings;
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
    settings.scrapedData = mockData;
    settings.ecommerceUrl = url;
    return mockData;
  },
};