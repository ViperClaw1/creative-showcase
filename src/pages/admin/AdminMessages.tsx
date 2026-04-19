import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

const AdminMessages = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "contact_messages"],
    queryFn: async (): Promise<ContactMessage[]> => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Contact messages</h1>
        <p className="text-sm text-muted-foreground">Submissions from the home page form.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
          No messages yet.
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border bg-card">
          {data.map((m) => (
            <div key={m.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <a
                    href={`mailto:${m.email}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-3 w-3" />
                    {m.email}
                  </a>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
