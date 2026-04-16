/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          accent: '#38b2f0',
          purple: '#818cf8',
          green: '#34d399',
        },
        surface: '#0c1220',
        surface2: '#111827',
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
        },
        border: '#1e293b',
      },
      fontFamily: {
        display: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
