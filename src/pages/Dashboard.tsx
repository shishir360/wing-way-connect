import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useShipments } from "@/hooks/useShipments";
import { useFlightBookings } from "@/hooks/useFlightBookings";
import { useAdmin } from "@/hooks/useAdmin";
import { motion } from "framer-motion";
import { 
  Package, Plane, MapPin, Clock, CheckCircle, AlertCircle, 
  User, Settings, ArrowRight, TrendingUp, Calendar, LogOut,
  Truck, Box, Shield
} from "lucide-react";

// Import 3D images
import box3D from "@/assets/box-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import trackingPhone3D from "@/assets/tracking-phone-3d.png";
import globe3D from "@/assets/globe-3d.png";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500" },
  pickup_scheduled: { label: "Pickup Scheduled", color: "bg-blue-500" },
  picked_up: { label: "Picked Up", color: "bg-blue-600" },
  in_transit: { label: "In Transit", color: "bg-indigo-500" },
  customs: { label: "At Customs", color: "bg-purple-500" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-orange-500" },
  delivered: { label: "Delivered", color: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
  confirmed: { label: "Confirmed", color: "bg-green-500" },
  completed: { label: "Completed", color: "bg-green-600" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { shipments, activeShipments, deliveredShipments, loading: shipmentsLoading } = useShipments();
  const { bookings, upcomingFlights, loading: bookingsLoading } = useFlightBookings();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const stats = [
    { 
      icon: Package, 
      value: activeShipments.length, 
      label: "Active Shipments",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    { 
      icon: CheckCircle, 
      value: deliveredShipments.length, 
      label: "Delivered",
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    { 
      icon: Plane, 
      value: upcomingFlights.length, 
      label: "Upcoming Flights",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    { 
      icon: TrendingUp, 
      value: shipments.length + bookings.length, 
      label: "Total Orders",
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-hero-pattern text-primary-foreground py-10 md:py-14 relative overflow-hidden">
        <motion.img
          src={trackingPhone3D}
          alt="Tracking"
          className="absolute top-4 right-[3%] w-32 sm:w-48 md:w-60 opacity-60 hidden md:block"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={globe3D}
          alt="Globe"
          className="absolute bottom-4 left-[5%] w-24 sm:w-36 md:w-48 opacity-50 hidden lg:block"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="container-wacc relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-foreground/60 text-sm mb-1">Welcome,</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">
                {profile?.full_name || user?.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-primary-foreground/70 mt-1">Your Dashboard</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => navigate("/dashboard/profile")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8 z-10 px-4">
        <div className="container-wacc">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border/50 p-4 sm:p-6 shadow-premium"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="section-padding">
        <div className="container-wacc">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 font-display">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/cargo-courier" className="group">
              <div className="bg-gradient-to-br from-route-bd-ca to-route-bd-ca/80 rounded-2xl p-5 text-white hover:shadow-lg transition-all">
                <Box className="h-8 w-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Book New Shipment</h3>
                <p className="text-white/70 text-sm">Send cargo or courier</p>
                <ArrowRight className="h-5 w-5 mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link to="/air-ticket" className="group">
              <div className="bg-gradient-to-br from-route-ca-bd to-route-ca-bd/80 rounded-2xl p-5 text-white hover:shadow-lg transition-all">
                <Plane className="h-8 w-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Book Air Ticket</h3>
                <p className="text-white/70 text-sm">Book your flight</p>
                <ArrowRight className="h-5 w-5 mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link to="/track-shipment" className="group">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-white hover:shadow-lg transition-all">
                <MapPin className="h-8 w-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Track Shipment</h3>
                <p className="text-white/70 text-sm">Find your parcel</p>
                <ArrowRight className="h-5 w-5 mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link to="/get-quote" className="group">
              <div className="bg-gradient-to-br from-cta to-cta/80 rounded-2xl p-5 text-cta-foreground hover:shadow-lg transition-all">
                <TrendingUp className="h-8 w-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Get Quote</h3>
                <p className="text-cta-foreground/70 text-sm">Know the price</p>
                <ArrowRight className="h-5 w-5 mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Shipments */}
      <section className="section-padding bg-secondary/50">
        <div className="container-wacc">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display">Active Shipments</h2>
            {activeShipments.length > 0 && (
              <Link to="/dashboard/shipments" className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          {shipmentsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : activeShipments.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {activeShipments.slice(0, 4).map((shipment) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-primary">{shipment.tracking_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {shipment.route === "bd-to-ca" ? "🇧🇩 → 🇨🇦" : "🇨🇦 → 🇧🇩"}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusLabels[shipment.status]?.color || "bg-gray-500"}`}>
                      {statusLabels[shipment.status]?.label || shipment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Weight</p>
                      <p className="font-medium">{shipment.weight || "-"} kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Packages</p>
                      <p className="font-medium">{shipment.packages}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Receiver</p>
                      <p className="font-medium">{shipment.receiver_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Delivery</p>
                      <p className="font-medium">
                        {shipment.estimated_delivery 
                          ? new Date(shipment.estimated_delivery).toLocaleDateString("en-US")
                          : "-"
                        }
                      </p>
                    </div>
                  </div>
                  <Link 
                    to={`/track-shipment?id=${shipment.tracking_id}`}
                    className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Track <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
              <motion.img
                src={box3D}
                alt="No shipments"
                className="w-24 h-24 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-semibold mb-2">No Active Shipments</h3>
              <p className="text-muted-foreground mb-4">Book your first shipment</p>
              <Button asChild>
                <Link to="/cargo-courier">Book Shipment</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Flights */}
      <section className="section-padding">
        <div className="container-wacc">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display">Upcoming Flights</h2>
            {upcomingFlights.length > 0 && (
              <Link to="/dashboard/flights" className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {bookingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : upcomingFlights.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingFlights.slice(0, 4).map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-primary">{booking.booking_ref}</p>
                      <p className="text-sm text-muted-foreground">{booking.airline || "Airline TBD"}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusLabels[booking.status]?.color || "bg-gray-500"}`}>
                      {statusLabels[booking.status]?.label || booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="font-bold">{booking.from_city}</p>
                      <p className="text-xs text-muted-foreground">{booking.departure_time || "--:--"}</p>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-px bg-border" />
                      <Plane className="h-4 w-4 mx-2 text-muted-foreground" />
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{booking.to_city}</p>
                      <p className="text-xs text-muted-foreground">{booking.arrival_time || "--:--"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(booking.departure_date).toLocaleDateString("en-US")}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {booking.adults + booking.children} passengers
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
              <motion.img
                src={airplane3D}
                alt="No flights"
                className="w-24 h-24 mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Flights</h3>
              <p className="text-muted-foreground mb-4">Book your next flight</p>
              <Button asChild>
                <Link to="/air-ticket">Book Flight</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
