-- 1. Auto-grant admin role to a specific email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'marin.duplava@zeroqode.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin_grant ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_grant
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_admin_grant();

-- Backfill: if the admin email already exists in auth.users, grant role now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'marin.duplava@zeroqode.com'
ON CONFLICT DO NOTHING;

-- 2. Storage policies for project-media bucket (admins manage; public can read)
DROP POLICY IF EXISTS "Public can view project media" ON storage.objects;
CREATE POLICY "Public can view project media"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');

DROP POLICY IF EXISTS "Admins can upload project media" ON storage.objects;
CREATE POLICY "Admins can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update project media" ON storage.objects;
CREATE POLICY "Admins can update project media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete project media" ON storage.objects;
CREATE POLICY "Admins can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));