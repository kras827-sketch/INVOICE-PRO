/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          slate: '#334155',
          emerald: '#059669',
          white: '#F8FAFC',
        }
      }
    },
  },
  plugins: [],
};
