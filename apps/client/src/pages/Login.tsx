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
    LineChart,
    Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sileo as toast } from 'sileo';
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
        } catch (err: any) {
            toast.error('Error: ' + (err.message || 'Credenciales inválidas'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4 sm:p-6 font-outfit">
            {/* Efectos de fondo sutiles corporativos */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white border border-border rounded-[2.5rem] overflow-hidden z-10 shadow-xl"
            >
                {/* Lado Visual (Solo Desktop) */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-secondary/30 border-r border-border/50">
                   <div>
                      <Logo className="mb-12" size="lg" />
                      <h2 className="text-5xl font-bold leading-tight mb-6 text-foreground tracking-tight">
                        Vende más con <br/> <span className="text-primary">Inteligencia Corporativa.</span>
                      </h2>
                      <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-md">
                         Optimiza tu ecommerce en WhatsApp con la eficiencia de IA de Dealerbot. Diseñado para empresas que buscan resultados reales.
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-white border border-border/50 shadow-sm">
                         <LineChart className="w-6 h-6 text-primary mb-3" />
                         <p className="text-[11px] font-bold text-foreground uppercase tracking-widest">Analytics Pro</p>
                         <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Control de Datos</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white border border-border/50 shadow-sm">
                         <ShieldCheck className="w-6 h-6 text-accent mb-3" />
                         <p className="text-[11px] font-bold text-foreground uppercase tracking-widest">Enterprise Security</p>
                         <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Protección Avanzada</p>
                      </div>
                   </div>
                </div>

                {/* Lado del Formulario */}
                <div className="p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-white">
                    <div className="mb-12 text-center lg:text-left">
                       <Badge variant="secondary" className="mb-4 border-primary/20 text-primary px-4 py-1.5 rounded-full font-bold text-[10px] tracking-[2px] uppercase bg-primary/5">
                          <Building2 className="w-3 h-3 mr-2" />
                          Acceso Institucional
                       </Badge>
                       <h3 className="text-4xl font-bold text-foreground tracking-tight">Bienvenido</h3>
                       <p className="text-muted-foreground text-sm mt-3 font-medium">Ingresa tus credenciales corporativas.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] px-1">Correo Electrónico</label>
                           <div className="relative">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                              <Input 
                                 type="email" 
                                 placeholder="nombre@empresa.com" 
                                 className="pl-12 h-14 bg-secondary/50 border-border rounded-2xl text-base font-medium focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground/40 transition-all"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 required
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] px-1">Contraseña</label>
                           <div className="relative">
                              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                              <Input 
                                 type="password" 
                                 placeholder="••••••••" 
                                 className="pl-12 h-14 bg-secondary/50 border-border rounded-2xl text-base font-medium focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground/40 transition-all"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 required
                              />
                           </div>
                        </div>

                        <Button 
                           type="submit"
                           disabled={loading}
                           className="w-full h-14 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                 Acceder al Sistema <ArrowRight className="w-4 h-4" />
                              </>
                           )}
                        </Button>
                    </form>

                    <div className="mt-12 text-center">
                       <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[4px]">Dealerbot Enterprise • v2.1.0</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;