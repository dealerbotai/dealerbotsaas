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
  Circle,
  Clock,
  User,
  MessageSquare,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';

interface Chat {
  id: string;
  external_id: string;
  customer_name: string;
  last_message_at: string;
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
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
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
                    { ...existing, last_message_at: new Date().toISOString() },
                    ...prev.filter(c => c.external_id !== data.message.from)
                ];
            } else {
                return [
                    {
                        id: data.message.chat_id,
                        external_id: data.message.from,
                        customer_name: data.message.pushname,
                        last_message_at: new Date().toISOString()
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
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 h-[calc(100vh-180px)]">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to={`/instance/${instanceId}`}>
                    <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                   <h1 className="text-2xl font-black text-slate-900 leading-none">WhatsApp Web Mirror</h1>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {instance?.name} • {instance?.status === 'connected' ? 'En Línea' : 'Desconectado'}
                   </p>
                </div>
            </div>
            {instance?.status === 'connected' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Motor Activo</span>
                </div>
            )}
         </div>

         <div className="flex-1 flex bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-xl">
            {/* Sidebar: Chats List */}
            <div className="w-[350px] border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-6 pb-2">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar chat..." 
                        className="pl-10 h-11 bg-white border-slate-200 rounded-2xl text-sm font-medium focus:ring-blue-500 focus:border-blue-500" 
                      />
                   </div>
                </div>

                <ScrollArea className="flex-1 mt-4">
                   <div className="px-3 space-y-1 pb-6">
                      {loadingChats ? (
                         Array(5).fill(0).map((_, i) => (
                             <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse mx-3" />
                         ))
                      ) : chats.length === 0 ? (
                         <div className="py-20 text-center space-y-2">
                             <MessageSquare className="w-10 h-10 text-slate-200 mx-auto" />
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay chats activos</p>
                         </div>
                      ) : (
                         chats.map((chat) => (
                             <button
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-[28px] transition-all text-left group",
                                    selectedChat?.id === chat.id 
                                        ? "bg-white shadow-lg shadow-blue-100 border-blue-100 ring-1 ring-blue-50" 
                                        : "hover:bg-white/60"
                                )}
                             >
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                    selectedChat?.id === chat.id ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"
                                )}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn("text-sm font-black truncate", selectedChat?.id === chat.id ? "text-slate-900" : "text-slate-700")}>
                                        {chat.customer_name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                             </button>
                         ))
                      )}
                   </div>
                </ScrollArea>
            </div>

            {/* Main: Chat View */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center text-white">
                                  <User className="w-5 h-5" />
                               </div>
                               <div>
                                  <h2 className="text-base font-black text-slate-900">{selectedChat.customer_name}</h2>
                                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                     En línea
                                  </span>
                               </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-8 bg-slate-50/30" ref={scrollRef}>
                           <div className="flex flex-col gap-6">
                              {loadingMessages ? (
                                  <div className="flex justify-center py-10">
                                      <Circle className="w-5 h-5 text-blue-500 animate-ping" />
                                  </div>
                              ) : (
                                  messages.map((msg, i) => (
                                      <div 
                                        key={msg.id} 
                                        className={cn("flex flex-col max-w-[80%]", msg.from_me ? "self-end items-end" : "self-start")}
                                      >
                                          <div className={cn(
                                              "px-6 py-4 rounded-[32px] text-sm font-medium shadow-sm leading-relaxed",
                                              msg.from_me 
                                                ? "bg-blue-600 text-white rounded-br-lg" 
                                                : "bg-white border border-slate-100 text-slate-700 rounded-bl-lg"
                                          )}>
                                              {msg.content}
                                          </div>
                                          <div className="flex items-center gap-2 mt-2 px-2">
                                              {msg.type === 'bot' && (
                                                  <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                                                      <Bot className="w-2.5 h-2.5" /> AI Reply
                                                  </div>
                                              )}
                                              <span className="text-[9px] font-black text-slate-400 uppercase">
                                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                          </div>
                                      </div>
                                  ))
                              )}
                           </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-8 border-t border-slate-100">
                           <form onSubmit={sendMessage} className="flex items-center gap-4 bg-slate-50 p-2 rounded-3xl border border-slate-200">
                              <Input 
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Escribe un mensaje..." 
                                className="border-none bg-transparent focus-visible:ring-0 text-sm font-medium placeholder:text-slate-400 px-4"
                              />
                              <Button 
                                type="submit" 
                                disabled={!messageInput.trim()}
                                className="h-12 w-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 shrink-0 p-0"
                              >
                                 <Send className="w-5 h-5" />
                              </Button>
                           </form>
                           <p className="text-[9px] font-bold text-slate-400 text-center mt-4 uppercase tracking-[2px]">
                               Dealerbot AI Mirror Interface
                           </p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-6 opacity-40">
                        <div className="p-10 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                           <MessageSquare className="w-20 h-20 text-slate-300" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-slate-900 uppercase">Selecciona un Chat</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-[280px]">
                                Visualiza la conversación y el comportamiento de la IA en tiempo real.
                            </p>
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
