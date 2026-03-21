"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { GroqConfig } from '@/components/settings/GroqConfig';
import { ScraperSection } from '@/components/settings/ScraperSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Globe, Key, ShieldCheck } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings, scrapeUrl, scraping } = useWhatsApp();

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground font-medium">Configura los parámetros globales para tu automatización.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-8">
          <TabsList className="bg-accent/50 p-1 rounded-2xl h-14 w-full sm:w-auto">
            <TabsTrigger value="general" className="rounded-xl px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-full gap-2">
              <SettingsIcon className="w-4 h-4" /> General
            </TabsTrigger>
            <TabsTrigger value="scraper" className="rounded-xl px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-full gap-2">
              <Globe className="w-4 h-4" /> Escáner
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-full gap-2">
              <ShieldCheck className="w-4 h-4" /> Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GroqConfig 
                apiKey={settings.groqApiKey} 
                onSave={(key) => updateSettings({ groqApiKey: key })} 
              />
              
              <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 flex flex-col justify-center">
                <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">¿Por qué Groq?</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Groq proporciona inferencia ultra rápida para modelos de lenguaje. Al usar Groq, tu bot de WhatsApp puede responder a los clientes en milisegundos, ofreciendo una experiencia de compra fluida y humana.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-accent" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-primary">Confiado por más de 500 tiendas</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scraper" className="outline-none">
            <div className="max-w-4xl">
              <ScraperSection 
                url={settings.ecommerceUrl} 
                scrapedData={settings.scrapedData} 
                onScrape={scrapeUrl} 
                loading={scraping} 
              />
            </div>
          </TabsContent>

          <TabsContent value="security" className="outline-none">
            <div className="bg-card border border-border/50 rounded-[32px] p-8">
              <h3 className="text-xl font-bold mb-6">Seguridad y Privacidad</h3>
              <div className="space-y-6">
                {[
                  { title: 'Cifrado de Extremo a Extremo', desc: 'Todos los mensajes procesados por el bot mantienen el cifrado nativo de WhatsApp.' },
                  { title: 'Almacenamiento Local de Claves', desc: 'Tus claves API nunca se guardan en nuestros servidores. Permanecen en tu navegador.' },
                  { title: 'Gestión de Sesiones', desc: 'Desconecta remotamente cualquier instancia en cualquier momento con un solo clic.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-1">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;