/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'],
        mono: ['ui-monospace', '"Cascadia Code"', 'Consolas', 'Menlo', 'monospace'],
      },
      // Palette: "neon ink". Components use slate (light neutrals), zinc (dark neutrals) and green (accent) by habit;
      // remapping the scales re-themes the whole app from one place. green is now CYAN, violet is the secondary accent.
      colors: {
        zinc: { 50: '#f4f4fb', 100: '#e8e8f5', 200: '#d0d0e6', 300: '#b3b3d1', 400: '#9494b8', 500: '#6e6e96', 600: '#4a4a6e', 700: '#2c2c47', 800: '#1a1a2e', 900: '#0f0f1c', 950: '#07070e' },
        green: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#0891b2', 600: '#0e7490', 700: '#155e75', 800: '#164e63', 900: '#0c3b4d', 950: '#06222e' },
      },
    },
  },
  plugins: [],
};
