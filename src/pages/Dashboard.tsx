import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useShipments } from "@/hooks/useShipments";
import { useFlightBookings } from "@/hooks/useFlightBookings";
import { useAdmin } from "@/hooks/useAdmin";
import { motion } from "framer-motion";
import {
  Package, Plane, Search, ArrowRight,
  TrendingUp, Settings, LogOut, Shield, Box,
  Calendar, CheckCircle, ChevronRight
} from "lucide-react";

// Import 3D images
import box3D from "@/assets/box-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import trackingPhone3D from "@/assets/tracking-phone-3d.png";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  processing: "bg-blue-500/10 text-blue-600 border-blue-200",
  confirmed: "bg-green-500/10 text-green-600 border-green-200",
  delivered: "bg-green-500/10 text-green-600 border-green-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
  in_transit: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading, signOut } = useAuth();
  // Hooks
  const { profile, loading: profileLoading } = useProfile();
  const { activeShipments, shipments, loading: shipmentsLoading } = useShipments();
  const { upcomingFlights, bookings, loading: bookingsLoading } = useFlightBookings();
  const { isAdmin } = useAdmin();

  const [trackId, setTrackId] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }

      if (role === 'admin') {
        navigate("/admin");
      } else if (role === 'agent') {
        navigate("/agent");
      }
    }
  }, [user, authLoading, role, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`/track-shipment?id=${trackId.trim()}`);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <Seo title="Dashboard" description="User Dashboard - Wing Way Connect" />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title="Dashboard - My Account" description="Manage your profile, shipments, and bookings with our secure user dashboard." />
      <div className="bg-muted/30 min-h-screen pb-20">
        {/* Premium Hero Section */}
        <section className="bg-[#0f172a] text-white pt-10 pb-20 relative overflow-hidden rounded-b-[3rem]">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[80%] bg-primary/20 blur-[100px] rounded-full" />
            <div className="absolute top-[40%] -left-[10%] w-[40%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full" />

            <motion.img
              src={trackingPhone3D}
              alt="Tracking"
              className="absolute top-10 right-[5%] w-64 opacity-20 hidden lg:block"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="container-wacc relative z-10">
            {/* Header / Nav */}
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/30">
                  {profile?.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-white/60 text-sm">Welcome back,</p>
                  <h1 className="text-xl font-bold font-display">{profile?.full_name || "User"}</h1>
                </div>
              </div>

              <div className="flex gap-2">
                {isAdmin && (
                  <Button variant="secondary" size="sm" className="hidden sm:flex" onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" /> Admin
                  </Button>
                )}
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => navigate("/dashboard/profile")}>
                  <Settings className="h-4 w-4 mr-2" /> Profile
                </Button>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main Tracking Search */}
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6 leading-tight">
                Track your shipment <br /> <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">in real-time</span>
              </h2>

              <form onSubmit={handleTrack} className="relative max-w-lg mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex bg-white rounded-2xl p-2 shadow-xl">
                    <div className="flex-1 flex items-center pl-4">
                      <Search className="h-5 w-5 text-gray-400 mr-3" />
                      <Input
                        placeholder="Enter tracking number (e.g. WACC-123456)"
                        className="border-0 shadow-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 h-12 text-base"
                        value={trackId}
                        onChange={(e) => setTrackId(e.target.value)}
                      />
                    </div>
                    <Button type="submit" size="lg" className="rounded-xl h-12 px-8 font-bold shadow-lg">
                      Track
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Floating Action Cards */}
        <section className="container-wacc -mt-16 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/cargo-courier" className="group">
              <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:bg-blue-500/10" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                    <Box className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Send Package</h3>
                  <p className="text-muted-foreground mb-4">Ship cargo or documents securely to anywhere.</p>
                  <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Start Shipping <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/air-ticket" className="group">
              <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:bg-purple-500/10" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                    <Plane className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Book Flight</h3>
                  <p className="text-muted-foreground mb-4">Find best flight deals and book tickets instantly.</p>
                  <div className="flex items-center text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Search Flights <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/get-quote" className="group">
              <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:bg-orange-500/10" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/20 flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Get Quote</h3>
                  <p className="text-muted-foreground mb-4">Calculate shipping costs instantly.</p>
                  <div className="flex items-center text-orange-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Calculate Now <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Dashboard Widgets */}
        <section className="container-wacc mt-12 grid lg:grid-cols-3 gap-8">

          {/* Main Activity Feed (Shipments + Flights) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Active Shipments */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> My Recent Shipments
                </h2>
                {activeShipments.length > 0 && <Link to="/dashboard/shipments" className="text-sm text-primary font-medium hover:underline">View All</Link>}
              </div>

              {shipmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-card/50 animate-pulse rounded-2xl" />)}
                </div>
              ) : activeShipments.length > 0 ? (
                <div className="space-y-4">
                  {activeShipments.slice(0, 3).map((shipment) => (
                    <div key={shipment.id} className="bg-white dark:bg-card p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                          <Box className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{shipment.tracking_id}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {shipment.from_city || 'Origin'}
                            <ArrowRight className="h-3 w-3" />
                            {shipment.to_city || 'Destination'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[shipment.status] || "bg-gray-100/50 text-gray-600 border-gray-200"}`}>
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <Link to={`/track-shipment?id=${shipment.tracking_id}`} className="text-sm text-primary flex items-center hover:underline opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          Track Status <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-card rounded-2xl p-8 border border-border/50 text-center">
                  <img src={box3D} className="w-20 mx-auto opacity-50 mb-4" alt="Empty" />
                  <p className="text-muted-foreground">You haven't placed any shipments yet.</p>
                  <Button variant="link" asChild><Link to="/cargo-courier">Book your first shipment</Link></Button>
                </div>
              )}
            </div>

            {/* Upcoming Flights */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plane className="h-5 w-5 text-purple-500" /> Upcoming Flights
                </h2>
                {upcomingFlights.length > 0 && <Link to="/dashboard/bookings" className="text-sm text-primary font-medium hover:underline">View All</Link>}
              </div>

              {bookingsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-card/50 animate-pulse rounded-2xl" />)}
                </div>
              ) : upcomingFlights.length > 0 ? (
                <div className="space-y-4">
                  {upcomingFlights.slice(0, 3).map((flight) => (
                    <div key={flight.id} className="bg-white dark:bg-card p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                          <Plane className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{flight.from_city} <span className="text-muted-foreground font-normal">to</span> {flight.to_city}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> {new Date(flight.departure_date).toLocaleDateString()}
                            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                            {flight.airline}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[flight.status] || "bg-gray-100 text-gray-600"}`}>
                          {flight.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-card rounded-2xl p-8 border border-border/50 text-center">
                  <img src={airplane3D} className="w-20 mx-auto opacity-50 mb-4" alt="Empty" />
                  <p className="text-muted-foreground">No upcoming flights</p>
                  <Button variant="link" asChild><Link to="/air-ticket">Book a flight</Link></Button>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1">Account Stats</h3>
                <p className="text-white/70 text-sm mb-6">Your activity overview and summary.</p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
                    <span className="flex items-center gap-2 text-sm"><Box className="h-4 w-4" /> Total Shipments</span>
                    <span className="font-bold text-lg">{shipments.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
                    <span className="flex items-center gap-2 text-sm"><Plane className="h-4 w-4" /> Flight Bookings</span>
                    <span className="font-bold text-lg">{bookings.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl">
                    <span className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4" /> Delivered</span>
                    <span className="font-bold text-lg">{activeShipments.filter(s => s.status === 'delivered').length}</span>
                  </div>
                </div>
              </div>

              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
            </div>

            {/* Marketing Widget */}
            <div className="bg-white dark:bg-card rounded-3xl p-1 shadow-md border border-border/50">
              <div className="bg-muted/50 rounded-[1.3rem] p-5 text-center">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">Our support team is here to assist you with your shipments.</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          </div>

        </section>
      </div>
    </Layout>
  );
}
