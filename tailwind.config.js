/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        body: ['"EB Garamond"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        paper: '#F2EEE7',
        ink: '#1B1815',
        dim: '#A79F92',
      },
    },
  },
  plugins: [],
};
