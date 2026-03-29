"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setProducts(data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin" />
        <p className="text-slate-400 mt-4">Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 font-bold">
        Error: {error}
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold text-white">Catálogo de Productos</h1>
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}             className="rounded-xl h-12 px-6 font-bold text-slate-400 hover:text-cyan-400">
            ← Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Badge variant="outline" className="mb-4 w-12 h-12 text-cyan-400">
                <Plus className="w-4 h-4" />
              </Badge>
              <p className="text-slate-400 font-medium">Aún no hay productos.</p>
              <p className="text-slate-400">Agrega productos manualmente o escanea una tienda.</p>
            </div>
          ) : (
            products.map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white/5 rounded-[32px] border border-white/10 p-4 flex flex-col justify-between hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden">
                    {product.image_base64 ? (
                      <img src={product.image_base64} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-2xl">
                        <Plus className="w-6 h-6 text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{product.name}</h3>
                    <p className="text-[9px] text-slate-400 line-clamp-2 mt-1">{product.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm font-bold text-cyan-400">${product.price}</span>
                      <Badge variant="outline" className={cn("text-[9px] font-black", product.is_active ? "text-green-500" : "text-slate-500")}>
                        {product.is_active ? 'Disponible' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardFooter className="pt-2 border-t border-white/5">
                  <Badge variant="outline" className={cn("text-[9px] font-black", product.is_active ? "text-green-500" : "text-slate-500")}>
                    {product.is_active ? 'En Stock' : 'Agotado'}
                  </Badge>
                </CardFooter>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Catalog;