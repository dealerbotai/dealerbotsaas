"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
import { 
    Users, 
    Search, 
    Filter, 
    MoreHorizontal, 
    ExternalLink,
    Shield,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { sileo as toast } from 'sileo';
import { PlanType } from '@/lib/acl';

interface WorkspaceAdminView {
    id: string;
    name: string;
    plan: PlanType;
    subscription_status: string;
    created_at: string;
    customer_id?: string;
}

const AdminMemberships = () => {
    const [workspaces, setWorkspaces] = useState<WorkspaceAdminView[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchWorkspaces = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWorkspaces(data || []);
        } catch (err: any) {
            toast.error('Error al cargar workspaces: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const updatePlan = async (id: string, plan: PlanType) => {
        try {
            const { error } = await supabase
                .from('workspaces')
                .update({ plan })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Plan actualizado a ${plan.toUpperCase()}`);
            setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, plan } : ws));
        } catch (err: any) {
            toast.error('Error: ' + err.message);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('workspaces')
                .update({ subscription_status: status })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Estado actualizado a ${status.toUpperCase()}`);
            setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, subscription_status: status } : ws));
        } catch (err: any) {
            toast.error('Error: ' + err.message);
        }
    };

    const filteredWorkspaces = workspaces.filter(ws => 
        ws.name.toLowerCase().includes(search.toLowerCase()) || 
        ws.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-outfit p-4 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-2">
                            <Shield className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Super Admin Panel</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
                            Control de Membresías
                            <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary uppercase px-3">
                                {workspaces.length} Workspaces
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Administra planes, estados y facturación de toda la plataforma Dealerbot.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar workspace o ID..." 
                                className="pl-11 h-12 bg-card border-none rounded-2xl shadow-sm font-medium text-sm focus:ring-primary/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="secondary" 
                            className="h-12 w-12 rounded-2xl p-0 shrink-0"
                            onClick={fetchWorkspaces}
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-card rounded-[32px] border border-border/5 shadow-xl overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sincronizando Base de Datos...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-secondary/30">
                                <TableRow className="hover:bg-transparent border-border/10">
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 pl-8">Workspace</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Plan Actual</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Estado</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">ID Cliente</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Creación</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 pr-8 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredWorkspaces.map((ws) => (
                                    <TableRow key={ws.id} className="hover:bg-secondary/20 border-border/5 transition-colors group">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground leading-none mb-1">{ws.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">ID: {ws.id.slice(0, 18)}...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "font-black uppercase text-[9px] px-3 py-1 rounded-full border-none",
                                                ws.plan === 'pro' ? "bg-amber-500/20 text-amber-500" :
                                                ws.plan === 'starter' ? "bg-primary/20 text-primary" :
                                                "bg-secondary text-muted-foreground"
                                            )}>
                                                {ws.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {ws.subscription_status === 'active' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                ) : ws.subscription_status === 'canceled' ? (
                                                    <XCircle className="w-4 h-4 text-destructive" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span className="text-[10px] font-bold uppercase text-foreground/80">{ws.subscription_status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                                <code className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-lg">
                                                    {ws.customer_id || 'SIN_VINCIULAR'}
                                                </code>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-muted-foreground">
                                            {new Date(ws.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-secondary">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2 bg-popover">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Gestión de Plan</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => updatePlan(ws.id, 'free')} className="rounded-xl font-bold text-xs py-3 cursor-pointer">Cambiar a FREE</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updatePlan(ws.id, 'starter')} className="rounded-xl font-bold text-xs py-3 cursor-pointer">Cambiar a STARTER</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updatePlan(ws.id, 'pro')} className="rounded-xl font-bold text-xs py-3 cursor-pointer">Cambiar a PRO</DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/10 my-1" />
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Estado Suscripción</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => updateStatus(ws.id, 'active')} className="rounded-xl font-bold text-xs py-3 cursor-pointer text-emerald-500">Marcar ACTIVA</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateStatus(ws.id, 'past_due')} className="rounded-xl font-bold text-xs py-3 cursor-pointer text-amber-500">Marcar ATRASADA</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateStatus(ws.id, 'canceled')} className="rounded-xl font-bold text-xs py-3 cursor-pointer text-destructive">Marcar CANCELADA</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminMemberships;
