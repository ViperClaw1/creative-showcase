import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublishedProject {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  media_type: "image" | "video";
  file_url: string;
  alt_text: string | null;
  sort_order: number;
}

export function usePublishedProjects() {
  return useQuery({
    queryKey: ["projects", "published"],
    queryFn: async (): Promise<PublishedProject[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, slug, title, description, start_date, end_date, cover_image_url")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectBySlug(slug: string | undefined) {
  return useQuery({
    enabled: !!slug,
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!project) return null;

      const { data: media, error: mediaError } = await supabase
        .from("project_media")
        .select("id, project_id, media_type, file_url, alt_text, sort_order")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true });
      if (mediaError) throw mediaError;

      return { project, media: (media ?? []) as ProjectMedia[] };
    },
  });
}
