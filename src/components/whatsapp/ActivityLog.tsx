import React, { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';
import { Terminal, Clock, Activity, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  [key: string]: any;
}

interface ActivityLogProps {
  instanceId: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ instanceId }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLog = (log: LogEntry) => {
        setLogs(prev => [...prev.slice(-100), log]);
    };

    const handleMessage = (data: { instanceId: string; message: any }) => {
        if (data.instanceId === instanceId) {
            setLogs(prev => [...prev.slice(-100), {
                level: 'info',
                message: `💬 Mensaje de ${data.message.pushname || data.message.from}: ${data.message.body}`,
                timestamp: new Date().toISOString()
            }]);
        }
    };

    socket.on('instance-log', handleLog);
    socket.on('message-update', handleMessage);
    
    // Set connected status if socket is alive
    setIsConnected(socket.connected);
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('instance-log', handleLog);
      socket.off('message-update', handleMessage);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [instanceId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-[400px] bg-slate-950 rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
             <Terminal className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-black text-slate-200 uppercase tracking-widest">Actividad en Vivo</span>
        </div>
        <div className="flex items-center gap-2">
           <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
             {isConnected ? 'Stream Activo' : 'Desconectado'}
           </span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-6 font-mono text-xs leading-relaxed" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-40 py-20">
            <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-center">
              Esperando señales del motor...<br/>
              <span className="text-[10px] font-medium">Inicia la instancia para ver logs</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-slate-600 whitespace-nowrap shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                </span>
                <span className={cn(
                  "font-bold",
                  log.level === 'error' ? 'text-red-400' : 
                  log.level === 'warn' ? 'text-amber-400' : 
                  log.level === 'success' ? 'text-green-400' : 'text-blue-300'
                )}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-500">Node Worker Thread #{instanceId.slice(0,4)}</span>
        <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">Listening</span>
        </div>
      </div>
    </div>
  );
};
