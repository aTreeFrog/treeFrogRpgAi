/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xss': '0.8125rem' // Between 0.75rem and 0.875rem
      }
    },
  },
  plugins: [],
}