"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CSVImporter } from '@/components/catalog/CSVImporter';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = React.useCallback(async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground mt-4 font-medium">Cargando catálogo...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Catálogo de Productos</h1>
            <p className="text-muted-foreground font-medium mt-2">Gestiona tus productos y existencias masivamente.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="rounded-2xl h-12 px-6 font-bold shadow-sm border-transparent transition-all hover:bg-accent/10"
          >
            ← Volver
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <CSVImporter />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-primary/10 shadow-sm pb-4">
            <h2 className="text-2xl font-bold">Tus Productos ({products.length})</h2>
            <Button variant="ghost" size="sm" onClick={fetchProducts} className="font-bold text-primary">
              Actualizar Lista
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-accent/10 rounded-[40px] shadow-sm shadow-primary/5 transition-all">
                <div className="bg-background w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aún no hay productos</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                  Utiliza el importador de arriba para cargar tus productos masivamente.
                </p>
              </div>
            ) : (
              products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-card rounded-[32px] shadow-sm transition-all shadow-primary/5 p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                        {product.image_base64 || product.image_url ? (
                          <img src={product.image_base64 || product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Plus className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-primary font-black text-xl">${product.price}</p>
                            {product.category && (
                                <Badge variant="outline" className="text-[9px] h-5 rounded-md border-primary/20 text-primary/70">{product.category}</Badge>
                            )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm font-medium line-clamp-2 h-[40px] leading-relaxed">
                      {product.description || 'Sin descripción disponible.'}
                    </p>

                    <div className="pt-4 border-t border-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={product.is_active ? "default" : "secondary"} className="rounded-full px-4 font-bold h-7">
                            {product.is_active ? 'Disponible' : 'Inactivo'}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            STOCK: {product.stock || 0}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50">
                        ID: {product.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Catalog;