/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ks-green': '#22c55e',
        'ks-light-green': '#f0fdf4',
        'whatsapp': {
          green: '#25d366',
          light: '#dcf8c6',
          dark: '#128c7e',
          bg: '#f7f7f7',
          bubble: '#e5e5ea'
        }
      },
      screens: {
        'xs': '475px',
      }
    },
  },
  plugins: [],
}