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

    textPrimary: '#f8fafc',   // fast weiß
    textSecondary: '#cbd5e1', // hellgrau
    textMuted: '#94a3b8',     // meta infos

    surface: '#111111',
    surfaceSoft: '#1c1c1c',
  }
},
  },
  plugins: [],
}