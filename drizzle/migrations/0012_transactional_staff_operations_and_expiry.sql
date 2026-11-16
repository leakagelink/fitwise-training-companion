CREATE FUNCTION public.staff_operation(_actor uuid,_action text,_payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE cap text; target uuid; rid uuid; t support_tickets; BEGIN
cap:=CASE WHEN _action IN ('permission','broadcast') THEN 'admin' WHEN _action='privacy_status' THEN 'privacy' ELSE 'support' END;
IF cap='admin' THEN IF NOT public.has_role(_actor,'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF; ELSE IF NOT public.has_staff_permission(_actor,cap) THEN RAISE EXCEPTION 'Permission required'; END IF; END IF;
IF _action='permission' THEN
 target:=(_payload->>'userId')::uuid; IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=target) THEN RAISE EXCEPTION 'User missing'; END IF;
 IF (_payload->>'enabled')::boolean THEN INSERT INTO staff_permissions(user_id,capability,granted_by) VALUES(target,_payload->>'capability',_actor) ON CONFLICT DO NOTHING; ELSE DELETE FROM staff_permissions WHERE user_id=target AND capability=_payload->>'capability'; END IF;
ELSIF _action='reply' THEN
 SELECT * INTO t FROM support_tickets WHERE id=(_payload->>'ticketId')::uuid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Ticket missing'; END IF;
 target:=t.user_id; INSERT INTO support_replies(ticket_id,author_id,from_staff,body) VALUES(t.id,_actor,true,_payload->>'body'); UPDATE support_tickets SET status=_payload->>'status',updated_at=now() WHERE id=t.id;
ELSIF _action='note' THEN target:=(_payload->>'userId')::uuid; INSERT INTO staff_notes(user_id,author_id,body) VALUES(target,_actor,_payload->>'body');
ELSIF _action='delete_note' THEN DELETE FROM staff_notes WHERE id=(_payload->>'id')::uuid RETURNING user_id INTO target; IF target IS NULL THEN RAISE EXCEPTION 'Note missing'; END IF;
ELSIF _action='broadcast' THEN
 IF jsonb_array_length(_payload->'userIds')>100 THEN RAISE EXCEPTION 'Too many recipients'; END IF;
 INSERT INTO user_notifications(user_id,title,body,kind) SELECT DISTINCT p.id,_payload->>'title',_payload->>'body','announcement' FROM jsonb_array_elements_text(_payload->'userIds') u JOIN profiles p ON p.id=u.value::uuid LEFT JOIN notification_preferences n ON n.user_id=p.id WHERE coalesce(n.announcements,true);
ELSIF _action='privacy_status' THEN
 SELECT user_id INTO target FROM privacy_requests WHERE id=(_payload->>'id')::uuid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Request missing'; END IF;
 IF _payload->>'status'='completed' AND EXISTS(SELECT 1 FROM privacy_requests WHERE id=(_payload->>'id')::uuid AND kind='delete' AND user_id IS NOT NULL) THEN RAISE EXCEPTION 'Delete the account first'; END IF;
 IF _payload->>'status'='completed' AND EXISTS(SELECT 1 FROM privacy_requests r WHERE r.id=(_payload->>'id')::uuid AND r.kind='export' AND NOT EXISTS(SELECT 1 FROM private_data_access a WHERE a.target_user_id=r.user_id AND a.resource='user_export' AND a.created_at>=r.created_at)) THEN RAISE EXCEPTION 'Export first'; END IF;
 UPDATE privacy_requests SET status=_payload->>'status',reason=_payload->>'reason',updated_at=now() WHERE id=(_payload->>'id')::uuid;
ELSE RAISE EXCEPTION 'Action not allowed'; END IF;
INSERT INTO admin_activity(actor_id,target_user_id,action,resource,reason) VALUES(_actor,target,_action,'staff_operations',coalesce(_payload->>'reason','Staff operation')); END $$;
REVOKE ALL ON FUNCTION public.staff_operation(uuid,text,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.staff_operation(uuid,text,jsonb) TO service_role;
CREATE FUNCTION public.send_expiry_notifications() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE sent integer; BEGIN
INSERT INTO user_notifications(user_id,title,body,kind,dedupe_key)
SELECT m.user_id,'Membership expiring soon',m.plan_name || ' expires on ' || to_char(m.ends_at AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI') || ' UTC.','expiry','expiry:'||m.id::text FROM membership_access m JOIN profiles p ON p.id=m.user_id LEFT JOIN notification_preferences n ON n.user_id=m.user_id WHERE m.revoked_at IS NULL AND m.starts_at<=now() AND m.ends_at>now() AND m.ends_at<=now()+interval '3 days' AND coalesce(n.expiry_reminders,true) ON CONFLICT(dedupe_key) DO NOTHING;
GET DIAGNOSTICS sent=ROW_COUNT; RETURN sent; END $$;
REVOKE ALL ON FUNCTION public.send_expiry_notifications() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.send_expiry_notifications() TO service_role;