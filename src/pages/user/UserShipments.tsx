
import { useState } from "react";
import Seo from "@/components/Seo";
import { useShipments } from "@/hooks/useShipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Package, Truck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
    pending: "Pending", pickup_scheduled: "Pickup Scheduled", picked_up: "Picked Up",
    in_transit: "In Transit", customs: "At Customs", out_for_delivery: "Out for Delivery",
    delivered: "Delivered", cancelled: "Cancelled",
};

export default function UserShipments() {
    const { shipments, loading, refetch: fetchShipments } = useShipments();
    const [search, setSearch] = useState("");

    const filtered = shipments.filter(s => {
        const term = search.toLowerCase();
        return !search ||
            s.tracking_id.toLowerCase().includes(term) ||
            (s.receiver_name || "").toLowerCase().includes(term);
    });

    return (
        <div className="container-wacc py-8 space-y-8 animate-in fade-in duration-500">
            <Seo
                title="My Shipments"
                description="Track and manage all your active and past shipments in one place."
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-primary">My Shipments</h1>
                    <p className="text-muted-foreground mt-1">Track and manage your cargo shipments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchShipments} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button asChild className="bg-cta hover:bg-cta/90 text-cta-foreground">
                        <Link to="/get-quote">New Shipment</Link>
                    </Button>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Tracking ID or Receiver..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white"
                />
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid gap-4">
                    {filtered.map((shipment) => (
                        <Card key={shipment.id} className="overflow-hidden hover:shadow-md transition-shadow border-muted/50">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center p-4 md:p-6 gap-4">
                                    {/* Icon & ID */}
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tracking ID</p>
                                            <p className="font-bold font-mono text-lg">{shipment.tracking_id}</p>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Route</p>
                                            <p className="font-medium text-sm">
                                                {shipment.route === 'bd-to-ca' ? 'BD 🇧🇩 ➝ CA 🇨🇦' : 'CA 🇨🇦 ➝ BD 🇧🇩'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Receiver</p>
                                            <p className="font-medium text-sm truncate">{shipment.receiver_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Date</p>
                                            <p className="font-medium text-sm">
                                                {new Date(shipment.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <StatusBadge status={shipment.status} />
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="flex items-center justify-end md:min-w-[120px]">
                                        <Button variant="ghost" size="sm" asChild className="group">
                                            <Link to={`/track-shipment?id=${shipment.tracking_id}`}>
                                                Track
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed">
                    <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No shipments found</h3>
                    <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                        {search ? "Try adjusting your search terms." : "You haven't made any shipments yet."}
                    </p>
                    {!search && (
                        <Button asChild className="mt-4 bg-primary text-primary-foreground">
                            <Link to="/get-quote">Create New Shipment</Link>
                        </Button>
                    )}
                </div>
            )}
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

    return (
        <Badge variant="outline" className={`${colors[status] || 'bg-muted text-muted-foreground'} border`}>
            {statusLabels[status] || status}
        </Badge>
    );
}
