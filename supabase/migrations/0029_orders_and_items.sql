-- Creación de la tabla orders y su relación con products (order_items)

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    store_id uuid REFERENCES public.stores(id),
    instance_id uuid REFERENCES public.instances(id),
    channel_id uuid REFERENCES public.control_channels(id),
    workspace_id uuid REFERENCES public.workspaces(id),
    total_amount numeric DEFAULT 0,
    metadata jsonb,
    delivery_data text,
    status text DEFAULT 'PENDING_DELIVERY',
    bot_closed boolean DEFAULT false,
    latitude numeric,
    longitude numeric,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manage_orders_policy" ON public.orders;
CREATE POLICY "manage_orders_policy" ON public.orders
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()))
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

-- Link Ventas y Productos
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id),
    quantity integer DEFAULT 1,
    unit_price numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manage_order_items_policy" ON public.order_items;
CREATE POLICY "manage_order_items_policy" ON public.order_items
    FOR ALL TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())))
    WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())));
