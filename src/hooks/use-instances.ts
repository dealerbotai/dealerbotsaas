import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, WhatsAppInstance } from '../lib/api';
import { toast } from '../utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useState } from 'react';

const BACKEND_URL = "http://localhost:3001";

export const useInstances = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (session) {
      const newSocket = io(BACKEND_URL, {
        auth: { token: session.access_token }
      });
      setSocket(newSocket);

      newSocket.on('ready', () => {
        queryClient.invalidateQueries({ queryKey: ['instances'] });
      });

      newSocket.on('scope-changed', () => {
        queryClient.invalidateQueries({ queryKey: ['instances'] });
      });

      newSocket.on('session-expired', ({ instanceId, message }) => {
        queryClient.invalidateQueries({ queryKey: ['instances'] });
        toast.error(`Sesión expirada: ${message || 'Desconectado'}`);
      });

      newSocket.on('connectivity-test-result', (data) => {
        if (data.success) {
          toast.success('Prueba de conectividad EXITOSA: El servicio funciona correctamente.');
        } else {
          toast.error(`Prueba de conectividad FALLIDA: ${data.error}`);
        }
        queryClient.invalidateQueries({ queryKey: ['instances'] });
      });

      return () => { newSocket.close(); };
    }
  }, [session, queryClient]);

  const { data: instances = [], isLoading: loading } = useQuery({
    queryKey: ['instances'],
    queryFn: api.getInstances,
    enabled: !!session,
    refetchInterval: 15000, // Heartbeat: Poll cada 15s para sincronizar estado real
  });

  const toggleBotMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string, enabled: boolean }) => api.toggleBot(id, enabled),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['instances'], (old: WhatsAppInstance[] | undefined) => 
        old?.map(inst => inst.id === variables.id ? { ...inst, bot_enabled: variables.enabled } : inst)
      );
      toast.success(`Bot ${variables.enabled ? 'activado' : 'desactivado'}`);
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteInstance,
    onSuccess: (_, id) => {
      queryClient.setQueryData(['instances'], (old: WhatsAppInstance[] | undefined) => 
        old?.filter(inst => inst.id !== id)
      );
      toast.success('Instancia eliminada');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<WhatsAppInstance> }) => 
      api.updateInstance(id, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['instances'], (old: WhatsAppInstance[] | undefined) => 
        old?.map(inst => inst.id === updated.id ? updated : inst)
      );
      toast.success('Instancia actualizada');
    },
    onError: () => toast.error('Error al actualizar la instancia'),
  });

  return {
    instances,
    loading,
    socket,
    toggleBot: (id: string, enabled: boolean) => toggleBotMutation.mutate({ id, enabled }),
    deleteInstance: (id: string) => deleteMutation.mutate(id),
    updateInstance: (id: string, updates: Partial<WhatsAppInstance>) => updateMutation.mutate({ id, updates }),
    startLinking: (name: string) => {
      if (socket) {
        socket.emit('init-instance', { name });
        toast.info('Generando código QR...');
      }
    },
    changeScope: (instanceId: string, scope: 'all' | 'groups' | 'specific') => {
      if (socket) socket.emit('change-scope', { instanceId, scope });
    },
    restartInstance: (instanceId: string) => {
      if (socket) {
        socket.emit('restart-instance', { instanceId });
        toast.info('Reiniciando instancia...');
      }
    },
    sendMessage: (instanceId: string, to: string, message: string) => {
      if (socket) {
        socket.emit('send-message', { instanceId, to, message });
      }
    },
    runConnectivityTest: (instanceId: string) => {
      if (socket) {
        socket.emit('run-connectivity-test', { instanceId });
        toast.info('Iniciando prueba de conectividad...');
      }
    }
  };
};
