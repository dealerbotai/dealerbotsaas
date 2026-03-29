import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp, Store, Product } from '@/hooks/use-whatsapp-instances';
import { supabase } from '@/lib/supabase';
import { 
    Store as StoreIcon, 
    Plus, 
    Trash2, 
    Package, 
    ArrowRight,
    Globe,
    Loader2,
    RefreshCcw,
    Image as ImageIcon,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Search,
    LayoutGrid,
    LayoutList,
    PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardContent,
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

const Stores = () => {
    const { stores, loading, addStore, deleteStore, scrapeUrl, scraping, addProductManually } = useWhatsApp();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isManualProductOpen, setIsManualProductOpen] = useState(false);
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [storeProducts, setStoreProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [scannerUrl, setScannerUrl] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [storeSearchQuery, setStoreSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [manualProduct, setManualProduct] = useState({
        name: '',
        price: '',
        description: '',
        image_base64: ''
    });

    const fetchStoreProducts = async (storeId: string) => {
        setLoadingProducts(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStoreProducts(data || []);
        } catch (error: any) {
            toast.error('Error al cargar productos: ' + error.message);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (selectedStore) {
            fetchStoreProducts(selectedStore.id);
        }
    }, [selectedStore]);

    const handleAddStore = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await addStore(name);
        setIsSubmitting(false);
        setIsAddOpen(false);
        setName('');
    };

    const handleAddManualProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore) return;
        setIsSubmitting(true);
        const product = await addProductManually({
            ...manualProduct,
            price: parseFloat(manualProduct.price),
            store_id: selectedStore.id
        });
        if (product) {
            setStoreProducts(prev => [product, ...prev]);
            setIsManualProductOpen(false);
            setManualProduct({ name: '', price: '', description: '', image_base64: '' });
        }
        setIsSubmitting(false);
    };

    const handleScrape = async () => {
        if (!scannerUrl || !selectedStore) return;
        await scrapeUrl(scannerUrl, selectedStore.id);
        fetchStoreProducts(selectedStore.id);
    };

    const toggleProductStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setStoreProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
            toast.success('Estado actualizado');
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('¿Eliminar producto?')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setStoreProducts(prev => prev.filter(p => p.id !== id));
            toast.success('Producto eliminado');
        } catch (error: any) {
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const filteredProducts = storeProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : 
                             statusFilter === 'active' ? p.is_active : !p.is_active;
        return matchesSearch && matchesStatus;
    });

    const filteredStores = stores.filter(s => 
        s.name.toLowerCase().includes(storeSearchQuery.toLowerCase())
    );

    if (selectedStore) {
        return (
            <MainLayout>
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setSelectedStore(null)}>
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight">{selectedStore.name}</h1>
                                <p className="text-sm text-slate-400 font-medium">Gestión de catálogo y escáner.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Dialog open={isManualProductOpen} onOpenChange={setIsManualProductOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl gap-2 h-11 px-5 font-bold">
                                        <PlusCircle className="w-4 h-4" /> Añadir Manual
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] border-white/10 shadow-2xl rounded-[32px] p-8 bg-[#0f172a] text-white">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                           <div className="bg-cyan-500 p-2 rounded-xl">
                                              <Package className="w-5 h-5 text-[#0f172a]" />
                                           </div>
                                           Producto Manual
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddManualProduct} className="space-y-5 mt-6">
                                        <Input placeholder="Nombre" className="h-12 bg-white/5 border-white/10 rounded-xl text-white" value={manualProduct.name} onChange={(e) => setManualProduct({...manualProduct, name: e.target.value})} required />
                                        <Input type="number" step="0.01" placeholder="Precio" className="h-12 bg-white/5 border-white/10 rounded-xl text-white" value={manualProduct.price} onChange={(e) => setManualProduct({...manualProduct, price: e.target.value})} required />
                                        <Textarea placeholder="Descripción" className="bg-white/5 border-white/10 rounded-xl text-white min-h-[100px]" value={manualProduct.description} onChange={(e) => setManualProduct({...manualProduct, description: e.target.value})} />
                                        <Button disabled={isSubmitting} className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] rounded-xl font-black uppercase text-xs tracking-widest">
                                            {isSubmitting ? 'Guardando...' : 'Añadir al Catálogo'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-1 rounded-[32px] border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden">
                            <CardHeader className="bg-white/5 pb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-cyan-500 rounded-xl">
                                        <Globe className="w-5 h-5 text-[#0f172a]" />
                                    </div>
                                    <CardTitle className="text-xl font-black text-white">Escáner</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <Input placeholder="https://tienda.com/categoria" className="h-12 bg-white/5 border-white/10 rounded-xl text-white" value={scannerUrl} onChange={(e) => setScannerUrl(e.target.value)} />
                                <Button className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] rounded-xl font-bold gap-2 ai-glow-hover" onClick={handleScrape} disabled={scraping || !scannerUrl}>
                                    {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                    {scraping ? 'Escaneando...' : 'Iniciar Sincronización'}
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input placeholder="Buscar productos..." className="pl-10 h-11 bg-white/5 border-white/10 rounded-2xl text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                                    <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')} className={cn("rounded-xl px-4 h-9 text-xs font-bold", statusFilter === 'all' && "bg-white/10 text-cyan-400")}>Todos</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setStatusFilter('active')} className={cn("rounded-xl px-4 h-9 text-xs font-bold", statusFilter === 'active' && "bg-white/10 text-cyan-400")}>Activos</Button>
                                </div>
                            </div>

                            {loadingProducts ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl bg-white/5" />)}
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="py-20 text-center space-y-4 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
                                    <Package className="w-12 h-12 text-slate-600 mx-auto" />
                                    <p className="text-slate-400 font-medium">No hay productos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredProducts.map((product) => (
                                        <div key={product.id} className="bg-white/5 rounded-[24px] border border-white/10 p-4 flex gap-4 hover:bg-white/10 transition-all group">
                                            <div className="w-24 h-24 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/10">
                                                {product.image_base64 ? (
                                                    <img src={product.image_base64} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                        <ImageIcon className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-black text-white truncate uppercase text-sm">{product.name}</h4>
                                                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{product.description}</p>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-black text-cyan-400">${product.price}</span>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteProduct(product.id)}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg", product.is_active ? "text-green-500 hover:bg-green-500/10" : "text-slate-500 hover:bg-white/10")} onClick={() => toggleProductStatus(product.id, product.is_active)}>
                                                            {product.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Tiendas</h1>
                        <p className="text-slate-400 text-sm font-medium">Organiza tus productos por marcas o sucursales.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input placeholder="Buscar tiendas..." className="pl-10 h-11 bg-white/5 border-white/10 rounded-2xl text-white" value={storeSearchQuery} onChange={(e) => setStoreSearchQuery(e.target.value)} />
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
                                    <Plus className="w-4 h-4" /> Nueva Tienda
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[450px] border-white/10 shadow-2xl rounded-[32px] p-8 bg-[#0f172a] text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                       <div className="bg-cyan-500 p-2 rounded-xl">
                                          <StoreIcon className="w-5 h-5 text-[#0f172a]" />
                                       </div>
                                       Crear Tienda
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddStore} className="space-y-6 mt-6">
                                    <Input placeholder="Nombre de la Tienda" className="h-12 bg-white/5 border-white/10 rounded-xl text-white" value={name} onChange={(e) => setName(e.target.value)} required />
                                    <Button disabled={isSubmitting} className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] rounded-xl font-black uppercase text-xs tracking-widest ai-glow-hover">
                                        {isSubmitting ? 'Guardando...' : 'Crear Tienda'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className={cn(
                    "gap-6",
                    view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
                )}>
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[32px] bg-white/5" />)
                        ) : filteredStores.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 text-center">
                                <StoreIcon className="w-12 h-12 text-slate-600 mb-4" />
                                <h3 className="text-lg font-bold text-white">No hay tiendas</h3>
                            </div>
                        ) : (
                            filteredStores.map((store) => (
                                <motion.div
                                    key={store.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    {view === 'grid' ? (
                                        <Card className="glass-card border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px] overflow-hidden group cursor-pointer" onClick={() => setSelectedStore(store)}>
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="bg-cyan-500/10 p-3 rounded-2xl">
                                                        <StoreIcon className="w-6 h-6 text-cyan-400" />
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar tienda?')) deleteStore(store.id); }} className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <CardTitle className="text-xl font-black mt-4 text-white uppercase">{store.name}</CardTitle>
                                                <CardDescription className="text-slate-500 font-medium">ID: {store.id.slice(0,8)}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="pt-4 border-t border-white/5 flex justify-between items-center">
                                               <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                                                  <Package className="w-3 h-3" /> Gestionar Catálogo
                                               </div>
                                               <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                            </CardFooter>
                                        </Card>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center justify-between hover:bg-white/10 transition-all group cursor-pointer" onClick={() => setSelectedStore(store)}>
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                                    <StoreIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white uppercase text-sm">{store.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: {store.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar tienda?')) deleteStore(store.id); }} className="rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout>
    );
};

export default Stores;