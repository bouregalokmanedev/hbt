import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(
    undefined,
);

const STORAGE_KEY = "hbtronics_theme";

function getInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (
        stored === "light" ||
        stored === "dark" ||
        stored === "system"
    ) {
        return stored;
    }

    return "system";
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;

    const resolvedTheme =
        theme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
            : theme;

    root.classList.toggle("dark", resolvedTheme === "dark");
}

export function ThemeProvider({ children }: PropsWithChildren) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme);
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,

            setTheme: (nextTheme: Theme) => {
                setThemeState(nextTheme);
            },
        }),
        [theme],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider",
        );
    }

    return context;
}