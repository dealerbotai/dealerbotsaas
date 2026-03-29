"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
    Mail, 
    Lock, 
    ArrowRight, 
    Loader2,
    ShieldCheck,
    Zap,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/layout/Logo';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Redirigir si ya está logueado
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/');
        });
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Por favor, completa todos los campos.');
            return;
        }
        
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            toast.success('Acceso concedido. Bienvenido.');
            navigate('/');
        } catch (error: any) {
            toast.error('Error: ' + (error.message || 'Credenciales inválidas'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden p-4 sm:p-6">
            {/* Efectos de fondo AI */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[40px] overflow-hidden z-10 shadow-2xl"
            >
                {/* Lado Visual (Solo Desktop) */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-white/[0.03] to-transparent border-r border-white/5">
                   <div>
                      <Logo className="mb-12" />
                      <h2 className="text-5xl font-black leading-tight mb-6 text-white tracking-tighter">
                        Vende más con <br/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">Inteligencia Real.</span>
                      </h2>
                      <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-md">
                         Automatiza tu ecommerce en WhatsApp con la velocidad de Groq™ y el control de Dealerbot.
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                         <Sparkles className="w-5 h-5 text-cyan-400 mb-3" />
                         <p className="text-[10px] font-black text-white uppercase tracking-widest">Groq™ Engine</p>
                         <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Inferencia Ultra-Rápida</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                         <ShieldCheck className="w-5 h-5 text-purple-400 mb-3" />
                         <p className="text-[10px] font-black text-white uppercase tracking-widest">Secure Auth</p>
                         <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Protección de Datos</p>
                      </div>
                   </div>
                </div>

                {/* Lado del Formulario */}
                <div className="p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-[#020617]/50">
                    <div className="mb-12 text-center lg:text-left">
                       <Badge variant="outline" className="mb-4 border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-full font-black text-[9px] tracking-[3px] uppercase bg-cyan-500/5">
                          Acceso Seguro
                       </Badge>
                       <h3 className="text-4xl font-black text-white tracking-tighter">Bienvenido de nuevo</h3>
                       <p className="text-slate-500 text-sm mt-2 font-medium">Ingresa tus credenciales para continuar.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-[3px] px-1">Correo Electrónico</label>
                           <div className="relative">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                              <Input 
                                 type="email" 
                                 placeholder="tu@email.com" 
                                 className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-base font-medium focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-slate-700"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 required
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-[3px] px-1">Contraseña</label>
                           <div className="relative">
                              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                              <Input 
                                 type="password" 
                                 placeholder="••••••••" 
                                 className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-base font-medium focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-slate-700"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 required
                              />
                           </div>
                        </div>

                        <Button 
                           type="submit"
                           disabled={loading}
                           className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                 Entrar al Sistema <ArrowRight className="w-4 h-4" />
                              </>
                           )}
                        </Button>
                    </form>

                    <div className="mt-12 text-center">
                       <p className="text-[9px] font-black text-slate-700 uppercase tracking-[4px]">Dealerbot AI • v2.0.0</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;