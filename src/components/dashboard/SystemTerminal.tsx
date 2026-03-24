"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, Trash2, ChevronDown, ChevronUp, Terminal as TerminalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Socket } from 'socket.io-client';

interface LogEntry {
  level: 'info' | 'error' | 'warn';
  message: string;
  timestamp: string;
  [key: string]: any;
}

interface SystemTerminalProps {
  socket: Socket | null;
}

export const SystemTerminal = ({ socket }: SystemTerminalProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleLog = (log: LogEntry) => {
      setLogs(prev => [...prev, log].slice(-100)); // Mantener últimos 100
    };

    socket.on('system-log', handleLog);
    return () => { socket.off('system-log', handleLog); };
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => setLogs([]);

  return (
    <Card className={cn(
      "rounded-[32px] border-border/50 shadow-sm overflow-hidden transition-all duration-300",
      isExpanded ? "h-[600px]" : "h-[350px]"
    )}>
      <CardHeader className="bg-zinc-950 text-zinc-400 border-b border-white/5 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-black flex items-center gap-2 uppercase tracking-[0.2em]">
          <TerminalIcon className="w-4 h-4 text-primary" /> Consola de Sistema
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg" onClick={clearLogs}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-zinc-950 h-full">
        <ScrollArea className="h-[calc(100%-60px)] font-mono text-[11px] p-6">
          <div ref={scrollRef} className="space-y-1.5">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-zinc-600 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={cn(
                  "font-bold shrink-0 uppercase w-12",
                  log.level === 'error' ? "text-red-500" : log.level === 'warn' ? "text-yellow-500" : "text-blue-500"
                )}>
                  {log.level}
                </span>
                <span className="text-zinc-300 break-all">{log.message}</span>
                {Object.keys(log).filter(k => !['level', 'message', 'timestamp'].includes(k)).length > 0 && (
                  <span className="text-zinc-600 italic group-hover:text-zinc-400 transition-colors">
                    {JSON.stringify(Object.fromEntries(Object.entries(log).filter(([k]) => !['level', 'message', 'timestamp'].includes(k))))}
                  </span>
                )}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Terminal className="w-12 h-12 mb-4" />
                <p className="font-bold tracking-widest uppercase">Escuchando eventos del sistema...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};