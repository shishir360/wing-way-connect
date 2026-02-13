import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package, User, Phone, MapPin, Printer, ExternalLink, ArrowLeft, BadgeCheck, Clock, Calendar } from "lucide-react";
import QRGenerator from "@/components/qr/QRGenerator";
import Seo from "@/components/Seo";

export default function ShipmentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: shipment, isLoading } = useQuery({
        queryKey: ['shipment', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('shipments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as any;
        }
    });

    const { data: timeline } = useQuery({
        queryKey: ['shipment-timeline', id],
        enabled: !!id,
        queryFn: async () => {
            const { data } = await supabase
                .from('shipment_timeline')
                .select('*')
                .eq('shipment_id', id)
                .order('created_at', { ascending: false });
            return data || [];
        }
    });

    const { data: agent } = useQuery({
        queryKey: ['shipment-agent', shipment?.assigned_agent],
        enabled: !!shipment?.assigned_agent,
        queryFn: async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', shipment.assigned_agent)
                .maybeSingle();
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!shipment) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold">Shipment Not Found</h2>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            <Seo title={`Shipment ${shipment.tracking_id}`} description="Shipment details and tracking." />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold font-display">{shipment.tracking_id}</h1>
                        <StatusBadge status={shipment.status} />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="h-3 w-3" /> Created {new Date(shipment.created_at).toLocaleDateString()}
                        {shipment.short_id && (
                            <Badge variant="outline" className="ml-2 font-mono tracking-widest">PIN: {shipment.short_id}</Badge>
                        )}
                    </div>
                </div>
                <div className="hidden sm:block">
                    <QRGenerator shipment={shipment} />
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger value="details" className="rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all px-6 py-3">Details</TabsTrigger>
                    <TabsTrigger value="timeline" className="rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all px-6 py-3">Timeline</TabsTrigger>
                    <TabsTrigger value="docs" className="rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all px-6 py-3">Docs & Print</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="details" className="space-y-6">
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
                                        <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-primary" onClick={() => navigate(`/admin/users/${shipment.user_id}`)}>
                                            View User Profile <ExternalLink className="h-3 w-3 ml-1" />
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
                                        <p className="text-muted-foreground">Weight/Pkg</p>
                                        <p className="font-medium">{shipment.weight} kg • {shipment.packages} pkg</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total Cost</p>
                                        <p className="font-bold text-primary text-lg">${shipment.total_cost || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Agent */}
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
                                                <p className="text-sm text-muted-foreground">{agent.email}</p>
                                            </div>
                                        </div>
                                        <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-primary" onClick={() => navigate(`/admin/agents/${agent.id}`)}>
                                            View Agent Profile <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tracking History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8 relative pl-2">
                                    {timeline && timeline.length > 0 ? timeline.map((event, i) => (
                                        <div key={event.id} className="flex gap-4 relative">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/30'} z-10`} />
                                                {i !== timeline.length - 1 && <div className="w-0.5 h-full bg-border absolute top-3" />}
                                            </div>
                                            <div className="pb-2">
                                                <p className="font-medium text-base">{event.status}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(event.event_time).toLocaleString()}
                                                </div>
                                                {event.description && <p className="text-sm mt-2 bg-muted/30 p-2 rounded-md border">{event.description}</p>}
                                                {event.location && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                        <MapPin className="h-3 w-3" /> {event.location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-muted-foreground">No history available.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="docs">
                        <div className="flex flex-col items-center justify-center py-12 bg-card rounded-lg border border-dashed">
                            <QRGenerator shipment={shipment} />
                            <p className="text-sm text-muted-foreground mt-4">Scan to view shipment status</p>
                            <Button className="mt-6" variant="outline" onClick={() => window.print()}>
                                <Printer className="mr-2 h-4 w-4" /> Print Waybill
                            </Button>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
        pickup_scheduled: "bg-blue-500/10 text-blue-600 border-blue-200",
        picked_up: "bg-blue-600/10 text-blue-700 border-blue-300",
        in_transit: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
        customs: "bg-purple-500/10 text-purple-600 border-purple-200",
        out_for_delivery: "bg-orange-500/10 text-orange-600 border-orange-200",
        delivered: "bg-green-500/10 text-green-600 border-green-200",
        cancelled: "bg-red-500/10 text-red-600 border-red-200",
    };
    const labels: Record<string, string> = {
        pending: "Pending", pickup_scheduled: "Pickup Scheduled", picked_up: "Picked Up",
        in_transit: "In Transit", customs: "Customs", out_for_delivery: "Out for Delivery",
        delivered: "Delivered", cancelled: "Cancelled",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-muted text-muted-foreground border-border'}`}>
            {labels[status] || status}
        </span>
    );
}
