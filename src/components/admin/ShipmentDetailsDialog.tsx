import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react"; // Added icon
import { Package, User, Phone, MapPin, Printer, ExternalLink, Clock } from "lucide-react";
import QRGenerator from "@/components/qr/QRGenerator";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ShipmentDetailsDialogProps {
    shipment: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ShipmentDetailsDialog({ shipment, open, onOpenChange }: ShipmentDetailsDialogProps) {
    const [timeline, setTimeline] = useState<any[]>([]);
    const [agent, setAgent] = useState<any>(null);

    useEffect(() => {
        if (shipment && open) {
            fetchTimeline(shipment.id);
            if (shipment.assigned_agent) {
                fetchAgent(shipment.assigned_agent);
            } else {
                setAgent(null);
            }
        }
    }, [shipment, open]);

    const fetchAgent = async (id: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        setAgent(data);
    };

    const fetchTimeline = async (id: string) => {
        const { data } = await supabase
            .from('shipment_timeline')
            .select('*')
            .eq('shipment_id', id)
            .order('created_at', { ascending: false });
        setTimeline(data || []);
    };

    if (!shipment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {shipment.tracking_id}
                                {shipment.short_id && (
                                    <Badge variant="outline" className="font-mono text-base tracking-widest text-foreground">PIN: {shipment.short_id}</Badge>
                                )}
                                <StatusBadge status={shipment.status} />
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {shipment.cargo_type || "General Cargo"} • {shipment.weight} kg • {shipment.packages} Pkg(s)
                            </DialogDescription>
                        </div>
                        <QRGenerator shipment={shipment} />
                    </div>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="w-full justify-start px-6 pt-2 bg-muted/20 rounded-none border-b h-auto">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="print">Labels & Print</TabsTrigger>
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
                                        <p className="font-semibold text-lg">{shipment.sender_name}</p>
                                        <div className="space-y-1 mt-2 text-sm">
                                            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {shipment.sender_phone}</p>
                                            <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" /> {shipment.pickup_address}</p>
                                        </div>
                                        {shipment.user_id && (
                                            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-primary" asChild>
                                                <a href={`/admin/users/${shipment.user_id}`} target="_blank" rel="noreferrer">
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
                                        <p className="font-semibold text-lg">{shipment.receiver_name}</p>
                                        <div className="space-y-1 mt-2 text-sm">
                                            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {shipment.receiver_phone}</p>
                                            <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" /> {shipment.delivery_address}</p>
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
                                            <p className="font-medium">{shipment.route === 'bd-to-ca' ? 'Bangladesh → Canada' : 'Canada → Bangladesh'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Contents</p>
                                            <p className="font-medium">{shipment.contents}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Total Cost</p>
                                            <p className="font-bold text-primary text-lg">${shipment.total_cost || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">From/To</p>
                                            <p className="font-medium">{shipment.from_city} → {shipment.to_city}</p>
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
                                            <p className="font-medium">{shipment.has_insurance ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Fragile</p>
                                            <p className="font-medium">{shipment.is_fragile ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium capitalize">{shipment.service_type}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Assigned Agent */}
                                {agent && (
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <BadgeCheck className="h-4 w-4 text-primary" /> Assigned Agent
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={agent.avatar_url} />
                                                    <AvatarFallback>{agent.full_name?.substring(0, 2).toUpperCase() || 'AG'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-lg">{agent.full_name}</p>
                                                    <div className="space-y-1 text-sm">
                                                        <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {agent.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-primary" asChild>
                                                <a href={`/admin/agents/${agent.id}`} target="_blank" rel="noreferrer">
                                                    View Agent Profile <ExternalLink className="h-3 w-3 ml-1" />
                                                </a>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
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
                                <QRGenerator shipment={shipment} />
                                <p className="text-sm text-muted-foreground mt-4">Scan to view shipment status</p>
                                <Button className="mt-6" variant="outline">
                                    <Printer className="mr-2 h-4 w-4" /> Print Waybill
                                </Button>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="p-4 border-t bg-muted/20">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
