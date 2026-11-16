CREATE TABLE public.membership_plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text NOT NULL DEFAULT '', duration_days integer NOT NULL DEFAULT 30 CHECK(duration_days BETWEEN 1 AND 3660), price_minor integer NOT NULL DEFAULT 0 CHECK(price_minor >= 0), currency text NOT NULL DEFAULT 'INR' CHECK(currency ~ '^[A-Z]{3}$'), diet_days integer NOT NULL DEFAULT 30 CHECK(diet_days IN (1,3,7,30)), workout_access boolean NOT NULL DEFAULT true, coach_access boolean NOT NULL DEFAULT true, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.membership_plans TO authenticated; GRANT ALL ON public.membership_plans TO service_role;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_read ON public.membership_plans FOR SELECT TO authenticated USING(is_active OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.membership_access (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, plan_id uuid REFERENCES public.membership_plans(id), plan_name text NOT NULL, starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz NOT NULL, diet_days integer NOT NULL CHECK(diet_days IN (1,3,7,30)), workout_access boolean NOT NULL, coach_access boolean NOT NULL, source text NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','payment')), reason text NOT NULL, granted_by uuid, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.membership_access TO authenticated; GRANT ALL ON public.membership_access TO service_role;
ALTER TABLE public.membership_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY access_read ON public.membership_access FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX membership_access_user ON public.membership_access(user_id, ends_at);
CREATE TABLE public.purchase_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, plan_name text NOT NULL, amount_minor integer NOT NULL CHECK(amount_minor>=0), currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), provider text NOT NULL CHECK(provider IN ('stripe','paddle')), provider_reference text NOT NULL UNIQUE, status text NOT NULL CHECK(status IN ('pending','paid','refunded','failed')), purchased_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.purchase_history TO authenticated; GRANT ALL ON public.purchase_history TO service_role;
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchase_read ON public.purchase_history FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.app_controls (id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), diet_enabled boolean NOT NULL DEFAULT true, workouts_enabled boolean NOT NULL DEFAULT true, coach_enabled boolean NOT NULL DEFAULT true, announcement text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.app_controls TO authenticated; GRANT ALL ON public.app_controls TO service_role;
ALTER TABLE public.app_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY controls_read ON public.app_controls FOR SELECT TO authenticated USING(auth.uid() IS NOT NULL);
CREATE TABLE public.admin_activity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid, target_user_id uuid, action text NOT NULL, resource text NOT NULL, record_id text, reason text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_activity TO authenticated; GRANT SELECT,INSERT,UPDATE ON public.admin_activity TO service_role;
ALTER TABLE public.admin_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_read ON public.admin_activity FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.admin_save_record(_actor uuid, _table text, _id text, _data jsonb, _delete boolean DEFAULT false, _reason text DEFAULT '') RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cols text; vals text; assignments text; key_col text := 'id'; result_id text; target uuid; BEGIN
IF NOT public.has_role(_actor,'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
IF _table NOT IN ('profiles','daily_checkins','weight_logs','body_measurements','meal_logs','grocery_items','nutrition_plans','workout_plans','workout_days','workout_day_exercises','workout_sessions','workout_sets','coach_profiles','coach_slots','coach_bookings','membership_plans','app_controls') THEN RAISE EXCEPTION 'Resource not allowed'; END IF;
IF _table='coach_profiles' THEN key_col:='user_id'; END IF;
IF _table='profiles' AND (_delete OR _id IS NULL) THEN RAISE EXCEPTION 'Use account management'; END IF;
IF _id IS NOT NULL THEN
EXECUTE format('SELECT to_jsonb(t)->>%L FROM public.%I t WHERE %I::text=$1',CASE WHEN _table='profiles' THEN 'id' WHEN _table='coach_slots' THEN 'coach_user_id' ELSE 'user_id' END,_table,key_col) INTO result_id USING _id;
IF _table NOT IN ('membership_plans','app_controls') THEN target:=result_id::uuid; END IF;
END IF;
IF _delete THEN
IF _table='app_controls' THEN RAISE EXCEPTION 'Settings cannot be deleted'; END IF;
IF _table='membership_plans' AND EXISTS(SELECT 1 FROM membership_access WHERE plan_id=_id::uuid) THEN RAISE EXCEPTION 'Archive plans used in access history'; END IF;
EXECUTE format('DELETE FROM public.%I WHERE %I::text=$1 RETURNING %I::text',_table,key_col,key_col) INTO result_id USING _id;
ELSE
IF _data='{}'::jsonb THEN RAISE EXCEPTION 'No fields provided'; END IF;
SELECT string_agg(format('%I',key),','), string_agg(format('r.%I',key),','), string_agg(format('%I=r.%I',key,key),',') INTO cols,vals,assignments FROM jsonb_object_keys(_data) key;
IF _id IS NULL THEN
EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) r RETURNING %I::text',_table,cols,vals,_table,key_col) INTO result_id USING _data;
IF _table NOT IN ('membership_plans','app_controls') THEN target:=COALESCE(_data->>'user_id',_data->>'coach_user_id')::uuid; END IF;
ELSE
EXECUTE format('UPDATE public.%I t SET %s FROM jsonb_populate_record(NULL::public.%I,$1) r WHERE t.%I::text=$2 RETURNING t.%I::text',_table,assignments,_table,key_col,key_col) INTO result_id USING _data,_id;
END IF;
END IF;
IF result_id IS NULL THEN RAISE EXCEPTION 'Record not found'; END IF;
INSERT INTO admin_activity(actor_id,target_user_id,action,resource,record_id,reason) VALUES(_actor,target,CASE WHEN _delete THEN 'delete' WHEN _id IS NULL THEN 'create' ELSE 'update' END,_table,result_id,_reason);
RETURN result_id; END $$;
REVOKE ALL ON FUNCTION public.admin_save_record(uuid,text,text,jsonb,boolean,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.admin_save_record(uuid,text,text,jsonb,boolean,text) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_membership(_actor uuid,_user uuid,_plan uuid,_ends timestamptz,_reason text,_revoke uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p membership_plans; rid uuid; BEGIN
IF NOT public.has_role(_actor,'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
IF length(trim(_reason))<3 THEN RAISE EXCEPTION 'Reason required'; END IF;
IF _revoke IS NOT NULL THEN UPDATE membership_access SET revoked_at=now() WHERE id=_revoke AND user_id=_user AND revoked_at IS NULL RETURNING id INTO rid;
ELSE
IF _ends<=now() THEN RAISE EXCEPTION 'Expiry must be in the future'; END IF;
SELECT * INTO p FROM membership_plans WHERE id=_plan AND is_active; IF NOT FOUND THEN RAISE EXCEPTION 'Active plan not found'; END IF;
IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=_user) THEN RAISE EXCEPTION 'User not found'; END IF;
INSERT INTO membership_access(user_id,plan_id,plan_name,ends_at,diet_days,workout_access,coach_access,reason,granted_by) VALUES(_user,p.id,p.name,_ends,p.diet_days,p.workout_access,p.coach_access,_reason,_actor) RETURNING id INTO rid;
END IF;
IF rid IS NULL THEN RAISE EXCEPTION 'Access not found'; END IF;
INSERT INTO admin_activity(actor_id,target_user_id,action,resource,record_id,reason) VALUES(_actor,_user,CASE WHEN _revoke IS NULL THEN 'activate' ELSE 'revoke' END,'membership_access',rid::text,_reason); RETURN rid; END $$;
REVOKE ALL ON FUNCTION public.admin_membership(uuid,uuid,uuid,timestamptz,text,uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.admin_membership(uuid,uuid,uuid,timestamptz,text,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.admin_set_role(_actor uuid,_user uuid,_role public.app_role,_remove boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
PERFORM pg_advisory_xact_lock(842901);
IF NOT public.has_role(_actor,'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
IF _role='admin' AND _remove AND (_actor=_user OR (SELECT count(*) FROM user_roles WHERE role='admin')<=1) THEN RAISE EXCEPTION 'Cannot remove your own or last administrator'; END IF;
IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=_user) THEN RAISE EXCEPTION 'User not found'; END IF;
IF _remove THEN DELETE FROM user_roles WHERE user_id=_user AND role=_role; ELSE INSERT INTO user_roles(user_id,role) VALUES(_user,_role) ON CONFLICT(user_id,role) DO NOTHING; END IF;
INSERT INTO admin_activity(actor_id,target_user_id,action,resource,reason) VALUES(_actor,_user,CASE WHEN _remove THEN 'remove_role' ELSE 'add_role' END,'user_roles',_role::text); END $$;
REVOKE ALL ON FUNCTION public.admin_set_role(uuid,uuid,public.app_role,boolean) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid,uuid,public.app_role,boolean) TO service_role;