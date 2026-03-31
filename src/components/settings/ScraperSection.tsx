"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Globe, Loader2, CheckSquare, Square, Download, AlertCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_base64?: string;
  url: string;
  category?: string;
}

interface ScraperSectionProps {
  url: string;
  onUrlChange: (url: string) => void;
  onScrape: (url: string) => Promise<void>;
  loading: boolean;
}

export const ScraperSection = ({ url, onUrlChange, onScrape, loading }: ScraperSectionProps) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [scrapedProducts, setScrapedProducts] = useState<Product[]>([]);
  const [showProductList, setShowProductList] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Por favor ingresa una URL válida');
      return;
    }
    
    setScrapedProducts([]);
    setShowProductList(false);

    try {
      console.log('Iniciando escaneo de:', url);
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      console.log('Datos recibidos del servidor:', data);

      if (!response.ok) throw new Error(data.error || 'Error al escanear la URL');
      
      if (data.products && data.products.length > 0) {
        setScrapedProducts(data.products);
        setShowProductList(true);
        setSelectedProducts(new Set());
        toast.success(`Se encontraron ${data.products.length} productos`);
      } else {
        setShowProductList(true); // Mostrar la lista aunque esté vacía para ver el mensaje de error de "no productos"
        setScrapedProducts([]);
        toast.error('No se detectaron productos automáticos.');
      }
    } catch (error: any) {
      console.error('Error en handleScrape:', error);
      toast.error(error.message || 'Error al conectar con el servidor de escaneo');
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const selectAll = () => {
    if (selectedProducts.size === scrapedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(scrapedProducts.map(p => p.id)));
    }
  };

  const importSelectedProducts = async () => {
    if (selectedProducts.size === 0) {
      toast.error('Selecciona al menos un producto para importar');
      return;
    }

    try {
      const productsToImport = scrapedProducts.filter(p => selectedProducts.has(p.id));
      
      const response = await fetch('/api/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsToImport })
      });

      if (!response.ok) throw new Error('Error al importar productos');

      const result = await response.json();
      toast.success(`Se importaron ${result.count} productos exitosamente`);
      setScrapedProducts([]);
      setShowProductList(false);
      setSelectedProducts(new Set());
    } catch (error: any) {
      toast.error(error.message || 'Error al importar productos');
    }
  };

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-accent/20 border-b border-border/50">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Globe className="w-6 h-6 text-primary" />
          Escáner de Tiendas Online
        </CardTitle>
        <CardDescription>
          Introduce la URL de una tienda online para extraer automáticamente sus productos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Input
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://tutienda.com/productos"
              className="h-12 pl-4 pr-32 rounded-2xl bg-background border-border focus:border-primary"
              disabled={loading}
            />
            {url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUrlChange('')}
                className="absolute right-20 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
              >
                Limpiar
              </Button>
            )}
          </div>
          <Button
            onClick={handleScrape}
            disabled={loading || !url.trim()}
            className="h-12 px-8 rounded-2xl font-bold gap-2 bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Globe className="w-5 h-5" />
                Escanear Tienda
              </>
            )}
          </Button>
        </div>

        {showProductList && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">
                  Productos Encontrados ({scrapedProducts.length})
                </h3>
                <Badge variant="outline" className="rounded-full">
                  {selectedProducts.size} seleccionados
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  className="rounded-xl gap-2"
                >
                  {selectedProducts.size === scrapedProducts.length ? (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Deseleccionar Todo
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      Seleccionar Todo
                    </>
                  )}
                </Button>
                <Button
                  onClick={importSelectedProducts}
                  disabled={selectedProducts.size === 0}
                  className="rounded-xl gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Importar Seleccionados ({selectedProducts.size})
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scrapedProducts.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                return (
                  <div
                    key={product.id}
                    className={cn(
                      "relative rounded-2xl border-2 p-4 transition-all cursor-pointer group",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-accent/20"
                    )}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="absolute top-4 right-4">
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6 text-primary" />
                      ) : (
                        <Square className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                      )}
                    </div>

                    {product.image_url && (
                      <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-muted">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-bold text-lg line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="rounded-full">
                          ${product.price?.toFixed(2) || 'N/A'}
                        </Badge>
                        {product.category && (
                          <span className="text-xs text-muted-foreground">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {scrapedProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h4 className="font-bold text-lg mb-2">No se encontraron productos</h4>
                <p className="text-muted-foreground max-w-md">
                  No se pudieron extraer productos de esta URL. Verifica que sea una tienda online compatible.
                </p>
              </div>
            )}
          </div>
        )}

        {!showProductList && !loading && (
          <div className="flex flex-col items-center justify-center py-12 bg-accent/20 rounded-3xl border-2 border-dashed border-border/50">
            <div className="p-4 bg-background rounded-full shadow-sm">
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="mt-4 text-center">
              <p className="font-bold text-lg">Sin productos escaneados</p>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto mt-2">
                Introduce la URL de tu tienda arriba para comenzar a escanear productos.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Escaneando tienda...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};