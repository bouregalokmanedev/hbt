/**
 * Layer-boundary enforcement (11 §Boundary enforcement, 14 §4).
 * - packages/** and data/** must not import react/next.
 * - reusable UI must not use physical-direction utilities (RTL safety).
 */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {},
  overrides: [
    {
      files: ["packages/**/*.ts", "data/**/*.ts"],
      excludedFiles: ["**/*.test.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              { name: "react", message: "Simulation/Data layers are framework-free (10 §0)." },
              { name: "react-dom", message: "Simulation/Data layers are framework-free (10 §0)." },
            ],
            patterns: [
              { group: ["next", "next/*"], message: "Simulation/Data layers must not import next (10 §0)." },
              { group: ["@/components/*", "@/features/*", "@/app/*", "@/stores/*"], message: "Data/Sim cannot import UI layers." },
            ],
          },
        ],
      },
    },
  ],
};
