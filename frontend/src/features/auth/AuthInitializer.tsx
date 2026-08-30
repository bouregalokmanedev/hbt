import {
    useEffect,
    type PropsWithChildren,
} from "react";

import { useAuth } from "./hooks/useAuth";

export function AuthInitializer({
    children,
}: PropsWithChildren) {
    const {
        initialize,
    } = useAuth();

    useEffect(() => {
        void initialize();
    }, [initialize]);

    return children;
}