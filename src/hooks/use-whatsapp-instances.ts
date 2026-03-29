import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { socket } from '@/lib/socket';
import { toast } from 'sonner';

export interface Store {
    id: string;
    name: string;
    workspace_id: string;
    created_at: string;
}

export interface WhatsAppInstance {
    id: string;
    name: string;
    status: 'initializing' | 'qr_ready' | 'connected' | 'disconnected' | 'expired' | 'loading';
    bot_enabled: boolean;
    phone_number?: string;
    last_connected_at?: string;
    workspace_id: string;
    qr?: string;
    scope?: 'all' | 'groups' | 'specific';
    agent_id?: string | null;
    store_id?: string | null;
    agent?: AIAgent;
    store?: Store;
}

export interface GlobalSettings {
    groqApiKey: string;
    ecommerceUrl: string;
    scrapedData?: any;
    globalPersonality?: string;
}

export interface AIAgent {
    id: string;
    name: string;
    prompt_text: string;
    workspace_id: string;
    created_at?: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image_base64?: string;
    is_active: boolean;
    url?: string;
    store_id?: string;
    workspace_id: string;
    created_at: string;
}

export const useWhatsApp = () => {
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [agents, setAgents] = useState<AIAgent[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [settings, setSettings] = useState<GlobalSettings>({ groqApiKey: '', ecommerceUrl: '' });
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);

    const getWorkspaceId = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: member, error } = await supabase
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', user.id)
                .single();
            
            if (error || !member) return null;
            return member.workspace_id;
        } catch (e: any) {
            return null;
        }
    }, []);

    const fetchInstances = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('instances')
                .select('*, agent:agents(*), store:stores(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInstances(data || []);
        } catch (error: any) {
            toast.error('Error al obtener instancias: ' + error.message);
        }
    }, []);

    const fetchAgents = useCallback(async () => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) return;

            const { data, error } = await supabase
                .from('agents')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAgents(data || []);
        } catch (error: any) {
            console.error('Error al obtener agentes:', error.message);
        }
    }, [getWorkspaceId]);

    const fetchStores = useCallback(async () => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) return;

            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStores(data || []);
        } catch (error: any) {
            console.error('Error al obtener tiendas:', error.message);
        }
    }, [getWorkspaceId]);

    const fetchSettings = useCallback(async () => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) return;

            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('workspace_id', workspaceId)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setSettings({
                    groqApiKey: data.groq_api_key_encrypted || '',
                    ecommerceUrl: data.ecommerce_url || '',
                    scrapedData: data.scraped_data || {},
                    globalPersonality: data.global_personality || ''
                });
            }
        } catch (error: any) {
            console.error('Error al obtener settings:', error.message);
        }
    }, [getWorkspaceId]);

    useEffect(() => {
        const handleStatusUpdate = (data: { instanceId: string; status: WhatsAppInstance['status']; error?: string }) => {
            setInstances(prev => prev.map(inst => 
                inst.id === data.instanceId ? { ...inst, status: data.status } : inst
            ));
            if (data.error) toast.error(`Error en instancia: ${data.error}`);
        };

        const handleQR = (data: { tempId: string; qr: string }) => {
            setInstances(prev => prev.map(inst => 
                inst.id === data.tempId ? { ...inst, status: 'qr_ready', qr: data.qr } : inst
            ));
        };

        const handleReady = (data: { instanceId: string; phoneNumber?: string }) => {
            setInstances(prev => prev.map(inst => 
                inst.id === data.instanceId ? { ...inst, status: 'connected', phone_number: data.phoneNumber } : inst
            ));
            toast.success('WhatsApp conectado correctamente.');
        };

        socket.on('instance-status-update', handleStatusUpdate);
        socket.on('qr', handleQR);
        socket.on('ready', handleReady);

        return () => {
            socket.off('instance-status-update', handleStatusUpdate);
            socket.off('qr', handleQR);
            socket.off('ready', handleReady);
        };
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchInstances(), fetchSettings(), fetchAgents(), fetchStores()]);
            setLoading(false);
        };
        init();
    }, [fetchInstances, fetchSettings, fetchAgents, fetchStores]);

    const addStore = async (name: string) => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) throw new Error('No se encontró un Workspace activo');

            const { data, error } = await supabase
                .from('stores')
                .insert([{ name, workspace_id: workspaceId }])
                .select()
                .single();

            if (error) throw error;
            setStores(prev => [data, ...prev]);
            toast.success('Tienda creada correctamente');
            return data;
        } catch (error: any) {
            toast.error('Error al crear tienda: ' + error.message);
        }
    };

    const deleteStore = async (id: string) => {
        try {
            const { error } = await supabase.from('stores').delete().eq('id', id);
            if (error) throw error;
            setStores(prev => prev.filter(s => s.id !== id));
            toast.success('Tienda eliminada');
        } catch (error: any) {
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const assignStore = async (instanceId: string, storeId: string | null) => {
        try {
            const { error } = await supabase
                .from('instances')
                .update({ store_id: storeId })
                .eq('id', instanceId);

            if (error) throw error;
            
            const storeObj = stores.find(s => s.id === storeId);
            setInstances(prev => prev.map(inst => 
                inst.id === instanceId ? { ...inst, store_id: storeId, store: storeObj } : inst
            ));
            
            toast.success('Tienda asignada con éxito');
        } catch (error: any) {
            toast.error('Error al asignar tienda: ' + error.message);
        }
    };

    const addAgent = async (name: string, promptText: string) => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) throw new Error('No se encontró un Workspace activo');

            const { data, error } = await supabase
                .from('agents')
                .insert([{ name, prompt_text: promptText, workspace_id: workspaceId }])
                .select()
                .single();

            if (error) throw error;
            setAgents(prev => [data, ...prev]);
            toast.success('Agente IA creado correctamente');
            return data;
        } catch (error: any) {
            toast.error('Error al crear agente: ' + error.message);
        }
    };

    const deleteAgent = async (id: string) => {
        try {
            const { error } = await supabase.from('agents').delete().eq('id', id);
            if (error) throw error;
            setAgents(prev => prev.filter(a => a.id !== id));
            toast.success('Agente eliminado');
        } catch (error: any) {
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const assignAgent = async (instanceId: string, agentId: string | null) => {
        try {
            const { error } = await supabase
                .from('instances')
                .update({ agent_id: agentId })
                .eq('id', instanceId);

            if (error) throw error;
            
            const agentObj = agents.find(a => a.id === agentId);
            setInstances(prev => prev.map(inst => 
                inst.id === instanceId ? { ...inst, agent_id: agentId, agent: agentObj } : inst
            ));
            
            toast.success('Agente asignado con éxito');
        } catch (error: any) {
            toast.error('Error al asignar agente: ' + error.message);
        }
    };

    const addInstance = async (name: string) => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) throw new Error('No se encontró un Workspace activo');

            const { data, error } = await supabase
                .from('instances')
                .insert([{
                    name,
                    workspace_id: workspaceId,
                    status: 'disconnected',
                    bot_enabled: true
                }])
                .select()
                .single();

            if (error) throw error;
            setInstances(prev => [data, ...prev]);
            socket.emit('start-instance', { instanceId: data.id, name });
            return data;
        } catch (error: any) {
            toast.error('Error al crear instancia: ' + error.message);
        }
    };

    const startInstance = useCallback((id: string, name: string) => {
        socket.emit('register-instance', { instanceId: id });
        socket.emit('start-instance', { instanceId: id, name });
        setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, status: 'initializing' } : inst));
        toast.info(`Iniciando motor para "${name}"...`);
    }, []);

    const toggleBot = async (id: string, enabled: boolean) => {
        try {
            const { error } = await supabase
                .from('instances')
                .update({ bot_enabled: enabled })
                .eq('id', id);

            if (error) throw error;
            setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, bot_enabled: enabled } : inst));
            toast.success(`Bot ${enabled ? 'activado' : 'desactivado'}`);
        } catch (error: any) {
            toast.error('Error al cambiar estado: ' + error.message);
        }
    };

    const deleteInstance = async (id: string) => {
        try {
            const { error } = await supabase.from('instances').delete().eq('id', id);
            if (error) throw error;
            setInstances(prev => prev.filter(inst => inst.id !== id));
            toast.success('Instancia eliminada');
        } catch (error: any) {
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) throw new Error('No se encontró un Workspace activo');

            const mapping: any = {};
            if (newSettings.groqApiKey !== undefined) mapping.groq_api_key_encrypted = newSettings.groqApiKey;
            if (newSettings.ecommerceUrl !== undefined) mapping.ecommerce_url = newSettings.ecommerceUrl;
            if (newSettings.globalPersonality !== undefined) mapping.global_personality = newSettings.globalPersonality;

            const { error } = await supabase
                .from('settings')
                .upsert({ ...mapping, workspace_id: workspaceId }, { onConflict: 'workspace_id' });

            if (error) throw error;
            setSettings(prev => ({ ...prev, ...newSettings }));
            toast.success('Configuración guardada');
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        }
    };

    const scrapeUrl = async (url: string, storeId?: string) => {
        setScraping(true);
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) throw new Error('No se encontró un Workspace activo');

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, workspaceId, storeId })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error en el servidor');

            toast.success(`Escaneo completado.`);
            setSettings(prev => ({ ...prev, ecommerceUrl: url }));
        } catch (error: any) {
            toast.error('Error al escanear: ' + error.message);
        } finally {
            setScraping(false);
        }
    };

    const addProductManually = async (product: Partial<Product>) => {
        try {
            const workspaceId = await getWorkspaceId();
            if (!workspaceId) throw new Error('No se encontró un Workspace activo');

            const { data, error } = await supabase
                .from('products')
                .insert([{ ...product, workspace_id: workspaceId, is_active: true }])
                .select()
                .single();

            if (error) throw error;
            toast.success('Producto añadido manualmente');
            return data;
        } catch (error: any) {
            toast.error('Error al añadir producto: ' + error.message);
        }
    };

    return {
        instances,
        agents,
        stores,
        settings,
        loading,
        scraping,
        addInstance,
        startInstance,
        toggleBot,
        deleteInstance,
        updateSettings,
        scrapeUrl,
        addAgent,
        deleteAgent,
        assignAgent,
        addStore,
        deleteStore,
        assignStore,
        addProductManually,
        refresh: fetchInstances
    };
};