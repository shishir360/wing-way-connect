import { useState } from "react";
import { useAdminShipments } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const shipmentStatuses = [
  "pending", "pickup_scheduled", "picked_up", "in_transit", 
  "customs", "out_for_delivery", "delivered", "cancelled"
];

const statusLabels: Record<string, string> = {
  pending: "Pending", pickup_scheduled: "Pickup Scheduled", picked_up: "Picked Up",
  in_transit: "In Transit", customs: "At Customs", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled",
};

export default function AdminShipments() {
  const { shipments, loading, updateShipmentStatus, refetch } = useAdminShipments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = shipments.filter(s => {
    const matchesSearch = !search || 
      s.tracking_id.toLowerCase().includes(search.toLowerCase()) ||
      s.sender_name.toLowerCase().includes(search.toLowerCase()) ||
      s.receiver_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusUpdate = async (id: string, newStatus: string, trackingId: string) => {
    setUpdating(id);
    try {
      await updateShipmentStatus(id, newStatus);
      
      // Add timeline entry
      await supabase.from('shipment_timeline').insert({
        shipment_id: id,
        status: newStatus,
        description: `Status updated to ${statusLabels[newStatus]}`,
        is_current: true,
      });

      // Try to send email notification
      try {
        await supabase.functions.invoke('notify-status-change', {
          body: { shipmentId: id, newStatus, trackingId },
        });
      } catch (e) {
        console.log('Email notification skipped:', e);
      }

      toast({ title: "Status Updated", description: `${trackingId} → ${statusLabels[newStatus]}` });
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Manage Shipments</h1>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tracking ID, sender, receiver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {shipmentStatuses.map(s => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="p-4">Tracking ID</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Sender</th>
                  <th className="p-4">Receiver</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-medium text-primary">{s.tracking_id}</td>
                    <td className="p-4">{s.route === 'bd-to-ca' ? '🇧🇩→🇨🇦' : '🇨🇦→🇧🇩'}</td>
                    <td className="p-4">
                      <div>{s.sender_name}</div>
                      <div className="text-xs text-muted-foreground">{s.sender_phone}</div>
                    </td>
                    <td className="p-4">
                      <div>{s.receiver_name}</div>
                      <div className="text-xs text-muted-foreground">{s.receiver_phone}</div>
                    </td>
                    <td className="p-4">{s.weight || '-'} kg</td>
                    <td className="p-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="p-4">
                      <Select
                        value={s.status}
                        onValueChange={(v) => handleStatusUpdate(s.id, v, s.tracking_id)}
                        disabled={updating === s.id}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {shipmentStatuses.map(status => (
                            <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No shipments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    pickup_scheduled: "bg-blue-500/10 text-blue-600",
    picked_up: "bg-blue-600/10 text-blue-700",
    in_transit: "bg-indigo-500/10 text-indigo-600",
    customs: "bg-purple-500/10 text-purple-600",
    out_for_delivery: "bg-orange-500/10 text-orange-600",
    delivered: "bg-green-500/10 text-green-600",
    cancelled: "bg-red-500/10 text-red-600",
  };
  const labels: Record<string, string> = {
    pending: "Pending", pickup_scheduled: "Pickup Scheduled", picked_up: "Picked Up",
    in_transit: "In Transit", customs: "Customs", out_for_delivery: "Out for Delivery",
    delivered: "Delivered", cancelled: "Cancelled",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
}
