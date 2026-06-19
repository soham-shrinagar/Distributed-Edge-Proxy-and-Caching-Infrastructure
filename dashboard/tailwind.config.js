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
          canvas: '#ffffff',
          panel: '#ffffff',
          surface: '#fafafa',
          border: '#e5e5e5',
          foreground: '#09090b',
          muted: '#737373',
          accent: '#09090b',
          success: '#09090b',
          warning: '#525252',
          danger: '#404040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
