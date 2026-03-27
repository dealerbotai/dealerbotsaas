"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck, Zap, Globe, Shield } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Bienvenido",
        description: "Sesión iniciada correctamente",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Credenciales inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Sutil patrón de fondo suizo */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Columna Izquierda: Branding y Valor */}
        <div className="hidden lg:block space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-black text-xl">D</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">DealerBot AI</span>
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] text-foreground">
              Automatización de <span className="text-primary">WhatsApp</span> para Empresas.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md font-medium">
              Gestión inteligente de agentes, flujos de venta y logística en una plataforma unificada y profesional.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: Zap, title: "Alta Velocidad", desc: "Inferencia Groq Llama 3" },
              { icon: ShieldCheck, title: "Seguro", desc: "Cifrado AES-256" },
              { icon: Globe, title: "Multi-Número", desc: "Escalabilidad Total" },
              { icon: Shield, title: "Privacidad", desc: "Datos Aislados" }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-accent/50 border border-border/50">
                <item.icon className="w-5 h-5 text-primary mb-2" />
                <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Columna Derecha: Formulario de Login */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="w-full max-w-[420px] dealerbot-card p-10 bg-card/50 backdrop-blur-xl border-border/60">
            <div className="text-center mb-10">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-black text-base">D</span>
                </div>
                <span className="text-xl font-bold tracking-tight">DealerBot AI</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Iniciar Sesión</h2>
              <p className="text-sm text-muted-foreground mt-2 font-medium">Ingresa tus credenciales de administrador</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@dealerbot.ai"
                    className="h-12 pl-11 rounded-xl bg-background border-border focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                  <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-11 rounded-xl bg-background border-border focus:ring-primary/20"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
              >
                {loading ? 'Verificando...' : 'Entrar al Sistema'}
              </Button>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                  © 2026 DealerBot AI - Sistema de Control
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Decoración sutil inferior */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
};

export default LoginPage;