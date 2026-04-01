export interface CSVProduct {
  handle: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  status: string;
}

export const parseCSV = (text: string): CSVProduct[] => {
  const rows = text.split('\n');
  const products: CSVProduct[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    
    // Manejo básico de CSV (separado por comas)
    // TODO: Usar una librería robusta como papaparse para casos complejos (comas dentro de comillas)
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
  
  return products;
};
