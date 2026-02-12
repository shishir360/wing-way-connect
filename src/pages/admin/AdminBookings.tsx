import { useState } from "react";
import Seo from "@/components/Seo";
import { useAdminBookings } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Plane, Calendar, User, CreditCard, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { FlightBooking } from "@/hooks/useFlightBookings";

const bookingStatuses = ["pending", "confirmed", "cancelled", "completed"];
const statusLabels: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed",
};

export default function AdminBookings() {
  const { bookings, loading, updateBookingStatus, refetch } = useAdminBookings();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<FlightBooking | null>(null);
  const [bookerProfile, setBookerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { toast } = useToast();

  const filtered = bookings.filter(b => {
    const term = search.toLowerCase();
    const matchesSearch = !search ||
      b.booking_ref.toLowerCase().includes(term) ||
      b.from_city.toLowerCase().includes(term) ||
      b.to_city.toLowerCase().includes(term);
    const matchesFilter = filter === "all" || b.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusUpdate = async (id: string, newStatus: string, ref: string) => {
    setUpdating(id);
    try {
      await updateBookingStatus(id, newStatus);
      toast({ title: "Updated", description: `${ref} → ${statusLabels[newStatus]}` });

      // Update local state for selected booking if it's open
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus } as FlightBooking);
      }
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleRowClick = async (booking: FlightBooking) => {
    setSelectedBooking(booking);
    setBookerProfile(null);

    if (booking.user_id) {
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', booking.user_id).single();
        if (!error && data) {
          setBookerProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  return (
    <div>
      <Seo title="Manage Bookings" description="View and manage all flight bookings." />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Manage Bookings</h1>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by ref, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {bookingStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
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
                  <th className="p-4">Booking Ref</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Passengers</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr
                    key={b.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(b)}
                  >
                    <td className="p-4 font-medium text-primary flex items-center gap-2">
                      <Plane className="h-4 w-4" /> {b.booking_ref}
                    </td>
                    <td className="p-4">{b.from_city} → {b.to_city}</td>
                    <td className="p-4">{new Date(b.departure_date).toLocaleDateString()}</td>
                    <td className="p-4 text-center">{b.adults + (b.children || 0)}</td>
                    <td className="p-4 capitalize">{b.cabin_class}</td>
                    <td className="p-4">
                      <Badge variant={
                        b.status === 'confirmed' ? 'default' :
                          b.status === 'pending' ? 'secondary' :
                            'destructive'
                      }>
                        {statusLabels[b.status] || b.status}
                      </Badge>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Select value={b.status} onValueChange={(v) => handleStatusUpdate(b.id, v, b.booking_ref)} disabled={updating === b.id}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {bookingStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Plane className="h-6 w-6 text-primary" />
                  Flight Booking
                </DialogTitle>
                <DialogDescription>
                  Reference: <span className="font-mono text-primary font-bold">{selectedBooking?.booking_ref}</span>
                </DialogDescription>
              </div>
              <Badge className="text-sm px-3 py-1" variant={
                selectedBooking?.status === 'confirmed' ? 'default' :
                  selectedBooking?.status === 'pending' ? 'secondary' :
                    'destructive'
              }>
                {selectedBooking ? statusLabels[selectedBooking.status] : ''}
              </Badge>
            </div>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Route Info */}
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="text-xl font-bold">{selectedBooking.from_city}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedBooking.departure_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1 md:text-right">
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="text-xl font-bold">{selectedBooking.to_city}</p>
                  {selectedBooking.return_date && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 md:justify-end">
                      <Calendar className="h-3 w-3" />
                      Return: {new Date(selectedBooking.return_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Flight Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-card rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Airline</p>
                  <p className="font-semibold">{selectedBooking.airline || "N/A"}</p>
                </div>
                <div className="p-3 bg-card rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Flight No</p>
                  <p className="font-semibold">{selectedBooking.flight_number || "N/A"}</p>
                </div>
                <div className="p-3 bg-card rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Class</p>
                  <p className="font-semibold capitalize">{selectedBooking.cabin_class || "Economy"}</p>
                </div>
                <div className="p-3 bg-card rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Passengers</p>
                  <p className="font-semibold">{selectedBooking.adults + (selectedBooking.children || 0)} Person(s)</p>
                </div>
              </div>

              {/* Booker Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Booker Information
                </h3>
                {loadingProfile ? (
                  <div className="h-16 bg-muted animate-pulse rounded-lg" />
                ) : bookerProfile ? (
                  <div className="bg-card p-4 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{bookerProfile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{bookerProfile.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{bookerProfile.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-xl text-muted-foreground text-sm">
                    Guest or Unknown User
                  </div>
                )}
              </div>

              {/* Payment / Cost */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Info
                </h3>
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Total Cost</p>
                    <p className="text-xs text-muted-foreground">Includes taxes & fees</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {selectedBooking.total_price ? `$${selectedBooking.total_price}` : "Quote Request"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setSelectedBooking(null)}>Close Details</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
