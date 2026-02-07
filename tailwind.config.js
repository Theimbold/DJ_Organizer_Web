/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff006e',
        secondary: '#3A86FF',

        surface: '#0f0f0f',
        surfaceSoft: '#1c1c1c',
      }
    },
  },
  plugins: [],
}