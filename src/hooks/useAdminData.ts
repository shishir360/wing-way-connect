import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Shipment } from './useShipments';
import type { FlightBooking } from './useFlightBookings';
import type { Profile } from './useProfile';

export function useAdminShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const fetchAll = async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setShipments((data || []) as Shipment[]);
    } catch (e) {
      console.error('Admin shipments error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user, authLoading]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('admin-shipments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const updateShipmentStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  return { shipments, loading, refetch: fetchAll, updateShipmentStatus };
}

export function useAdminBookings() {
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const fetchAll = async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flight_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings((data || []) as FlightBooking[]);
    } catch (e) {
      console.error('Admin bookings error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user, authLoading]);

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('flight_bookings')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  return { bookings, loading, refetch: fetchAll, updateBookingStatus };
}

export function useAdminProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const fetchAll = async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (e: any) {
      console.error('Admin profiles error:', e);
      setError(e.message || "Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user, authLoading]);

  return { profiles, loading, error, refetch: fetchAll };
}

export function useAgentDetails(userId: string | undefined) {
  const [agent, setAgent] = useState<any>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0, today: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Fetch Profile & Agent Info
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: agentData } = await supabase.from('agents' as any).select('*').eq('user_id', userId).maybeSingle();
      const { data: wallet } = await supabase.from('wallets' as any).select('*').eq('user_id', userId).maybeSingle();

      // 2. Fetch Shipments: Assigned OR Scanned by this agent
      // A. Assigned
      const { data: assigned } = await supabase
        .from('shipments')
        .select('*')
        .eq('assigned_agent', userId);

      // B. Scanned (Interacted with) - Determine IDs first
      const { data: scans } = await supabase
        .from('shipment_scans')
        .select('shipment_id')
        .eq('scanned_by', userId);

      const scannedIds = scans?.map(s => s.shipment_id) || [];

      let scannedShipments: any[] = [];
      if (scannedIds.length > 0) {
        const { data: sShipments } = await supabase
          .from('shipments')
          .select('*')
          .in('id', scannedIds);
        scannedShipments = sShipments || [];
      }

      // Merge unique
      const allMap = new Map();
      assigned?.forEach(s => allMap.set(s.id, s));
      scannedShipments.forEach(s => allMap.set(s.id, s));

      // Sort by date desc
      const safeShipments = Array.from(allMap.values()).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setShipments(safeShipments as Shipment[]);

      // 3. Calc Stats
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const delivered = safeShipments.filter(s => s.status === 'delivered');

      setStats({
        total: safeShipments.length,
        delivered: delivered.length,
        pending: safeShipments.length - delivered.length,
        today: safeShipments.filter(s => s.updated_at >= startOfDay && s.status === 'delivered').length, // Approx
        thisMonth: safeShipments.filter(s => s.updated_at >= startOfMonth && s.status === 'delivered').length
      });

      setAgent({ ...profile, ...(agentData as any || {}), wallet });

    } catch (error) {
      console.error("Error fetching agent details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [userId]);

  return { agent, shipments, stats, loading, refetch: fetchDetails };
}
