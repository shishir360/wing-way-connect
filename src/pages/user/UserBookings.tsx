
import { useState } from "react";
import Seo from "@/components/Seo";
import { useFlightBookings } from "@/hooks/useFlightBookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Plane, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusLabels: Record<string, string> = {
    pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed",
};

export default function UserBookings() {
    const { bookings, loading, refetch: fetchBookings } = useFlightBookings();
    const [search, setSearch] = useState("");

    const filtered = bookings.filter(b => {
        const term = search.toLowerCase();
        return !search ||
            b.booking_ref.toLowerCase().includes(term) ||
            b.from_city.toLowerCase().includes(term) ||
            b.to_city.toLowerCase().includes(term);
    });

    const upcoming = filtered.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
    const past = filtered.filter(b => b.status === 'completed' || b.status === 'cancelled');

    return (
        <div className="container-wacc py-8 space-y-8 animate-in fade-in duration-500">
            <Seo
                title="My Bookings"
                description="View your air ticket bookings and shipment reservations."
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-primary">My Bookings</h1>
                    <p className="text-muted-foreground mt-1">Manage your upcoming flights</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchBookings} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button asChild className="bg-cta hover:bg-cta/90 text-cta-foreground">
                        <Link to="/air-ticket">Book Flight</Link>
                    </Button>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Reference or City..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white"
                />
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="upcoming">Upcoming Flights</TabsTrigger>
                    <TabsTrigger value="history">Booking History</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    {loading ? <LoadingSkeleton /> : <BookingList bookings={upcoming} type="upcoming" />}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {loading ? <LoadingSkeleton /> : <BookingList bookings={past} type="past" />}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function BookingList({ bookings, type }: { bookings: any[], type: 'upcoming' | 'past' }) {
    if (bookings.length === 0) {
        return (
            <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed">
                <Plane className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No {type} bookings found</h3>
                {type === 'upcoming' && (
                    <Button asChild className="mt-4 bg-primary text-primary-foreground">
                        <Link to="/air-ticket">Search Flights</Link>
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow border-muted/50">
                    <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row p-4 md:p-6 gap-6">
                            {/* Left: Date & Time */}
                            <div className="flex md:flex-col items-center justify-between md:justify-center md:text-center min-w-[100px] gap-2 md:border-r border-muted/50 md:pr-6">
                                <div className="text-2xl font-bold text-primary">
                                    {new Date(booking.departure_date).getDate()}
                                </div>
                                <div className="text-sm font-medium uppercase text-muted-foreground">
                                    {new Date(booking.departure_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </div>
                                <StatusBadge status={booking.status} />
                            </div>

                            {/* Middle: Flight Details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">{booking.airline || "Unknown Airline"}</h3>
                                    <span className="font-mono text-sm text-muted-foreground">{booking.booking_ref}</span>
                                </div>

                                <div className="flex items-center gap-4 md:gap-8">
                                    <div className="flex-1">
                                        <p className="text-2xl font-bold">{booking.from_city}</p>
                                        <p className="text-xs text-muted-foreground">Departure</p>
                                    </div>

                                    <div className="flex flex-col items-center px-4 w-24">
                                        <Plane className="h-4 w-4 text-muted-foreground mb-1 rotate-90" />
                                        <div className="h-[1px] w-full bg-border" />
                                    </div>

                                    <div className="flex-1 text-right">
                                        <p className="text-2xl font-bold">{booking.to_city}</p>
                                        <p className="text-xs text-muted-foreground">Arrival</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                                    <span className="flex items-center gap-1">
                                        <Plane className="h-3 w-3" />
                                        {booking.class || "Economy"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {booking.adults + (booking.children || 0)} Passengers
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
        confirmed: "bg-green-500/10 text-green-600 border-green-200",
        completed: "bg-blue-500/10 text-blue-600 border-blue-200",
        cancelled: "bg-red-500/10 text-red-600 border-red-200",
    };

    return (
        <Badge variant="outline" className={`${colors[status] || 'bg-muted text-muted-foreground'} border`}>
            {statusLabels[status] || status}
        </Badge>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2].map(i => (
                <div key={i} className="h-40 bg-muted/20 animate-pulse rounded-xl" />
            ))}
        </div>
    );
}
