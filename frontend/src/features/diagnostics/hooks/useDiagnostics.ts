import { useCallback, useEffect, useState } from "react";

import { getDiagnostics } from "../api/diagnostics.api";

import type { DiagnosticHubItem } from "../types/diagnostic.types";

export function useDiagnostics() {
    const [items, setItems] = useState<DiagnosticHubItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            setItems(await getDiagnostics());
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Unable to load diagnostics.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    return { items, isLoading, error, reload };
}
