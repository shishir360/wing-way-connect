import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Shipment {
  id: string;
  user_id: string;
  tracking_id: string;
  short_id?: string | null;
  route: 'bd-to-ca' | 'ca-to-bd';
  status: 'pending' | 'pickup_scheduled' | 'picked_up' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered' | 'cancelled';
  cargo_type: string | null;
  weight: number | null;
  packages: number;
  contents: string | null;
  sender_name: string;
  sender_phone: string;
  sender_email: string | null;
  pickup_address: string | null;
  from_city: string | null;
  receiver_name: string;
  receiver_phone: string;
  delivery_address: string | null;
  to_city: string | null;
  service_type: 'standard' | 'express' | 'priority';
  base_cost: number | null;
  insurance_cost: number | null;
  fragile_fee: number | null;
  total_cost: number | null;
  has_insurance: boolean;
  is_fragile: boolean;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  created_at: string;
  updated_at: string;
}

export function useShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchShipments();
    } else {
      setShipments([]);
      setLoading(false);
    }
  }, [user]);

  // Real-time subscription for auto-refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('user-shipments-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipments',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchShipments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchShipments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .or(`user_id.eq.${user.id},sender_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments((data || []) as Shipment[]);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveShipments = () => {
    return shipments.filter(s => !['delivered', 'cancelled'].includes(s.status));
  };

  const getDeliveredShipments = () => {
    return shipments.filter(s => s.status === 'delivered');
  };

  return {
    shipments,
    loading,
    refetch: fetchShipments,
    activeShipments: getActiveShipments(),
    deliveredShipments: getDeliveredShipments()
  };
}
