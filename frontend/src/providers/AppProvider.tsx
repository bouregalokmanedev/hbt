import type { PropsWithChildren } from "react";

import { QueryProvider } from "./QueryProvider";

export function AppProvider({ children }: PropsWithChildren) {
    return (
        <QueryProvider>
            {children}
        </QueryProvider>
    );
}
