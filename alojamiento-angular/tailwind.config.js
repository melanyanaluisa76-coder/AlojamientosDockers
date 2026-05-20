/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  important: true,
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#0f172a', 700: '#1e293b' },
        accent:    { DEFAULT: '#2563eb', 600: '#1d4ed8', 100: '#dbeafe' },
        success:   '#10b981',
        warning:   '#f59e0b',
        danger:    '#ef4444',
        'bg-light': '#f8fafc',
        muted:     '#94a3b8',
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.04)',
        hover: '0 10px 25px -5px rgba(0,0,0,.12)',
      },
    },
  },
  plugins: [],
};
