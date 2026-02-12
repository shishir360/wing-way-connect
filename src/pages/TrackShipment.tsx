import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, Plane, CheckCircle, Clock, MapPin, Phone } from "lucide-react";
import { mockTrackingData, CargoTracking, FlightTracking } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// Extending locally for now to match UI expectation with potential DB fields
interface TrackingEvent {
  status: string;
  label: string;
  date?: string;
  location?: string;
  description?: string;
  completed: boolean;
  current?: boolean;
}

const shipmentStatuses = [
  "pending", "pickup_scheduled", "picked_up", "in_transit",
  "customs", "out_for_delivery", "delivered"
];

const statusLabels: Record<string, string> = {
  pending: "Pending", pickup_scheduled: "Pickup Scheduled", picked_up: "Picked Up",
  in_transit: "In Transit", customs: "At Customs", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled",
};

// Import 3D images
import trackingPhone3D from "@/assets/tracking-phone-3d.png";
import mapRoute3D from "@/assets/map-route-3d.png";
import box3D from "@/assets/box-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import deliveryScooter3D from "@/assets/delivery-scooter-3d.png";
import truck3D from "@/assets/truck-3d.png";

export default function TrackShipment() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const [trackingId, setTrackingId] = useState(initialId);
  const [result, setResult] = useState<CargoTracking | FlightTracking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  // Real-time updates
  useEffect(() => {
    if (!result) return;
    const table = result.type === 'cargo' ? 'shipments' : 'flight_bookings';
    const idValue = result.type === 'cargo'
      ? (result as CargoTracking).trackingId
      : (result as FlightTracking).bookingRef;

    const channel = supabase
      .channel('public:' + table)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
        const newData = payload.new as any;
        if (newData && (newData.tracking_id === idValue || newData.booking_ref === idValue || (result.type === 'flight' && newData.pnr === (result as FlightTracking).pnr))) {
          handleSearch(idValue);
        }
      })
      .subscribe();

    if (result.type === 'cargo') {
      const timelineChannel = supabase
        .channel('public:shipment_timeline')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shipment_timeline' }, () => {
          handleSearch(idValue);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); supabase.removeChannel(timelineChannel); };
    }
    return () => { supabase.removeChannel(channel); };
  }, [result]);

  const handleSearch = async (id?: string) => {
    const searchId = (id || trackingId).trim().toUpperCase();
    setError("");
    setLoading(true);

    if (!searchId) {
      setError("Please enter a tracking ID");
      setLoading(false);
      return;
    }

    try {
      const { data: shipment } = await supabase
        .from('shipments')
        .select(`*, shipment_timeline (*)`)
        .eq('tracking_id', searchId)
        .maybeSingle();

      if (shipment) {
        // Build Timeline Logic
        const fetchedTimeline = shipment.shipment_timeline || [];
        const currentStatusIndex = shipmentStatuses.indexOf(shipment.status);

        let fullTimeline: TrackingEvent[] = [];

        if (shipment.status === 'cancelled') {
          // Special Case: Just show what happened + Cancelled
          fullTimeline = fetchedTimeline.map((t: any) => ({
            status: t.status,
            label: t.description || statusLabels[t.status] || t.status,
            date: new Date(t.event_time).toLocaleString(),
            location: t.location || '',
            description: t.description,
            completed: true,
            current: t.is_current
          }));
        } else {
          // Standard Flow
          fullTimeline = shipmentStatuses.map((status, index) => {
            const existingEvent = fetchedTimeline.find((t: any) => t.status === status);
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;

            return {
              status: status,
              label: existingEvent?.description || statusLabels[status],
              date: existingEvent ? new Date(existingEvent.event_time).toLocaleString() : undefined,
              location: existingEvent?.location || '',
              description: existingEvent?.description || (isCurrent ? 'In Progress' : 'Pending'),
              completed: isCompleted,
              current: isCurrent
            };
          });
        }

        setResult({
          type: "cargo",
          trackingId: shipment.tracking_id,
          cargoType: shipment.cargo_type || "General",
          weight: (shipment.weight || 0) + " kg",
          packages: shipment.packages || 1,
          from: shipment.from_city || "Origin",
          to: shipment.to_city || "Destination",
          bookedDate: new Date(shipment.created_at).toLocaleDateString(),
          estimatedDelivery: shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : "Pending",
          deliveredDate: shipment.actual_delivery ? new Date(shipment.actual_delivery).toLocaleDateString() : undefined,
          sender: shipment.sender_name,
          receiver: shipment.receiver_name,
          contact: shipment.sender_phone,
          amount: shipment.total_cost ? "$" + shipment.total_cost : "N/A",
          currentStatus: shipment.status,
          timeline: fullTimeline
        } as CargoTracking);
        setLoading(false);
        return;
      }

      const { data: flight } = await supabase
        .from('flight_bookings')
        .select('*')
        .or(`booking_ref.eq.${searchId},pnr.eq.${searchId}`)
        .maybeSingle();

      if (flight) {
        setResult({
          type: "flight",
          bookingRef: flight.booking_ref,
          pnr: flight.pnr || "N/A",
          status: flight.status,
          airline: flight.airline || "N/A",
          flightNumber: flight.flight_number || "N/A",
          from: flight.from_city,
          to: flight.to_city,
          departureDate: flight.departure_date,
          departureTime: flight.departure_time || "",
          arrivalDate: flight.arrival_date || "",
          arrivalTime: flight.arrival_time || "",
          duration: flight.duration || "",
          stops: flight.stops ? `${flight.stops} stops` : "Direct",
          class: flight.cabin_class,
          passengers: Array((flight.adults || 0) + (flight.children || 0)).fill(0).map((_, i) => ({ name: `Passenger ${i + 1}`, ticketNo: "-" })),
          totalAmount: flight.total_price ? "$" + flight.total_price : "N/A"
        } as FlightTracking);
        setLoading(false);
        return;
      }

      setError("No shipment found with this tracking ID.");
      setResult(null);
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const sampleIds = ["WC-SH-10245", "WC-SH-20891", "WC-FL-30567"];

  return (
    <Layout>
      <Seo
        title="Track Shipment"
        description="Track your cargo or flight booking status in real-time with Wing Way Connect."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-12 md:py-16 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={trackingPhone3D}
          alt="Tracking"
          className="absolute top-2 right-[2%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-80 hidden md:block"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={box3D}
          alt="Box"
          className="absolute bottom-4 left-[3%] w-32 sm:w-48 md:w-60 opacity-70 hidden md:block"
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={mapRoute3D}
          alt="Map Route"
          className="absolute top-1/2 left-[12%] w-32 sm:w-48 md:w-56 opacity-60 hidden lg:block -translate-y-1/2"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img
          src={deliveryScooter3D}
          alt="Delivery"
          className="absolute bottom-10 right-[18%] w-40 sm:w-52 md:w-64 opacity-60 hidden lg:block"
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={truck3D}
          alt="Truck"
          className="absolute top-14 right-[32%] w-36 sm:w-48 md:w-60 opacity-50 hidden xl:block"
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container-wacc relative">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Track Shipment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Track Your Shipment</h1>
          <p className="text-xl text-primary-foreground/80">
            Enter your tracking ID to see real-time updates
          </p>
        </div>
      </section>

      <section className="section-padding relative overflow-hidden">
        {/* Background decorative images - BIGGER */}
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute top-10 right-[2%] w-36 sm:w-48 md:w-60 opacity-25 hidden lg:block"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc">
          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-xl border border-border p-6 shadow-card relative overflow-hidden"
            >
              <motion.img
                src={trackingPhone3D}
                alt="Tracking"
                className="absolute -right-8 -bottom-8 w-24 opacity-20"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter Tracking ID (e.g. WC-SH-10245)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12">Track Now</Button>
              </form>

              {error && (
                <p className="text-sm text-destructive mt-3">{error}</p>
              )}

              <div className="mt-4 text-center relative">
                <p className="text-sm text-muted-foreground mb-2">Try sample IDs:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {sampleIds.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setTrackingId(id); handleSearch(id); }}
                      className="text-sm text-primary hover:underline"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Results */}
          {result && result.type === "cargo" && (
            <CargoTrackingResult data={result as CargoTracking} />
          )}

          {result && result.type === "flight" && (
            <FlightTrackingResult data={result as FlightTracking} />
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="section-padding bg-secondary relative overflow-hidden">
        <motion.img
          src={deliveryScooter3D}
          alt="Delivery"
          className="absolute bottom-4 right-[3%] w-44 sm:w-60 md:w-72 opacity-25 hidden lg:block"
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc text-center relative">
          <h2 className="text-xl font-semibold mb-4">Need Help With Your Shipment?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+14378497607" className="inline-flex items-center gap-2 bg-card px-4 py-3 rounded-lg shadow-sm border border-border hover:bg-muted transition-colors">
              <span className="text-lg">🇨🇦</span>
              <Phone className="h-4 w-4" />
              <span>+1 437 849 7607</span>
            </a>
            <a href="tel:+8801715044409" className="inline-flex items-center gap-2 bg-card px-4 py-3 rounded-lg shadow-sm border border-border hover:bg-muted transition-colors">
              <span className="text-lg">🇧🇩</span>
              <Phone className="h-4 w-4" />
              <span>+8801715044409</span>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function CargoTrackingResult({ data }: { data: CargoTracking }) {
  const currentStep = data.timeline.findIndex(t => t.current);
  const isDelivered = data.currentStatus === "delivered";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      {/* Status Card */}
      <div className={cn(
        "rounded-xl p-6 mb-8 text-white relative overflow-hidden",
        isDelivered ? "bg-success" : "bg-primary"
      )}>
        <motion.img
          src={box3D}
          alt="Box"
          className="absolute -right-4 -top-4 w-20 opacity-30"
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="flex items-center gap-3 mb-2 relative">
          {isDelivered ? (
            <CheckCircle className="h-8 w-8" />
          ) : (
            <Package className="h-8 w-8" />
          )}
          <span className="text-2xl font-bold">
            {isDelivered ? "Delivered" : "In Transit"}
          </span>
        </div>
        <p className="text-white/80 relative">
          {isDelivered
            ? `Delivered on ${data.deliveredDate}`
            : `Estimated delivery: ${data.estimatedDelivery}`
          }
        </p>
      </div>

      {/* Shipment Details */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h3 className="font-semibold mb-4">Shipment Details</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tracking ID</p>
            <p className="font-semibold text-primary">{data.trackingId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cargo Type</p>
            <p className="font-medium">{data.cargoType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Weight</p>
            <p className="font-medium">{data.weight}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Packages</p>
            <p className="font-medium">{data.packages}</p>
          </div>
          <div>
            <p className="text-muted-foreground">From</p>
            <p className="font-medium">{data.from}</p>
          </div>
          <div>
            <p className="text-muted-foreground">To</p>
            <p className="font-medium">{data.to}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sender</p>
            <p className="font-medium">{data.sender}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Receiver</p>
            <p className="font-medium">{data.receiver}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-medium">{data.amount}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-6">Shipment Timeline</h3>
        <div className="space-y-6">
          {data.timeline.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  event.completed ? "bg-success text-white" : event.current ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  {event.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                {index < data.timeline.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-full min-h-[2rem] my-1",
                    event.completed ? "bg-success" : "bg-muted"
                  )} />
                )}
              </div>
              <div className="pb-6">
                <p className={cn("font-semibold", event.current && "text-primary")}>{event.label}</p>
                {event.date && <p className="text-sm text-muted-foreground">{event.date}</p>}
                {event.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {event.location}
                  </p>
                )}
                {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FlightTrackingResult({ data }: { data: FlightTracking }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      {/* Status Card */}
      <div className="bg-success text-white rounded-xl p-6 mb-8 relative overflow-hidden">
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute -right-4 -top-4 w-20 opacity-30"
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="flex items-center gap-3 mb-2 relative">
          <CheckCircle className="h-8 w-8" />
          <span className="text-2xl font-bold">Flight {data.status}</span>
        </div>
        <p className="text-white/80 relative">Booking Reference: {data.bookingRef}</p>
      </div>

      {/* Flight Details */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">{data.airline}</p>
            <p className="text-muted-foreground">{data.flightNumber}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">PNR</p>
            <p className="font-bold text-lg">{data.pnr}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 border-t border-border pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Departure</p>
            <p className="text-2xl font-bold">{data.departureTime}</p>
            <p className="font-medium">{data.departureDate}</p>
            <p className="text-muted-foreground">{data.from}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Arrival</p>
            <p className="text-2xl font-bold">{data.arrivalTime}</p>
            <p className="font-medium">{data.arrivalDate}</p>
            <p className="text-muted-foreground">{data.to}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border text-sm">
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">{data.duration}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Stops</p>
            <p className="font-medium">{data.stops}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Class</p>
            <p className="font-medium">{data.class}</p>
          </div>
        </div>
      </div>

      {/* Passengers */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Passengers</h3>
        <div className="space-y-3">
          {data.passengers.map((passenger, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
              <span className="font-medium">{passenger.name}</span>
              <span className="text-sm text-muted-foreground">Ticket: {passenger.ticketNo}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border flex justify-between">
          <span className="font-medium">Total Amount</span>
          <span className="font-bold text-xl text-primary">{data.totalAmount}</span>
        </div>
      </div>
    </motion.div>
  );
}