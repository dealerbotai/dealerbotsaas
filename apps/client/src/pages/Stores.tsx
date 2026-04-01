import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp, Store, Product } from '@/hooks/use-whatsapp-instances';
import { supabase } from '@/lib/supabase';
import { CSVImporter } from '@/components/catalog/CSVImporter';
import { 
    Store as StoreIcon, 
    Plus, 
    Trash2, 
    Package, 
    ArrowRight,
    Loader2,
    Image as ImageIcon,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Search,
    LayoutGrid,
    LayoutList,
    Table as TableIcon,
    PlusCircle,
    FileUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { sileo as toast } from 'sileo';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

const Stores = () => {
    const { stores, loading, addStore, deleteStore, addProductManually } = useWhatsApp();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isManualProductOpen, setIsManualProductOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [storeProducts, setStoreProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [productView, setProductView] = useState<'grid' | 'list' | 'table'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [storeSearchQuery, setStoreSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [manualProduct, setManualProduct] = useState({
        name: '',
        handle: '',
        category: '',
        price: '',
        stock: '0',
        description: '',
        image_url: '',
        image_base64: ''
    });

    const categories = ['all', ...new Set(storeProducts.map(p => p.category).filter(Boolean))];

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
        const promise = addStore(name).then(() => {
            setIsAddOpen(false);
            setName('');
            return 'Tienda creada correctamente';
        });

        toast.promise(promise, {
            loading: 'Creando tienda...',
            success: (data) => data as string,
            error: 'Error al crear la tienda'
        });
        setIsSubmitting(false);
    };

    const handleAddManualProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore) return;
        setIsSubmitting(true);
        
        const promise = addProductManually({
            ...manualProduct,
            price: parseFloat(manualProduct.price),
            stock: parseInt(manualProduct.stock) || 0,
            store_id: selectedStore.id
        }).then((product) => {
            if (product) {
                setStoreProducts(prev => [product, ...prev]);
                setIsManualProductOpen(false);
                setManualProduct({ 
                    name: '', 
                    handle: '', 
                    category: '', 
                    price: '', 
                    stock: '0', 
                    description: '', 
                    image_url: '', 
                    image_base64: '' 
                });
                return 'Producto añadido con éxito';
            }
            throw new Error('No se pudo añadir el producto');
        });

        toast.promise(promise, {
            loading: 'Añadiendo producto...',
            success: (data) => data as string,
            error: (err: any) => 'Error: ' + err.message
        });
        setIsSubmitting(false);
    };

    const toggleProductStatus = async (id: string, currentStatus: boolean) => {
        const promise = (async () => {
            const { error } = await supabase
                .from('products')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setStoreProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
            return 'Estado actualizado';
        })();

        toast.promise(promise, {
            loading: 'Actualizando estado...',
            success: (data) => data as string,
            error: (err: any) => 'Error: ' + err.message
        });
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('¿Eliminar producto?')) return;
        
        const promise = (async () => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setStoreProducts(prev => prev.filter(p => p.id !== id));
            return 'Producto eliminado';
        })();

        toast.promise(promise, {
            loading: 'Eliminando producto...',
            success: (data) => data as string,
            error: (err: any) => 'Error al eliminar: ' + err.message
        });
    };

    const filteredProducts = storeProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : 
                             statusFilter === 'active' ? p.is_active : !p.is_active;
        const matchesCategory = selectedCategory === 'all' ? true : p.category === selectedCategory;
        return matchesSearch && matchesStatus && matchesCategory;
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
                            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 shadow-sm bg-card/50 text-foreground hover:bg-card" onClick={() => setSelectedStore(null)}>
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-black text-foreground tracking-tight">{selectedStore.name}</h1>
                                <p className="text-sm text-muted-foreground font-medium">Gestión de catálogo e importación.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10 rounded-xl gap-2 h-11 px-5 font-bold">
                                        <FileUp className="w-4 h-4" /> Importar CSV
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[800px] border-border/10 shadow-2xl rounded-[40px] p-0 overflow-hidden bg-background">
                                    <CSVImporter storeId={selectedStore.id} onComplete={() => { fetchStoreProducts(selectedStore.id); setIsImportOpen(false); }} />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isManualProductOpen} onOpenChange={setIsManualProductOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/10 rounded-xl gap-2 h-11 px-5 font-bold">
                                        <PlusCircle className="w-4 h-4" /> Añadir Manual
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] border-border/10 shadow-2xl rounded-[32px] p-8 bg-background text-foreground">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                           <div className="bg-primary p-2 rounded-xl">
                                              <Package className="w-5 h-5 text-primary-foreground" />
                                           </div>
                                           Producto Manual
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddManualProduct} className="space-y-5 mt-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre</Label>
                                                <Input placeholder="Ej. Camiseta" className="h-12 bg-card border-border/10 rounded-xl text-foreground" value={manualProduct.name} onChange={(e) => setManualProduct({...manualProduct, name: e.target.value})} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Handle (URL)</Label>
                                                <Input placeholder="ej-camiseta" className="h-12 bg-card border-border/10 rounded-xl text-foreground" value={manualProduct.handle} onChange={(e) => setManualProduct({...manualProduct, handle: e.target.value})} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Categoría</Label>
                                                <Input placeholder="Ropa" className="h-12 bg-card border-border/10 rounded-xl text-foreground" value={manualProduct.category} onChange={(e) => setManualProduct({...manualProduct, category: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Precio</Label>
                                                <Input type="number" step="0.01" placeholder="0.00" className="h-12 bg-card border-border/10 rounded-xl text-foreground" value={manualProduct.price} onChange={(e) => setManualProduct({...manualProduct, price: e.target.value})} required />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Stock</Label>
                                                <Input type="number" placeholder="0" className="h-12 bg-card border-border/10 rounded-xl text-foreground" value={manualProduct.stock} onChange={(e) => setManualProduct({...manualProduct, stock: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Imagen URL</Label>
                                                <Input placeholder="https://..." className="h-12 bg-card border-border/10 rounded-xl text-foreground" value={manualProduct.image_url} onChange={(e) => setManualProduct({...manualProduct, image_url: e.target.value})} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Descripción</Label>
                                            <Textarea placeholder="Descripción del producto..." className="bg-card border-border/10 rounded-xl text-foreground min-h-[80px]" value={manualProduct.description} onChange={(e) => setManualProduct({...manualProduct, description: e.target.value})} />
                                        </div>

                                        <Button disabled={isSubmitting} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                                            {isSubmitting ? 'Guardando...' : 'Añadir al Catálogo'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Buscar productos..." className="pl-10 h-11 bg-card/50 shadow-sm rounded-2xl text-foreground" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                {categories.length > 1 && (
                                    <div className="flex items-center gap-1.5 bg-card/50 p-1 rounded-2xl border shadow-sm overflow-x-auto max-w-xs sm:max-w-none no-scrollbar">
                                        {categories.map((cat) => (
                                            <Button 
                                                key={cat}
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setSelectedCategory(cat)} 
                                                className={cn(
                                                    "rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-widest transition-all", 
                                                    selectedCategory === cat ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-card hover:text-foreground"
                                                )}
                                            >
                                                {cat === 'all' ? 'Todas' : cat}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 bg-card/50 p-1 rounded-2xl border shadow-sm">
                                    <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')} className={cn("rounded-xl px-4 h-9 text-xs font-bold", statusFilter === 'all' && "bg-card text-primary")}>Todos</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setStatusFilter('active')} className={cn("rounded-xl px-4 h-9 text-xs font-bold", statusFilter === 'active' && "bg-card text-primary")}>Activos</Button>
                                </div>

                                <div className="flex items-center gap-2 bg-card/50 p-1 rounded-2xl border shadow-sm">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setProductView('grid')} 
                                        className={cn("rounded-xl h-9 w-9", productView === 'grid' && "bg-card text-primary")}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setProductView('list')} 
                                        className={cn("rounded-xl h-9 w-9", productView === 'list' && "bg-card text-primary")}
                                    >
                                        <LayoutList className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setProductView('table')} 
                                        className={cn("rounded-xl h-9 w-9", productView === 'table' && "bg-card text-primary")}
                                    >
                                        <TableIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {loadingProducts ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl bg-card/50" />)}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="py-20 text-center space-y-4 bg-card/50 rounded-[40px] border-2 border-dashed shadow-sm">
                                <Package className="w-12 h-12 text-slate-600 mx-auto" />
                                <p className="text-muted-foreground font-medium">No hay productos. ¡Importa un CSV para comenzar!</p>
                            </div>
                        ) : productView === 'grid' || productView === 'list' ? (
                            <div className={cn(
                                "gap-4",
                                productView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
                            )}>
                                {filteredProducts.map((product) => (
                                    <div 
                                        key={product.id} 
                                        className={cn(
                                            "bg-card/50 border shadow-sm transition-all group",
                                            productView === 'grid' 
                                                ? "rounded-[24px] p-4 flex gap-4 hover:bg-card" 
                                                : "rounded-2xl p-3 flex items-center justify-between hover:bg-card"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={cn(
                                                "rounded-xl bg-card/50 overflow-hidden shrink-0 border shadow-sm",
                                                productView === 'grid' ? "w-20 h-20" : "w-12 h-12"
                                            )}>
                                                {product.image_base64 || product.image_url ? (
                                                    <img src={product.image_base64 || product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                        <ImageIcon className={cn(productView === 'grid' ? "w-6 h-6" : "w-4 h-4")} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-foreground truncate uppercase text-xs">{product.name}</h4>
                                                    {product.category && (
                                                        <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold border border-primary/20">{product.category}</span>
                                                    )}
                                                </div>
                                                {productView === 'grid' ? (
                                                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                                                ) : (
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs font-black text-primary">${product.price}</span>
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">STOCK: {product.stock || 0}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "flex items-center gap-1",
                                            productView === 'grid' ? "flex-col justify-between items-end" : "ml-4"
                                        )}>
                                            {productView === 'grid' && (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-primary">${product.price}</span>
                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">STOCK: {product.stock || 0}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteProduct(product.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg", product.is_active ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground hover:bg-card")} onClick={() => toggleProductStatus(product.id, product.is_active)}>
                                                    {product.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-card/50 border shadow-sm rounded-[32px] overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent shadow-sm">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-5 pl-8">Imagen</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-5">Nombre</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-5">Categoría</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-5">Precio</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-5">Stock</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-5 pr-8 text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => (
                                            <TableRow key={product.id} className="hover:bg-card/50 shadow-sm group transition-colors">
                                                <TableCell className="py-4 pl-8">
                                                    <div className="w-12 h-12 rounded-xl bg-card/50 overflow-hidden border shadow-sm">
                                                        {product.image_base64 ? (
                                                            <img src={product.image_base64} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                                <ImageIcon className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="font-black text-foreground uppercase text-xs">{product.name}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {product.category && (
                                                        <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold border border-primary/20">{product.category}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-sm font-black text-primary">${product.price}</span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{product.stock || 0}</span>
                                                </TableCell>
                                                <TableCell className="py-4 pr-8 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteProduct(product.id)}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg", product.is_active ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground hover:bg-card")} onClick={() => toggleProductStatus(product.id, product.is_active)}>
                                                            {product.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
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
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Gestión de Tiendas</h1>
                        <p className="text-muted-foreground text-sm font-medium">Organiza tus productos por marcas o sucursales.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Buscar tiendas..." className="pl-10 h-11 bg-card/50 shadow-sm rounded-2xl text-foreground" value={storeSearchQuery} onChange={(e) => setStoreSearchQuery(e.target.value)} />
                        </div>

                        <div className="flex items-center gap-2 bg-card/50 p-1 rounded-2xl border shadow-sm">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setView('grid')} 
                              className={cn("rounded-xl h-9 w-9", view === 'grid' && "bg-card text-primary")}
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setView('list')} 
                              className={cn("rounded-xl h-9 w-9", view === 'list' && "bg-card text-primary")}
                            >
                              <LayoutList className="w-4 h-4" />
                            </Button>
                        </div>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-cyan-400 text-[#0f172a] rounded-xl gap-2 shadow-lg shadow-primary/20 h-12 px-6 font-black uppercase text-xs tracking-widest ai-glow-hover">
                                    <Plus className="w-4 h-4" /> Nueva Tienda
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[450px] shadow-sm shadow-2xl rounded-[32px] p-8 bg-background text-foreground">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                       <div className="bg-primary p-2 rounded-xl">
                                          <StoreIcon className="w-5 h-5 text-[#0f172a]" />
                                       </div>
                                       Crear Tienda
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddStore} className="space-y-6 mt-6">
                                    <Input placeholder="Nombre de la Tienda" className="h-12 bg-card/50 shadow-sm rounded-xl text-foreground" value={name} onChange={(e) => setName(e.target.value)} required />
                                    <Button disabled={isSubmitting} className="w-full h-12 bg-primary hover:bg-cyan-400 text-[#0f172a] rounded-xl font-black uppercase text-xs tracking-widest ai-glow-hover">
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
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[32px] bg-card/50" />)
                        ) : filteredStores.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card/50 rounded-[40px] border-2 border-dashed shadow-sm text-center">
                                <StoreIcon className="w-12 h-12 text-slate-600 mb-4" />
                                <h3 className="text-lg font-bold text-foreground">No hay tiendas</h3>
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
                                                    <div className="bg-primary/10 p-3 rounded-2xl">
                                                        <StoreIcon className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar tienda?')) deleteStore(store.id); }} className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <CardTitle className="text-xl font-black mt-4 text-foreground uppercase">{store.name}</CardTitle>
                                                <CardDescription className="text-muted-foreground font-medium">ID: {store.id.slice(0,8)}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="pt-4 border-t shadow-sm flex justify-between items-center">
                                               <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                                                  <Package className="w-3 h-3" /> Gestionar Catálogo
                                               </div>
                                               <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
                                            </CardFooter>
                                        </Card>
                                    ) : (
                                        <div className="bg-card/50 border shadow-sm rounded-3xl p-4 flex items-center justify-between hover:bg-card transition-all group cursor-pointer" onClick={() => setSelectedStore(store)}>
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <StoreIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-foreground uppercase text-sm">{store.name}</h3>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {store.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar tienda?')) deleteStore(store.id); }} className="rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary" />
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