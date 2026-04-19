import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useReactions, type ReactionType } from "@/hooks/useReactions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReactionButtonsProps {
  projectId: string;
  userId: string | null;
}

export const ReactionButtons = ({ projectId, userId }: ReactionButtonsProps) => {
  const { counts, mine, react } = useReactions(projectId, userId);
  const { toast } = useToast();

  const handle = (type: ReactionType) => {
    if (!userId) {
      toast({ title: "Setting things up…", description: "Please try again in a moment." });
      return;
    }
    react.mutate(type, {
      onError: (e: unknown) => {
        toast({
          title: "Couldn't save your reaction",
          description: e instanceof Error ? e.message : "Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const myReaction = mine.data;
  const likes = counts.data?.likes ?? 0;
  const dislikes = counts.data?.dislikes ?? 0;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handle("like")}
        disabled={react.isPending}
        aria-pressed={myReaction === "like"}
        className={cn(
          "gap-2",
          myReaction === "like" && "bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="tabular-nums">{likes}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handle("dislike")}
        disabled={react.isPending}
        aria-pressed={myReaction === "dislike"}
        className={cn(
          "gap-2",
          myReaction === "dislike" && "bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="tabular-nums">{dislikes}</span>
      </Button>
    </div>
  );
};
