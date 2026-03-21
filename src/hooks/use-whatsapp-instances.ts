
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
      toast.error('Failed to fetch instances');
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await mockApi.getSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to fetch settings');
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
      toast.success('Instance added successfully');
      return newInstance;
    } catch (error) {
      toast.error('Failed to add instance');
    }
  };

  const toggleBot = async (id: string, enabled: boolean) => {
    try {
      await mockApi.toggleBot(id, enabled);
      setInstances((prev) =>
        prev.map((inst) => (inst.id === id ? { ...inst, botEnabled: enabled } : inst))
      );
      toast.success(`Bot ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle bot');
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      await mockApi.deleteInstance(id);
      setInstances((prev) => prev.filter((inst) => inst.id !== id));
      toast.success('Instance deleted');
    } catch (error) {
      toast.error('Failed to delete instance');
    }
  };

  const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
    try {
      const updated = await mockApi.updateSettings(newSettings);
      setSettings(updated);
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const scrapeUrl = async (url: string) => {
    setScraping(true);
    try {
      const data = await mockApi.scrapeUrl(url);
      setSettings((prev) => ({ ...prev, ecommerceUrl: url, scrapedData: data }));
      toast.success('URL scraped successfully');
      return data;
    } catch (error) {
      toast.error('Failed to scrape URL');
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
    toggleBot,
    deleteInstance,
    updateSettings,
    scrapeUrl,
    refresh: fetchInstances,
  };
};
