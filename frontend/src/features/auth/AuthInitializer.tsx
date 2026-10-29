import { useEffect, type PropsWithChildren } from "react";

import { useAuth } from "./hooks/useAuth";
import { useAuthStore } from "./store/auth.store";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/unauthorized";
import { changeLanguage } from "@/i18n";

export function AuthInitializer({ children }: PropsWithChildren) {
  const { initialize, user } = useAuth();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const resetSession = () => {
      useAuthStore.setState({
        user: null,
        isLoading: false,
        isInitialized: true,
        isAuthenticated: false,
        isInitializing: false,
      });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, resetSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, resetSession);
  }, []);

  useEffect(() => {
    if (user?.language === "ar" || user?.language === "en") {
      changeLanguage(user.language);
    }
  }, [user?.language]);

  return children;
}
