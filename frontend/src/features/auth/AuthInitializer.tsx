import { useEffect, type PropsWithChildren } from "react";

import { useAuth } from "./hooks/useAuth";
import { changeLanguage } from "@/i18n";

export function AuthInitializer({ children }: PropsWithChildren) {
  const { initialize, user } = useAuth();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (user?.language === "ar" || user?.language === "en") {
      changeLanguage(user.language);
    }
  }, [user?.language]);

  return children;
}
