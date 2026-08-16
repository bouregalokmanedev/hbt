import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext =
    createContext<ThemeContextValue | undefined>(
        undefined,
    );

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({
    children,
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme =
            localStorage.getItem("hbt-theme");

        if (
            savedTheme === "light" ||
            savedTheme === "dark"
        ) {
            return savedTheme;
        }

        return window.matchMedia(
            "(prefers-color-scheme: dark)",
        ).matches
            ? "dark"
            : "light";
    });

    useEffect(() => {
        const root =
            document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        localStorage.setItem(
            "hbt-theme",
            theme,
        );
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "light"
                ? "dark"
                : "light",
        );
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context =
        useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider",
        );
    }

    return context;
}