/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { navy: { 700: '#1a2b5a', 800: '#111f45', 900: '#0b1530' } } } },
  plugins: [],
}
