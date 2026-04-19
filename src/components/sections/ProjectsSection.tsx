import { ProjectShowcase } from "@/components/ui/project-showcase";
import { mockProjects } from "@/data/projects";

export const ProjectsSection = () => {
  return (
    <section id="projects" className="w-full">
      <ProjectShowcase projects={mockProjects} />
    </section>
  );
};
