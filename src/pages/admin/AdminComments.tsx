import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface AdminComment {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  project_id: string;
  projects: { title: string; slug: string } | null;
}

const AdminComments = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "comments"],
    queryFn: async (): Promise<AdminComment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, author_name, created_at, project_id, projects(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminComment[];
    },
  });

  const del = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "comments"] }),
  });

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await del.mutateAsync(confirmId);
      toast({ title: "Comment removed" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
        <p className="text-sm text-muted-foreground">All comments across all projects.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
          No comments yet.
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {data.map((c) => (
            <div key={c.id} className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{c.author_name}</span>
                  <span className="text-muted-foreground">
                    · {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
                {c.projects && (
                  <Link
                    to={`/projects/${c.projects.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    on {c.projects.title}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Delete comment"
                onClick={() => setConfirmId(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={del.isPending}>
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminComments;
