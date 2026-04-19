import { Link } from "react-router-dom";
import { ProjectShowcase, type Project } from "@/components/ui/project-showcase";
import { usePublishedProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const formatYear = (start: string | null, end: string | null) => {
  const date = end ?? start;
  if (!date) return "";
  return new Date(date).getFullYear().toString();
};

export const ProjectsSection = () => {
  const { data, isLoading, error } = usePublishedProjects();

  return (
    <section id="projects" className="w-full">
      <div className="w-full max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-10">
          Selected Work
        </h2>

        {isLoading && (
          <div className="space-y-6 border-t border-border pt-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-muted-foreground border-t border-border pt-6">
            Couldn&apos;t load projects right now. Please try again later.
          </p>
        )}

        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <div className="border-t border-border pt-12 pb-6 text-center">
            <p className="text-base md:text-lg text-foreground font-medium">
              No projects published yet.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              New work will appear here soon.
            </p>
          </div>
        )}

        {!isLoading && !error && data && data.length > 0 && (
          <ProjectShowcaseInline data={data} />
        )}
      </div>
    </section>
  );
};

const ProjectShowcaseInline = ({
  data,
}: {
  data: ReturnType<typeof usePublishedProjects>["data"];
}) => {
  const projects: Project[] = (data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description ?? "",
    year: formatYear(p.start_date, p.end_date),
    image: p.cover_image_url ?? "",
  }));

  // The ProjectShowcase already wraps in its own container; render inline list here.
  return (
    <div className="-mt-16 md:-mt-24">
      <ProjectShowcase projects={projects} />
    </div>
  );
};
