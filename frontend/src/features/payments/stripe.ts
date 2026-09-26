import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

export function useStripePublishableKey() {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/v1/config/stripe-key`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const k = data?.data?.publishable_key ?? data?.publishable_key ?? null;
        if (k) setKey(k);
      })
      .catch(() => {});
  }, []);

  return key;
}

export async function getStripe(key: string | null) {
  if (!key) return null;
  return loadStripe(key);
}
