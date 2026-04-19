import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the visitor has a Supabase session.
 * If none exists, signs in anonymously so they can like/dislike/comment.
 */
export function useAnonAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let uid = sessionData.session?.user.id ?? null;

      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous sign-in failed:", error);
        } else {
          uid = data.user?.id ?? null;
        }
      }

      if (mounted) {
        setUserId(uid);
        setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { userId, loading };
}
