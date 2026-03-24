"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Cpu, 
  MessageSquare, 
  LayoutDashboard, 
  Package, 
  Truck, 
  Activity, 
  Zap, 
  Database,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

const msgData = [
  { time: '00:00', value: 1200 },
  { time: '04:00', value: 800 },
  { time: '08:00', value: 2400 },
  { time: '12:00', value: 1600 },
  { time: '16:00', value: 3200 },
  { time: '20:00', value: 2100 },
  { time: '24:00', value: 2800 },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white font-sans selection:bg-amber-500/30 overflow-hidden relative p-8">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="text-center mb-12 relative z-10">
        <h1 className="text-4xl font-bold tracking-[0.2em] text-nexus-gradient mb-2">NEXUS AURORA</h1>
        <p className="text-gray-400 font-light text-lg">Centro de Administración Multi-Agente de WhatsApp y Logística</p>
      </header>

      <main className="grid grid-cols-12 gap-8 items-start max-w-[1600px] mx-auto relative z-10">
        
        {/* Left Column: System Stats */}
        <div className="col-span-3 space-y-6">
          <div className="nexus-card p-4 border-l-2 border-amber-500/50">
            <h3 className="text-[10px] tracking-widest text-gray-400 mb-4 uppercase">Rendimiento del Sistema</h3>
            <div className="space-y-4">
              {[
                { label: 'LATENCIA DE AGENTES IA', val: 85 },
                { label: 'SALUD DE LA API DE WHATSAPP', val: 95 },
                { label: 'CARGA DE PROCESAMIENTO DE PEDIDOS', val: 65 }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span>{item.label}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-12 pt-16 pr-8">
            <div className="relative group cursor-pointer w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-amber-400 rotate-45 rounded-xl opacity-20 group-hover:opacity-40 transition-all duration-500 border border-white/20"></div>
              <div className="relative flex flex-col items-center text-center p-2">
                <Cpu className="text-amber-500 mb-2" size={20} />
                <h4 className="text-[8px] font-bold mb-1 leading-tight uppercase">Configuración de Agentes IA</h4>
                <p className="text-[6px] text-gray-500 leading-tight uppercase">Seleccionar modelos, respuestas, entrenamiento</p>
              </div>
            </div>

            <div className="relative group cursor-pointer w-32 h-32 flex items-center justify-center translate-x-12">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-purple-400 rotate-45 rounded-xl opacity-20 group-hover:opacity-40 transition-all duration-500 border border-white/20"></div>
              <div className="relative flex flex-col items-center text-center p-2">
                <MessageSquare className="text-purple-500 mb-2" size={20} />
                <h4 className="text-[8px] font-bold mb-1 leading-tight uppercase">Gestión Multi-Número</h4>
                <p className="text-[6px] text-gray-500 leading-tight uppercase">Activar, Optimizar, Monitorear Líneas de WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Login Box */}
        <div className="col-span-6 flex justify-center py-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-[1px] rounded-[2.5rem] border-nexus-glow overflow-hidden"
          >
            <div className="bg-[#0d0e12]/95 backdrop-blur-3xl p-10 h-full flex flex-col items-center">
              <div className="w-24 h-24 mb-10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative bg-black/60 border border-white/10 w-full h-full rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <div className="text-5xl font-black italic bg-clip-text text-transparent bg-gradient-to-br from-purple-400 via-amber-200 to-purple-600">N</div>
                  <div className="absolute inset-0 border border-white/5 rounded-full" />
                </div>
              </div>

              <form onSubmit={handleLogin} className="w-full space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] tracking-[0.15em] text-gray-500 uppercase block pl-1">Correo electrónico / Usuario del Administrador</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-600 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/40 border-gray-800 h-14 pl-14 rounded-full focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all text-sm placeholder:text-gray-700"
                      placeholder="admin@nexus.ai"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] tracking-[0.15em] text-gray-500 uppercase block pl-1">Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-600 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-black/40 border-gray-800 h-14 pl-14 rounded-full focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all text-sm"
                    />
                  </div>
                </div>

                {error && <p className="text-[10px] text-red-500 text-center bg-red-500/5 py-2 rounded-lg border border-red-500/10 tracking-wider">{error.toUpperCase()}</p>}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-black font-black text-sm tracking-[0.2em] shadow-xl shadow-amber-500/10 transition-all active:scale-[0.98] uppercase"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                <button type="button" className="w-full text-[9px] tracking-[0.2em] text-gray-500 hover:text-white transition-colors uppercase py-2">
                  Restablecer contraseña del administrador
                </button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Admin Stats */}
        <div className="col-span-3 space-y-6">
          <div className="nexus-card p-4 border-r-2 border-purple-500/50">
            <h3 className="text-[10px] tracking-widest text-gray-400 mb-4 uppercase text-right">Estado de Administradores</h3>
            <div className="space-y-3">
              {[
                { status: 'Activo', id: 'Multi-Modo', time: '5d 20h' },
                { status: 'Activo', id: 'NXA-500-ADMIN', time: '5d 20h' },
                { status: 'Activo', id: 'NXA-500-ADMIN', time: '5d 20h' }
              ].map((admin, i) => (
                <div key={i} className="flex justify-between text-[9px] items-center border-b border-white/5 pb-2 last:border-0">
                  <span className="text-green-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                    {admin.status} -
                  </span>
                  <span className="text-gray-300">{admin.id}</span>
                  <span className="text-gray-400 font-mono tracking-tighter">{admin.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-12 pt-16 pl-8">
            <div className="relative group cursor-pointer w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-purple-400 rotate-45 rounded-xl opacity-20 group-hover:opacity-40 transition-all duration-500 border border-white/20"></div>
              <div className="relative flex flex-col items-center text-center p-2">
                <Package className="text-amber-500 mb-2" size={20} />
                <h4 className="text-[8px] font-bold mb-1 leading-tight uppercase">Hub de Productos y Pedidos</h4>
                <p className="text-[6px] text-gray-500 leading-tight uppercase">Sincronizar Inventario, Procesar Pedidos, Pago</p>
              </div>
            </div>

            <div className="relative group cursor-pointer w-32 h-32 flex items-center justify-center -translate-x-12">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-amber-400 rotate-45 rounded-xl opacity-20 group-hover:opacity-40 transition-all duration-500 border border-white/20"></div>
              <div className="relative flex flex-col items-center text-center p-2">
                <Truck className="text-purple-500 mb-2" size={20} />
                <h4 className="text-[8px] font-bold mb-1 leading-tight uppercase">Hub de Tráfico Logístico</h4>
                <p className="text-[6px] text-gray-500 leading-tight uppercase">Optimización de Rutas, Entregas, Rastreo</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Widgets */}
      <div className="fixed bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
        
        {/* Toast-like notification */}
        <div className="nexus-card p-4 border-l-4 border-green-500 flex items-start gap-4 max-w-sm pointer-events-auto">
          <div className="bg-green-500/10 p-2 rounded-full">
            <CheckCircle2 className="text-green-500" size={20} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-xs font-bold uppercase">Éxito en Sincronización Logística:</h4>
              <X size={14} className="text-gray-500 cursor-pointer" />
            </div>
            <p className="text-[10px] text-gray-400">Optimización de Rutas completada.<br/>Datos de Tráfico en vivo activos.</p>
          </div>
        </div>

        <div className="flex gap-8 items-end pointer-events-auto">
          {/* Circular Stats */}
          <div className="nexus-card p-4">
            <h3 className="text-[10px] tracking-widest text-gray-400 mb-4 uppercase">Resumen de Datos</h3>
            <div className="flex gap-8">
              {[
                { label: 'TASA DE RESPUESTA IA', val: 90, color: '#f59e0b' },
                { label: '% DE CUMPLIMIENTO DE PEDIDOS', val: 70, color: '#a855f7' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-16 h-16 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: stat.val },
                            { value: 100 - stat.val }
                          ]}
                          innerRadius={24}
                          outerRadius={30}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill={stat.color} />
                          <Cell fill="#1f2937" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                      {stat.val}%
                    </div>
                  </div>
                  <span className="text-[8px] text-center mt-2 text-gray-400 w-16 leading-tight uppercase">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volume Chart */}
          <div className="nexus-card p-4 w-64 h-48">
            <h3 className="text-[10px] tracking-widest text-gray-400 mb-4 uppercase">Volumen de Mensajería (Últimas 12h)</h3>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={msgData}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    dot={false}
                    fill="url(#colorVal)"
                  />
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[8px] text-gray-500 mt-2 uppercase">
              <span>Tiempo -{'>'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
