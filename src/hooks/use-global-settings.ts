import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, GlobalSettings } from '../lib/api';
import { toast } from '../utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = "http://localhost:3001";

export const useGlobalSettings = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [scraping, setScraping] = useState(false);

  const { data: settings = { groq_api_key: '', ecommerce_url: '' } } = useQuery({
    queryKey: ['settings'],
    queryFn: () => {
      if (!session) throw new Error('No hay sesión');
      return api.getSettings(session.access_token);
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (session) {
      const socket = io(BACKEND_URL, {
        auth: { token: session.access_token }
      });

      socket.on('message-update', () => {
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      });

      return () => { socket.close(); };
    }
  }, [session, queryClient]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: Partial<GlobalSettings>) => {
      if (!session) throw new Error('No hay sesión');
      return api.updateSettings(newSettings, session.access_token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      toast.success('Configuración actualizada');
    },
    onError: () => toast.error('Error al actualizar'),
  });

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
      queryClient.setQueryData(['settings'], (old: GlobalSettings | undefined) => 
        ({ ...old, ecommerce_url: url, scraped_data: data } as GlobalSettings)
      );
      toast.success('URL escaneada exitosamente');
      return data;
    } catch (error) { 
      toast.error('Error al escanear URL'); 
      console.error(error);
    } finally { 
      setScraping(false); 
    }
  };

  return {
    settings,
    scraping,
    updateSettings: (newSettings: Partial<GlobalSettings>) => updateMutation.mutate(newSettings),
    scrapeUrl,
  };
};
