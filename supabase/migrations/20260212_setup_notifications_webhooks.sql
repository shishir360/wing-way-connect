-- Trigger for Flight Bookings
CREATE OR REPLACE FUNCTION public.handle_new_flight_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://pndayqswiizunhizvscy.supabase.co/functions/v1/notification-service',
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

CREATE TRIGGER on_flight_booking_created
  AFTER INSERT ON public.flight_bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_flight_booking();

-- Trigger for Shipment Updates
CREATE OR REPLACE FUNCTION public.handle_shipment_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM
      net.http_post(
        url := 'https://pndayqswiizunhizvscy.supabase.co/functions/v1/notification-service',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'type', 'shipment_update',
          'record', row_to_json(NEW),
          'old_record', row_to_json(OLD)
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_shipment_status_updated
  AFTER UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_shipment_update();
