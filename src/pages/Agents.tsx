import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, User, Search, MoreVertical, Trash2, Edit2, CheckCircle2, XCircle, Brain, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Agent } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const PREDEFINED_QUALITIES = [
  "Amigable", "Profesional", "Entusiasta", "Conciso", "Detallista", 
  "Empático", "Persuasivo", "Divertido", "Sarcástico", "Formal",
  "Informal", "Técnico", "Paciente", "Directo", "Creativo"
];

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [flows, setFlows] = useState<any[]>([]);
  
  // Inline flow creation state
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowKeyword, setNewFlowKeyword] = useState('');
  const [newFlowResponse, setNewFlowResponse] = useState('');
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    gender: 'masculino',
    personality_mode: 'prompt',
    prompt_text: '',
    selected_qualities: [],
    flow_id: undefined,
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
    fetchFlows();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await api.getAgents();
      setAgents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFlows = async () => {
    try {
      const { data, error } = await supabase.from('flows').select('id, name');
      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error("Error fetching flows:", error);
    }
  };

  const handleCreateInlineFlow = async () => {
    const { user } = (await supabase.auth.getSession()).data.session || {};
    if (!user) {
      toast({ title: "Error", description: "No se encontró sesión de usuario", variant: "destructive" });
      return;
    }

    if (!newFlowName || !newFlowKeyword || !newFlowResponse) {
      toast({ title: "Campos incompletos", description: "Por favor completa todos los campos del flujo", variant: "destructive" });
      return;
    }

    try {
      setIsSavingFlow(true);
      
      // Get workspace_id
      const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const workspaceId = member?.workspace_id;
      if (!workspaceId) throw new Error('No se encontró un espacio de trabajo activo');

      // Create a basic flow definition
      const triggerId = `node-${Date.now()}`;
      const messageId = `node-${Date.now() + 1}`;
      
      const definition = {
        nodes: [
          {
            id: triggerId,
            type: 'nexus',
            position: { x: 100, y: 100 },
            data: { label: 'Disparador', icon: 'Zap', color: 'text-amber-500', bg: 'bg-amber-500/10', keyword: newFlowKeyword, description: `Keyword: ${newFlowKeyword}` }
          },
          {
            id: messageId,
            type: 'nexus',
            position: { x: 400, y: 100 },
            data: { label: 'Mensaje', icon: 'MessageSquare', color: 'text-blue-500', bg: 'bg-blue-500/10', text: newFlowResponse, description: `Texto: ${newFlowResponse.slice(0, 20)}...` }
          }
        ],
        edges: [
          {
            id: `edge-${Date.now()}`,
            source: triggerId,
            target: messageId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#f59e0b', strokeWidth: 2 }
          }
        ]
      };

      const { data: savedFlow, error } = await supabase
        .from('flows')
        .insert({
          workspace_id: workspaceId,
          name: newFlowName,
          definition,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Flujo creado", description: `El flujo "${newFlowName}" ha sido creado y asignado.` });
      
      // Update local state
      await fetchFlows();
      setFormData({ ...formData, flow_id: savedFlow.id });
      setIsCreatingFlow(false);
      setNewFlowName('');
      setNewFlowKeyword('');
      setNewFlowResponse('');
    } catch (error: any) {
      toast({ title: "Error al crear flujo", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingFlow(false);
    }
  };

  const handleOpenModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData(agent);
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        gender: 'masculino',
        personality_mode: 'prompt',
        prompt_text: '',
        selected_qualities: [],
        flow_id: undefined,
        is_active: true
      });
    }
    setIsCreatingFlow(false); // Reset inline creation state
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "Campo obligatorio",
        description: "El nombre del agente es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingAgent) {
        await api.updateAgent(editingAgent.id, formData);
        toast({ title: "Agente actualizado", description: "Los cambios se guardaron correctamente" });
      } else {
        await api.createAgent(formData);
        toast({ title: "Agente creado", description: "El nuevo agente ha sido registrado" });
      }
      setIsModalOpen(false);
      fetchAgents();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el agente",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este agente?')) return;
    try {
      await api.deleteAgent(id);
      toast({ title: "Agente eliminado" });
      fetchAgents();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el agente", variant: "destructive" });
    }
  };

  const toggleQuality = (quality: string) => {
    const current = formData.selected_qualities || [];
    if (current.includes(quality)) {
      setFormData({ ...formData, selected_qualities: current.filter(q => q !== quality) });
    } else {
      setFormData({ ...formData, selected_qualities: [...current, quality] });
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-nexus-gradient uppercase italic">Agentes IA</h1>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] mt-1">Crea y Personaliza tus Entidades Inteligentes</p>
          </div>
          <Button 
            onClick={() => handleOpenModal()} 
            className="rounded-full h-14 px-8 font-black gap-3 bg-gradient-to-r from-purple-500 to-purple-300 text-black shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" /> Crear Nuevo Agente
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input 
            placeholder="Buscar agentes..." 
            className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-purple-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-[32px] bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAgents.map((agent) => (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="nexus-card p-6 border-t-2 border-white/5 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <User className="w-7 h-7 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-white tracking-tight">{agent.name}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/10 bg-white/5">
                          {agent.gender}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(agent)} className="rounded-xl hover:bg-white/5">
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(agent.id)} className="rounded-xl hover:bg-red-500/5 hover:text-red-500">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                      <Brain className="w-4 h-4" />
                      <span className="uppercase tracking-widest">Modo: {agent.personality_mode}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 min-h-[60px]">
                      {agent.personality_mode === 'prompt' && (
                        <p className="text-xs text-gray-500 line-clamp-2 italic">"{agent.prompt_text || 'Sin prompt definido'}"</p>
                      )}
                      {agent.personality_mode === 'qualities' && (
                        <div className="flex flex-wrap gap-1">
                          {agent.selected_qualities?.map(q => (
                            <Badge key={q} variant="secondary" className="text-[9px] bg-purple-500/20 text-purple-300 border-none uppercase">
                              {q}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {agent.personality_mode === 'flow' && (
                        <p className="text-xs text-gray-500 italic">Usando flujo personalizado</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {agent.is_active ? (
                        <div className="flex items-center gap-1.5 text-green-500 font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-500 font-black text-[10px] uppercase tracking-widest">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-gray-600">ID: {agent.id.slice(0,8)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[700px] bg-[#0d0e12] border-white/10 text-white rounded-[32px] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic text-nexus-gradient">
                {editingAgent ? 'Editar Agente' : 'Nuevo Agente'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                Configura los Atributos y Personalidad de tu Entidad
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Nombre del Agente</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Max Vendedor" 
                    className="bg-white/5 border-white/10 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Sexo / Género</Label>
                  <Select 
                    value={formData.gender}
                    onValueChange={(val: any) => setFormData({ ...formData, gender: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0e12] border-white/10 text-white rounded-xl">
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="no_binario">No Binario</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Configuración de Personalidad</Label>
                <Tabs 
                  value={formData.personality_mode} 
                  onValueChange={(val: any) => setFormData({ ...formData, personality_mode: val })}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 rounded-2xl p-1 h-14 border border-white/5">
                    <TabsTrigger value="prompt" className="rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-black font-black text-[10px] uppercase tracking-widest gap-2">
                      <MessageSquare className="w-4 h-4" /> Prompt
                    </TabsTrigger>
                    <TabsTrigger value="qualities" className="rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-black font-black text-[10px] uppercase tracking-widest gap-2">
                      <Sparkles className="w-4 h-4" /> Cualidades
                    </TabsTrigger>
                    <TabsTrigger value="flow" className="rounded-xl data-[state=active]:bg-purple-500 data-[state=active]:text-black font-black text-[10px] uppercase tracking-widest gap-2">
                      <Brain className="w-4 h-4" /> Flujo
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 p-6 rounded-3xl bg-white/5 border border-white/5 min-h-[250px]">
                    <TabsContent value="prompt" className="mt-0 space-y-4">
                      <p className="text-[11px] text-gray-400 font-medium italic">Define el comportamiento del agente mediante instrucciones de texto libre.</p>
                      <Textarea 
                        placeholder="Eres un experto en ventas, amable y directo..."
                        className="min-h-[150px] bg-black/20 border-white/5 rounded-2xl focus:ring-purple-500/20"
                        value={formData.prompt_text}
                        onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                      />
                    </TabsContent>

                    <TabsContent value="qualities" className="mt-0 space-y-4">
                      <p className="text-[11px] text-gray-400 font-medium italic">Selecciona las cualidades que definirán el tono del agente.</p>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_QUALITIES.map(quality => (
                          <Button
                            key={quality}
                            variant="outline"
                            size="sm"
                            onClick={() => toggleQuality(quality)}
                            className={cn(
                              "rounded-full border-white/10 text-[10px] uppercase tracking-widest font-bold h-9 px-4 transition-all",
                              formData.selected_qualities?.includes(quality) 
                                ? "bg-purple-500 text-black border-purple-500 scale-105" 
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            )}
                          >
                            {quality}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="flow" className="mt-0 space-y-4">
                      <p className="text-[11px] text-gray-400 font-medium italic">Asigna un flujo lógico prediseñado como la personalidad del agente.</p>
                      
                      {!isCreatingFlow && (
                        <div className="space-y-4">
                          <Select 
                            value={formData.flow_id}
                            onValueChange={(val) => setFormData({ ...formData, flow_id: val })}
                          >
                            <SelectTrigger className="bg-black/20 border-white/5 rounded-2xl h-14">
                              <SelectValue placeholder="Seleccionar un flujo de automatización" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0d0e12] border-white/10 text-white rounded-xl">
                              {flows.map(flow => (
                                <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex flex-col gap-3">
                            {flows.length === 0 && (
                              <p className="text-xs text-amber-500/80 px-2 italic">No tienes flujos creados. Comienza creando uno aquí mismo.</p>
                            )}
                            <Button 
                              variant="outline" 
                              onClick={() => setIsCreatingFlow(true)}
                              className="w-full rounded-2xl h-12 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-purple-500/50 transition-all gap-2"
                            >
                              <Plus className="w-4 h-4" /> Crear Nuevo Flujo Directo
                            </Button>
                          </div>
                        </div>
                      )}

                      {isCreatingFlow && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 bg-black/40 p-5 rounded-[24px] border border-white/5"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500">Nuevo Flujo Rápido</h4>
                            <Button variant="ghost" size="icon" onClick={() => setIsCreatingFlow(false)} className="w-6 h-6 rounded-full">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-bold text-gray-500 ml-1">Nombre del Flujo</Label>
                              <Input 
                                placeholder="Ej: Venta Zapatos" 
                                value={newFlowName}
                                onChange={(e) => setNewFlowName(e.target.value)}
                                className="h-10 bg-white/5 border-white/5 rounded-xl text-sm"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase font-bold text-gray-500 ml-1">Palabra Clave</Label>
                                <Input 
                                  placeholder="Ej: hola" 
                                  value={newFlowKeyword}
                                  onChange={(e) => setNewFlowKeyword(e.target.value)}
                                  className="h-10 bg-white/5 border-white/5 rounded-xl text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[9px] uppercase font-bold text-gray-500 ml-1">Respuesta</Label>
                                <Input 
                                  placeholder="Ej: ¡Hola! ¿En qué puedo ayudarte?" 
                                  value={newFlowResponse}
                                  onChange={(e) => setNewFlowResponse(e.target.value)}
                                  className="h-10 bg-white/5 border-white/5 rounded-xl text-sm"
                                />
                              </div>
                            </div>

                            <Button 
                              onClick={handleCreateInlineFlow}
                              disabled={isSavingFlow}
                              className="w-full mt-2 rounded-xl h-11 bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500 hover:text-black transition-all font-bold uppercase tracking-widest text-[10px]"
                            >
                              {isSavingFlow ? 'Guardando...' : 'Crear y Asignar Flujo'}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>

            <DialogFooter className="mt-6 gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-12 px-6 font-bold text-gray-400">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[11px] bg-purple-500 text-black hover:bg-purple-400 transition-colors">
                Guardar Agente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Agents;
