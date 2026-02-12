import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FlightBooking {
  id: string;
  user_id: string;
  booking_ref: string;
  pnr: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  airline: string | null;
  flight_number: string | null;
  from_city: string;
  to_city: string;
  departure_date: string;
  departure_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  duration: string | null;
  stops: number;
  stop_location: string | null;
  cabin_class: 'economy' | 'premium' | 'business' | 'first';
  trip_type: 'one-way' | 'round-trip';
  return_date: string | null;
  adults: number;
  children: number;
  price_per_person: number | null;
  total_price: number | null;
  created_at: string;
  updated_at: string;
}

export function useFlightBookings() {
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('flight_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as FlightBooking[]);
    } catch (error) {
      console.error('Error fetching flight bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingFlights = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => b.departure_date >= today && b.status !== 'cancelled');
  };

  const getPastFlights = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => b.departure_date < today || b.status === 'completed');
  };

  return {
    bookings,
    loading,
    refetch: fetchBookings,
    upcomingFlights: getUpcomingFlights(),
    pastFlights: getPastFlights()
  };
}
