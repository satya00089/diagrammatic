/** @type {import('tailwindcss').Config} */
module.exports = {
  // Use class strategy so you can toggle dark mode programmatically (e.g. ThemeProvider).
  darkMode: "class",

  // include TS/TSX files and other templates so Tailwind picks up all utilities
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        // keep your existing named color plus any semantic tokens if you want
        nightSky: "#0d1117",
        primary: "#A695E7",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        muted: "var(--muted)",
        // add more semantic tokens as needed
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "var(--theme)",
            a: {
              color: "var(--brand)",
              "&:hover": {
                color: "var(--accent)",
              },
            },
            h1: {
              color: "var(--theme)",
              fontWeight: "700",
              fontSize: "2.25rem",
              marginTop: "0",
              marginBottom: "1rem",
            },
            h2: {
              color: "var(--theme)",
              fontWeight: "600",
              fontSize: "1.875rem",
              marginTop: "2rem",
              marginBottom: "1rem",
            },
            h3: {
              color: "var(--theme)",
              fontWeight: "600",
              fontSize: "1.5rem",
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
            },
            h4: {
              color: "var(--theme)",
              fontWeight: "600",
              fontSize: "1.25rem",
            },
            code: {
              color: "var(--accent)",
              backgroundColor: "rgba(var(--surface-rgb), 0.5)",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              backgroundColor: "var(--surface)",
              color: "var(--theme)",
              borderRadius: "0.5rem",
              padding: "1rem",
            },
            strong: {
              color: "var(--theme)",
              fontWeight: "600",
            },
            blockquote: {
              color: "var(--muted)",
              borderLeftColor: "var(--brand)",
              borderLeftWidth: "4px",
              fontStyle: "italic",
            },
            table: {
              width: "100%",
            },
            th: {
              color: "var(--theme)",
              backgroundColor: "rgba(var(--brand-rgb), 0.1)",
            },
            td: {
              borderColor: "var(--border)",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
