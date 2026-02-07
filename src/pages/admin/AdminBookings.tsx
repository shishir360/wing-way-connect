import { useState } from "react";
import { useAdminBookings } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw } from "lucide-react";

const bookingStatuses = ["pending", "confirmed", "cancelled", "completed"];
const statusLabels: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed",
};

export default function AdminBookings() {
  const { bookings, loading, updateBookingStatus, refetch } = useAdminBookings();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = bookings.filter(b => {
    const matchesSearch = !search ||
      b.booking_ref.toLowerCase().includes(search.toLowerCase()) ||
      b.from_city.toLowerCase().includes(search.toLowerCase()) ||
      b.to_city.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || b.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusUpdate = async (id: string, newStatus: string, ref: string) => {
    setUpdating(id);
    try {
      await updateBookingStatus(id, newStatus);
      toast({ title: "Updated", description: `${ref} → ${statusLabels[newStatus]}` });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
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
                  <th className="p-4">Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-medium text-primary">{b.booking_ref}</td>
                    <td className="p-4">{b.from_city} → {b.to_city}</td>
                    <td className="p-4">{new Date(b.departure_date).toLocaleDateString()}</td>
                    <td className="p-4">{b.adults + b.children}</td>
                    <td className="p-4 capitalize">{b.cabin_class}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        b.status === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                        b.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                        b.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Select value={b.status} onValueChange={(v) => handleStatusUpdate(b.id, v, b.booking_ref)} disabled={updating === b.id}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
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
    </div>
  );
}
