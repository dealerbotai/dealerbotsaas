import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, User, Bot, Search, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Socket } from 'socket.io-client';
import { api } from '@/lib/api';

interface Message {
  id: string;
  type: 'msg' | 'bot';
  sender_name: string;
  text: string;
  created_at: string;
  from_me: boolean;
  contact_id: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  instanceName: string;
  socket: Socket | null;
  onSendMessage: (id: string, to: string, msg: string) => void;
}

export const ChatModal = ({ isOpen, onClose, instanceId, instanceName, socket, onSendMessage }: ChatModalProps) => {
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [contacts, setContacts] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async () => {
    if (!isOpen) return;
    setLoadingContacts(true);
    try {
      const allInstanceLogs = await api.getMessageLogs(instanceId);
      const uniqueContacts = Array.from(new Set(allInstanceLogs.map((m: any) => m.contact_id))).filter(Boolean) as string[];
      setContacts(uniqueContacts);
    } catch (e) {
      console.error("Error fetching contacts:", e);
    } finally {
      setLoadingContacts(false);
    }
  }, [instanceId, isOpen]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (data: { instanceId: string; message: any }) => {
      if (data.instanceId !== instanceId) return;

      const newMsg: Message = {
        id: `socket_${Date.now()}`,
        created_at: new Date().toISOString(),
        contact_id: data.message.fromMe ? data.message.to : data.message.from,
        from_me: data.message.fromMe,
        sender_name: data.message.user || (data.message.fromMe ? 'Tú' : data.message.from),
        ...data.message
      };
      
      const chatId = newMsg.contact_id;
      setMessagesByChat(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMsg]
      }));

      if (chatId && !contacts.includes(chatId)) {
        setContacts(prev => [chatId, ...prev]);
      }
    };
    socket.on('message-update', handleNewMessage);
    return () => { socket.off('message-update', handleNewMessage); };
  }, [socket, instanceId, contacts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesByChat, activeChat]);

  const handleSelectChat = async (contactId: string) => {
    setActiveChat(contactId);
    if (!messagesByChat[contactId]) {
      setLoadingMessages(true);
      try {
        const chatLogs = await api.getMessageLogs(instanceId, contactId);
        setMessagesByChat(prev => ({
          ...prev,
          [contactId]: chatLogs.reverse()
        }));
      } catch (e) {
        console.error("Error fetching chat logs:", e);
      } finally {
        setLoadingMessages(false);
      }
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || !activeChat) return;
    onSendMessage(instanceId, activeChat, inputValue);
    setInputValue('');
  };

  const activeMessages = activeChat ? messagesByChat[activeChat] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
        <div className="flex h-full w-full bg-background">
          {/* Sidebar de Contactos */}
          <div className="w-80 border-r border-border/50 flex flex-col bg-accent/10">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-bold mb-4">Chats</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar chat..." className="pl-10 rounded-xl bg-background/50 border-border/50" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingContacts ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="p-2 space-y-1">
                  {contacts.length > 0 ? contacts.map(contact => (
                    <button
                      key={contact}
                      onClick={() => handleSelectChat(contact)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all",
                        activeChat === contact ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-accent/50"
                      )}
                    >
                      <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                        <AvatarFallback className={activeChat === contact ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}>
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-bold truncate">{contact.split('@')[0]}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="p-8 text-center space-y-2 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto opacity-20" />
                      <p className="text-sm font-medium">No hay conversaciones aún</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Área de Chat */}
          <div className="flex-1 flex flex-col">
            {activeChat ? (
              <>
                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-border/50">
                      <AvatarFallback className="bg-primary/5 text-primary">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{activeChat.split('@')[0]}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1 font-bold bg-primary/5 text-primary border-primary/20">
                    Instancia: {instanceName}
                  </Badge>
                </div>

                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:400px] bg-fixed"
                >
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : (
                    activeMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn("flex w-full", msg.from_me ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] p-4 rounded-[24px] shadow-sm relative",
                            msg.from_me 
                              ? "bg-primary text-primary-foreground rounded-tr-none" 
                              : "bg-background border border-border/50 text-foreground rounded-tl-none"
                          )}
                        >
                          {msg.type === 'bot' && !msg.from_me && (
                            <div className="flex items-center gap-1.5 mb-1 opacity-70">
                              <Bot className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">Respuesta del Bot</span>
                            </div>
                          )}
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={cn(
                            "text-[9px] mt-2 font-bold opacity-50 text-right",
                            msg.from_me ? "text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 bg-background border-t border-border/50">
                  <div className="flex items-center gap-3 bg-accent/20 p-2 rounded-2xl border border-border/50">
                    <Input
                      placeholder="Escribe un mensaje..."
                      className="flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none font-medium"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button 
                      size="icon" 
                      className="rounded-xl h-10 w-10 shrink-0 shadow-lg shadow-primary/20"
                      onClick={handleSend}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30">
                {loadingContacts ? (
                   <Loader2 className="w-16 h-16 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="p-8 bg-accent rounded-full">
                      <MessageSquare className="w-16 h-16" />
                    </div>
                    <p className="text-xl font-black uppercase tracking-tighter">Selecciona un chat para comenzar</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};