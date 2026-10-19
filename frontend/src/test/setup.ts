import "@testing-library/jest-dom/vitest";

// Initialise the app's English dictionary: components that call t() must render
// real strings in tests instead of raw translation keys.
import "@/i18n";
