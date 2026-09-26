import { useEffect, useState, useCallback } from "react";
import { env } from "@/config/env";
import { authStorage } from "@/lib/storage/auth-storage";

interface SubscriptionEntry {
  id: string;
  plan?: string | null;
  status: string;
}

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = authStorage.getToken();
    if (!token) {
      setIsPro(false);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${env.apiUrl}/v1/subscriptions`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setIsPro(false);
        return;
      }
      const body = (await res.json()) as { data?: SubscriptionEntry[] };
      const list = Array.isArray(body.data) ? body.data : [];
      const active = list.find((s) => ["active", "trial", "past_due"].includes(s.status) && s.plan && !s.plan.toLowerCase().includes("starter") && !s.plan.toLowerCase().includes("free"));
      if (active) {
        setIsPro(true);
        setPlanName(active.plan ?? "Pro");
      } else {
        // Check legacy purchases/subscriptions via overview? Fallback to transactions
        setIsPro(false);
        setPlanName(null);
      }
    } catch {
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("hbt:refresh-pro", load as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("hbt:refresh-pro", load as EventListener);
    };
  }, [load]);

  return { isPro, planName, loading, refresh: load };
}
