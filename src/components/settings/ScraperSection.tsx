"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Search, Loader2, Package, Tag, Info, RefreshCw, Save, Trash2, Plus } from 'lucide-react';
import { ScrapedData, GlobalSettings } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/utils/toast';

interface ScraperSectionProps {
  url: string;
  scrapedData?: ScrapedData;
  onScrape: (url: string) => Promise<any>;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
  loading: boolean;
}

export const ScraperSection = ({ url, scrapedData, onScrape, onUpdateSettings, loading }: ScraperSectionProps) => {
  const [inputUrl, setInputUrl] = useState(url || '');
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (scrapedData?.products) {
      setLocalProducts([...scrapedData.products]);
    }
  }, [scrapedData]);

  const handleScrape = () => {
    if (!inputUrl) return;
    onScrape(inputUrl);
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const updated = [...localProducts];
    updated[index] = { ...updated[index], [field]: value };
    setLocalProducts(updated);
  };

  const removeProduct = (index: number) => {
    const updated = localProducts.filter((_, i) => i !== index);
    setLocalProducts(updated);
  };

  const addProduct = () => {
    setLocalProducts([...localProducts, { name: 'Nuevo Producto', price: '$0.00', description: 'Descripción del producto' }]);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatedScrapedData = {
        ...scrapedData,
        url: inputUrl,
        products: localProducts,
        lastScraped: new Date().toISOString()
      };
      await onUpdateSettings({ 
        ecommerce_url: inputUrl, 
        scraped_data: updatedScrapedData as ScrapedData 
      });
      toast.success('Catálogo actualizado correctamente');
    } catch (error) {
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(localProducts) !== JSON.stringify(scrapedData?.products) || inputUrl !== url;

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-border/50 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Escáner de Ecommerce</CardTitle>
          </div>
          {scrapedData && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold gap-2"
                onClick={addProduct}
              >
                <Plus className="w-4 h-4" /> Añadir
              </Button>
              <Button 
                size="sm" 
                className="rounded-xl font-bold gap-2"
                disabled={!hasChanges || isSaving}
                onClick={handleSaveChanges}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </Button>
            </div>
          )}
        </div>
        <CardDescription className="text-muted-foreground font-medium">
          Entrena al bot con tus productos. Puedes escanear tu tienda o editarlos manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-url" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              URL de la Tienda
            </Label>
            <div className="flex gap-3">
              <Input
                id="store-url"
                placeholder="https://tu-tienda.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="h-12 rounded-xl border-border/50 focus:ring-primary/20"
              />
              <Button 
                onClick={handleScrape} 
                disabled={loading || !inputUrl}
                className="h-12 px-6 rounded-xl font-bold gap-2 min-w-[140px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Escaneando...' : 'Iniciar Escaneo'}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {localProducts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Productos en Catálogo</h3>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold">
                  {localProducts.length} Artículos
                </Badge>
              </div>

              <div className="grid gap-4">
                {localProducts.map((product, idx) => (
                  <div 
                    key={idx} 
                    className="group relative flex flex-col gap-4 p-5 rounded-2xl bg-accent/30 border border-border/50 hover:border-primary/20 transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-border/50 h-fit">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre</Label>
                            <Input 
                              value={product.name} 
                              onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                              className="h-9 rounded-lg bg-background/50 border-border/30 text-sm font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Precio</Label>
                            <Input 
                              value={product.price} 
                              onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                              className="h-9 rounded-lg bg-background/50 border-border/30 text-sm font-bold text-primary"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción</Label>
                          <Input 
                            value={product.description} 
                            onChange={(e) => updateProduct(idx, 'description', e.target.value)}
                            className="h-9 rounded-lg bg-background/50 border-border/30 text-xs font-medium"
                          />
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-8 w-8"
                        onClick={() => removeProduct(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {scrapedData && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-600">
                  <Info className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-medium">
                    Última sincronización: {new Date(scrapedData.lastScraped).toLocaleString()}
                  </p>
                  <Button variant="ghost" size="sm" className="ml-auto h-8 rounded-lg text-blue-600 hover:bg-blue-500/10 gap-1" onClick={handleScrape}>
                    <RefreshCw className="w-3 h-3" /> Re-escanear
                  </Button>
                </div>
              )}
            </motion.div>
          ) : !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-accent/20 rounded-3xl border-2 border-dashed border-border/50">
              <div className="p-4 bg-background rounded-full shadow-sm">
                <Globe className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg">Sin datos indexados</p>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  Escanea tu tienda para que el bot aprenda sobre tus productos.
                </p>
              </div>
              <Button variant="outline" className="rounded-xl font-bold" onClick={addProduct}>
                <Plus className="w-4 h-4 mr-2" /> Añadir Producto Manualmente
              </Button>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};