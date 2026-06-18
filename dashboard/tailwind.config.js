/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './charts/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        edge: {
          bg: '#ffffff',
          canvas: '#fafafa',
          panel: '#ffffff',
          surface: '#f4f4f5',
          border: '#e4e4e7',
          foreground: '#09090b',
          muted: '#71717a',
          accent: '#09090b',
          success: '#18181b',
          warning: '#52525b',
          danger: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        lift: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
