import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReactionType = "like" | "dislike";

export function useReactions(projectId: string | undefined, userId: string | null) {
  const qc = useQueryClient();

  const counts = useQuery({
    enabled: !!projectId,
    queryKey: ["reactions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("project_id", projectId!);
      if (error) throw error;
      const likes = data.filter((r) => r.reaction_type === "like").length;
      const dislikes = data.filter((r) => r.reaction_type === "dislike").length;
      return { likes, dislikes };
    },
  });

  const mine = useQuery({
    enabled: !!projectId && !!userId,
    queryKey: ["reactions", projectId, "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("project_id", projectId!)
        .eq("user_identifier", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.reaction_type as ReactionType | undefined) ?? null;
    },
  });

  const react = useMutation({
    mutationFn: async (next: ReactionType) => {
      if (!projectId || !userId) throw new Error("Not ready");
      const current = mine.data;
      if (current === next) {
        // Toggle off
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("project_id", projectId)
          .eq("user_identifier", userId);
        if (error) throw error;
        return null;
      }
      const { error } = await supabase
        .from("reactions")
        .upsert(
          { project_id: projectId, user_identifier: userId, reaction_type: next },
          { onConflict: "project_id,user_identifier" },
        );
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reactions", projectId] });
    },
  });

  return { counts, mine, react };
}
