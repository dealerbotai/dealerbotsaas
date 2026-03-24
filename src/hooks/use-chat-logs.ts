import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = "http://localhost:3001";

export const useChatLogs = (instanceId?: string, contactId?: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [liveLogs, setLiveLogs] = useState<any[]>([]);

  const { data: initialLogs = [], isLoading: loading } = useQuery({
    queryKey: ['chat-logs', instanceId, contactId],
    queryFn: async () => {
      const logs = await api.getMessageLogs(instanceId, contactId);
      return Array.isArray(logs) ? logs : [];
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (session) {
      const socket = io(BACKEND_URL, {
        auth: { token: session.access_token }
      });

      socket.on('message-update', (data: any) => {
        if (!instanceId || data.instanceId === instanceId) {
          setLiveLogs(prev => [data.message, ...prev.slice(0, 49)]);
          queryClient.invalidateQueries({ queryKey: ['chat-logs'] });
        }
      });

      return () => { socket.close(); };
    }
  }, [session, instanceId, queryClient]);

  const allLogs = liveLogs.length > 0 
    ? [...liveLogs, ...initialLogs].slice(0, 50) 
    : initialLogs;

  return {
    logs: allLogs,
    loading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['chat-logs'] }),
  };
};
