import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import {
  useAdminProject,
  useCreateProject,
  useUpdateProject,
  uploadProjectFile,
} from "@/hooks/useAdminProjects";
import { supabase } from "@/integrations/supabase/client";
import { MediaManager } from "@/components/admin/MediaManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CommentsSection } from "@/components/projects/CommentsSection";
import { useAuth } from "@/hooks/useAuth";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().min(1, "Slug is required").max(80).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  cover_image_url: z.string().optional().or(z.literal("")),
});

const AdminProjectEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data, isLoading } = useAdminProject(isNew ? undefined : id);
  const create = useCreateProject();
  const update = useUpdateProject();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "draft" as "draft" | "published",
    cover_image_url: "",
  });
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = isNew ? "New Project — Admin" : "Edit Project — Admin";
  }, [isNew]);

  useEffect(() => {
    if (data?.project) {
      setForm({
        title: data.project.title,
        slug: data.project.slug,
        description: data.project.description ?? "",
        start_date: data.project.start_date ?? "",
        end_date: data.project.end_date ?? "",
        status: data.project.status,
        cover_image_url: data.project.cover_image_url ?? "",
      });
      setSlugTouched(true);
    }
  }, [data]);

  const update_ = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "title" && !slugTouched && isNew) {
        next.slug = slugify(v as string);
      }
      return next;
    });
  };

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Cover must be an image", variant: "destructive" });
      return;
    }
    setUploadingCover(true);
    try {
      // Use a temp folder for new projects
      const projectIdForPath = data?.project.id ?? "covers-pending";
      const { url, path } = await uploadProjectFile(projectIdForPath, file);
      // Remove previous cover if it lived in the bucket
      if (coverPath) {
        await supabase.storage.from("project-media").remove([coverPath]).catch(() => {});
      }
      setCoverPath(path);
      update_("cover_image_url", url);
    } catch (e: any) {
      toast({ title: "Cover upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    const payload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      status: parsed.data.status,
      cover_image_url: parsed.data.cover_image_url || null,
    };
    try {
      if (isNew) {
        const created = await create.mutateAsync(payload);
        toast({ title: "Project created" });
        navigate(`/admin/projects/${created.id}`, { replace: true });
      } else {
        await update.mutateAsync({ id: id!, patch: payload });
        toast({ title: "Project saved" });
      }
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isNew && !data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Project not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/dashboard">Back</Link>
        </Button>
      </div>
    );
  }

  const submitting = create.isPending || update.isPending;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {isNew ? "New project" : "Edit project"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 border border-border rounded-lg p-6 bg-card">
        <div className="space-y-2">
          <Label htmlFor="title">Project name</Label>
          <Input id="title" value={form.title} onChange={(e) => update_("title", e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update_("slug", e.target.value);
            }}
            required
          />
          <p className="text-xs text-muted-foreground">URL: /projects/{form.slug || "..."}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start date</Label>
            <Input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) => update_("start_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End date</Label>
            <Input
              id="end_date"
              type="date"
              value={form.end_date}
              onChange={(e) => update_("end_date", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={(e) => update_("description", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Cover image</Label>
          {form.cover_image_url ? (
            <div className="relative w-full max-w-sm aspect-video rounded-md overflow-hidden border border-border">
              <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => {
                  if (coverPath) {
                    supabase.storage.from("project-media").remove([coverPath]).catch(() => {});
                    setCoverPath(null);
                  }
                  update_("cover_image_url", "");
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingCover ? "Uploading…" : "Upload cover"}
            </Button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleCoverUpload(e.target.files?.[0])}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => update_("status", v as "draft" | "published")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/dashboard">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : isNew ? "Create project" : "Save changes"}
          </Button>
        </div>
      </form>

      {!isNew && data && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Gallery media</h2>
            <MediaManager projectId={data.project.id} media={data.media} />
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-semibold">Comments on this project</h2>
            <CommentsSection projectId={data.project.id} userId={user?.id ?? null} />
          </section>
        </>
      )}
    </div>
  );
};

export default AdminProjectEditor;
