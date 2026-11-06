import type { Config } from "tailwindcss";
import { colors } from "./src/lib/tokens";

// Tokens da identidade Closie (branco + vermelho).
// Use sempre as classes closie-* nos componentes, nunca hex solto.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        closie: colors,
      },
      fontFamily: {
        // Sora é a única fonte do site (títulos e texto)
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
