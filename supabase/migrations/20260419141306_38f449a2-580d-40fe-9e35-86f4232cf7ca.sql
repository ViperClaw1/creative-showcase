-- Replace permissive contact_messages insert policy with a non-trivial check
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;

CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(email)) > 0
    AND length(trim(message)) > 0
  );

-- Restrict storage listing on project-media: keep direct file access public,
-- but disallow public bucket listing. We split SELECT by access pattern.
DROP POLICY IF EXISTS "Project media is publicly readable" ON storage.objects;

-- Public can read individual objects (direct URL access still works because
-- the bucket is public; this policy keeps RLS-granted SELECT working too).
-- We narrow it so that only admins can list/enumerate; public read of a known
-- object path is still possible via the public bucket's signed/public URL.
CREATE POLICY "Admins can list project media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));