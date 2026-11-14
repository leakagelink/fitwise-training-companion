DROP POLICY IF EXISTS "Read coach slots" ON public.coach_slots;
CREATE POLICY "Read coach slots" ON public.coach_slots FOR SELECT TO authenticated
USING (
  (is_available AND starts_at > now())
  OR coach_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.coach_bookings b WHERE b.slot_id = coach_slots.id AND b.user_id = auth.uid())
);