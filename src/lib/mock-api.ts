
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
    name: 'Sales Bot - Main',
    phoneNumber: '+1234567890',
    status: 'connected',
    botEnabled: true,
    lastActive: new Date().toISOString(),
    scope: 'all',
  },
  {
    id: '2',
    name: 'Support Bot - Groups',
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
        { name: 'Premium Coffee Beans', price: '$19.99', description: 'Organic dark roast beans.' },
        { name: 'French Press', price: '$29.99', description: 'Stainless steel 8-cup press.' },
        { name: 'Coffee Grinder', price: '$45.00', description: 'Burr grinder with 18 settings.' },
      ],
      lastScraped: new Date().toISOString(),
    };
    settings.scrapedData = mockData;
    settings.ecommerceUrl = url;
    return mockData;
  },
};
