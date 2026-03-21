import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp, AIAgent } from '@/hooks/use-whatsapp-instances';
import { 
    Bot, 
    Plus, 
    Trash2, 
    Brain,
    Search,
    LayoutGrid,
    LayoutList,
    Sparkles,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Agents = () => {
    const { agents, loading, addAgent, deleteAgent } = useWhatsApp();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [name, setName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await addAgent(name, prompt);
        setIsSubmitting(false);
        setIsAddOpen(false);
        setName('');
        setPrompt('');
    };

    const filteredAgents = agents.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.prompt_text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Agentes IA</h1>
                        <p className="text-slate-400 text-sm font-medium">Define la personalidad y comportamiento de tus bots.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                                placeholder="Buscar agentes..." 
                                className="pl-10 h-11 bg-white/5 border-white/10 rounded-2xl text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setView('grid')} 
                              className={cn("rounded-xl h-9 w-9", view === 'grid' && "bg-white/10 text-cyan-400")}
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setView('list')} 
                              className={cn("rounded-xl h-9 w-9", view === 'list' && "bg-white/10 text-cyan-400")}
                            >
                              <LayoutList className="w-4 h-4" />
                            </Button>
                        </div>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] rounded-xl gap-2 shadow-lg shadow-cyan-500/20 h-12 px-6 font-black uppercase text-xs tracking-widest ai-glow-hover">
                                    <Plus className="w-4 h-4" />
                                    Nuevo Agente
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] border-white/10 shadow-2xl rounded-[32px] p-8 bg-[#0f172a] text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                       <div className="bg-cyan-500 p-2 rounded-xl">
                                          <Brain className="w-5 h-5 text-[#0f172a]" />
                                       </div>
                                       Crear Nuevo Agente
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 font-medium">
                                        Instruye a tu IA con una personalidad específica.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddAgent} className="space-y-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nombre del Agente</label>
                                        <Input 
                                            placeholder="Ej: Agente de Ventas Premium..." 
                                            className="h-12 bg-white/5 border-white/10 rounded-xl text-white"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Prompt del Sistema</label>
                                        <Textarea 
                                            placeholder="Instrucciones para la IA..." 
                                            className="min-h-[200px] bg-white/5 border-white/10 rounded-xl resize-none text-white"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button disabled={isSubmitting} className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] rounded-xl font-black uppercase text-xs tracking-widest">
                                        {isSubmitting ? 'Guardando...' : 'Crear Agente IA'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[32px] bg-white/5" />) }
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="py-20 text-center space-y-4 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
                        <Bot className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-slate-400 font-medium">No se encontraron agentes.</p>
                    </div>
                ) : (
                    <div className={cn(
                        "gap-6",
                        view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
                    )}>
                        <AnimatePresence mode="popLayout">
                            {filteredAgents.map((agent) => (
                                <motion.div
                                    key={agent.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    {view === 'grid' ? (
                                        <Card className="glass-card border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px] overflow-hidden group">
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="bg-cyan-500/10 p-3 rounded-2xl">
                                                        <Brain className="w-6 h-6 text-cyan-400" />
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => { if(confirm('¿Eliminar agente?')) deleteAgent(agent.id); }}
                                                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <CardTitle className="text-xl font-black mt-4 text-white uppercase">{agent.name}</CardTitle>
                                                <CardDescription className="line-clamp-3 text-slate-500 font-medium leading-relaxed min-h-[60px]">
                                                    {agent.prompt_text}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardFooter className="pt-4 border-t border-white/5">
                                               <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                                                  <Sparkles className="w-3 h-3 text-cyan-400" />
                                                  Listo para asignación
                                               </div>
                                            </CardFooter>
                                        </Card>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center justify-between hover:bg-white/10 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                                    <Brain className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white uppercase text-sm">{agent.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[300px]">{agent.prompt_text}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => { if(confirm('¿Eliminar agente?')) deleteAgent(agent.id); }}
                                                    className="rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Agents;