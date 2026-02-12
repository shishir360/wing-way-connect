import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { useAdminShipments } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, QrCode, ScanLine, Printer, Package, MapPin, Phone, User, Calendar, ExternalLink, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QRGenerator from "@/components/qr/QRGenerator";
import QRScanner from "@/components/qr/QRScanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
          .eq('tracking_id', trackingId)
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
      <Seo title="Manage Shipments | Admin" />
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
                  <th className="p-4">Tracking ID</th>
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
                    <td className="p-4 font-medium text-primary">{s.tracking_id}</td>
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
                      <Select
                        value={(s as any).assigned_agent || "none"}
                        onValueChange={(v) => handleAssignAgent(s.id, v)}
                        onOpenChange={() => { if (agents.length === 0) fetchAgents(); }}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Assign" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {agents.map(a => (<SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email}</SelectItem>))}
                        </SelectContent>
                      </Select>
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
      <Dialog open={!!selectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedShipment && (
            <>
              <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                      {selectedShipment.tracking_id}
                      <StatusBadge status={selectedShipment.status} />
                    </DialogTitle>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {selectedShipment.cargo_type || "General Cargo"} • {selectedShipment.weight} kg • {selectedShipment.packages} Pkg(s)
                    </p>
                  </div>
                  <QRGenerator shipment={selectedShipment} />
                </div>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start px-6 pt-2 bg-muted/20 rounded-none border-b h-auto">
                  <TabsTrigger value="details" className="pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Details</TabsTrigger>
                  <TabsTrigger value="timeline" className="pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Timeline</TabsTrigger>
                  <TabsTrigger value="print" className="pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Labels & Print</TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="details" className="space-y-6 mt-0">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Sender */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Sender Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-semibold text-lg">{selectedShipment.sender_name}</p>
                          <div className="space-y-1 mt-2 text-sm">
                            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {selectedShipment.sender_phone}</p>
                            <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" /> {selectedShipment.pickup_address}</p>
                          </div>
                          {selectedShipment.user_id && (
                            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-primary" asChild>
                              <a href={`/admin/users?search=${selectedShipment.sender_email || selectedShipment.sender_name}`} target="_blank" rel="noreferrer">
                                View User Profile <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>

                      {/* Receiver */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Receiver Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-semibold text-lg">{selectedShipment.receiver_name}</p>
                          <div className="space-y-1 mt-2 text-sm">
                            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {selectedShipment.receiver_phone}</p>
                            <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" /> {selectedShipment.delivery_address}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Shipment Info */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4" /> Shipment Info
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Route</p>
                            <p className="font-medium">{selectedShipment.route === 'bd-to-ca' ? 'Bangladesh → Canada' : 'Canada → Bangladesh'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Contents</p>
                            <p className="font-medium">{selectedShipment.contents}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Cost</p>
                            <p className="font-bold text-primary text-lg">${selectedShipment.total_cost || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">From/To</p>
                            <p className="font-medium">{selectedShipment.from_city} → {selectedShipment.to_city}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            Other Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Insurance</p>
                            <p className="font-medium">{selectedShipment.has_insurance ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fragile</p>
                            <p className="font-medium">{selectedShipment.is_fragile ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Service Type</p>
                            <p className="font-medium capitalize">{selectedShipment.service_type}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tracking History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {timeline.length > 0 ? timeline.map((event, i) => (
                            <div key={event.id} className="flex gap-4 relative">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'} z-10`} />
                                {i !== timeline.length - 1 && <div className="w-0.5 h-full bg-border absolute top-3" />}
                              </div>
                              <div className="pb-4">
                                <p className="font-medium leading-none">{event.status}</p>
                                <p className="text-sm text-muted-foreground mt-1">{new Date(event.event_time).toLocaleString()}</p>
                                <p className="text-sm mt-1">{event.description}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-center text-muted-foreground py-4">No history available yet.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="print" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-8">
                      <QRGenerator shipment={selectedShipment} />
                      <p className="text-sm text-muted-foreground mt-4">Scan to view shipment status</p>
                      <Button className="mt-6" variant="outline">
                        <Printer className="mr-2 h-4 w-4" /> Print Waybill
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter className="p-4 border-t bg-muted/20">
                <Button variant="outline" onClick={() => setSelectedShipment(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
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
