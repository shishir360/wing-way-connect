import { Package, Plane, Users, TrendingUp, CheckCircle, Clock, ExternalLink, Download, DollarSign, ScanLine, Truck, MapPin, BadgeCheck } from "lucide-react";
import { useAdminShipments, useAdminBookings, useAdminProfiles } from "@/hooks/useAdminData";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Seo from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminOverview() {
  const { shipments, loading: sLoading } = useAdminShipments();
  const { bookings, loading: bLoading } = useAdminBookings();
  const { profiles, loading: pLoading } = useAdminProfiles();
  const navigate = useNavigate();
  const [agentActivity, setAgentActivity] = useState<any[]>([]);

  // Helper to check if item is valid revenue (not cancelled)
  const isValid = (status: string) => !['cancelled', 'rejected'].includes(status.toLowerCase());

  // Fetch Agent Activity (Scans)
  useEffect(() => {
    const fetchActivity = async () => {
      // 1. Fetch raw scans with shipment details
      const { data: scans, error } = await supabase
        .from('shipment_scans')
        .select(`
          *,
          shipments (
            tracking_id
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching scans:", error);
        return;
      }

      if (!scans || scans.length === 0) {
        setAgentActivity([]);
        return;
      }

      // 2. Extract unique user IDs for manual join
      const userIds = Array.from(new Set(scans.map(s => s.scanned_by).filter(Boolean)));

      // 3. Fetch profiles for those users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // 4. Merge data
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const combined = scans.map(scan => ({
        ...scan,
        scanned_by: profileMap.get(scan.scanned_by) || { full_name: 'Unknown Agent', avatar_url: null }
      }));

      setAgentActivity(combined);
    };

    fetchActivity();

    // Real-time subscription for scans
    const channel = supabase
      .channel('admin-scans')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shipment_scans' }, () => {
        fetchActivity();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 1. Calculate Revenue
  const cargoRevenue = shipments
    .filter(s => isValid(s.status))
    .reduce((sum, s) => sum + (s.total_cost || 0), 0);

  const flightRevenue = bookings
    .filter(b => isValid(b.status))
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const totalRevenue = cargoRevenue + flightRevenue;

  // 2. Prepare Chart Data
  const revenueSourceData = [
    { name: 'Cargo', value: cargoRevenue, color: '#3b82f6' }, // Blue
    { name: 'Flights', value: flightRevenue, color: '#8b5cf6' }, // Violet
  ];

  // 3. Top Customers Logic
  const customerSpend = new Map<string, { id: string; name: string; email: string; spend: number; orders: number }>();

  // Process Shipments
  shipments.forEach(s => {
    if (!isValid(s.status)) return;
    const key = s.user_id || s.sender_email;
    if (!key) return;

    const existing = customerSpend.get(key) || {
      id: s.user_id || '',
      name: s.sender_name,
      email: s.sender_email || 'N/A',
      spend: 0,
      orders: 0
    };

    existing.spend += (s.total_cost || 0);
    existing.orders += 1;
    customerSpend.set(key, existing);
  });

  // Process Bookings
  bookings.forEach(b => {
    if (!isValid(b.status)) return;
    const key = b.user_id || 'guest';
    if (!key) return;

    let existing = customerSpend.get(key);
    if (!existing) {
      const profile = profiles.find(p => p.id === key);
      existing = {
        id: key,
        name: profile?.full_name || `User ${key.slice(0, 4)}`,
        email: profile?.email || 'N/A',
        spend: 0,
        orders: 0
      };
    }

    existing.spend += (b.total_price || 0);
    existing.orders += 1;
    customerSpend.set(key, existing);
  });

  const topCustomers = Array.from(customerSpend.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  // 4. Recent Activity (Consolidated)
  const recentActivity = [
    ...shipments.map(s => ({
      id: s.tracking_id,
      type: 'cargo',
      date: new Date(s.created_at),
      customer: s.sender_name,
      amount: s.total_cost,
      status: s.status,
      route: s.route === 'bd-to-ca' ? 'BD ➔ CA' : 'CA ➔ BD',
      raw: s
    })),
    ...bookings.map(b => ({
      id: b.booking_ref,
      type: 'flight',
      date: new Date(b.created_at),
      customer: `Booking #${b.booking_ref.slice(-4)}`,
      amount: b.total_price,
      status: b.status,
      route: `${b.from_city} ➔ ${b.to_city}`,
      raw: b
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);


  const stats = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: "+12.5%", // Mock trend
      desc: "Gross revenue",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      path: null
    },
    {
      label: "Total Shipments",
      value: shipments.length,
      trend: "+8%",
      desc: `${shipments.filter(s => s.status === 'delivered').length} delivered`,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/admin/shipments"
    },
    {
      label: "Flight Bookings",
      value: bookings.length,
      trend: "+24%",
      desc: "All time",
      icon: Plane,
      color: "text-violet-600",
      bg: "bg-violet-50",
      path: "/admin/bookings"
    },
    {
      label: "Active Users",
      value: profiles.length,
      trend: "+5%",
      desc: "Registered users",
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
      path: "/admin/users"
    },
  ];

  const isLoading = sLoading || bLoading || pLoading;

  return (
    <div className="space-y-6 pb-12">
      <Seo title="Admin Overview" description="Overview of shipments, bookings, users, and system activity." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
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
                onClick={() => stat.path && navigate(stat.path)}
                className={`bg-card p-6 rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all group ${stat.path ? 'cursor-pointer' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-display">{stat.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-6 rounded-3xl border border-border/40 shadow-sm lg:col-span-1 min-h-[350px] flex flex-col"
            >
              <h3 className="text-lg font-bold mb-2">Revenue Breakdown</h3>
              <p className="text-sm text-muted-foreground mb-6">Split between Cargo & Flights</p>

              <div className="flex-1 relative min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {revenueSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</span>
                  <span className="text-xl font-bold">${totalRevenue.toLocaleString(undefined, { notation: 'compact' })}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-6 justify-center">
                {revenueSourceData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold">${item.value.toLocaleString(undefined, { notation: 'compact' })}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Customers - Clickable */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card p-6 rounded-3xl border border-border/40 shadow-sm lg:col-span-1"
            >
              <h3 className="text-lg font-bold mb-2">Top Customers</h3>
              <p className="text-sm text-muted-foreground mb-6">Highest spending clients</p>

              <div className="space-y-4">
                {topCustomers.map((customer, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      if (customer.id && customer.id !== 'guest') {
                        navigate(`/admin/users/${customer.id}`);
                      } else {
                        navigate(`/admin/users?search=${customer.name}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                        {customer.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate max-w-[120px] group-hover:text-primary transition-colors">{customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{customer.orders} Orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">${customer.spend.toLocaleString()}</p>
                      <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}

                {topCustomers.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">No sales data yet.</div>
                )}
              </div>
            </motion.div>

            {/* Agent Activity - NEW SECTION */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card p-6 rounded-3xl border border-border/40 shadow-sm lg:col-span-1"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Live Delivery Updates
                  </h3>
                  <p className="text-sm text-muted-foreground">Real-time packet movement</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {agentActivity.map((activity, i) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => {
                      // Reverted to navigation
                      navigate(`/admin/shipments?search=${activity.shipments?.tracking_id}`);
                    }}
                  >
                    <div className="mt-1 relative">
                      <Avatar className="h-8 w-8 border border-background shadow-sm">
                        <AvatarImage src={activity.scanned_by?.avatar_url} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {activity.scanned_by?.full_name?.substring(0, 2).toUpperCase() || 'AG'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        <BadgeCheck className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{activity.scanned_by?.full_name || 'Agent'}</span>
                        <span className="text-muted-foreground mx-1">
                          {activity.scan_type === 'delivery' ? 'delivered' :
                            activity.scan_type === 'pickup' ? 'picked up' :
                              activity.scan_type === 'out_for_delivery' ? 'is out for delivery' :
                                'scanned'}
                        </span>
                        <span className="font-mono text-xs font-medium text-primary bg-primary/10 px-1 py-0.5 rounded">{activity.shipments?.tracking_id}</span>
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={`text-[10px] px-1.5 h-5 capitalize border-0 ${activity.scan_type === 'delivery' ? 'bg-green-100 text-green-700' :
                          activity.scan_type === 'out_for_delivery' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                          {activity.scan_type.replace(/_/g, ' ')}
                        </Badge>
                        {activity.location && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate max-w-[120px]">
                            <MapPin className="h-3 w-3" /> {activity.location}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                          <Clock className="h-3 w-3" /> {format(new Date(activity.scanned_at), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                  </div>
                ))}
                {agentActivity.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center text-muted-foreground">
                    <ScanLine className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">No live updates yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card p-6 rounded-3xl border border-border/40 shadow-sm mt-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">Recent Orders</h3>
                <p className="text-sm text-muted-foreground">Latest shipments and bookings</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/shipments')} className="hidden sm:flex text-primary">View All</Button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (activity.type === 'cargo') {
                      navigate(`/admin/shipments?search=${activity.id}`);
                    } else {
                      navigate(`/admin/bookings?search=${activity.id}`);
                    }
                  }}
                >
                  <div className={`p-3 rounded-full ${activity.type === 'cargo' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
                    {activity.type === 'cargo' ? <Package className="h-5 w-5" /> : <Plane className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="col-span-2 md:col-span-1">
                      <p className="font-bold text-sm truncate">{activity.customer}</p>
                      <p className="text-xs text-muted-foreground">{activity.id}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        {activity.route}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="outline" className="capitalize">
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="font-bold block">
                        {activity.amount ? `$${activity.amount.toLocaleString()}` : 'Quote'}
                      </span>
                      <span className="text-xs text-muted-foreground block">{format(activity.date, 'MMM d')}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </motion.div>

        </>
      )}
    </div>
  );
}
