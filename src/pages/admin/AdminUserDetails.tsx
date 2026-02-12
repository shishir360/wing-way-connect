import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User, Phone, Mail, MapPin, Calendar, Package,
    ArrowLeft, Truck, Clock, CheckCircle2, AlertCircle, Plane
} from "lucide-react";
import { format } from "date-fns";

import FlightDetailsDialog from "@/components/admin/FlightDetailsDialog";
import ShipmentDetailsDialog from "@/components/admin/ShipmentDetailsDialog";

export default function AdminUserDetails() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [shipments, setShipments] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

    useEffect(() => {
        if (userId) fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profile
            const { data: prof, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profError) throw profError;
            setProfile(prof);

            // 2. Fetch Shipments (as Sender)
            const { data: ships, error: shipError } = await supabase
                .from('shipments')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (shipError) throw shipError;

            // 2b. Fetch Assigned Agent Details for shipments
            let shipmentsWithAgents = ships || [];
            const agentIds = [...new Set(shipmentsWithAgents.filter(s => s.assigned_agent).map(s => s.assigned_agent))];

            if (agentIds.length > 0) {
                const { data: agents } = await supabase
                    .from('profiles')
                    .select('id, full_name, phone')
                    .in('id', agentIds);

                const agentMap = new Map(agents?.map(a => [a.id, a]) || []);
                shipmentsWithAgents = shipmentsWithAgents.map(s => ({
                    ...s,
                    agent_details: s.assigned_agent ? agentMap.get(s.assigned_agent) : null
                }));
            }

            setShipments(shipmentsWithAgents);

            // 3. Fetch Flight Bookings
            const { data: flights, error: flightError } = await supabase
                .from('flight_bookings')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!flightError) {
                setBookings(flights || []);
            }

        } catch (err: any) {
            toast({ title: "Error", description: "Failed to load user details", variant: "destructive" });
            navigate("/admin");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!profile) return null;

    const activeShipments = shipments.filter(s =>
        s.status !== 'delivered' && s.status !== 'cancelled' && s.status !== 'returned'
    );

    const pastShipments = shipments.filter(s =>
        s.status === 'delivered' || s.status === 'cancelled' || s.status === 'returned'
    );

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-6">
            <Seo title={`${profile.full_name || 'User'} Details`} description="View user details, shipments, and bookings." />

            <Button variant="ghost" className="mb-4" onClick={() => navigate("/admin/users")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
            </Button>

            {/* Header Profile Card */}
            <div className="flex flex-col md:flex-row gap-6 bg-card border rounded-2xl p-6 shadow-sm">
                <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-10 w-10" />
                    </div>
                </div>

                <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold font-display">{profile.full_name}</h1>
                        <Badge variant={profile.is_active === false ? "destructive" : "outline"}>
                            {profile.is_active === false ? "Inactive" : "Active"}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">{profile.role || 'User'}</Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> {profile.email}
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" /> {profile.phone || 'No Phone'}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> {profile.city || 'No City'}, {profile.country || 'No Country'}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Joined: {format(new Date(profile.created_at), 'PPP')}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[150px]">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{shipments.length}</div>
                            <div className="text-xs text-muted-foreground font-semibold">Total Orders</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
                    <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3">
                        Active Shipments ({activeShipments.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3">
                        History ({pastShipments.length})
                    </TabsTrigger>
                    <TabsTrigger value="flights" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3">
                        Flights ({bookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3">
                        All ({shipments.length + bookings.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="pt-6 space-y-4">
                    {activeShipments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                            No active shipments.
                        </div>
                    ) : (
                        activeShipments.map(shipment => (
                            <ShipmentCard key={shipment.id} shipment={shipment} onClick={() => setSelectedShipment(shipment)} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="history" className="pt-6 space-y-4">
                    {pastShipments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                            No shipment history.
                        </div>
                    ) : (
                        pastShipments.map(shipment => (
                            <ShipmentCard key={shipment.id} shipment={shipment} onClick={() => setSelectedShipment(shipment)} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="flights" className="pt-6 space-y-4">
                    {bookings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                            No flight bookings found.
                        </div>
                    ) : (
                        bookings.map(booking => (
                            <BookingCard key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="all" className="pt-6 space-y-4">
                    <div className="space-y-4">
                        {shipments.map(shipment => (
                            <ShipmentCard key={shipment.id} shipment={shipment} onClick={() => setSelectedShipment(shipment)} />
                        ))}
                        {bookings.map(booking => (
                            <BookingCard key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <ShipmentDetailsDialog
                shipment={selectedShipment}
                open={!!selectedShipment}
                onOpenChange={(open) => !open && setSelectedShipment(null)}
            />

            <FlightDetailsDialog
                booking={selectedBooking}
                open={!!selectedBooking}
                onOpenChange={(open) => !open && setSelectedBooking(null)}
            />
        </div>
    );
}

function ShipmentCard({ shipment, onClick }: { shipment: any, onClick: () => void }) {
    return (
        <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50" onClick={onClick}>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{shipment.tracking_id}</h3>
                                <Badge variant="outline" className="capitalize">{shipment.status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>{shipment.from_city} <span className="mx-1">→</span> {shipment.to_city}</p>
                                <p className="text-xs">Service: <span className="font-medium">{shipment.service_type}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm border-l pl-4 md:min-w-[200px]">
                        {/* AGENT DISPLAY */}
                        {shipment.agent_details ? (
                            <a href={`/admin/agents/${shipment.agent_details.id}`} className="flex items-center gap-2 text-green-600 bg-green-50 p-1.5 rounded-md hover:bg-green-100 transition-colors" onClick={(e) => e.stopPropagation()}>
                                <Truck className="h-4 w-4" />
                                <span className="font-medium hover:underline">{shipment.agent_details.full_name}</span>
                            </a>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground p-1.5">
                                <Truck className="h-4 w-4 opacity-50" />
                                <span className="text-xs">No Agent Assigned</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{shipment.current_location || 'Processing'}</span>
                        </div>
                        {shipment.route && (
                            <div className="flex items-center gap-2 text-orange-600">
                                <Truck className="h-4 w-4" />
                                <span>On Route: {shipment.route}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(shipment.created_at), 'MMM d, yyyy')}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function BookingCard({ booking, onClick }: { booking: any, onClick: () => void }) {
    return (
        <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50" onClick={onClick}>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <Plane className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{booking.from_city} → {booking.to_city}</h3>
                                <Badge variant={booking.status === 'confirmed' ? "default" : "secondary"} className="capitalize">{booking.status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>{booking.airline} • {booking.flight_number}</p>
                                <p className="text-xs">Class: <span className="font-medium capitalize">{booking.class || booking.cabin_class}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm border-l pl-4 md:min-w-[200px]">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.departure_date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Flight Ticket</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
