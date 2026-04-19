"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

export interface Project {
  title: string;
  description: string;
  year: string;
  link: string;
  image: string;
}

interface ProjectShowcaseProps {
  projects: Project[];
}

export function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mousePosition]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setIsVisible(false);
  };

  const activeProject = hoveredIndex !== null ? projects[hoveredIndex] : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="w-full max-w-3xl mx-auto px-4 py-16 md:py-24 relative"
    >
      <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-10">
        Selected Work
      </h2>

      {/* Floating preview image */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-50 hidden md:block transition-opacity duration-300"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: `translate(${smoothPosition.x + (containerRef.current?.getBoundingClientRect().left ?? 0) + 24}px, ${smoothPosition.y + (containerRef.current?.getBoundingClientRect().top ?? 0) - 80}px)`,
        }}
      >
        {activeProject && (
          <img
            src={activeProject.image}
            alt={activeProject.title}
            className="w-64 h-44 object-cover rounded-md shadow-2xl border border-border"
          />
        )}
      </div>

      <ul className="border-t border-border">
        {projects.map((project, index) => (
          <li
            key={project.title}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            className="group relative border-b border-border"
          >
            <a
              href={project.link}
              className="flex items-center justify-between py-6 md:py-8 px-2 md:px-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground transition-opacity duration-300 group-hover:opacity-100">
                    <span className="relative inline-block">
                      {project.title}
                      <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-foreground transition-all duration-500 group-hover:w-full" />
                    </span>
                  </h3>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
                <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-md">
                  {project.description}
                </p>
              </div>
              <span className="ml-4 text-xs md:text-sm text-muted-foreground tabular-nums">
                {project.year}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
