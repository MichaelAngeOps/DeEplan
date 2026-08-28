import type { Config } from "tailwindcss";

// Le design system complet (couleurs, typo, espacements) sera traduit ici
// depuis maquette/colors_and_type.css à l'étape D.
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
