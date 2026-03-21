import React, { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';
import { Terminal, Clock, Activity, Loader2, MessageSquare, Bot, AlertTriangle, CheckCircle2, XCircle, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: string;
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
        setLogs(prev => [...prev.slice(-150), log]);
    };

    const handleMessage = (data: { instanceId: string; message: any }) => {
        // We might already get this via instance-log (bot-in/bot-out)
        // but keeping it as backup or for richer data if needed.
        // If it's a message event from the worker, we can skip it if we handle bot-in/bot-out
    };

    socket.on('instance-log', handleLog);
    socket.on('message-update', handleMessage);
    
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
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [logs]);

  const getLogStyles = (level: string) => {
    switch (level) {
      case 'error':
        return {
          icon: <XCircle className="w-3 h-3 text-destructive" />,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/20'
        };
      case 'warn':
        return {
          icon: <AlertTriangle className="w-3 h-3 text-amber-500" />,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-green-500" />,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          border: 'border-green-500/20'
        };
      case 'bot-in':
        return {
          icon: <MessageSquare className="w-3 h-3 text-blue-400" />,
          color: 'text-blue-400',
          bg: 'bg-blue-400/10',
          border: 'border-blue-400/20'
        };
      case 'bot-out':
        return {
          icon: <Bot className="w-3 h-3 text-purple-400" />,
          color: 'text-purple-400',
          bg: 'bg-purple-400/10',
          border: 'border-purple-400/20'
        };
      default:
        return {
          icon: <Info className="w-3 h-3 text-primary/70" />,
          color: 'text-foreground/80',
          bg: 'bg-secondary/30',
          border: 'border-border'
        };
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-background/40 backdrop-blur-xl rounded-[32px] border border-border overflow-hidden shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background/20 pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg">
             <Terminal className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-black text-foreground uppercase tracking-[2px] block">Live Instance Feed</span>
            <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-[1px]">Real-time system synchronization</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-secondary/40 px-3 py-1 rounded-full border border-border">
           <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-destructive")} />
           <span className="text-[9px] font-bold text-foreground/70 uppercase tracking-wider">
             {isConnected ? 'Sync Active' : 'Disconnected'}
           </span>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1 p-6 font-mono relative z-10" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[350px] space-y-4 opacity-40">
            <div className="p-5 bg-secondary/50 rounded-full border border-dashed border-border animate-pulse">
                <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[3px]">Listening for neural signals</p>
                <p className="text-[8px] text-muted-foreground/60 mt-1 uppercase tracking-widest">Awaiting first handshake...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => {
              const styles = getLogStyles(log.level);
              return (
                <div key={i} className={cn(
                  "group flex flex-col gap-1 p-2.5 rounded-xl border transition-all duration-200 hover:scale-[1.01]",
                  styles.bg,
                  styles.border
                )}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {styles.icon}
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-60">
                            {log.level.replace('bot-', '')}
                        </span>
                        {log.context && (
                            <>
                                <ChevronRight className="w-2.5 h-2.5 opacity-30" />
                                <span className="text-[9px] font-bold text-primary/70 uppercase tracking-tighter">
                                    {log.context}
                                </span>
                            </>
                        )}
                    </div>
                    <span className="text-[9px] font-medium text-muted-foreground/50 tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                  </div>
                  <div className={cn("text-[11px] leading-relaxed font-medium pl-5 break-words", styles.color)}>
                    {log.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      
      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-background/60 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Instance ID: {instanceId?.slice(0,8)}</span>
        </div>
        <div className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            {logs.length} events recorded
        </div>
      </div>
    </div>
  );
};
