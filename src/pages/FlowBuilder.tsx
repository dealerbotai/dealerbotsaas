import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  addEdge, 
  Node, 
  applyNodeChanges, 
  applyEdgeChanges, 
  NodeChange, 
  EdgeChange,
  ConnectionMode,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  MessageSquare, 
  Zap, 
  Brain, 
  Split, 
  X,
  Play,
  Trash2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import NexusNode from '@/components/flow/NexusNode';

const nodeTypes = {
  nexus: NexusNode,
};

const NODE_CONFIGS = {
  trigger: { label: 'Disparador', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  message: { label: 'Mensaje', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  condition: { label: 'Condición', icon: Split, color: 'text-purple-500', bg: 'bg-purple-500/10', outputs: [{ id: 'true', label: 'Verdadero' }, { id: 'false', label: 'Falso' }] },
  ai_action: { label: 'IA Agente', icon: Brain, color: 'text-green-500', bg: 'bg-green-500/10' },
};

const FlowBuilder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [flowName, setFlowName] = useState('Mi Automatización');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
      style: { stroke: '#f59e0b', strokeWidth: 2 }
    }, eds)),
    []
  );

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const { data: flows = [] } = useQuery({
    queryKey: ['flows'],
    queryFn: async () => {
      const { data, error } = await supabase.from('flows').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveFlow = async () => {
    if (!user) return;
    try {
      const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const workspaceId = member?.workspace_id;
      if (!workspaceId) throw new Error('No se encontró un espacio de trabajo activo');

      // 2. Guardar el flujo
      const flowData: any = {
        workspace_id: workspaceId,
        name: flowName,
        definition: { nodes, edges },
        is_active: true
      };

      // Si tenemos un ID, lo incluimos para actualizar ese registro específico
      // El onConflict por nombre evitará duplicados en el mismo workspace
      if (selectedFlowId) {
        flowData.id = selectedFlowId;
      }

      const { data: savedFlow, error } = await supabase
        .from('flows')
        .upsert(flowData, { 
          onConflict: 'id', // Priorizar la actualización por ID si existe
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        // Si el error es por duplicado de nombre (debido al constraint que añadimos)
        if (error.code === '23505') {
          throw new Error('Ya existe un flujo con este nombre en tu espacio de trabajo.');
        }
        throw error;
      }
      
      setSelectedFlowId(savedFlow.id);
      toast.success('Flujo guardado correctamente');
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message);
    }
  };

  const addNode = (type: keyof typeof NODE_CONFIGS) => {
    const config = NODE_CONFIGS[type];
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'nexus',
      position: { x: 100 + nodes.length * 20, y: 100 + nodes.length * 20 },
      data: {
        ...config,
        description: '',
        keyword: '',
        text: '',
        condition: '',
        prompt: '',
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (id: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const description = updates.keyword || updates.text || updates.condition || updates.prompt || '';
          return {
            ...node,
            data: { ...node.data, ...updates, description },
          };
        }
        return node;
      })
    );
  };

  const deleteSelected = () => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-180px)] flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-nexus-gradient uppercase italic">Constructor de Flujos</h1>
            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.2em] mt-1">Automatización Visual n8n Style</p>
          </div>
          <div className="flex gap-4 items-center">
            <Input 
              value={flowName} 
              onChange={(e) => setFlowName(e.target.value)}
              className="bg-black/40 border-white/10 rounded-full h-10 px-6 w-48 text-sm"
            />
            <Button onClick={saveFlow} className="rounded-full h-10 px-6 font-black gap-2 bg-amber-500 text-black text-xs hover:bg-amber-600 transition-all">
              <Save className="w-4 h-4" /> Guardar
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Sidebar Left: Nodes */}
          <div className="w-64 flex flex-col gap-4">
            <div className="nexus-card p-4 space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nodos</h3>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(NODE_CONFIGS) as Array<keyof typeof NODE_CONFIGS>).map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    onClick={() => addNode(type)}
                    className={cn(
                      "justify-start gap-3 h-12 rounded-xl border border-transparent hover:border-white/10 transition-all",
                      NODE_CONFIGS[type].bg
                    )}
                  >
                    {React.createElement(NODE_CONFIGS[type].icon, { className: cn("w-5 h-5", NODE_CONFIGS[type].color) })}
                    <span className="text-xs font-bold">{NODE_CONFIGS[type].label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="nexus-card p-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mis Flujos</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-6 h-6 rounded-md hover:bg-white/10"
                  onClick={() => {
                    setSelectedFlowId(null);
                    setFlowName('Nueva Automatización');
                    setNodes([]);
                    setEdges([]);
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {flows.map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFlowId(f.id);
                      setFlowName(f.name);
                      const def = f.definition || { nodes: [], edges: [] };
                      setNodes(def.nodes || []);
                      setEdges(def.edges || []);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                  >
                    <p className="text-xs font-bold truncate group-hover:text-amber-500 transition-colors">{f.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 nexus-card relative overflow-hidden bg-black/40">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
            >
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={20} 
                size={1} 
                color="rgba(255,255,255,0.1)" 
              />
              <Controls className="!bg-black/80 !border-white/10 !fill-white" />
            </ReactFlow>
          </div>

          {/* Sidebar Right: Config */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-80 nexus-card p-6 border-l border-white/5 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-widest">Configuración</h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={deleteSelected} className="hover:bg-red-500/20 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedNodeId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {/* Trigger Config */}
                  {selectedNode.data.label === 'Disparador' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Palabra Clave</label>
                      <Input 
                        value={selectedNode.data.keyword as string}
                        onChange={(e) => updateNodeData(selectedNode.id, { keyword: e.target.value })}
                        placeholder="ej: precio, hola"
                        className="bg-black/40 border-white/10 rounded-xl"
                      />
                    </div>
                  )}

                  {/* Message Config */}
                  {selectedNode.data.label === 'Mensaje' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Texto de Respuesta</label>
                      <textarea 
                        value={selectedNode.data.text as string}
                        onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
                        placeholder="Escribe el mensaje..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm min-h-[150px] focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Condition Config */}
                  {selectedNode.data.label === 'Condición' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Si el mensaje contiene...</label>
                      <Input 
                        value={selectedNode.data.condition as string}
                        onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                        placeholder="ej: urgente"
                        className="bg-black/40 border-white/10 rounded-xl"
                      />
                    </div>
                  )}

                  {/* AI Action Config */}
                  {selectedNode.data.label === 'IA Agente' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Instrucción IA (Prompt)</label>
                      <textarea 
                        value={selectedNode.data.prompt as string}
                        onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                        placeholder="ej: Resume el mensaje anterior y ofrece ayuda..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm min-h-[150px] focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
};

export default FlowBuilder;
