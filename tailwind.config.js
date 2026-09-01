/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          500: '#334e68',
          700: '#102a43',
          800: '#0b1b2b',
          900: '#050c14',
        },
        brand: {
          blue: '#1d4ed8',
          navy: '#0f172a',
          emerald: '#059669',
          amber: '#d97706',
          rose: '#dc2626',
        }
      },
    },
  },
  plugins: [],
}
