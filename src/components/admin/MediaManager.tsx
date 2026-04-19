import { useRef, useState } from "react";
import { Upload, Trash2, Replace, GripVertical, Loader2 } from "lucide-react";
import {
  MediaRow,
  useAddMedia,
  useDeleteMedia,
  useReorderMedia,
  useReplaceMedia,
} from "@/hooks/useAdminProjects";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  media: MediaRow[];
}

export function MediaManager({ projectId, media }: Props) {
  const add = useAddMedia();
  const del = useDeleteMedia();
  const reorder = useReorderMedia();
  const replace = useReplaceMedia();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<MediaRow | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      let order = media.length;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          toast({
            title: "Unsupported file",
            description: `${file.name} skipped (only images/videos).`,
            variant: "destructive",
          });
          continue;
        }
        await add.mutateAsync({ projectId, file, sortOrder: order++ });
      }
      toast({ title: "Upload complete" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReplace = async (file: File | undefined) => {
    if (!file || !replaceTarget) return;
    try {
      await replace.mutateAsync({ media: replaceTarget, file, projectId });
      toast({ title: "File replaced" });
    } catch (e: any) {
      toast({ title: "Replace failed", description: e.message, variant: "destructive" });
    } finally {
      setReplaceTarget(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const ids = media.map((m) => m.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setDraggedId(null);
    try {
      await reorder.mutateAsync({ projectId, orderedIds: ids });
    } catch (e: any) {
      toast({ title: "Reorder failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-secondary/40" : "border-border bg-card"
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Drag &amp; drop images or videos here
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        )}
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((m) => (
            <div
              key={m.id}
              draggable
              onDragStart={() => setDraggedId(m.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, m.id)}
              className="group relative border border-border rounded-md overflow-hidden bg-muted aspect-video"
            >
              {m.media_type === "image" ? (
                <img src={m.file_url} alt={m.alt_text ?? ""} className="w-full h-full object-cover" />
              ) : (
                <video src={m.file_url} className="w-full h-full object-cover" muted />
              )}
              <div className="absolute top-1 left-1 bg-background/80 rounded px-1 py-0.5 cursor-grab">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    setReplaceTarget(m);
                    replaceInputRef.current?.click();
                  }}
                  title="Replace"
                >
                  <Replace className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => del.mutate({ media: m, projectId })}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => handleReplace(e.target.files?.[0])}
      />
    </div>
  );
}
