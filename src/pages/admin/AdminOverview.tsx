import { Package, Plane, Users, TrendingUp, CheckCircle, Clock, Search, Filter, MoreHorizontal, Download } from "lucide-react";
import { useAdminShipments, useAdminBookings, useAdminProfiles } from "@/hooks/useAdminData";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function AdminOverview() {
  const { shipments, loading: sLoading } = useAdminShipments();
  const { bookings, loading: bLoading } = useAdminBookings();
  const { profiles, loading: pLoading } = useAdminProfiles();

  // Status Calculations
  const activeShipments = shipments.filter(s => !['delivered', 'cancelled', 'completed'].includes(s.status));
  const deliveredShipments = shipments.filter(s => s.status === 'delivered' || s.status === 'completed');
  const pendingShipments = shipments.filter(s => s.status === 'pending');

  // Revenue (Mock Calculation for Demo)
  const totalRevenue = shipments.length * 120 + bookings.length * 850;

  const stats = [
    {
      label: "Total Shipments",
      value: shipments.length,
      trend: "+12%",
      desc: "vs last month",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      trend: "+8.2%",
      desc: "vs last month",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Flight Bookings",
      value: bookings.length,
      trend: "+24%",
      desc: "vs last month",
      icon: Plane,
      color: "text-violet-600",
      bg: "bg-violet-50"
    },
    {
      label: "Active Users",
      value: profiles.length,
      trend: "+5%",
      desc: "new users",
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
  ];

  // Chart Data
  const chartData = [
    { name: 'Active', value: activeShipments.length, color: '#f59e0b' }, // Amber
    { name: 'Delivered', value: deliveredShipments.length, color: '#10b981' }, // Emerald
    { name: 'Pending', value: pendingShipments.length, color: '#3b82f6' }, // Blue
  ];

  const isLoading = sLoading || bLoading || pLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back towards your goals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-6 rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.label}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-6 rounded-3xl border border-border/40 shadow-sm flex flex-col items-center justify-center lg:col-span-1 min-h-[300px]"
            >
              <h3 className="text-lg font-bold mb-6 w-full text-left">Shipment Status</h3>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold">{shipments.length}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="flex gap-4 mt-6 w-full justify-center">
                {chartData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Orders Table */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card p-6 rounded-3xl border border-border/40 shadow-sm lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Recent Orders</h3>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  See all <span className="ml-1">→</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                      <th className="pb-4 pl-2">Order ID</th>
                      <th className="pb-4">Customer</th>
                      <th className="pb-4">Route</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {shipments.slice(0, 5).map((s, i) => (
                      <tr key={s.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-4 pl-2">
                          <span className="font-semibold text-primary family-mono text-sm">#{s.tracking_id.slice(-6)}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {s.sender_name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{s.sender_name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {s.route === 'bd-to-ca' ? '🇧🇩 BD ➔ 🇨🇦 CA' : '🇨🇦 CA ➔ 🇧🇩 BD'}
                        </td>
                        <td className="py-4">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="py-4 text-right pr-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    pickup_scheduled: "bg-blue-100 text-blue-700",
    picked_up: "bg-indigo-100 text-indigo-700",
    in_transit: "bg-violet-100 text-violet-700",
    customs: "bg-rose-100 text-rose-700",
    out_for_delivery: "bg-sky-100 text-sky-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-700",
    confirmed: "bg-emerald-100 text-emerald-700",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    pickup_scheduled: "Scheduled",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    customs: "Customs",
    out_for_delivery: "Delivering",
    delivered: "Delivered",
    cancelled: "Cancelled",
    confirmed: "Confirmed"
  };

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}
