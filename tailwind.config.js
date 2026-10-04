/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'], mono: ['ui-monospace', '"Cascadia Code"', 'Consolas', 'Menlo', 'monospace'] },
    },
  },
  plugins: [],
};
