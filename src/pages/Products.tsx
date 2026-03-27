import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreVertical, Trash2, Edit2, Package, ShoppingBag, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Product } from '@/lib/api';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    category: '',
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: 0, description: '', category: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({ title: "Campos obligatorios", description: "El nombre y precio son requeridos", variant: "destructive" });
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        toast({ title: "Producto actualizado" });
      } else {
        await api.createProduct(formData);
        toast({ title: "Producto creado" });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el producto", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.deleteProduct(id);
      toast({ title: "Producto eliminado" });
      fetchProducts();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "destructive" });
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-dealerbot-gradient uppercase italic">Mantenimiento de Productos</h1>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] mt-1">Gestión Local de Catálogo y Precios</p>
          </div>
          <Button 
            onClick={() => handleOpenModal()} 
            className="rounded-full h-14 px-8 font-black gap-3 bg-gradient-to-r from-amber-500 to-amber-300 text-black shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" /> Añadir Nuevo Producto
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input 
            placeholder="Buscar productos o categorías..." 
            className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 rounded-[32px] bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="dealerbot-card p-6 border-t-2 border-white/5 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(product)} className="rounded-xl hover:bg-white/5">
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="rounded-xl hover:bg-red-500/5 hover:text-red-500">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-black text-lg text-white tracking-tight line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 text-amber-500 font-bold">
                      <DollarSign className="w-4 h-4" />
                      <span>{product.price.toLocaleString()}</span>
                    </div>
                    {product.category && (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/10 bg-white/5">
                        <Tag className="w-3 h-3 mr-1" /> {product.category}
                      </Badge>
                    )}
                    <p className="text-xs text-gray-500 line-clamp-2 mt-2 h-8">{product.description || 'Sin descripción'}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-[#0d0e12] border-white/10 text-white rounded-[32px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic text-dealerbot-gradient">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                Define los detalles de tu producto para el catálogo IA
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nombre del Producto</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Camiseta de Algodón" 
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Precio</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="bg-white/5 border-white/10 rounded-xl h-12 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Categoría</Label>
                  <Input 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej: Ropa" 
                    className="bg-white/5 border-white/10 rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Descripción</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe las características del producto..."
                  className="bg-white/5 border-white/10 rounded-xl min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl h-12 px-6 font-bold text-gray-400">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[11px] bg-amber-500 text-black hover:bg-amber-400 transition-colors">
                Guardar Producto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Products;