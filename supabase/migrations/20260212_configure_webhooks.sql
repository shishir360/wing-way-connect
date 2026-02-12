-- ==============================================================================
-- CONFIGURE DATABASE WEBHOOKS FOR NOTIFICATION SERVICE
-- Run this in the Supabase SQL Editor to enable automatic notifications.
-- ==============================================================================

-- 1. Create a function to handle Flight Booking notifications (INSERT)
CREATE OR REPLACE FUNCTION public.handle_new_flight_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://nloedcznsdblkbggdbfp.supabase.co/functions/v1/notification-service',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'flight_booking',
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger for Flight Bookings
DROP TRIGGER IF EXISTS on_flight_booking_created ON public.flight_bookings;
CREATE TRIGGER on_flight_booking_created
  AFTER INSERT ON public.flight_bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_flight_booking();

-- 3. Create a function to handle Shipment Notifications (INSERT & UPDATE)
CREATE OR REPLACE FUNCTION public.handle_shipment_event()
RETURNS TRIGGER AS $$
DECLARE
  event_type text;
BEGIN
  -- Determine if it's a new shipment or an update
  IF (TG_OP = 'INSERT') THEN
    event_type := 'shipment_created';
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only trigger if status changed
    IF (OLD.status IS NOT DISTINCT FROM NEW.status) THEN
      RETURN NEW;
    END IF;
    event_type := 'shipment_update';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM
    net.http_post(
      url := 'https://nloedcznsdblkbggdbfp.supabase.co/functions/v1/notification-service',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'type', event_type,
        'record', row_to_json(NEW),
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the triggers for Shipments
DROP TRIGGER IF EXISTS on_shipment_event ON public.shipments;
CREATE TRIGGER on_shipment_event
  AFTER INSERT OR UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_shipment_event();

-- ==============================================================================
-- NOTE: 
-- 1. Ensure 'pgnet' extension is enabled: CREATE EXTENSION IF NOT EXISTS "net";
-- 2. Verify your Project ID in the URL (Currently: nloedcznsdblkbggdbfp)
-- 3. Ensure 'app.settings.service_role_key' is set in your database config.
-- ==============================================================================
