import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Shipment } from './useShipments';
import type { FlightBooking } from './useFlightBookings';
import type { Profile } from './useProfile';

export function useAdminShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAll = async () => {
    if (!user) return;
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
    if (user) fetchAll();
  }, [user]);

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
  const { user } = useAuth();

  const fetchAll = async () => {
    if (!user) return;
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
    if (user) fetchAll();
  }, [user]);

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
  const { user } = useAuth();

  const fetchAll = async () => {
    if (!user) return;
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
    if (user) fetchAll();
  }, [user]);

  return { profiles, loading, error, refetch: fetchAll };
}
