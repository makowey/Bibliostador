/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'biblical-gold': '#d4af37',
        'biblical-brown': '#8b4513', 
        'biblical-light': '#f8f4e6',
        'biblical-dark': '#654321'
      },
      fontFamily: {
        'biblical': ['Cinzel', 'serif']
      }
    },
  },
  plugins: [],
}