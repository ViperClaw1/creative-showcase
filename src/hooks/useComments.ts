import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Comment {
  id: string;
  project_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export function useComments(projectId: string | undefined, userId: string | null) {
  const qc = useQueryClient();

  const list = useQuery({
    enabled: !!projectId,
    queryKey: ["comments", projectId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, project_id, author_name, content, created_at")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (input: { author_name: string; content: string }) => {
      if (!projectId || !userId) throw new Error("Not ready");
      const { error } = await supabase.from("comments").insert({
        project_id: projectId,
        user_identifier: userId,
        author_name: input.author_name.trim(),
        content: input.content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", projectId] });
    },
  });

  return { list, add };
}
