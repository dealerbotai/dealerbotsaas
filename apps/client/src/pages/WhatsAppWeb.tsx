import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
import { socket } from '@/lib/socket';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  MoreVertical, 
  MessageSquare,
  User,
  Paperclip,
  Smile,
  Mic,
  Check,
  CheckCheck,
  Filter,
  CircleDashed,
  Plus,
  Shield,
  Users,
  Info,
  Power,
  Zap,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { sileo as toast } from 'sileo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Chat {
  id: string;
  external_id: string;
  customer_name: string;
  last_message_at: string;
  last_message_content?: string;
  is_group?: boolean;
}

interface WhatsAppGroup {
    id: string;
    subject: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_name: string;
  content: string;
  from_me: boolean;
  type: string;
  created_at: string;
}

const WhatsAppWeb = () => {
  const { id: instanceId } = useParams();
  const { instances } = useWhatsApp();
  const instance = instances.find(i => i.id === instanceId);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chats for this instance
  useEffect(() => {
    const fetchChats = async () => {
      if (!instanceId) return;
      setLoadingChats(true);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('instance_id', instanceId)
        .order('last_message_at', { ascending: false });

      if (error) console.error('Error fetching chats:', error.message);
      else setChats((data || []).map(c => ({ ...c, is_group: c.external_id.includes('@g.us') })));
      setLoadingChats(false);
    };

    fetchChats();
  }, [instanceId]);

  // Request groups from worker
  const syncGroups = () => {
      if (!instanceId || instance?.status !== 'connected') {
          toast.error("El motor debe estar conectado para sincronizar grupos.");
          return;
      }
      toast.info("Sincronizando grupos desde WhatsApp...");
      socket.emit('request-groups', { instanceId });
  };

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error.message);
      else setMessages(data || []);
      setLoadingMessages(false);
    };

    fetchMessages();
  }, [selectedChat]);

  // Listen for real-time updates
  useEffect(() => {
    const handleUpdate = (data: any) => {
        if (data.instanceId !== instanceId) return;
        
        if (data.type === 'message-update') {
            // If it's a message for the current selected chat, add it
            if (selectedChat && data.message.chat_id === selectedChat.id) {
                const newMsg: Message = {
                    id: Math.random().toString(),
                    chat_id: data.message.chat_id,
                    sender_name: data.message.pushname,
                    content: data.message.body,
                    from_me: data.message.from_me || false,
                    type: 'text',
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, newMsg]);
            }
            
            // Update chats list
            setChats(prev => {
                const existing = prev.find(c => c.external_id === data.message.from);
                if (existing) {
                    return [
                        { ...existing, last_message_at: new Date().toISOString(), last_message_content: data.message.body },
                        ...prev.filter(c => c.external_id !== data.message.from)
                    ];
                } else {
                    return [
                        {
                            id: data.message.chat_id,
                            external_id: data.message.from,
                            customer_name: data.message.pushname,
                            last_message_at: new Date().toISOString(),
                            last_message_content: data.message.body,
                            is_group: data.message.from.includes('@g.us')
                        },
                        ...prev
                    ];
                }
            });
        }

        if (data.type === 'groups-list') {
            setGroups(data.groups || []);
            toast.success(`${data.groups?.length || 0} grupos sincronizados.`);
        }
    };

    socket.on('message-update', (d) => handleUpdate({ ...d, type: 'message-update' }));
    socket.on('groups-list', (d) => handleUpdate({ ...d, type: 'groups-list' }));
    
    return () => {
        socket.off('message-update');
        socket.off('groups-list');
    };
  }, [instanceId, selectedChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
     if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
     }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim() || !selectedChat || !instanceId) return;

      const text = messageInput;
      setMessageInput('');

      // Send via socket
      socket.emit('send-message', { 
        instanceId, 
        to: selectedChat.external_id, 
        text,
        chatId: selectedChat.id
      });

      // Optimistic update
      const optimisticMsg: Message = {
          id: 'temp-' + Date.now(),
          chat_id: selectedChat.id,
          sender_name: 'You',
          content: text,
          from_me: true,
          type: 'text',
          created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);
  };

  const handleSelectGroup = async (group: WhatsAppGroup) => {
      setLoadingMessages(true);
      // Ensure chat exists in DB for this group
      const { data: chat, error } = await supabase
          .from('chats')
          .upsert({
              instance_id: instanceId,
              external_id: group.id,
              customer_name: group.subject,
              last_message_at: new Date().toISOString()
          }, { onConflict: 'instance_id,external_id' })
          .select()
          .single();

      if (error) {
          toast.error("Error al acceder al grupo: " + error.message);
          setLoadingMessages(false);
          return;
      }

      const selected = { ...chat, is_group: true };
      setSelectedChat(selected);
      setActiveTab('chats');
      
      // If not in chats list, add it
      if (!chats.find(c => c.id === chat.id)) {
          setChats(prev => [selected, ...prev]);
      }
  };

  const filteredItems = activeTab === 'chats' 
    ? chats.filter(chat => 
        chat.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.external_id.includes(searchQuery)
      )
    : groups.filter(group => 
        group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.id.includes(searchQuery)
      );

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] -mt-4 -mx-4 overflow-hidden bg-[#f0f2f5] dark:bg-[#0b141a] font-outfit">
         <div className="flex-1 flex overflow-hidden shadow-sm">
            
            {/* Left Sidebar */}
            <div className="w-[400px] flex flex-col bg-white dark:bg-[#111b21] shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 border-r border-border/5">
                {/* User Header */}
                <div className="h-[64px] px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33]">
                    <div className="flex items-center gap-3">
                        <Link to={`/instances/${instanceId}`}>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="relative">
                            <Avatar className="w-10 h-10 border-2 border-white dark:border-[#202c33]">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{instance?.name?.[0] || 'W'}</AvatarFallback>
                            </Avatar>
                            {instance?.status === 'connected' && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#202c33]" />
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={syncGroups} variant="ghost" size="icon" className="rounded-full text-[#54656f] dark:text-[#aebac1]">
                                        <Users className="w-5 h-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-primary text-white font-bold border-none text-[10px] uppercase tracking-widest">Sincronizar Grupos</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Button variant="ghost" size="icon" className="rounded-full text-[#54656f] dark:text-[#aebac1]">
                            <CircleDashed className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-[#54656f] dark:text-[#aebac1]">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Tabs Area */}
                <div className="px-4 py-2 flex items-center gap-2 border-b border-border/5">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab('chats')}
                        className={cn("flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-9", activeTab === 'chats' ? "bg-primary/5 text-primary" : "text-muted-foreground")}
                    >
                        Conversaciones
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveTab('groups')}
                        className={cn("flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-9", activeTab === 'groups' ? "bg-primary/5 text-primary" : "text-muted-foreground")}
                    >
                        Grupos WhatsApp
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="p-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={activeTab === 'chats' ? "Buscar chat..." : "Buscar grupo..."} 
                            className="pl-11 h-10 bg-secondary/40 border-none rounded-xl text-xs font-bold shadow-inner placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {loadingChats ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4" i={i}>
                                    <div className="w-12 h-12 bg-secondary rounded-full animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 bg-secondary rounded animate-pulse" />
                                        <div className="h-3 w-2/3 bg-secondary rounded animate-pulse" />
                                    </div>
                                </div>
                            ))
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-10 text-center space-y-4">
                                <div className="p-4 bg-secondary/30 rounded-full">
                                    <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
                                </div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {activeTab === 'chats' ? "Sin conversaciones activas" : "No hay grupos sincronizados"}
                                </p>
                                {activeTab === 'groups' && (
                                    <Button onClick={syncGroups} variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest">
                                        Sincronizar Ahora
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredItems.map((item: any) => (
                                <button
                                    key={item.id}
                                    onClick={() => activeTab === 'chats' ? setSelectedChat(item) : handleSelectGroup(item)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-4 py-4 transition-all duration-300 relative group",
                                        selectedChat?.id === item.id 
                                            ? "bg-primary/5 dark:bg-[#2a3942]" 
                                            : "hover:bg-secondary/30 dark:hover:bg-[#202c33]"
                                    )}
                                >
                                    {selectedChat?.id === item.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-full shadow-lg" />
                                    )}
                                    <Avatar className="w-12 h-12 shadow-sm">
                                        <AvatarFallback className={cn("text-white font-bold", item.is_group || activeTab === 'groups' ? "bg-indigo-500" : "bg-emerald-500")}>
                                            {item.is_group || activeTab === 'groups' ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-bold text-foreground truncate tracking-tight">
                                                {activeTab === 'chats' ? item.customer_name : item.subject}
                                            </h3>
                                            {activeTab === 'chats' && item.last_message_at && (
                                                <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0">
                                                    {new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-medium truncate mt-1">
                                            {activeTab === 'chats' ? (item.last_message_content || item.external_id) : item.id}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Main Content */}
            <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-[64px] px-6 flex items-center justify-between bg-white dark:bg-[#202c33] z-10 shadow-sm border-b border-border/5">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-10 h-10">
                                    <AvatarFallback className={cn("text-white font-bold", selectedChat.is_group ? "bg-indigo-500" : "bg-emerald-500")}>
                                        {selectedChat.is_group ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-[15px] font-bold text-foreground leading-tight tracking-tight">
                                        {selectedChat.customer_name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground font-bold font-mono tracking-tighter">
                                            {selectedChat.external_id}
                                        </span>
                                        {selectedChat.is_group && (
                                            <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 border-none">Grupo</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {instance?.bot_enabled && (
                                    <Badge variant="outline" className="mr-4 border-amber-500/30 text-amber-500 bg-amber-500/5 px-3 py-1 font-black text-[9px] uppercase tracking-widest gap-2">
                                        <Zap className="w-3 h-3 fill-amber-500" /> IA Asistiendo
                                    </Badge>
                                )}
                                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                                    <Search className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Background Pattern Overlay */}
                        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.2] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded51.png')] bg-repeat" />

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-6 lg:px-24" ref={scrollRef}>
                           <div className="flex flex-col gap-2 relative z-10">
                              {loadingMessages ? (
                                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando historial seguro...</p>
                                  </div>
                              ) : messages.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-32 opacity-30 select-none">
                                      <MessageSquare className="w-16 h-16 mb-4" />
                                      <p className="text-sm font-bold uppercase tracking-widest">Inicia la conversación</p>
                                  </div>
                              ) : (
                                  messages.map((msg, i) => {
                                      const isFirstFromSender = i === 0 || messages[i-1].from_me !== msg.from_me;
                                      return (
                                          <div 
                                            key={msg.id} 
                                            className={cn(
                                                "flex flex-col max-w-[85%] lg:max-w-[70%]", 
                                                msg.from_me ? "self-end" : "self-start",
                                                isFirstFromSender ? "mt-4" : "mt-0"
                                            )}
                                          >
                                              <div className={cn(
                                                  "px-3.5 py-2 rounded-2xl text-[14px] shadow-sm relative leading-relaxed group/msg transition-all",
                                                  msg.from_me 
                                                    ? "bg-primary text-white rounded-tr-none" 
                                                    : "bg-white dark:bg-[#202c33] text-foreground rounded-tl-none border border-border/5"
                                              )}>
                                                  {!msg.from_me && selectedChat.is_group && isFirstFromSender && (
                                                      <p className="text-[10px] font-black text-indigo-500 mb-1 uppercase tracking-tight">{msg.sender_name}</p>
                                                  )}

                                                  <div className="pr-10 whitespace-pre-wrap break-words">
                                                      {msg.content}
                                                  </div>
                                                  
                                                  <div className="flex items-center justify-end gap-1.5 mt-1 opacity-60">
                                                      <span className="text-[9px] font-bold uppercase tracking-tighter">
                                                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                      </span>
                                                      {msg.from_me && (
                                                          <CheckCheck className="w-3.5 h-3.5" />
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })
                              )}
                           </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="px-6 py-4 bg-white dark:bg-[#202c33] flex items-center gap-4 z-10 border-t border-border/5">
                           <div className="flex items-center text-muted-foreground gap-1">
                               <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
                                  <Smile className="w-6 h-6" />
                               </Button>
                               <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
                                  <Plus className="w-6 h-6" />
                               </Button>
                           </div>
                           
                           <form onSubmit={sendMessage} className="flex-1 flex items-center gap-3">
                               <div className="flex-1 relative">
                                   <Input 
                                     value={messageInput}
                                     onChange={(e) => setMessageInput(e.target.value)}
                                     placeholder="Escribe un mensaje corporativo..." 
                                     className="h-12 bg-secondary/40 border-none rounded-2xl text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/20 text-foreground placeholder:text-muted-foreground/30 px-6"
                                   />
                               </div>
                               <Button 
                                 type="submit" 
                                 disabled={!messageInput.trim()}
                                 className={cn(
                                     "rounded-2xl w-12 h-12 flex items-center justify-center transition-all shadow-md",
                                     messageInput.trim() ? "bg-primary text-white shadow-primary/20 scale-100" : "bg-secondary text-muted-foreground scale-95"
                                 )}
                               >
                                  {messageInput.trim() ? (
                                      <Send className="w-5 h-5" />
                                  ) : (
                                      <Mic className="w-5 h-5" />
                                  )}
                               </Button>
                           </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-secondary/10 relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                        
                        <div className="max-w-[500px] text-center flex flex-col items-center relative z-10">
                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl mb-10 group hover:scale-105 transition-all duration-500">
                                <Bot className="w-12 h-12 text-primary group-hover:rotate-12 transition-transform" />
                            </div>
                            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase mb-4">
                                Centro de Mensajería <span className="text-primary">Dealerbot</span>
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-12">
                                Gestiona tus conversaciones de WhatsApp y Messenger con el respaldo de IA.<br/>
                                Todos los mensajes se registran de forma segura para auditoría y entrenamiento.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="p-6 rounded-3xl bg-white/50 border border-border/5 text-left">
                                    <Shield className="w-5 h-5 text-emerald-500 mb-3" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Registro Seguro</h4>
                                    <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase">Auditoría 24/7 de flujo</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/50 border border-border/5 text-left">
                                    <Power className="w-5 h-5 text-primary mb-3" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Estado Motor</h4>
                                    <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase">
                                        {instance?.status === 'connected' ? 'ONLINE - ACTIVO' : 'OFFLINE - ESPERA'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
         </div>
      </div>
    </MainLayout>
  );
};

export default WhatsAppWeb;