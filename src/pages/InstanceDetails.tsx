"use client";

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  MessageSquare, 
  Settings, 
  Activity, 
  History, 
  Bot, 
  Shield, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const InstanceDetails = () => {
  const { id } = useParams();
  const { instances, toggleBot, deleteInstance, loading } = useWhatsApp();
  const instance = instances.find(i => i.id === id);

  if (loading) return <MainLayout><div className="animate-pulse space-y-8"><div className="h-12 w-48 bg-accent rounded-xl" /><div className="h-64 bg-accent rounded-3xl" /></div></MainLayout>;
  if (!instance) return <MainLayout><div className="text-center py-20"><h2 className="text-2xl font-bold">Instance not found</h2><Link to="/"><Button className="mt-4">Back to Dashboard</Button></Link></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{instance.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="rounded-full px-3 py-0.5 font-bold bg-primary/5">
                {instance.phoneNumber || 'Unlinked'}
              </Badge>
              <div className="flex items-center gap-1.5 ml-2">
                <div className={cn("w-2 h-2 rounded-full", instance.status === 'connected' ? "bg-green-500" : "bg-red-500")} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{instance.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[32px] border-border/50 overflow-hidden shadow-sm">
              <CardHeader className="bg-accent/30 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold">Bot Configuration</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground">Bot Active</span>
                    <Switch 
                      checked={instance.botEnabled} 
                      onCheckedChange={(checked) => toggleBot(instance.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Response Scope</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['all', 'groups', 'specific'].map((scope) => (
                        <Button 
                          key={scope}
                          variant={instance.scope === scope ? 'default' : 'outline'}
                          className="rounded-xl font-bold capitalize h-10"
                          size="sm"
                        >
                          {scope}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Personality</label>
                    <Button variant="outline" className="w-full rounded-xl font-bold justify-between h-10">
                      Professional Sales <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-accent/30 border border-border/50 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Shield className="w-5 h-5" />
                    <h4 className="font-bold">Safety Controls</h4>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    The bot will only respond to product inquiries based on your scraped ecommerce data. It will not engage in off-topic conversations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-border/50 overflow-hidden shadow-sm">
              <CardHeader className="bg-accent/30 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {[
                    { type: 'msg', user: '+1 555 0123', text: 'How much is the French Press?', time: '2m ago' },
                    { type: 'bot', user: 'Bot Response', text: 'The French Press is $29.99. Would you like to order?', time: '2m ago' },
                    { type: 'msg', user: '+1 555 9876', text: 'Do you have coffee beans?', time: '15m ago' },
                  ].map((log, idx) => (
                    <div key={idx} className="p-4 flex items-start gap-4 hover:bg-accent/20 transition-colors">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        log.type === 'bot' ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground"
                      )}>
                        {log.type === 'bot' ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold">{log.user}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">{log.time}</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground truncate">{log.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full rounded-none h-12 font-bold text-primary hover:bg-primary/5">
                  View Full Logs
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[32px] border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Connection</span>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full">Stable</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Uptime</span>
                  <span className="text-sm font-bold">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Latency</span>
                  <span className="text-sm font-bold">142ms</span>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <Button variant="outline" className="w-full rounded-xl font-bold h-11 gap-2">
                    <Activity className="w-4 h-4" /> Restart Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-destructive/20 bg-destructive/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs font-medium text-destructive/80 leading-relaxed">
                  Deleting this instance will permanently remove all session data and bot configurations. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  className="w-full rounded-xl font-bold h-11 gap-2"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this instance?')) {
                      deleteInstance(instance.id);
                      window.location.href = '/';
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Delete Instance
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default InstanceDetails;