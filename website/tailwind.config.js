/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C170',
          dark: '#A88A35',
          muted: 'rgba(201,168,76,0.15)',
        },
        bg: '#060606',
        card: '#0E0E0E',
        border: '#1A1A1A',
        muted: '#141414',
        lenz: {
          bg: '#080808',
          card: '#111111',
          card2: '#161616',
          border: '#1e1e1e',
          muted: '#1a1a1a',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
