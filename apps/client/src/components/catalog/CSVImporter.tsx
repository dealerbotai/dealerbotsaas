import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUp, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CSVProduct {
  handle: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  status: string;
}

interface CSVImporterProps {
  storeId?: string;
  onComplete?: () => void;
}

export const CSVImporter = ({ storeId, onComplete }: CSVImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVProduct[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Por favor, selecciona un archivo CSV válido.');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n');
      
      const products: CSVProduct[] = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        
        // Manejo básico de CSV (separado por comas)
        const columns = rows[i].split(',').map(c => c.trim());
        
        // Orden: Handle,Nombre,Categoría,Precio,Stock,Imagen URL,Descripción,Estado
        products.push({
          handle: columns[0] || '',
          name: columns[1] || '',
          category: columns[2] || '',
          price: parseFloat(columns[3]) || 0,
          stock: parseInt(columns[4]) || 0,
          image_url: columns[5] || '',
          description: columns[6] || '',
          status: columns[7] || 'active'
        });
      }
      setPreview(products);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    
    setImporting(true);
    try {
      // Obtener el workspace_id real del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró sesión de usuario');

      const { data: member, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) throw new Error('No tienes un espacio de trabajo asignado');
      const workspaceId = member.workspace_id;

      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/import-products`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId
        },
        body: JSON.stringify({ products: preview, storeId })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al importar');

      toast.success(`¡Éxito! Se importaron ${result.imported} productos.`);
      setPreview([]);
      setFile(null);
      if (onComplete) onComplete();
    } catch (error: any) {
      toast.error('Error en la importación: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="rounded-[32px] border-border/50 bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Importar Productos</CardTitle>
            <CardDescription className="text-muted-foreground font-medium mt-1">
              Sube un archivo CSV con tus productos para cargarlos masivamente.
            </CardDescription>
          </div>
          <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center">
            <FileUp className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-6">
        {!file ? (
          <div className="border-2 border-dashed border-primary/20 rounded-3xl p-12 text-center hover:border-primary/40 transition-colors bg-primary/5">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
              <div className="bg-primary/20 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <FileUp className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-bold mb-2">Haz clic para subir o arrastra</h4>
              <p className="text-sm text-muted-foreground font-medium max-w-[240px]">
                Formato: Nombre, Precio, Descripción. Asegúrate de incluir cabeceras.
              </p>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-accent/30 p-4 rounded-2xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{preview.length} productos detectados</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {setFile(null); setPreview([]);}} className="rounded-xl text-destructive hover:bg-destructive/10">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="max-h-[300px] overflow-auto rounded-2xl border border-border/50">
              <Table>
                <TableHeader className="bg-accent/50 sticky top-0">
                  <TableRow className="border-border/50">
                    <TableHead className="font-bold py-4">Nombre</TableHead>
                    <TableHead className="font-bold py-4">Precio</TableHead>
                    <TableHead className="font-bold py-4">Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((p, i) => (
                    <TableRow key={i} className="border-border/50 hover:bg-accent/20">
                      <TableCell className="font-bold">{p.name}</TableCell>
                      <TableCell className="text-primary font-bold">${p.price}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium truncate max-w-[200px]">
                        {p.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleImport} 
                disabled={importing || preview.length === 0}
                className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
              >
                {importing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Importando...</>
                ) : (
                  <><Check className="w-5 h-5 mr-2" /> Confirmar Importación</>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {setFile(null); setPreview([]);}}
                className="h-14 rounded-2xl px-8 font-bold border-border/50"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <p className="text-xs text-amber-700 font-bold leading-relaxed">
            Nota: Si el producto ya existe con el mismo nombre, sus datos (precio y descripción) se actualizarán con los del CSV.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
