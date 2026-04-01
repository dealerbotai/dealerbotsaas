import { describe, it, expect } from 'vitest';
import { parseCSV } from './csv-parser';

describe('CSV Parser Utility', () => {
  it('should correctly parse a valid CSV string with all 8 columns', () => {
    const csvContent = `Handle,Nombre,Categoría,Precio,Stock,Imagen URL,Descripción,Estado
reloj-v1,Reloj V1,Electrónica,125.00,50,https://img.url,Descripción corta,active`;

    const result = parseCSV(csvContent);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      handle: 'reloj-v1',
      name: 'Reloj V1',
      category: 'Electrónica',
      price: 125.00,
      stock: 50,
      image_url: 'https://img.url',
      description: 'Descripción corta',
      status: 'active'
    });
  });

  it('should handle empty rows and whitespace', () => {
    const csvContent = `Handle,Nombre,Categoría,Precio,Stock,Imagen URL,Descripción,Estado
    
    prod-1, Producto 1 , Hogar , 10.5 , 5 , url , desc , active
    `;

    const result = parseCSV(csvContent);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Producto 1');
    expect(result[0].price).toBe(10.5);
  });

  it('should return empty array for empty input', () => {
    expect(parseCSV('')).toHaveLength(0);
  });
});
