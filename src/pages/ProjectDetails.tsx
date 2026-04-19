import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProjectBySlug } from "@/hooks/useProjects";
import { useAnonAuth } from "@/hooks/useAnonAuth";
import { MediaGallery } from "@/components/projects/MediaGallery";
import { ReactionButtons } from "@/components/projects/ReactionButtons";
import { CommentsSection } from "@/components/projects/CommentsSection";
import { Skeleton } from "@/components/ui/skeleton";

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
};

const ProjectDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useProjectBySlug(slug);
  const { userId } = useAnonAuth();

  useEffect(() => {
    if (data?.project?.title) {
      document.title = `${data.project.title} — Portfolio`;
    }
  }, [data]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>

        {isLoading && (
          <div className="mt-10 space-y-6">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="aspect-[16/9] w-full" />
          </div>
        )}

        {error && (
          <p className="mt-10 text-sm text-muted-foreground">
            Couldn&apos;t load this project.
          </p>
        )}

        {!isLoading && !error && !data && (
          <div className="mt-20 text-center">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Project not found
            </h1>
            <p className="mt-3 text-muted-foreground">
              This project may be unpublished or the link is incorrect.
            </p>
          </div>
        )}

        {data && (
          <article className="mt-10 space-y-12">
            <header className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                {data.project.title}
              </h1>
              {(data.project.start_date || data.project.end_date) && (
                <p className="text-sm text-muted-foreground tabular-nums">
                  {formatDate(data.project.start_date)}
                  {data.project.end_date && ` — ${formatDate(data.project.end_date)}`}
                </p>
              )}
              {data.project.description && (
                <p className="text-base md:text-lg text-foreground/80 max-w-2xl leading-relaxed">
                  {data.project.description}
                </p>
              )}
            </header>

            <MediaGallery media={data.media} title={data.project.title} />

            <div className="flex items-center justify-between gap-4 border-t border-b border-border py-4">
              <span className="text-sm text-muted-foreground">
                What do you think?
              </span>
              <ReactionButtons projectId={data.project.id} userId={userId} />
            </div>

            <CommentsSection projectId={data.project.id} userId={userId} />
          </article>
        )}
      </div>
    </main>
  );
};

export default ProjectDetails;
