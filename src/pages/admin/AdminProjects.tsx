import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useAdminProjects, useDeleteProject } from "@/hooks/useAdminProjects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const AdminProjects = () => {
  const { data: projects, isLoading } = useAdminProjects();
  const del = useDeleteProject();
  const { toast } = useToast();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await del.mutateAsync(confirmId);
      toast({ title: "Project deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Create, edit and publish your work.</p>
        </div>
        <Button asChild>
          <Link to="/admin/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New project
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <Button asChild className="mt-4">
            <Link to="/admin/projects/new">Create your first project</Link>
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{p.title}</h3>
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">/{p.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                {p.status === "published" && (
                  <Button asChild variant="ghost" size="icon" title="View">
                    <Link to={`/projects/${p.slug}`} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="icon" title="Edit">
                  <Link to={`/admin/projects/${p.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={() => setConfirmId(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the project, all its media files, comments and reactions. This cannot be undone.
            </AlertDialogDescription>
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

export default AdminProjects;
