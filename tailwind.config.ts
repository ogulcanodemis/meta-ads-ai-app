import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundColor: {
        primary: "var(--background)",
        secondary: "var(--background-secondary)",
      },
      textColor: {
        primary: "var(--foreground)",
        secondary: "var(--foreground-secondary)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#3b82f6',
              '&:hover': {
                color: '#2563eb',
              },
            },
            p: {
              marginTop: '1em',
              marginBottom: '1em',
              color: 'inherit',
            },
            'ul, ol': {
              paddingLeft: '1.5em',
              color: 'inherit',
            },
            'h1, h2, h3, h4, h5, h6': {
              color: 'inherit',
            },
            img: {
              marginTop: '1em',
              marginBottom: '1em',
            },
            strong: {
              color: 'inherit',
            },
            blockquote: {
              color: 'inherit',
              borderLeftColor: 'inherit',
            },
            hr: {
              borderColor: 'inherit',
            },
            pre: {
              backgroundColor: 'inherit',
              color: 'inherit',
            },
            code: {
              color: 'inherit',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'media',
} satisfies Config;
