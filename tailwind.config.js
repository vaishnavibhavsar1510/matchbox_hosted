/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aurora-blue': '#6B46C1',
        'aurora-teal': '#9F7AEA',
        'aurora-light': '#FAF5FF',
        'aurora-orange': '#805AD5',
        'aurora-dark': '#44337A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 