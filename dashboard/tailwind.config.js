/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './charts/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        edge: {
          bg: '#ffffff',
          panel: '#ffffff',
          surface: '#f5f5f5',
          border: '#e5e5e5',
          foreground: '#0a0a0a',
          muted: '#737373',
          accent: '#0a0a0a',
          success: '#171717',
          warning: '#525252',
          danger: '#262626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
