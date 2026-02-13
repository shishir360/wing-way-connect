import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import CargoCourier from "./pages/CargoCourier";
import AirTicket from "./pages/AirTicket";
import TrackShipment from "./pages/TrackShipment";
import GetQuote from "./pages/GetQuote";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import DebugAuth from "./pages/DebugAuth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminOverview from "./pages/admin/AdminOverview";
import ShipmentDetailsPage from "./pages/admin/ShipmentDetailsPage";
import AdminShipments from "./pages/admin/AdminShipments";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminAgentProfile from "./pages/admin/AdminAgentProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLayout from "./pages/admin/AdminLayout";
import AgentAuth from "./pages/agent/AgentAuth";
import AgentLayout from "./pages/agent/AgentLayout";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentShipments from "./pages/agent/AgentShipments";
import AgentProfile from "./pages/agent/AgentProfile";
import AgentScan from "./pages/agent/AgentScan";
import NotFound from "./pages/NotFound";
import UserShipments from "./pages/user/UserShipments";
import UserBookings from "./pages/user/UserBookings";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/cargo-courier" element={<CargoCourier />} />
              <Route path="/air-ticket" element={<AirTicket />} />
              <Route path="/track-shipment" element={<TrackShipment />} />
              <Route path="/get-quote" element={<GetQuote />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/debug-auth" element={<DebugAuth />} />

              {/* Protected User Routes */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user', 'admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute allowedRoles={['user', 'admin']}><ProfilePage /></ProtectedRoute>} />
              <Route path="/dashboard/shipments" element={<ProtectedRoute allowedRoles={['user', 'admin']}><UserShipments /></ProtectedRoute>} />
              <Route path="/dashboard/bookings" element={<ProtectedRoute allowedRoles={['user', 'admin']}><UserBookings /></ProtectedRoute>} />

              {/* Protected Admin Routes */}
              <Route path="/admin/login" element={<AdminAuth />} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="shipments" element={<AdminShipments />} />
                <Route path="shipments/:id" element={<ShipmentDetailsPage />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:userId" element={<AdminUserDetails />} />
                <Route path="agents/:id" element={<AdminAgentProfile />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Protected Agent Routes */}
              <Route path="/agent/login" element={<AgentAuth />} />
              <Route path="/agent" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><AgentLayout /></ProtectedRoute>}>
                <Route index element={<AgentDashboard />} />
                <Route path="shipments" element={<AgentShipments />} />
                <Route path="scan" element={<AgentScan />} />
                <Route path="profile" element={<AgentProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
