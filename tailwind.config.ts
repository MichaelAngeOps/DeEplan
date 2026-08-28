import type { Config } from "tailwindcss";

/**
 * Miroir Tailwind du design system OBSCURA.
 * Source de vérité : maquette/colors_and_type.css (reprise dans
 * src/app/globals.css). Toute modification de token doit être répercutée
 * dans les DEUX fichiers.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Palette fermée : on remplace entièrement celle de Tailwind.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      white: "#ffffff",
      black: "#000000",

      accent: {
        DEFAULT: "#1668e3",
        focus: "#2a78f0",
        "on-dark": "#4d9bff",
      },

      ink: {
        DEFAULT: "#18181a",
        80: "#313134",
        48: "#7b7b80",
      },

      canvas: "#ffffff",
      parchment: "#f5f5f7",
      pearl: "#fafafc",

      tile: {
        1: "#1f1f21",
        2: "#242427",
        3: "#1b1b1d",
      },

      "on-dark": {
        DEFAULT: "#ffffff",
        muted: "#c9c9ce",
      },

      hairline: "#e2e2e6",
      "divider-soft": "rgba(0, 0, 0, 0.06)",
      "chip-translucent": "rgba(210, 210, 215, 0.64)",

      // Couleurs de statut — utilisées en dur dans la maquette (hors
      // colors_and_type.css), rapatriées ici comme tokens.
      success: "#2e7d32", // "A servi", disponible
      danger: "#c0392b", // "N'a pas servi", indisponible, actions destructrices
      warning: "#b7791f", // "À confirmer"
    },

    borderRadius: {
      none: "0px",
      xs: "5px",
      sm: "8px",
      md: "11px",
      lg: "18px",
      pill: "9999px",
      full: "9999px",
    },

    extend: {
      // Échelle du design system, EN PLUS de l'échelle Tailwind par défaut
      // (on garde 0,1,2… pour porter finement le markup de la maquette).
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "17px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "80px",
      },

      fontFamily: {
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        text: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: [
          "SFMono-Regular",
          "ui-monospace",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },

      // Type scale : [taille, { lineHeight, letterSpacing, fontWeight }]
      fontSize: {
        hero: ["56px", { lineHeight: "1.07", letterSpacing: "-0.5px", fontWeight: "600" }],
        dlg: ["40px", { lineHeight: "1.10", letterSpacing: "-0.4px", fontWeight: "600" }],
        dmd: ["34px", { lineHeight: "1.18", letterSpacing: "-0.4px", fontWeight: "600" }],
        lead: ["28px", { lineHeight: "1.21", letterSpacing: "-0.2px", fontWeight: "400" }],
        airy: ["24px", { lineHeight: "1.5", letterSpacing: "-0.1px", fontWeight: "300" }],
        tag: ["21px", { lineHeight: "1.2", letterSpacing: "-0.2px", fontWeight: "600" }],
        "body-strong": ["17px", { lineHeight: "1.3", letterSpacing: "-0.3px", fontWeight: "600" }],
        body: ["17px", { lineHeight: "1.47", letterSpacing: "-0.3px", fontWeight: "400" }],
        caption: ["14px", { lineHeight: "1.43", letterSpacing: "-0.2px", fontWeight: "400" }],
        "caption-strong": ["14px", { lineHeight: "1.29", letterSpacing: "-0.2px", fontWeight: "600" }],
        fine: ["12px", { lineHeight: "1.33", letterSpacing: "-0.1px", fontWeight: "400" }],
        micro: ["10px", { lineHeight: "1.3", letterSpacing: "-0.05px", fontWeight: "400" }],
      },

      maxWidth: {
        "container-text": "980px",
        "container-grid": "1440px",
      },

      boxShadow: {
        product: "3px 5px 30px 0 rgba(0, 0, 0, 0.22)",
      },

      transitionTimingFunction: {
        // utilitaire : ease-smooth  (--ease de la maquette)
        smooth: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
      transitionDuration: {
        fast: "140ms",
        DEFAULT: "240ms",
        slow: "420ms",
      },
      scale: {
        press: "0.96",
      },
    },
  },
  plugins: [],
};

export default config;
