import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { api, Sale } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar,
  ChevronRight,
  User,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SalesDashboard = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await api.getSales();
      setSales(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las ventas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.total_amount), 0);
  const confirmedSales = sales.filter(s => s.status === 'confirmed').length;
  const botClosures = sales.filter(s => s.bot_closure).length;

  const stats = [
    { label: 'Ingresos Totales', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Ventas Confirmadas', value: confirmedSales, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Cierres por Bot', value: botClosures, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Tasa de Conversión', value: '12.5%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <MainLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-dealerbot-gradient uppercase italic">Tablero de Ventas</h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] mt-1">Métricas de Conversión y Cierres de IA</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="dealerbot-card p-6 border-t-2 border-white/5 relative overflow-hidden group"
            >
              <div className="flex items-center gap-5 relative z-10">
                <div className={cn("p-4 rounded-2xl border border-white/5", stat.bg)}>
                  <stat.icon className={cn("w-7 h-7", stat.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tighter text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-gray-400">Cierres Recientes</h2>
            <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <Calendar className="w-3 h-3" />
              Últimos 30 días
            </div>
          </div>

          <div className="dealerbot-card overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Cliente</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Monto</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Instancia</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Fecha</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="p-8 bg-white/5" />
                      </tr>
                    ))
                  ) : sales.length > 0 ? (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{sale.customer_name}</p>
                              <p className="text-[10px] text-gray-500 font-mono">{sale.customer_phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-black text-green-500">${Number(sale.total_amount).toLocaleString()}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-white/10 bg-white/5">
                            {sale.instances?.name || 'Desconocida'}
                          </Badge>
                        </td>
                        <td className="p-4 text-[10px] font-mono text-gray-500">
                          {format(new Date(sale.created_at), 'dd MMM, HH:mm', { locale: es })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                            {sale.status === 'confirmed' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="text-green-500">Confirmado</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span className="text-amber-500">Pendiente</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">No se han registrado cierres de venta aún.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SalesDashboard;