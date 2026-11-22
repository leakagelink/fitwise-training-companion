CREATE OR REPLACE FUNCTION public.sync_coach_slot_availability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coach_slots s
  SET is_available = NOT EXISTS (
    SELECT 1 FROM public.coach_bookings b
    WHERE b.slot_id = s.id AND b.status IN ('pending','confirmed','completed'))
  WHERE s.id IN (NEW.slot_id, CASE WHEN TG_OP = 'UPDATE' THEN OLD.slot_id END);
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_coach_slot_availability() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_coach_slot_availability
AFTER INSERT OR UPDATE OF status, slot_id ON public.coach_bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_coach_slot_availability();
UPDATE public.coach_slots s SET is_available = false
WHERE EXISTS (SELECT 1 FROM public.coach_bookings b WHERE b.slot_id = s.id AND b.status IN ('pending','confirmed','completed'));