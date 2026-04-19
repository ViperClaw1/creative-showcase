import { useState } from "react";
import { useComments } from "@/hooks/useComments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CommentsSectionProps {
  projectId: string;
  userId: string | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const CommentsSection = ({ projectId, userId }: CommentsSectionProps) => {
  const { list, add } = useComments(projectId, userId);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({ title: "Setting things up…", description: "Please try again in a moment." });
      return;
    }
    if (!name.trim() || !content.trim()) return;

    add.mutate(
      { author_name: name, content },
      {
        onSuccess: () => {
          setContent("");
          toast({ title: "Comment posted" });
        },
        onError: (e: unknown) => {
          toast({
            title: "Couldn't post comment",
            description: e instanceof Error ? e.message : "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const comments = list.data ?? [];

  return (
    <section aria-labelledby="comments-heading" className="space-y-8">
      <h2 id="comments-heading" className="text-sm uppercase tracking-widest text-muted-foreground">
        Comments
      </h2>

      <form onSubmit={submit} className="space-y-4 border border-border rounded-lg p-4 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="comment-name">Name</Label>
          <Input
            id="comment-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment-content">Comment</Label>
          <Textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts…"
            maxLength={2000}
            rows={4}
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={add.isPending || !userId}>
            {add.isPending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </form>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Be the first to comment.</p>
      ) : (
        <ul className="space-y-6">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-border pb-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium text-foreground">{c.author_name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(c.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm md:text-base text-foreground whitespace-pre-wrap">
                {c.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
