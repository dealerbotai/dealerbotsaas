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
    Pencil,
    Settings2,
    CheckCircle2,
    Clock,
    UserPlus
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
import { Badge } from '@/components/ui/badge';

const Agents = () => {
    const { agents, loading, addAgent, updateAgent, deleteAgent } = useWhatsApp();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
    
    const [name, setName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const resetForm = () => {
        setName('');
        setPrompt('');
        setEditingAgent(null);
    };

    const handleOpenEdit = (agent: AIAgent) => {
        setEditingAgent(agent);
        setName(agent.name);
        setPrompt(agent.prompt_text);
        setIsAddOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (editingAgent) {
            await updateAgent(editingAgent.id, name, prompt);
        } else {
            await addAgent(name, prompt);
        }
        setIsSubmitting(false);
        setIsAddOpen(false);
        resetForm();
    };

    const filteredAgents = agents.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.prompt_text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="space-y-10 font-outfit">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Badge variant="secondary" className="mb-4 bg-primary/5 text-primary border-primary/10 px-3 py-1 uppercase tracking-widest text-[10px] font-bold">
                           Gestión de Inteligencia
                        </Badge>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">Agentes de IA</h1>
                        <p className="text-muted-foreground text-base mt-2 font-medium max-w-xl">
                            Configura y personaliza el comportamiento de tus bots para ofrecer una experiencia de cliente superior y automatizada.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <Input 
                                placeholder="Filtrar agentes..." 
                                className="pl-11 h-12 bg-secondary/50 border-border rounded-2xl text-foreground focus:ring-primary/20 focus:border-primary transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-2xl border border-border">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setView('grid')} 
                              className={cn("rounded-xl h-10 w-10 transition-all", view === 'grid' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                              <LayoutGrid className="w-4.5 h-4.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setView('list')} 
                              className={cn("rounded-xl h-10 w-10 transition-all", view === 'list' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                              <LayoutList className="w-4.5 h-4.5" />
                            </Button>
                        </div>

                        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/95 text-white rounded-2xl gap-2 shadow-md shadow-primary/10 h-12 px-6 font-bold uppercase text-[11px] tracking-widest transition-all">
                                    <UserPlus className="w-4 h-4" />
                                    Nuevo Agente
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[650px] border-border shadow-2xl rounded-[2.5rem] p-10 bg-white">
                                <DialogHeader>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="bg-primary/10 p-3 rounded-2xl">
                                            <Brain className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                                                {editingAgent ? 'Editar Parámetros' : 'Configurar Agente'}
                                            </DialogTitle>
                                            <DialogDescription className="text-muted-foreground font-medium text-sm">
                                                {editingAgent ? 'Ajusta la personalidad y directivas del agente seleccionado.' : 'Define una nueva identidad para tu asistente de inteligencia artificial.'}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-8 mt-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[2px] px-1">Identificador del Agente</label>
                                        <Input 
                                            placeholder="Ej: Consultor de Ventas Senior" 
                                            className="h-14 bg-secondary/30 border-border rounded-2xl text-foreground font-medium focus:ring-primary/20 focus:border-primary transition-all"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[2px]">Directivas del Sistema (Prompt)</label>
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">Groq™ optimized</span>
                                        </div>
                                        <Textarea 
                                            placeholder="Describe detalladamente cómo debe comportarse la IA, su tono, restricciones y objetivos..." 
                                            className="min-h-[250px] bg-secondary/30 border-border rounded-2xl resize-none text-foreground font-medium p-6 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            required
                                        />
                                        <p className="text-[10px] text-muted-foreground font-medium px-1 italic">
                                            * Un prompt detallado mejora significativamente la precisión de las respuestas.
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setIsAddOpen(false)}
                                            className="flex-1 h-14 border-border text-muted-foreground font-bold rounded-2xl uppercase text-[11px] tracking-widest hover:bg-secondary/50"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button disabled={isSubmitting} className="flex-[2] h-14 bg-primary hover:bg-primary/95 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-md shadow-primary/10">
                                            {isSubmitting ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 animate-pulse" /> Procesando...
                                                </div>
                                            ) : editingAgent ? 'Guardar Cambios' : 'Desplegar Agente'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] bg-secondary/50 animate-pulse" />) }
                    </div>
                ) : filteredAgents.length === 0 ? (
                    <div className="py-24 text-center space-y-6 bg-secondary/30 rounded-[3rem] border-2 border-dashed border-border flex flex-col items-center justify-center">
                        <div className="bg-white p-6 rounded-full shadow-sm">
                            <Bot className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">Sin agentes configurados</h3>
                            <p className="text-muted-foreground font-medium max-w-xs mx-auto">Comienza creando tu primer agente de IA para automatizar tus canales.</p>
                        </div>
                        <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-xl border-primary/20 text-primary font-bold">
                            <Plus className="w-4 h-4 mr-2" /> Crear mi primer agente
                        </Button>
                    </div>
                ) : (
                    <div className={cn(
                        "gap-8",
                        view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
                    )}>
                        <AnimatePresence mode="popLayout">
                            {filteredAgents.map((agent) => (
                                <motion.div
                                    key={agent.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {view === 'grid' ? (
                                        <Card className="bg-white border-border shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2.5rem] overflow-hidden group flex flex-col h-full">
                                            <CardHeader className="p-8 pb-4 flex-grow">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="bg-secondary/50 p-4 rounded-2xl group-hover:bg-primary/5 transition-colors">
                                                        <Brain className="w-7 h-7 text-primary" />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleOpenEdit(agent)}
                                                            className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => { if(confirm('¿Confirmas la eliminación de este agente?')) deleteAgent(agent.id); }}
                                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-bold text-foreground mb-3">{agent.name}</CardTitle>
                                                <CardDescription className="line-clamp-4 text-muted-foreground font-medium leading-relaxed text-sm">
                                                    {agent.prompt_text}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardFooter className="p-8 pt-0 mt-auto">
                                               <div className="w-full flex items-center justify-between border-t border-border/50 pt-6">
                                                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                                     <CheckCircle2 className="w-3.5 h-3.5" />
                                                     Operativo
                                                  </div>
                                                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                     {new Date(agent.created_at || '').toLocaleDateString()}
                                                  </div>
                                               </div>
                                            </CardFooter>
                                        </Card>
                                    ) : (
                                        <div className="bg-white border border-border rounded-[2rem] p-6 flex items-center justify-between hover:shadow-lg transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary group-hover:bg-primary/5 transition-colors">
                                                    <Brain className="w-7 h-7" />
                                                </div>
                                                <div className="max-w-md">
                                                    <h3 className="font-bold text-foreground text-lg">{agent.name}</h3>
                                                    <p className="text-xs font-medium text-muted-foreground truncate leading-relaxed">
                                                        {agent.prompt_text}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pr-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider mr-4">
                                                   <Sparkles className="w-3 h-3" /> Auto-response
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleOpenEdit(agent)}
                                                    className="rounded-xl hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
                                                >
                                                    <Pencil className="w-4.5 h-4.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => { if(confirm('¿Confirmas la eliminación?')) deleteAgent(agent.id); }}
                                                    className="rounded-xl hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-all"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
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