"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./contexts/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import InstanceDetails from "./pages/InstanceDetails";
import Agents from "./pages/Agents";
import FlowBuilder from "./pages/FlowBuilder";
import Products from "./pages/Products";
import Delivery from "./pages/Delivery";
import SalesDashboard from "./pages/SalesDashboard";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/instances" element={<Dashboard />} />
              <Route path="/instances/:id" element={<InstanceDetails />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/flows" element={<FlowBuilder />} />
              <Route path="/products" element={<Products />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/sales" element={<SalesDashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;