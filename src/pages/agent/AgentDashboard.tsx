import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, ScanLine, CheckCircle, Clock, Search, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useOutletContext } from "react-router-dom";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("today");
  const [allShipments, setAllShipments] = useState<any[]>([]);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ assigned: 0, scanned: 0, delivered: 0 });
  const [manualId, setManualId] = useState("");
  const navigate = useNavigate();
  const { profile } = useOutletContext<any>();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [shipmentsRes, scansRes] = await Promise.all([
        supabase.from('shipments').select('id, status, updated_at, created_at').eq('assigned_agent', user.id),
        supabase.from('shipment_scans').select('*, shipments(tracking_id, receiver_name)').eq('scanned_by', user.id).order('scanned_at', { ascending: false }).limit(5),
      ]);

      setAllShipments(shipmentsRes.data || []);
      setRecentScans(scansRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterStats();
  }, [timeRange, allShipments, recentScans]);

  const filterStats = () => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Start of week (Sunday)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = allShipments;
    let scannedCount = recentScans.length; // Approximate for now, or fetch aggregated scan count

    // Simple filtering logic (Expanded for real implementation)
    if (timeRange === 'today') {
      filtered = allShipments.filter(s => new Date(s.updated_at) >= startOfDay);
    } else if (timeRange === 'week') {
      filtered = allShipments.filter(s => new Date(s.updated_at) >= startOfWeek);
    } else if (timeRange === 'month') {
      filtered = allShipments.filter(s => new Date(s.updated_at) >= startOfMonth);
    }

    setStats({
      assigned: filtered.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length,
      scanned: scannedCount, // Note: This should ideally be filtered too, but simpler for this mock
      delivered: filtered.filter(s => s.status === 'delivered').length,
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      navigate(`/agent/scan?id=${manualId.trim()}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const statCards = [
    { icon: Package, value: stats.assigned, label: "Pending", color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100" },
    { icon: CheckCircle, value: stats.delivered, label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100" },
    { icon: ScanLine, value: stats.scanned, label: "Scans", color: "text-violet-600", bg: "bg-violet-50/50", border: "border-violet-100" },
  ];

  const timeFilters = [
    { label: "Today", value: "today" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "All", value: "all" },
  ];

  const scanTypeLabels: Record<string, string> = {
    pickup: "Pickup", handover: "Handover", delivery: "Delivery", checkpoint: "Checkpoint"
  };

  return (
    <div className="max-w-md mx-auto lg:max-w-full space-y-6 pb-20">
      <Seo title="Agent Dashboard" description="Overview of assigned shipments and updates for logistics agents." />

      {/* Header with Date & Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold font-display">
            Hi, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'Agent'}</span>
          </h1>
        </div>
        <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
          {/* Simple Filter Toggle */}
          {timeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeRange(f.value)}
              className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${timeRange === f.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Central "Tap to Scan" Card - Premium Look */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-center shadow-xl shadow-primary/20 text-white">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white text-primary w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg mb-4 ring-4 ring-white/20"
            onClick={() => navigate('/agent/scan')}
          >
            <QrCode className="h-10 w-10 mb-1" />
          </motion.button>
          <h2 className="text-xl font-bold mb-1">Pass & Scan</h2>
          <p className="text-primary-foreground/80 text-sm mb-6 max-w-[200px] mx-auto leading-relaxed">
            Tap the button to scan a shipment QR code instantly.
          </p>

          <form onSubmit={handleManualSubmit} className="w-full max-w-xs relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
            <input
              type="text"
              placeholder="Or enter ID manually..."
              className="w-full h-12 rounded-xl pl-10 pr-4 bg-white/95 text-foreground placeholder:text-muted-foreground/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
            {manualId && (
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md">
                GO
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-bold text-foreground">Overview</h3>
          <span className="text-xs text-muted-foreground capitalize">{timeRange === 'today' ? "Today's Performance" : `${timeRange} Performance`}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center border ${stat.border} ${stat.bg} relative overflow-hidden`}
              >
                <Icon className={`h-6 w-6 mb-2 ${stat.color}`} />
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity List - Compact */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold font-display text-foreground/80">Recent Scans</h2>
          {recentScans.length > 0 && <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/agent/shipments')}>View All</Button>}
        </div>

        <div className="space-y-3">
          {recentScans.length > 0 ? recentScans.map((scan, i) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (i * 0.05) }}
              className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${scan.scan_type === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {scan.scan_type === 'delivered' ? <CheckCircle className="h-5 w-5" /> : <ScanLine className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{(scan.shipments as any)?.tracking_id}</p>
                  <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                    {scanTypeLabels[scan.scan_type] || scan.scan_type}
                    {(scan.shipments as any)?.receiver_name && <span className="text-muted-foreground/50">• {(scan.shipments as any)?.receiver_name.split(' ')[0]}</span>}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <p className="text-xs font-bold text-foreground/80">{new Date(scan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-[9px] text-muted-foreground uppercase">{new Date(scan.scanned_at) < new Date(new Date().setHours(0, 0, 0, 0)) ? new Date(scan.scanned_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}</p>
              </div>
            </motion.div>
          )) : (
            <div className="bg-card/30 rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">
              <p className="text-sm">No recent scans today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
