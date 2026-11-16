CREATE OR REPLACE FUNCTION public.admin_save_record(_actor uuid, _table text, _id text, _data jsonb, _delete boolean DEFAULT false, _reason text DEFAULT '') RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cols text; vals text; assignments text; key_col text := 'id'; result_id text; target uuid; oldrow jsonb; owner_col text; BEGIN
IF NOT public.has_role(_actor,'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
IF length(trim(_reason))<3 THEN RAISE EXCEPTION 'Reason required'; END IF;
IF _table NOT IN ('profiles','daily_checkins','weight_logs','body_measurements','meal_logs','grocery_items','nutrition_plans','workout_plans','workout_days','workout_day_exercises','workout_sessions','workout_sets','coach_profiles','coach_slots','coach_bookings','membership_plans','app_controls') THEN RAISE EXCEPTION 'Resource not allowed'; END IF;
IF _table='coach_profiles' THEN key_col:='user_id'; END IF;
IF _table='profiles' AND (_delete OR _id IS NULL) THEN RAISE EXCEPTION 'Use account management'; END IF;
owner_col:=CASE WHEN _table='profiles' THEN 'id' WHEN _table='coach_slots' THEN 'coach_user_id' WHEN _table IN ('membership_plans','app_controls') THEN NULL ELSE 'user_id' END;
IF _id IS NOT NULL THEN
EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE %I::text=$1 FOR UPDATE',_table,key_col) INTO oldrow USING _id;
IF oldrow IS NULL THEN RAISE EXCEPTION 'Record not found'; END IF;
IF owner_col IS NOT NULL THEN target:=(oldrow->>owner_col)::uuid; END IF;
IF _data ? key_col OR (owner_col IS NOT NULL AND _data ? owner_col) THEN RAISE EXCEPTION 'Ownership and identifier cannot change'; END IF;
ELSE
IF owner_col IS NOT NULL THEN target:=(_data->>owner_col)::uuid; IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=target) THEN RAISE EXCEPTION 'User not found'; END IF; END IF;
END IF;
IF _data ? 'plan_id' AND _table='workout_days' AND NOT EXISTS(SELECT 1 FROM workout_plans WHERE id=(_data->>'plan_id')::uuid AND user_id=target) THEN RAISE EXCEPTION 'Plan owner mismatch'; END IF;
IF _data ? 'day_id' AND _table='workout_day_exercises' AND NOT EXISTS(SELECT 1 FROM workout_days WHERE id=(_data->>'day_id')::uuid AND user_id=target) THEN RAISE EXCEPTION 'Day owner mismatch'; END IF;
IF _table='coach_slots' AND _id IS NULL AND (_data->>'starts_at')::timestamptz<=now() THEN RAISE EXCEPTION 'Future availability required'; END IF;
PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',_actor,'role','authenticated')::text,true);
IF _delete THEN
IF _table='app_controls' THEN RAISE EXCEPTION 'Settings cannot be deleted'; END IF;
IF _table='membership_plans' AND EXISTS(SELECT 1 FROM membership_access WHERE plan_id=_id::uuid) THEN RAISE EXCEPTION 'Archive plans used in access history'; END IF;
EXECUTE format('DELETE FROM public.%I WHERE %I::text=$1 RETURNING %I::text',_table,key_col,key_col) INTO result_id USING _id;
ELSE
IF _data='{}'::jsonb THEN RAISE EXCEPTION 'No fields provided'; END IF;
SELECT string_agg(format('%I',key),','), string_agg(format('r.%I',key),','), string_agg(format('%I=r.%I',key,key),',') INTO cols,vals,assignments FROM jsonb_object_keys(_data) key;
IF _id IS NULL THEN
EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) r RETURNING %I::text',_table,cols,vals,_table,key_col) INTO result_id USING _data;
ELSE
EXECUTE format('UPDATE public.%I t SET %s FROM jsonb_populate_record(NULL::public.%I,$1) r WHERE t.%I::text=$2 RETURNING t.%I::text',_table,assignments,_table,key_col,key_col) INTO result_id USING _data,_id;
END IF;
END IF;
IF result_id IS NULL THEN RAISE EXCEPTION 'Record not found'; END IF;
INSERT INTO admin_activity(actor_id,target_user_id,action,resource,record_id,reason) VALUES(_actor,target,CASE WHEN _delete THEN 'delete' WHEN _id IS NULL THEN 'create' ELSE 'update' END,_table,result_id,_reason);
RETURN result_id; END $$;
REVOKE ALL ON FUNCTION public.admin_save_record(uuid,text,text,jsonb,boolean,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.admin_save_record(uuid,text,text,jsonb,boolean,text) TO service_role;