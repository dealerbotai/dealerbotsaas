import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUp, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { parseCSV, CSVProduct } from '@/utils/csv-parser';

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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPreview(parseCSV(text));
      };
      reader.readAsText(selectedFile);
    }
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
    <Card className="premium-card page-enter overflow-hidden border-none p-0">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold gradient-text">Importar Productos</CardTitle>
            <CardDescription className="text-muted-foreground font-medium mt-1">
              Sube un archivo CSV con tus productos para cargarlos masivamente.
            </CardDescription>
          </div>
          <div className="bg-primary/15 w-14 h-14 rounded-2xl flex items-center justify-center text-glow">
            <FileUp className="w-7 h-7 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-6">
        {!file ? (
          <div className="border-2 border-dashed border-primary/20 rounded-[2rem] p-12 text-center hover:border-primary/40 transition-all bg-primary/5 hover:bg-primary/10 group">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
              <div className="bg-primary/20 p-5 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                <FileUp className="w-10 h-10 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-2 text-foreground">Haz clic para subir o arrastra</h4>
              <p className="text-sm text-muted-foreground font-medium max-w-[280px] leading-relaxed">
                Formato recomendado: <span className="text-primary/80">Handle, Nombre, Categoría, Precio, Stock...</span>
              </p>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between glass p-5 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-base text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{preview.length} productos detectados</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {setFile(null); setPreview([]);}} className="rounded-xl text-destructive hover:bg-destructive/10">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="max-h-[350px] overflow-auto rounded-2xl border border-primary/10 bg-card/50">
              <Table>
                <TableHeader className="bg-secondary/50 sticky top-0 backdrop-blur-sm">
                  <TableRow className="border-primary/5">
                    <TableHead className="font-bold py-4 text-foreground/70">Handle</TableHead>
                    <TableHead className="font-bold py-4 text-foreground/70">Nombre</TableHead>
                    <TableHead className="font-bold py-4 text-foreground/70 text-right">Precio</TableHead>
                    <TableHead className="font-bold py-4 text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((p, i) => (
                    <TableRow key={i} className="border-primary/5 hover:bg-primary/5 transition-colors">
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{p.handle}</TableCell>
                      <TableCell className="font-bold text-xs text-foreground">{p.name}</TableCell>
                      <TableCell className="text-primary font-bold text-xs text-right">${p.price}</TableCell>
                      <TableCell className="text-[10px] text-center">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-black uppercase">
                          {p.status}
                        </span>
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
                className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                className="h-14 rounded-2xl px-8 font-bold border-primary/20 hover:bg-secondary/50 text-muted-foreground"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-5 bg-warning/10 rounded-2xl border border-warning/20">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <p className="text-xs text-warning/90 font-bold leading-relaxed">
            Nota: Si el producto ya existe con el mismo Handle o Nombre, sus datos se actualizarán automáticamente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
