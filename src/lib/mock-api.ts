import { supabase } from './supabase';
import { generateAIResponse } from '@/services/ai';

export interface WhatsAppInstance {
  id: string;
  name: string;
  phone_number?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_ready';
  bot_enabled: boolean;
  last_active?: string;
  qr_code?: string;
  scope: 'all' | 'groups' | 'specific';
}

export interface ScrapedData {
  url: string;
  products: any[];
  lastScraped: string;
}

export interface GlobalSettings {
  groq_api_key: string;
  ecommerce_url: string;
  scraped_data?: ScrapedData;
}

export const mockApi = {
  getInstances: async () => {
    const { data, error } = await supabase
      .from('instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as WhatsAppInstance[];
  },

  addInstance: async (name: string) => {
    const newInstance = {
      name,
      status: 'qr_ready',
      bot_enabled: false,
      qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-whatsapp-qr-' + Date.now(),
      scope: 'all',
    };

    const { data, error } = await supabase
      .from('instances')
      .insert([newInstance])
      .select()
      .single();

    if (error) throw error;
    return data as WhatsAppInstance;
  },

  connectInstance: async (id: string) => {
    const { error } = await supabase
      .from('instances')
      .update({ 
        status: 'connected', 
        phone_number: `+52 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        last_active: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  toggleBot: async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('instances')
      .update({ bot_enabled: enabled })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  deleteInstance: async (id: string) => {
    const { error } = await supabase
      .from('instances')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  getSettings: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || { groq_api_key: '', ecommerce_url: '' };
  },

  updateSettings: async (newSettings: Partial<GlobalSettings>) => {
    const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();

    let result;
    if (existing) {
      result = await supabase
        .from('settings')
        .update(newSettings)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('settings')
        .insert([newSettings])
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return result.data;
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
    
    await mockApi.updateSettings({ ecommerce_url: url, scraped_data: mockData });
    return mockData;
  }
};