import { supabase } from './supabase';

export interface WhatsAppInstance {
  id: string;
  name: string;
  phone_number?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_ready' | 'expired';
  bot_enabled: boolean;
  last_active?: string;
  qr_code?: string;
  scope: 'all' | 'groups' | 'specific';
  personality?: string;
  agent_id?: string;
}

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  gender: 'masculino' | 'femenino' | 'no_binario' | 'otro';
  personality_mode: 'prompt' | 'qualities' | 'flow';
  prompt_text?: string;
  selected_qualities: string[];
  flow_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface ScrapedData {
  url: string;
  products: any[];
  lastScraped: string;
}

export interface GlobalSettings {
  groq_api_key_encrypted?: string;
  ecommerce_url: string;
  scraped_data?: ScrapedData;
  total_messages?: number;
  global_personality?: string;
}

export const api = {
  getInstances: async () => {
    const { data, error } = await supabase
      .from('instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as WhatsAppInstance[];
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

  updateInstance: async (id: string, updates: Partial<WhatsAppInstance>) => {
    const { data, error } = await supabase
      .from('instances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as WhatsAppInstance;
  },

  getAgents: async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Agent[];
  },

  createAgent: async (agent: Partial<Agent>) => {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  updateAgent: async (id: string, updates: Partial<Agent>) => {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  deleteAgent: async (id: string) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  getSettings: async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener configuración');
      }
      return await response.json();
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  },

  updateSettings: async (newSettings: Partial<GlobalSettings>, token: string) => {
    const response = await fetch('http://localhost:3001/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newSettings)
    });

    if (!response.ok) throw new Error('Error al actualizar configuración');
    return await response.json();
  },

  getMessageLogs: async (instanceId?: string, contactId?: string) => {
    let query = supabase
      .from('messages')
      .select('*, chat:chats!inner(*)')
      .order('created_at', { ascending: false });
    
    if (instanceId) {
      query = query.eq('chat.instance_id', instanceId);
    }
    if (contactId) {
      query = query.eq('chat.external_id', contactId);
    }

    const { data, error } = await query.limit(50);
    if (error) {
      console.error('Supabase Query Error (messages):', error);
      throw error;
    }
    
    return data.map((m: any) => ({
      ...m,
      instance_id: m.chat.instance_id,
      contact_id: m.chat.external_id,
      text: m.content,
      type: m.type
    }));
  },
};