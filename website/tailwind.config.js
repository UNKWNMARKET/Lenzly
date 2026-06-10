/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#ecc85c',
        'gold-light': '#f4dd8e',
        bg: '#0b0b0d',
        card: '#141417',
        card2: '#1b1b1f',
        border: '#26262b',
        muted: '#0f0f11',
        lenz: {
          bg: '#0b0b0d',
          card: '#141417',
          card2: '#1b1b1f',
          border: '#26262b',
          muted: '#0f0f11',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
