import React from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Shield, 
  Zap, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight, 
  Activity,
  Layers,
  Globe,
  Database
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0a261a] text-[#fcfdfa] font-sans selection:bg-[#6d8c7c]/30 selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a261a]/80 backdrop-blur-xl border-b border-white/5 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-[#6d8c7c] p-2.5 rounded-xl group-hover:bg-white transition-all duration-500">
            <Activity className="w-5 h-5 text-[#0a261a]" />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase font-outfit">
            SalesBot <span className="text-[#6d8c7c]">AI</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[3px] text-[#8fa69a]">
          <a href="#features" className="hover:text-white transition-colors">Tecnología</a>
          <a href="#solutions" className="hover:text-white transition-colors">Soluciones</a>
          <a href="#pricing" className="hover:text-white transition-colors">Membresías</a>
        </div>

        <button 
          onClick={() => window.location.href = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173/signup'}
          className="bg-[#fcfdfa] text-[#0a261a] px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-[2px] transition-all hover:bg-[#6d8c7c] hover:text-white shadow-2xl hover:scale-105 active:scale-95"
        >
          Comenzar Plan Gratis
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-52 pb-40 px-8 flex flex-col items-center text-center">
        {/* Ambient Atmosphere */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#6d8c7c]/10 blur-[150px] rounded-full -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] border border-white/5 rounded-full mb-10 backdrop-blur-md">
            <Shield className="w-4 h-4 text-[#6d8c7c]" />
            <span className="text-[10px] font-black uppercase tracking-[4px] text-[#8fa69a]">SaaS de Venta Autónoma • v2.0</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-[0.85] mb-12 font-outfit uppercase">
            La <span className="text-white/40">Inferencia</span> de <br />
            Ventas más <br />
            <span className="text-[#6d8c7c] italic">Precisa</span> del Mercado.
          </h1>

          <p className="text-lg md:text-xl text-[#8fa69a] font-medium max-w-2xl mx-auto mb-16 leading-relaxed">
            Dealerbot AI transforma su WhatsApp en una terminal de ingresos corporativa. 
            Conexión binaria segura, catálogos híbridos y automatización nativa.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="h-16 px-12 bg-[#6d8c7c] text-[#0a261a] rounded-3xl font-black text-xs uppercase tracking-[3px] hover:bg-white transition-all shadow-2xl shadow-[#6d8c7c]/20 flex items-center justify-center gap-3">
              LANZAR INSTANCIA <ArrowRight className="w-5 h-5" />
            </button>
            <button className="h-16 px-12 bg-white/5 border border-white/10 rounded-3xl font-black text-xs uppercase tracking-[3px] hover:bg-white/10 transition-all backdrop-blur-xl">
              AUDITÓRIA DE IA ⚡
            </button>
          </div>
        </motion.div>
      </section>

      {/* Engineering Stats */}
      <section className="py-24 border-y border-white/5 bg-black/10">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-16">
          {[
            { label: "Tiempo de Respuesta IA", value: "< 0.8s" },
            { label: "Disponibilidad del Sistema", value: "99.99%" },
            { label: "Órdenes Procesadas", value: "2M+" },
            { label: "Cero Latencia Binaria", value: "0ms" }
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-[#6d8c7c] mb-3 font-outfit">{s.value}</div>
              <div className="text-[9px] font-black uppercase tracking-[3px] text-[#8fa69a]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing - The Core Component */}
      <section id="pricing" className="py-40 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-24 max-w-2xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tighter mb-6 font-outfit uppercase">Membresías <span className="opacity-30 italic">Estratégicas</span></h2>
          <p className="text-[#8fa69a] font-medium leading-relaxed">Arquitectura escalable diseñada para maximizar la conversión en cada etapa de su negocio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Gratis",
              price: "0",
              desc: "Perfecto para validación de concepto.",
              features: ["1 Instancia WhatsApp", "1 Agente de IA", "1 Tienda Virtual", "Soporte comunitario"],
              btn: "Empezar Gratis",
              premium: false
            },
            {
              name: "Starter",
              price: "125",
              desc: "Potencia para negocios en crecimiento.",
              features: ["3 Instancias WhatsApp", "5 Agentes de IA", "10 Tiendas Virtuales", "Analítica Avanzada", "Soporte por Email"],
              btn: "Seleccionar Starter",
              premium: true
            },
            {
              name: "Pro",
              price: "217",
              desc: "Infraestructura crítica empresarial.",
              features: ["10 Instancias WhatsApp", "Agentes Ilimitados", "Tiendas Ilimitadas", "Soporte VIP 24/7", "Integración Custom"],
              btn: "Seleccionar Pro",
              premium: false
            }
          ].map((plan, i) => (
            <div key={i} className={`p-12 rounded-[40px] flex flex-col justify-between transition-all duration-500 ${plan.premium ? 'bg-[#6d8c7c] text-[#0a261a] scale-105 shadow-3xl' : 'bg-white/[0.03] border border-white/5 hover:border-[#6d8c7c]/30'}`}>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[4px] mb-8 opacity-60">{plan.name}</div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-bold font-outfit">${plan.price}</span>
                  <span className="text-sm font-bold opacity-60">USD/mes</span>
                </div>
                <p className={`text-sm font-medium mb-10 leading-relaxed ${plan.premium ? 'text-[#0a261a]/70' : 'text-[#8fa69a]'}`}>{plan.desc}</p>
                <div className="space-y-4 mb-12">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <CheckCircle className={`w-4 h-4 ${plan.premium ? 'text-[#0a261a]' : 'text-[#6d8c7c]'}`} />
                      <span className="text-xs font-bold uppercase tracking-wider">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[3px] transition-all ${plan.premium ? 'bg-[#0a261a] text-white hover:bg-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
                {plan.btn}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Deep Footer */}
      <footer className="py-24 border-t border-white/5 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#6d8c7c] p-2 rounded-lg">
                <Activity className="w-4 h-4 text-[#0a261a]" />
              </div>
              <span className="text-lg font-black uppercase tracking-widest font-outfit">Dealerbot AI</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[5px] text-[#8fa69a]">Global Infrastructure</p>
          </div>
          
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[3px] text-[#8fa69a]">
            <a href="#" className="hover:text-white transition-all">Termini</a>
            <a href="#" className="hover:text-white transition-all">Privacy</a>
            <a href="#" className="hover:text-white transition-all">Security</a>
          </div>

          <div className="text-[10px] font-bold text-[#8fa69a]/40">
            © 2026 DEALERBOT AI ENGINE. TODOS LOS DERECHOS RESERVADOS.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
 default Landing;
