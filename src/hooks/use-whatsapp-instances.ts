import { useState, useEffect, useCallback } from 'react';
import { api, WhatsAppInstance, GlobalSettings } from '../lib/api';
import { toast } from '../utils/toast';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

export const useWhatsApp = () => {
  const { session, user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ groq_api_key: '', ecommerce_url: '' });
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const BACKEND_URL = "http://localhost:3001";

  const fetchInstances = useCallback(async () => {
    if (!session) return;
    try {
      // This will be updated to pass the token once api is updated
      const data = await api.getInstances();
      setInstances(data);
    } catch (error) { console.error(error); }
  }, [session]);

  const fetchSettings = useCallback(async () => {
    if (!session) return;
    try {
      // This will be updated to pass the token once api is updated
      const data = await api.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) { console.error(error); }
  }, [session]);

  useEffect(() => {
    if (session) {
      const newSocket = io(BACKEND_URL, {
        auth: { token: session.access_token }
      });
      setSocket(newSocket);

      newSocket.on('message-update', fetchSettings);
      newSocket.on('ready', fetchInstances);
      newSocket.on('scope-changed', fetchInstances);
      newSocket.on('session-expired', ({ instanceId, message }) => {
        fetchInstances();
        toast.error(`La sesión de la instancia ha expirado: ${message || 'Desconectado'}`);
      });

      return () => { newSocket.close(); };
    }
  }, [session, fetchInstances, fetchSettings]);

  useEffect(() => {
    const init = async () => {
      if (user) {
        setLoading(true);
        await Promise.all([fetchInstances(), fetchSettings()]);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user, fetchInstances, fetchSettings]);

  const startLinking = (name: string) => {
    if (socket) {
      socket.emit('init-instance', { name });
      toast.info('Generando código QR...');
    }
  };

  const toggleBot = async (id: string, enabled: boolean) => {
    try {
      await api.toggleBot(id, enabled);
      setInstances((prev) =>
        prev.map((inst) => (inst.id === id ? { ...inst, bot_enabled: enabled } : inst))
      );
      toast.success(`Bot ${enabled ? 'activado' : 'desactivado'}`);
    } catch (error) { toast.error('Error al cambiar estado'); }
  };

  const deleteInstance = async (id: string) => {
    try {
      await api.deleteInstance(id);
      setInstances((prev) => prev.filter((inst) => inst.id !== id));
      toast.success('Instancia eliminada');
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const changeScope = (instanceId: string, scope: 'all' | 'groups' | 'specific') => {
    if (socket) {
      socket.emit('change-scope', { instanceId, scope });
    }
  };

  const restartInstance = (instanceId: string) => {
    if (socket) {
      socket.emit('restart-instance', { instanceId });
      toast.info('Reiniciando instancia...');
    }
  };

  const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      toast.success('Configuración actualizada');
    } catch (error) { toast.error('Error al actualizar'); }
  };

  const updateInstance = async (id: string, updates: Partial<WhatsAppInstance>) => {
    try {
      const updated = await api.updateInstance(id, updates);
      setInstances((prev) =>
        prev.map((inst) => (inst.id === id ? { ...inst, ...updated } : inst))
      );
      toast.success('Instancia actualizada');
      return updated;
    } catch (error) {
      toast.error('Error al actualizar la instancia');
      return null;
    }
  };

  const scrapeUrl = async (url: string) => {
    if (!session) return toast.error("Autenticación requerida.");
    setScraping(true);
    try {
      const response = await fetch(`${BACKEND_URL}/scrape`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) throw new Error('Error al escanear');
      
      const data = await response.json();
      setSettings((prev) => ({ ...prev, ecommerce_url: url, scraped_data: data }));
      toast.success('URL escaneada exitosamente');
      return data;
    } catch (error) { 
      toast.error('Error al escanear URL'); 
      console.error(error);
    } finally { 
      setScraping(false); 
    }
  };

  const sendMessage = (instanceId: string, to: string, message: string) => {
    if (socket) {
      socket.emit('send-message', { instanceId, to, message });
    } else {
      toast.error('Error de conexión con el servidor');
    }
  };

  const getLogs = async (instanceId?: string, contactId?: string) => {
    try {
      const result = await api.getMessageLogs(instanceId, contactId);
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('Error al obtener logs:', error);
      return [];
    }
  };

  return {
    instances,
    settings,
    loading,
    scraping,
    socket,
    startLinking,
    toggleBot,
    deleteInstance,
    updateSettings,
    scrapeUrl,
    sendMessage,
    getLogs,
    changeScope,
    restartInstance,
    updateInstance,
    refresh: fetchInstances,
  };
};
