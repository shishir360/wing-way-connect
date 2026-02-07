import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, ScanLine, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ assigned: 0, scanned: 0, delivered: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [shipmentsRes, scansRes] = await Promise.all([
        supabase.from('shipments').select('id, status').eq('assigned_agent', user.id),
        supabase.from('shipment_scans').select('*, shipments(tracking_id, receiver_name)').eq('scanned_by', user.id).order('scanned_at', { ascending: false }).limit(10),
      ]);

      const shipments = shipmentsRes.data || [];
      setStats({
        assigned: shipments.length,
        scanned: scansRes.data?.length || 0,
        delivered: shipments.filter(s => s.status === 'delivered').length,
      });
      setRecentScans(scansRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const statCards = [
    { icon: Package, value: stats.assigned, label: "Assigned Shipments", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: ScanLine, value: stats.scanned, label: "Total Scans", color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: CheckCircle, value: stats.delivered, label: "Delivered", color: "text-green-500", bg: "bg-green-500/10" },
  ];

  const scanTypeLabels: Record<string, string> = {
    pickup: "Pickup", handover: "Handover", delivery: "Delivery", checkpoint: "Checkpoint"
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold font-display mb-6">Agent Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <h2 className="text-xl font-bold font-display mb-4">Recent Scans</h2>
      {recentScans.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="p-4">Tracking ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map(scan => (
                  <tr key={scan.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-medium text-primary">{(scan.shipments as any)?.tracking_id || '-'}</td>
                    <td className="p-4">{scanTypeLabels[scan.scan_type] || scan.scan_type}</td>
                    <td className="p-4">{scan.location || '-'}</td>
                    <td className="p-4 text-muted-foreground">{new Date(scan.scanned_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 p-8 text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No scans yet</p>
        </div>
      )}
    </div>
  );
}
