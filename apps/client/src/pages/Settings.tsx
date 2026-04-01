"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { GroqConfig } from '@/components/settings/GroqConfig';
import { GeminiConfig } from '@/components/settings/GeminiConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useWhatsApp();

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
              
              <GeminiConfig 
                apiKey={settings.geminiApiKey} 
                onSave={(key) => updateSettings({ geminiApiKey: key })} 
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
