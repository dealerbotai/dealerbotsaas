import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Shield, Zap, MessageSquare, CheckCircle, ArrowRight, Star } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-cyan-500 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">SalesBot <span className="text-cyan-400">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
        </div>
        <button className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          Comenzar Gratis
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-black uppercase tracking-[3px] text-cyan-400">Ventas 10x con IA</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8">
            TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">WHATSAPP</span> <br />
            NUNCA VOLVERÁ A <br />
            ESTAR <span className="italic font-serif">SOLO.</span>
          </h1>

          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            La automatización de ventas más rápida del mercado. Respuestas en milisegundos, 
            gestión de catálogos nativa y conexión binaria de alto rendimiento.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="h-16 px-10 bg-cyan-500 rounded-2xl font-black text-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(6,182,212,0.3)]">
              CREAR MI BOT AHORA <ArrowRight className="w-6 h-6" />
            </button>
            <button className="h-16 px-10 bg-white/5 border border-white/10 rounded-2xl font-black text-xl hover:bg-white/10 transition-all backdrop-blur-xl">
              VER DEMO ⚡
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: <Zap />, 
              title: "Velocidad Groq", 
              desc: "Inferencia IA ultra-rápida. Tus clientes no esperarán ni un segundo para recibir una respuesta humana.",
              color: "text-cyan-400"
            },
            { 
              icon: <Shield />, 
              title: "Cero Bloqueos", 
              desc: "Arquitectura binaria nativa que imita el comportamiento humano perfecto, minimizando riesgos de baneo.",
              color: "text-blue-400"
            },
            { 
              icon: <MessageSquare />, 
              title: "Importación CSV", 
              desc: "Sube miles de productos en segundos. Tu catálogo sincronizado al instante con tu bot inteligente.",
              color: "text-purple-400"
            }
          ].map((f, i) => (
            <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[40px] hover:bg-white/10 transition-all duration-500 group">
              <div className={`${f.color} bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {React.cloneElement(f.icon, { className: "w-8 h-8" })}
              </div>
              <h3 className="text-2xl font-black mb-4">{f.title}</h3>
              <p className="text-slate-400 font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-20 bg-white/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Vendedores Activos", value: "500+" },
            { label: "Mensajes Enviados", value: "1.2M" },
            { label: "Ventas Generadas", value: "$4.5M" },
            { label: "Uptime Promedio", value: "99.9%" }
          ].map((s, i) => (
            <div key={i}>
              <div className="text-4xl font-black text-cyan-400 mb-2">{s.value}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-32 px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
        <div className="text-cyan-500 opacity-20 mb-8"><Zap size={80} strokeWidth={3} /></div>
        <h2 className="text-4xl md:text-5xl font-black italic tracking-tight leading-tight mb-12 text-slate-300">
          "El bot de ventas definitivo. Hemos reducido el tiempo de respuesta en un 95% y las ventas por WhatsApp han subido como espuma."
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-800 rounded-full border border-white/20 overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Founder" />
          </div>
          <div className="text-left">
            <div className="font-black">Felipe García</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">CEO de TiendaMística</div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 px-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[60px] p-12 md:p-24 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20" />
           <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-12 relative z-10">
             ¿LISTO PARA ESCALAR <br />
             TU <span className="text-black/30">OPERACIÓN?</span>
           </h2>
           <button className="bg-white text-black px-12 py-5 rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-2xl relative z-10">
              LANZAR MI BOT GRATIS 🚀
           </button>
           <p className="mt-8 text-white/60 font-bold uppercase tracking-widest text-sm relative z-10">
             No requiere tarjeta de crédito • Instalación en 2 minutos
           </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-6 text-center text-slate-600">
        <div className="text-xs font-black uppercase tracking-[5px] mb-4">SalesBot AI Engine</div>
        <div className="text-[10px] font-bold">© 2026 Todos los derechos reservados. Optimizado para el éxito.</div>
      </footer>

    </div>
  );
};

export default Landing;
