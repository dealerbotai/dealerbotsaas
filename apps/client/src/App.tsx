import { Toaster as SileoToaster } from "sileo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminMemberships from "./pages/AdminMemberships";
import Settings from "./pages/Settings";
import InstanceDetails from "./pages/InstanceDetails";
import InstanceWizard from "./pages/InstanceWizard";
import WhatsAppWeb from "./pages/WhatsAppWeb";
import Analytics from "./pages/Analytics";
import Agents from "./pages/Agents";
import Stores from "./pages/Stores";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <SileoToaster position="top-center" />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/instances" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/instances/new" element={<ProtectedRoute><InstanceWizard /></ProtectedRoute>} />
              <Route path="/instances/:id" element={<ProtectedRoute><InstanceDetails /></ProtectedRoute>} />
              <Route path="/instances/:id/web" element={<ProtectedRoute><WhatsAppWeb /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
              <Route path="/stores" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
              <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/admin/memberships" element={<ProtectedRoute><AdminMemberships /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;