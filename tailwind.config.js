/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#e8eaf6',
          100: '#c5cae9',
          200: '#9fa8da',
          500: '#3f51b5',
          600: '#3f51b5',
          700: '#303f9f',
          800: '#283593',
          900: '#1a237e',
        },
        grey: {
          light: '#f5f5f5',
          border: '#e0e0e0',
        },
        teal: {
          50: '#e0f2f1',
          100: '#b2dfdb',
          500: '#009688',
          600: '#00897b',
          700: '#00796b',
        },
        orange: {
          50: '#fff3e0',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
        }
      },
    },
  },
  plugins: [],
}
