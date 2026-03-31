import { useState, useEffect, useCallback } from 'react';
import { mockApi, WhatsAppInstance, GlobalSettings, ScrapedData } from '../lib/mock-api';
import { toast } from '../utils/toast';

export const useWhatsApp = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ groqApiKey: '', ecommerceUrl: '' });
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  const fetchInstances = useCallback(async () => {
    try {
      const data = await mockApi.getInstances();
      setInstances(data);
    } catch (error) {
      toast.error('Error al obtener las instancias');
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await mockApi.getSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Error al obtener la configuración');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchInstances(), fetchSettings()]);
      setLoading(false);
    };
    init();
  }, [fetchInstances, fetchSettings]);

  const addInstance = async (name: string) => {
    try {
      const newInstance = await mockApi.addInstance(name);
      setInstances((prev) => [...prev, newInstance]);
      toast.success('Instancia añadida con éxito');
      return newInstance;
    } catch (error) {
      toast.error('Error al añadir la instancia');
      throw error;
    }
  };

  const connectInstance = async (id: string) => {
    try {
      await mockApi.connectInstance(id);
      await fetchInstances();
      toast.success('WhatsApp vinculado correctamente');
    } catch (error) {
      toast.error('Error al vincular WhatsApp');
    }
  };

  const toggleBot = async (id: string, enabled: boolean) => {
    try {
      await mockApi.toggleBot(id, enabled);
      setInstances((prev) =>
        prev.map((inst) => (inst.id === id ? { ...inst, botEnabled: enabled } : inst))
      );
      toast.success(`Bot ${enabled ? 'activado' : 'desactivado'}`);
    } catch (error) {
      toast.error('Error al cambiar el estado del bot');
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      await mockApi.deleteInstance(id);
      setInstances((prev) => prev.filter((inst) => inst.id !== id));
      toast.success('Instancia eliminada');
    } catch (error) {
      toast.error('Error al eliminar la instancia');
    }
  };

  const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
    try {
      const updated = await mockApi.updateSettings(newSettings);
      setSettings(updated);
      toast.success('Configuración actualizada');
    } catch (error) {
      toast.error('Error al actualizar la configuración');
    }
  };

  const scrapeUrl = async (url: string) => {
    setScraping(true);
    try {
      const data = await mockApi.scrapeUrl(url);
      setSettings((prev) => ({ ...prev, ecommerceUrl: url, scrapedData: data }));
      toast.success('URL escaneada con éxito');
      return data;
    } catch (error) {
      toast.error('Error al escanear la URL');
    } finally {
      setScraping(false);
    }
  };

  return {
    instances,
    settings,
    loading,
    scraping,
    addInstance,
    connectInstance,
    toggleBot,
    deleteInstance,
    updateSettings,
    scrapeUrl,
    refresh: fetchInstances,
  };
};