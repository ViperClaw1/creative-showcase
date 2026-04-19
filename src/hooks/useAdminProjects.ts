import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type MediaRow = Database["public"]["Tables"]["project_media"]["Row"];

export function useAdminProjects() {
  return useQuery({
    queryKey: ["admin", "projects"],
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminProject(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["admin", "project", id],
    queryFn: async () => {
      const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!project) return null;

      const { data: media, error: mediaError } = await supabase
        .from("project_media")
        .select("*")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true });
      if (mediaError) throw mediaError;

      return { project, media: media ?? [] };
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInsert) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      qc.invalidateQueries({ queryKey: ["projects", "published"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProjectUpdate }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      qc.invalidateQueries({ queryKey: ["admin", "project", vars.id] });
      qc.invalidateQueries({ queryKey: ["projects", "published"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch media to remove storage files
      const { data: media } = await supabase
        .from("project_media")
        .select("file_path")
        .eq("project_id", id);
      const paths = (media ?? []).map((m) => m.file_path).filter(Boolean) as string[];
      if (paths.length > 0) {
        await supabase.storage.from("project-media").remove(paths);
      }
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      qc.invalidateQueries({ queryKey: ["projects", "published"] });
    },
  });
}

/** Upload a file to project-media bucket. Returns public URL + path. */
export async function uploadProjectFile(projectId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("project-media")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("project-media").getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export function useAddMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      sortOrder,
    }: {
      projectId: string;
      file: File;
      sortOrder: number;
    }) => {
      const { path, url } = await uploadProjectFile(projectId, file);
      const media_type = file.type.startsWith("video/") ? "video" : "image";
      const { error } = await supabase.from("project_media").insert({
        project_id: projectId,
        media_type,
        file_url: url,
        file_path: path,
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "project", vars.projectId] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ media }: { media: MediaRow; projectId: string }) => {
      if (media.file_path) {
        await supabase.storage.from("project-media").remove([media.file_path]);
      }
      const { error } = await supabase.from("project_media").delete().eq("id", media.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "project", vars.projectId] });
    },
  });
}

export function useReorderMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      orderedIds,
    }: {
      projectId: string;
      orderedIds: string[];
    }) => {
      // Update each row's sort_order
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase.from("project_media").update({ sort_order: idx }).eq("id", id),
        ),
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "project", vars.projectId] });
    },
  });
}

export function useReplaceMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      media,
      file,
      projectId,
    }: {
      media: MediaRow;
      file: File;
      projectId: string;
    }) => {
      // Remove old file
      if (media.file_path) {
        await supabase.storage.from("project-media").remove([media.file_path]);
      }
      const { path, url } = await uploadProjectFile(projectId, file);
      const media_type = file.type.startsWith("video/") ? "video" : "image";
      const { error } = await supabase
        .from("project_media")
        .update({ file_url: url, file_path: path, media_type })
        .eq("id", media.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "project", vars.projectId] });
    },
  });
}
