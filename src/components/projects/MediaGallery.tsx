import { useState } from "react";
import type { ProjectMedia } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

interface MediaGalleryProps {
  media: ProjectMedia[];
  title: string;
}

export const MediaGallery = ({ media, title }: MediaGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="w-full aspect-[16/9] rounded-lg border border-border bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No media yet.</p>
      </div>
    );
  }

  const active = media[activeIndex];

  return (
    <div className="w-full">
      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-border bg-muted">
        {active.media_type === "image" ? (
          <img
            src={active.file_url}
            alt={active.alt_text ?? title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <video
            src={active.file_url}
            controls
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden border transition-all",
                i === activeIndex
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-border opacity-70 hover:opacity-100",
              )}
              aria-label={`View media ${i + 1}`}
            >
              {m.media_type === "image" ? (
                <img
                  src={m.file_url}
                  alt={m.alt_text ?? `${title} ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-foreground/10 flex items-center justify-center text-xs text-muted-foreground">
                  Video
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
