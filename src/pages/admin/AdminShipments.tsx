import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useAdminShipments } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QRGenerator from "@/components/qr/QRGenerator";
import QRScanner from "@/components/qr/QRScanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ShipmentDetailsDialog from "@/components/admin/ShipmentDetailsDialog";

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
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const { toast } = useToast();

  const filtered = shipments.filter(s => {
    const matchesSearch = !search ||
      s.tracking_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.short_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.sender_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.receiver_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusUpdate = async (id: string, newStatus: string, trackingId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setUpdating(id);
    try {
      await updateShipmentStatus(id, newStatus);
      await supabase.from('shipment_timeline').insert({
        shipment_id: id,
        status: newStatus,
        description: `Admin updated status to ${statusLabels[newStatus]}`,
        is_current: true,
      });
      toast({ title: "Status Updated", description: `${trackingId} → ${statusLabels[newStatus]}` });
      if (selectedShipment && selectedShipment.id === id) {
        fetchTimeline(id); // Refresh timeline if viewing details
      }
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'agent')
      .eq('is_approved', true);
    if (data) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      setAgents(profiles || []);
    }
  };

  const handleAssignAgent = async (shipmentId: string, agentUserId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    const { error } = await supabase
      .from('shipments')
      .update({ assigned_agent: agentUserId })
      .eq('id', shipmentId);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Agent Assigned ✅" });
      refetch();
    }
  };

  const fetchTimeline = async (shipmentId: string) => {
    const { data } = await supabase
      .from('shipment_timeline')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });
    setTimeline(data || []);
  };

  const handleRowClick = (shipment: any) => {
    setSelectedShipment(shipment);
    fetchTimeline(shipment.id);
  };

  const handleScanResult = async (data: string) => {
    try {
      let trackingId = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.id) trackingId = parsed.id;
      } catch {
        // Not JSON, assume raw ID
      }

      // 1. Try to find in current list
      const found = shipments.find(s => s.tracking_id === trackingId);

      if (found) {
        setSelectedShipment(found);
        fetchTimeline(found.id);
        setShowScanner(false);
        toast({ title: "Shipment Found", description: `Opened details for ${trackingId}` });
      } else {
        // 2. If not found locally, fetch from DB
        const { data: remoteShipment } = await supabase
          .from('shipments')
          .select('*')
          .or(`tracking_id.eq.${trackingId},short_id.eq.${trackingId}`)
          .maybeSingle();

        if (remoteShipment) {
          setSelectedShipment(remoteShipment);
          fetchTimeline(remoteShipment.id);
          setShowScanner(false);
          toast({ title: "Shipment Found", description: `Opened details for ${trackingId}` });
        } else {
          toast({ title: "Not Found", description: `Shipment ${trackingId} not found`, variant: "destructive" });
        }
      }
    } catch (e) {
      toast({ title: "Scan Error", description: "Could not process QR code", variant: "destructive" });
    }
  };

  return (
    <div>
      <Seo title="Manage Shipments" description="Add, update, and track all shipments in the system." />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Manage Shipments</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowScanner(!showScanner); }}>
            <ScanLine className="h-4 w-4 mr-2" />QR Scan
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {showScanner && (
        <div className="mb-6 max-w-sm">
          <QRScanner onScan={handleScanResult} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by tracking ID, sender, receiver..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {shipmentStatuses.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="p-4">Tracking ID / PIN</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Sender</th>
                  <th className="p-4">Receiver</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Update</th>
                  <th className="p-4">Agent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(s)}
                  >
                    <td className="p-4">
                      <div className="font-medium text-primary">{s.tracking_id}</div>
                      {s.short_id && <div className="text-xs font-mono text-muted-foreground">PIN: {s.short_id}</div>}
                    </td>
                    <td className="p-4">{s.route === 'bd-to-ca' ? '🇧🇩→🇨🇦' : '🇨🇦→🇧🇩'}</td>
                    <td className="p-4">
                      <div className="font-medium">{s.sender_name}</div>
                      <div className="text-xs text-muted-foreground">{s.sender_phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{s.receiver_name}</div>
                      <div className="text-xs text-muted-foreground">{s.receiver_phone}</div>
                    </td>
                    <td className="p-4">{s.weight || '-'} kg</td>
                    <td className="p-4"><StatusBadge status={s.status} /></td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Select value={s.status} onValueChange={(v) => handleStatusUpdate(s.id, v, s.tracking_id)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {shipmentStatuses.map(status => (<SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Select
                          value={(s as any).assigned_agent || "none"}
                          onValueChange={(v) => handleAssignAgent(s.id, v)}
                          onOpenChange={() => { if (agents.length === 0) fetchAgents(); }}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {agents.map(a => (<SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        {(s as any).assigned_agent && (
                          <a
                            href={`/admin/agents/${(s as any).assigned_agent}`}
                            className="p-1.5 rounded-md hover:bg-muted text-primary transition-colors"
                            title="View Agent Profile"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ScanLine className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No shipments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED SHIPMENT DIALOG */}
      <ShipmentDetailsDialog
        shipment={selectedShipment}
        open={!!selectedShipment}
        onOpenChange={(open) => !open && setSelectedShipment(null)}
      />
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
