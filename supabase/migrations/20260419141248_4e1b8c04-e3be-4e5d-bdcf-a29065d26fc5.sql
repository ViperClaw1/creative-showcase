-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.project_status AS ENUM ('draft', 'published');
CREATE TYPE public.media_type AS ENUM ('image', 'video');
CREATE TYPE public.reaction_type AS ENUM ('like', 'dislike');

-- =========================
-- UTILITY: updated_at trigger fn
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- PROJECTS
-- =========================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  status public.project_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_slug ON public.projects(slug);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- PROJECT MEDIA
-- =========================
CREATE TABLE public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_type public.media_type NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_project_media_project ON public.project_media(project_id);

CREATE POLICY "Anyone can view media of published projects"
  ON public.project_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_media.project_id AND p.status = 'published'
    )
  );

CREATE POLICY "Admins can view all media"
  ON public.project_media FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage media"
  ON public.project_media FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- REACTIONS
-- =========================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reaction_type public.reaction_type NOT NULL,
  user_identifier UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_identifier)
);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reactions_project ON public.reactions(project_id);

CREATE POLICY "Anyone can view reactions on published projects"
  ON public.reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = reactions.project_id AND p.status = 'published'
    )
  );

CREATE POLICY "Authenticated users can react to published projects"
  ON public.reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_identifier
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = reactions.project_id AND p.status = 'published'
    )
  );

CREATE POLICY "Users can update their own reaction"
  ON public.reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_identifier)
  WITH CHECK (auth.uid() = user_identifier);

CREATE POLICY "Users can delete their own reaction"
  ON public.reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_identifier);

CREATE POLICY "Admins can manage all reactions"
  ON public.reactions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- COMMENTS
-- =========================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_identifier UUID NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_comments_project ON public.comments(project_id);
CREATE INDEX idx_comments_user ON public.comments(user_identifier, created_at);

-- Validation + soft rate limit (max 5 comments per minute per user)
CREATE OR REPLACE FUNCTION public.validate_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  IF length(trim(NEW.author_name)) < 1 OR length(NEW.author_name) > 60 THEN
    RAISE EXCEPTION 'Author name must be between 1 and 60 characters';
  END IF;
  IF length(trim(NEW.content)) < 1 OR length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Comment must be between 1 and 2000 characters';
  END IF;

  SELECT COUNT(*) INTO recent_count
  FROM public.comments
  WHERE user_identifier = NEW.user_identifier
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit: too many comments, please wait a moment';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_comment
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_comment();

CREATE POLICY "Anyone can view comments on published projects"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = comments.project_id AND p.status = 'published'
    )
  );

CREATE POLICY "Authenticated users can post comments on published projects"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_identifier
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = comments.project_id AND p.status = 'published'
    )
  );

CREATE POLICY "Users can delete their own comment"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_identifier);

CREATE POLICY "Admins can manage all comments"
  ON public.comments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- CONTACT MESSAGES
-- =========================
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(trim(NEW.name)) < 1 OR length(NEW.name) > 120 THEN
    RAISE EXCEPTION 'Name must be between 1 and 120 characters';
  END IF;
  IF NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(NEW.email) > 200 THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  IF length(trim(NEW.message)) < 1 OR length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 5000 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_contact_message
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message();

CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- STORAGE: project-media bucket
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-media', 'project-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Project media is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-media');

CREATE POLICY "Admins can upload project media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update project media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete project media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));