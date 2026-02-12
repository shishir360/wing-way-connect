import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, Package, Phone, User, MapPin } from "lucide-react";
import QRGenerator from "@/components/qr/QRGenerator";

export default function AgentShipments() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchShipments();
  }, [user]);

  const fetchShipments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shipments')
      .select('*')
      .eq('assigned_agent', user.id)
      .order('created_at', { ascending: false });
    setShipments(data || []);
    setLoading(false);
  };

  const filtered = shipments.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.tracking_id.toLowerCase().includes(q) || s.receiver_name.toLowerCase().includes(q) || s.sender_name.toLowerCase().includes(q);
  });

  const statusLabels: Record<string, string> = {
    pending: "Pending", pickup_scheduled: "Pickup Scheduled", picked_up: "Picked Up",
    in_transit: "In Transit", customs: "In Customs", out_for_delivery: "Out for Delivery",
    delivered: "Delivered", cancelled: "Cancelled",
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <Seo title="Shipments" description="Track, scan, and update shipment statuses assigned to you." />
      <h1 className="text-2xl sm:text-3xl font-bold font-display mb-6">My Shipments</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by Tracking ID, Sender, Receiver..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-primary text-lg">{s.tracking_id}</p>
                  <p className="text-sm text-muted-foreground">{s.route === 'bd-to-ca' ? '🇧🇩→🇨🇦' : '🇨🇦→🇧🇩'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.status === 'delivered' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                  {statusLabels[s.status] || s.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Sender</p>
                    <p className="font-medium">{s.sender_name}</p>
                    <p className="text-xs text-muted-foreground">{s.sender_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Receiver</p>
                    <p className="font-medium">{s.receiver_name}</p>
                    <p className="text-xs text-muted-foreground">{s.receiver_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium">{s.weight || '-'} kg</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Delivery Address</p>
                    <p className="font-medium text-xs">{s.delivery_address || '-'}</p>
                  </div>
                </div>
              </div>

              <QRGenerator shipment={s} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 p-8 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No shipments assigned</p>
        </div>
      )}
    </div>
  );
}
