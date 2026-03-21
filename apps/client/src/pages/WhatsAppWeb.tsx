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
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Chat {
  id: string;
  external_id: string;
  customer_name: string;
  last_message_at: string;
  last_message_content?: string;
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

// WhatsApp Official-like Colors
const WA_COLORS = {
  header: '#f0f2f5',
  sidebar: '#ffffff',
  chatBg: '#efeae2',
  chatBgDark: '#0b141a',
  myBubble: '#d9fdd3',
  myBubbleDark: '#005c4b',
  theirBubble: '#ffffff',
  theirBubbleDark: '#202c33',
  primary: '#00a884',
};

const WhatsAppWeb = () => {
  const { id: instanceId } = useParams();
  const { instances } = useWhatsApp();
  const instance = instances.find(i => i.id === instanceId);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      else setChats(data || []);
      setLoadingChats(false);
    };

    fetchChats();
  }, [instanceId]);

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

  // Listen for real-time messages
  useEffect(() => {
    const handleUpdate = (data: any) => {
        if (data.instanceId !== instanceId) return;
        
        // If it's a message for the current selected chat, add it
        if (selectedChat && data.message.chat_id === selectedChat.id) {
            const newMsg: Message = {
                id: Math.random().toString(),
                chat_id: data.message.chat_id,
                sender_name: data.message.pushname,
                content: data.message.body,
                from_me: false,
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
                        last_message_content: data.message.body
                    },
                    ...prev
                ];
            }
        });
    };

    socket.on('message-update', handleUpdate);
    return () => {
        socket.off('message-update', handleUpdate);
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

  const filteredChats = chats.filter(chat => 
    chat.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.external_id.includes(searchQuery)
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] -mt-4 -mx-4 overflow-hidden bg-[#f0f2f5] dark:bg-[#0b141a]">
         {/* Container for the "App" with WhatsApp Web dimensions/style */}
         <div className="flex-1 flex overflow-hidden shadow-sm">
            
            {/* Left Sidebar */}
            <div className="w-[400px] flex flex-col bg-white dark:bg-[#111b21] border-r border-border dark:border-[#222d34]">
                {/* User Header */}
                <div className="h-[60px] px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33]">
                    <div className="flex items-center gap-3">
                        <Link to={`/instances/${instanceId}`}>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-muted"><User className="w-6 h-6 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full text-[#54656f] dark:text-[#aebac1]">
                            <CircleDashed className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-[#54656f] dark:text-[#aebac1]">
                            <MessageSquare className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-[#54656f] dark:text-[#aebac1]">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="p-2 flex items-center gap-2">
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Search className="w-4 h-4 text-[#54656f] dark:text-[#aebac1]" />
                        </div>
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar un chat o iniciar uno nuevo" 
                            className="pl-12 h-9 bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-lg text-sm focus-visible:ring-0 placeholder:text-[#54656f] dark:placeholder:text-[#aebac1]"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-[#54656f] dark:text-[#aebac1]">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {loadingChats ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 border-b border-border/50 dark:border-[#222d34]/50">
                                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                                    </div>
                                </div>
                            ))
                        ) : filteredChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-10 text-center text-[#667781] dark:text-[#8696a0]">
                                <p className="text-sm">No se encontraron chats.</p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-3 transition-colors border-b border-border/50 dark:border-[#222d34]/50",
                                        selectedChat?.id === chat.id 
                                            ? "bg-[#f0f2f5] dark:bg-[#2a3942]" 
                                            : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
                                    )}
                                >
                                    <Avatar className="w-12 h-12">
                                        <AvatarFallback className="bg-[#dfe5e7] dark:bg-[#6a7175]">
                                            <User className="w-7 h-7 text-white" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-[16px] font-normal text-[#111b21] dark:text-[#e9edef] truncate">
                                                {chat.customer_name}
                                            </h3>
                                            <span className="text-[12px] text-[#667781] dark:text-[#8696a0] shrink-0">
                                                {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                                            {chat.last_message_content || chat.external_id}
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
                        <div className="h-[60px] px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] z-10 shadow-sm border-l border-border/20 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 cursor-pointer">
                                    <AvatarFallback className="bg-[#dfe5e7] dark:bg-[#6a7175]">
                                        <User className="w-6 h-6 text-white" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="cursor-pointer">
                                    <h2 className="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef] leading-tight">
                                        {selectedChat.customer_name}
                                    </h2>
                                    <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                                        {selectedChat.external_id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[#54656f] dark:text-[#aebac1]">
                                <Search className="w-5 h-5 cursor-pointer" />
                                <MoreVertical className="w-5 h-5 cursor-pointer" />
                            </div>
                        </div>

                        {/* Background Pattern Overlay (Optional, but gives the WA feel) */}
                        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.4] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded51.png')] bg-repeat" />

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-4 lg:px-16" ref={scrollRef}>
                           <div className="flex flex-col gap-1.5 relative z-10">
                              {loadingMessages ? (
                                  <div className="flex justify-center py-20">
                                      <div className="w-10 h-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                                  </div>
                              ) : (
                                  messages.map((msg, i) => {
                                      const isFirstFromSender = i === 0 || messages[i-1].from_me !== msg.from_me;
                                      return (
                                          <div 
                                            key={msg.id} 
                                            className={cn(
                                                "flex flex-col max-w-[85%] lg:max-w-[65%]", 
                                                msg.from_me ? "self-end" : "self-start",
                                                isFirstFromSender ? "mt-2" : "mt-0"
                                            )}
                                          >
                                              <div className={cn(
                                                  "px-2.5 py-1.5 rounded-lg text-[14.2px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative leading-normal",
                                                  msg.from_me 
                                                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none" 
                                                    : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none"
                                              )}>
                                                  {/* Bubble Tail */}
                                                  {isFirstFromSender && (
                                                      <div className={cn(
                                                          "absolute top-0 w-3 h-3",
                                                          msg.from_me 
                                                            ? "-right-2 bg-[#d9fdd3] dark:bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)]" 
                                                            : "-left-2 bg-white dark:bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)]"
                                                      )} />
                                                  )}

                                                  <div className="pr-12">
                                                      {msg.content}
                                                  </div>
                                                  
                                                  <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
                                                      <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                                                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                      </span>
                                                      {msg.from_me && (
                                                          <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
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
                        <div className="px-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2 z-10">
                           <div className="flex items-center text-[#54656f] dark:text-[#aebac1]">
                               <Button variant="ghost" size="icon" className="rounded-full">
                                  <Smile className="w-6 h-6" />
                               </Button>
                               <Button variant="ghost" size="icon" className="rounded-full">
                                  <Plus className="w-6 h-6" />
                               </Button>
                           </div>
                           
                           <form onSubmit={sendMessage} className="flex-1 flex items-center gap-2">
                               <Input 
                                 value={messageInput}
                                 onChange={(e) => setMessageInput(e.target.value)}
                                 placeholder="Escribe un mensaje aquí" 
                                 className="h-11 bg-white dark:bg-[#2a3942] border-none rounded-lg text-sm focus-visible:ring-0 text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0]"
                               />
                               <Button 
                                 type="submit" 
                                 variant="ghost"
                                 disabled={!messageInput.trim()}
                                 className="rounded-full text-[#54656f] dark:text-[#aebac1]"
                               >
                                  {messageInput.trim() ? (
                                      <Send className="w-6 h-6 text-[#00a884]" />
                                  ) : (
                                      <Mic className="w-6 h-6" />
                                  )}
                               </Button>
                           </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[#f8f9fa] dark:bg-[#222e35] border-l border-border dark:border-white/5">
                        <div className="max-w-[560px] text-center flex flex-col items-center">
                            <div className="w-full max-w-[400px] mb-8 opacity-80 dark:opacity-100">
                                <img 
                                    src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5y9Z.png" 
                                    alt="WhatsApp" 
                                    className="w-full h-auto mx-auto"
                                />
                            </div>
                            <h1 className="text-[32px] font-light text-[#41525d] dark:text-[#e9edef] mb-4">
                                WhatsApp Web
                            </h1>
                            <p className="text-[14px] text-[#667781] dark:text-[#8696a0] leading-relaxed mb-10">
                                Envía y recibe mensajes sin necesidad de tener tu teléfono conectado.<br/>
                                Usa WhatsApp en hasta 4 dispositivos vinculados y 1 teléfono a la vez.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-[14px] text-[#8696a0]">
                                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Cifrado de extremo a extremo</span>
                            </div>
                        </div>
                        {/* Decorative bottom line like WA */}
                        <div className="absolute bottom-10 h-1.5 w-[300px] bg-[#00a884] rounded-full opacity-20" />
                    </div>
                )}
            </div>
         </div>
      </div>
    </MainLayout>
  );
};

export default WhatsAppWeb;
