"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
import { 
    Package, 
    Truck, 
    CheckCircle2, 
    Clock, 
    Search, 
    Filter,
    MapPin,
    Phone,
    User,
    Store,
    Calendar,
    ChevronRight,
    Tag,
    Bot,
    UserCircle,
    Maximize2,
    Map as MapIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sileo as toast } from 'sileo';

// Leaflet CDN is used for the map to avoid API keys and complex setups
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const Orders = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showMap, setShowMap] = useState(false);
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, store:stores(name), channel:control_channels(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error: any) {
            toast.error('Error al cargar pedidos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Load Leaflet resources and initialize map
    useEffect(() => {
        if (!showMap || !mapContainerRef.current) return;

        const initMap = () => {
            // @ts-ignore
            if (mapRef.current) return;

            // @ts-ignore
            const L = window.L;
            if (!L) return;

            const map = L.map(mapContainerRef.current).setView([-34.6037, -58.3816], 13); // Default view
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            mapRef.current = map;

            // Add markers for orders with coordinates
            orders.filter(o => o.latitude && o.longitude).forEach(order => {
                const marker = L.marker([order.latitude, order.longitude]).addTo(map);
                marker.bindPopup(`
                    <div style="font-family: sans-serif; padding: 5px;">
                        <b style="color: #06b6d4;">Pedido #${order.id.split('-')[0]}</b><br/>
                        <span>${order.metadata?.concept || 'Venta'}</span><br/>
                        <span style="font-size: 10px; color: #666;">${order.delivery_data || ''}</span>
                    </div>
                `);
            });

            // If there are markers, fit bounds
            const points = orders.filter(o => o.latitude && o.longitude).map(o => [o.latitude, o.longitude]);
            if (points.length > 0) {
                map.fitBounds(points);
            }
        };

        if (!(window as any).L) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = LEAFLET_CSS;
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = LEAFLET_JS;
            script.async = true;
            script.onload = initMap;
            document.body.appendChild(script);
        } else {
            initMap();
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [showMap, orders]);

    const markAsDelivered = async (id: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'DELIVERED' })
                .eq('id', id);
            
            if (error) throw error;
            toast.success('Pedido marcado como Entregado.');
            fetchOrders();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const filteredOrders = orders.filter(o => 
        o.metadata?.concept?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.includes(search)
    );

    return (
        <MainLayout>
            <div className="space-y-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Gestión de Pedidos</h1>
                        <p className="text-slate-400 font-medium mt-1">Monitorea cierres y gestiona entregas geolocalizadas.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={() => setShowMap(!showMap)}
                            variant="outline"
                            className={cn(
                                "h-11 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest gap-2 transition-all",
                                showMap ? "bg-cyan-500 text-black border-cyan-500 ai-glow" : "bg-white/5 text-slate-300 hover:bg-white/10"
                            )}
                        >
                            <MapIcon className="w-4 h-4" /> {showMap ? 'Ocultar Mapa' : 'Ver Mapa Global'}
                        </Button>
                        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input 
                                    placeholder="Buscar pedido..." 
                                    className="pl-10 h-11 bg-transparent border-none w-64 text-white focus-visible:ring-0"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {showMap && (
                    <div className="glass-panel h-[400px] overflow-hidden p-0 border-cyan-500/20 shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)]">
                        <div ref={mapContainerRef} className="w-full h-full z-10" />
                    </div>
                )}

                {/* Status Tabs */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    <StatusBadge label="Por Entregar" count={orders.filter(o => o.status === 'PENDING_DELIVERY').length} active color="bg-orange-500" />
                    <StatusBadge label="Entregados" count={orders.filter(o => o.status === 'DELIVERED').length} color="bg-green-500" />
                    <StatusBadge label="Cancelados" count={orders.filter(o => o.status === 'CANCELLED').length} color="bg-red-500" />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 animate-pulse rounded-3xl" />)}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-20 text-center glass-card border-dashed">
                        <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium italic">No hay pedidos registrados en esta sección.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="glass-card p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                                
                                {order.latitude && (
                                    <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none translate-x-1/4 -translate-y-1/4">
                                        <MapPin className="w-full h-full text-cyan-400" />
                                    </div>
                                )}

                                {/* Left Side: Order Info */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                order.status === 'PENDING_DELIVERY' ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                                            )}>
                                                {order.status === 'PENDING_DELIVERY' ? <Truck className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Pedido #{order.id.split('-')[0]}</h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {order.latitude && (
                                                <Badge className="bg-cyan-500/20 text-cyan-400 border-none rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest gap-1.5">
                                                    <MapPin className="w-2.5 h-2.5" /> Geolocalizado
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-none",
                                                order.status === 'PENDING_DELIVERY' ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
                                            )}>
                                                {order.status === 'PENDING_DELIVERY' ? 'Por Entregar' : 'Entregado'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sucursal / Canal</span>
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <Store className="w-4 h-4 text-cyan-400" />
                                                <span>{order.channel?.name || 'Ventas Directas'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Atribución</span>
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                {order.bot_closed ? <Bot className="w-4 h-4 text-cyan-400" /> : <UserCircle className="w-4 h-4 text-orange-400" />}
                                                <span>{order.bot_closed ? 'Inteligencia Artificial' : 'Vendedor Humano'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group/loc">
                                        <div className="flex items-start gap-4">
                                            <MapPin className="w-5 h-5 text-cyan-400 mt-1" />
                                            <div className="flex-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Datos de Entrega</span>
                                                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                                    {order.delivery_data || 'Sin datos registrados'}
                                                </p>
                                            </div>
                                            {order.latitude && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-xl h-10 w-10 hover:bg-cyan-500 hover:text-black transition-all"
                                                    onClick={() => {
                                                        setShowMap(true);
                                                        setTimeout(() => {
                                                            if (mapRef.current) {
                                                                mapRef.current.setView([order.latitude, order.longitude], 16);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }
                                                        }, 500);
                                                    }}
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Summary & Actions */}
                                <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-8 lg:pt-0 lg:pl-8">
                                    <div className="space-y-6">
                                        <div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Concepto</span>
                                            <p className="text-lg font-black text-white leading-tight uppercase">{order.metadata?.concept || 'Venta de Productos'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Monto Total</span>
                                            <p className="text-4xl font-black text-cyan-400 tracking-tighter">${order.total_amount}</p>
                                        </div>
                                    </div>

                                    {order.status === 'PENDING_DELIVERY' && (
                                        <Button 
                                            onClick={() => markAsDelivered(order.id)}
                                            className="w-full h-12 bg-white/10 hover:bg-green-500 hover:text-white text-slate-300 font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Marcar Entregado
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

const StatusBadge = ({ label, count, active, color }: any) => (
    <div className={cn(
        "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all cursor-pointer whitespace-nowrap",
        active ? "bg-white/10 border-white/20" : "bg-transparent border-white/5 hover:bg-white/5"
    )}>
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <span className={cn("text-xs font-black uppercase tracking-widest", active ? "text-white" : "text-slate-500")}>{label}</span>
        <Badge variant="outline" className="bg-white/5 border-none text-[10px] font-black text-slate-400">
            {count}
        </Badge>
    </div>
);

export default Orders;
