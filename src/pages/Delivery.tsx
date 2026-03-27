import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search, Trash2, Edit2, Truck, Phone, User, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, DeliveryPerson } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Delivery = () => {
  const [personnel, setPersonnel] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DeliveryPerson | null>(null);
  const [formData, setFormData] = useState<Partial<DeliveryPerson>>({
    name: '',
    phone: '',
    vehicle: '',
    status: 'available',
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const data = await api.getDeliveryPersonnel();
      setPersonnel(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los repartidores", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (person?: DeliveryPerson) => {
    if (person) {
      setEditingPerson(person);
      setFormData(person);
    } else {
      setEditingPerson(null);
      setFormData({ name: '', phone: '', vehicle: '', status: 'available', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Campo obligatorio", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    try {
      if (editingPerson) {
        await api.updateDeliveryPerson(editingPerson.id, formData);
        toast({ title: "Repartidor actualizado" });
      } else {
        await api.createDeliveryPerson(formData);
        toast({ title: "Repartidor creado" });
      }
      setIsModalOpen(false);
      fetchPersonnel();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar a este repartidor?')) return;
    try {
      await api.deleteDeliveryPerson(id);
      toast({ title: "Repartidor eliminado" });
      fetchPersonnel();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  };

  const filteredPersonnel = personnel.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vehicle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    available: 'text-green-500 bg-green-500/10 border-green-500/20',
    busy: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    offline: 'text-gray-500 bg-gray-500/10 border-gray-500/20'
  };

  const statusIcons = {
    available: CheckCircle2,
    busy: Clock,
    offline: XCircle
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-dealerbot-gradient uppercase italic">Mantenimiento de Repartidores</h1>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] mt-1">Gestión de Logística y Flota</p>
          </div>
          <Button 
            onClick={() => handleOpenModal()} 
            className="rounded-full h-14 px-8 font-black gap-3 bg-gradient-to-r from-blue-500 to-blue-300 text-black shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" /> Añadir Nuevo Repartidor
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input 
            placeholder="Buscar por nombre o vehículo..." 
            className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-[32px] bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredPersonnel.map((person) => {
                const StatusIcon = statusIcons[person.status];
                return (
                  <motion.div
                    key={person.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="dealerbot-card p-6 border-t-2 border-white/5 group relative"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <User className="w-7 h-7 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-white tracking-tight">{person.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-widest border", statusColors[person.status])}>
                            <StatusIcon className="w-3 h-3 mr-1" /> {person.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(person)} className="rounded-xl hover:bg-white/5">
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(person.id)} className="rounded-xl hover:bg-red-500/5 hover:text-red-500">
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <Phone className="w-4 h-4 text-blue-500/50" />
                        {person.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <Truck className="w-4 h-4 text-blue-500/50" />
                        {person.vehicle || 'N/A'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-[#0d0e12] border-white/10 text-white rounded-[32px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic text-dealerbot-gradient">
                {editingPerson ? 'Editar Repartidor' : 'Nuevo Repartidor'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                Configura los datos del personal de entrega
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nombre Completo</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez" 
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Teléfono</Label>
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+123456789" 
                    className="bg-white/5 border-white/10 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Vehículo</Label>
                  <Input 
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    placeholder="Ej: Moto Honda" 
                    className="bg-white/5 border-white/10 rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Estado de Disponibilidad</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0e12] border-white/10 text-white rounded-xl">
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="busy">En camino / Ocupado</SelectItem>
                    <SelectItem value="offline">Desconectado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6 gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-12 px-6 font-bold text-gray-400">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[11px] bg-blue-500 text-black hover:bg-blue-400 transition-colors">
                Guardar Repartidor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Delivery;