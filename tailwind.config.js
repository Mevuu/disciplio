/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D0D',
        surface: '#1A1A1A',
        border: '#2A2A2A',
        accent: '#00C853',
        'text-primary': '#FFFFFF',
        'text-secondary': '#888888',
        'nav-inactive': '#555555',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
