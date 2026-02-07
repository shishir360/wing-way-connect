import { Package, Plane, Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { useAdminShipments, useAdminBookings, useAdminProfiles } from "@/hooks/useAdminData";
import { motion } from "framer-motion";

export default function AdminOverview() {
  const { shipments, loading: sLoading } = useAdminShipments();
  const { bookings, loading: bLoading } = useAdminBookings();
  const { profiles, loading: pLoading } = useAdminProfiles();

  const activeShipments = shipments.filter(s => !['delivered', 'cancelled'].includes(s.status));
  const deliveredShipments = shipments.filter(s => s.status === 'delivered');
  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const stats = [
    { icon: Package, label: "Total Shipments", value: shipments.length, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Clock, label: "Active Shipments", value: activeShipments.length, color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: CheckCircle, label: "Delivered", value: deliveredShipments.length, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Plane, label: "Flight Bookings", value: bookings.length, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: TrendingUp, label: "Pending Bookings", value: pendingBookings.length, color: "text-cta", bg: "bg-cta/10" },
    { icon: Users, label: "Total Users", value: profiles.length, color: "text-primary", bg: "bg-primary/10" },
  ];

  const isLoading = sLoading || bLoading || pLoading;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold font-display mb-6">Admin Overview</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border/50 p-5 shadow-premium"
                >
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Recent shipments */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Recent Shipments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4">Tracking ID</th>
                    <th className="pb-3 pr-4">Route</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Sender</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.slice(0, 5).map(s => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium text-primary">{s.tracking_id}</td>
                      <td className="py-3 pr-4">{s.route === 'bd-to-ca' ? '🇧🇩→🇨🇦' : '🇨🇦→🇧🇩'}</td>
                      <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                      <td className="py-3 pr-4">{s.sender_name}</td>
                      <td className="py-3">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
    confirmed: "bg-green-500/10 text-green-600",
    completed: "bg-green-600/10 text-green-700",
  };
  const labels: Record<string, string> = {
    pending: "Pending", pickup_scheduled: "Pickup Scheduled", picked_up: "Picked Up",
    in_transit: "In Transit", customs: "Customs", out_for_delivery: "Out for Delivery",
    delivered: "Delivered", cancelled: "Cancelled", confirmed: "Confirmed", completed: "Completed",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
}
